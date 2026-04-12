export type NextFunction = (
  err?: unknown,
) => Promise<Response> | Response | void;

export interface WorkerExpressRequest {
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  params: Record<string, string>;
  headers: Headers;
  body: unknown;
  raw: Request;
  env: unknown;
  ctx: unknown;
}

export interface WorkerExpressResponse {
  headersSent: boolean;
  status(code: number): WorkerExpressResponse;
  set(name: string, value: string): WorkerExpressResponse;
  send(payload?: unknown): WorkerExpressResponse;
  json(data: unknown): WorkerExpressResponse;
  end(payload?: BodyInit | null): WorkerExpressResponse;
  toResponse(): Response;
}

export type Handler = (
  req: WorkerExpressRequest,
  res: WorkerExpressResponse,
  next: NextFunction,
) => Promise<unknown> | unknown;

interface CompiledPath {
  keys: string[];
  pattern: RegExp;
}

interface Route extends CompiledPath {
  method: string;
  path: string;
  handlers: Handler[];
}

function normalizePath(path: string): string {
  // 目的: ルート定義と実リクエストの比較を安定化するため、末尾スラッシュ差分を吸収する。
  if (!path) return "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function parseQuery(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (Object.hasOwn(query, key)) {
      const current = query[key];
      query[key] = Array.isArray(current)
        ? [...current, value]
        : [current, value];
    } else {
      query[key] = value;
    }
  }
  return query;
}

function compilePath(path: string): CompiledPath {
  // 目的: `:id` のようなパスパラメータを正規表現に変換し、実行時マッチングを高速化する。
  const keys: string[] = [];
  const escaped = path
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment.startsWith(":")) {
        keys.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return {
    keys,
    pattern: new RegExp(`^${escaped}$`),
  };
}

function createResponseToolkit(): WorkerExpressResponse {
  // 目的: Response 生成前に status/body/header を段階的に構築できるようにする。
  const headers = new Headers();
  let statusCode = 200;
  let body: BodyInit | null | undefined;
  let finalized = false;

  const finalize = (nextBody?: BodyInit | null): void => {
    body = nextBody;
    finalized = true;
    res.headersSent = true;
  };

  const res: WorkerExpressResponse = {
    headersSent: false,
    status(code) {
      if (finalized) return this;
      statusCode = code;
      return this;
    },
    set(name, value) {
      if (finalized) return this;
      headers.set(name, value);
      return this;
    },
    send(payload = "") {
      if (finalized) return this;
      // 目的: send は文字列表現を返す高レベル API とし、既定 content-type を補完する。
      // 処理: 文字列以外は文字列表現へ寄せ、text/plain を既定の content-type として扱う。
      const nextBody = typeof payload === "string" ? payload : String(payload);
      if (!headers.has("content-type")) {
        headers.set("content-type", "text/plain; charset=utf-8");
      }
      finalize(nextBody);
      return this;
    },
    json(data) {
      if (finalized) return this;
      // 目的: 明示指定された content-type を優先し、未指定時のみ JSON の既定値を補完する。
      // 処理: JSON 本文を生成し、header 未設定なら application/json を付与する。
      const nextBody = JSON.stringify(data);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json; charset=utf-8");
      }
      finalize(nextBody);
      return this;
    },
    end(payload) {
      if (finalized) return this;
      // 目的: end は低レベル API として扱い、send/json のような暗黙変換をしない。
      // 処理: 渡された BodyInit をそのまま確定し、content-type の自動補完は行わない。
      finalize(payload);
      return this;
    },
    toResponse() {
      const responseBody = [204, 205, 304].includes(statusCode) ? null : body;
      return new Response(responseBody, { status: statusCode, headers });
    },
  };

  return res;
}

function matchRoute(
  route: CompiledPath,
  path: string,
): Record<string, string> | null {
  // 目的: 正規表現マッチ結果を `req.params` で扱えるキー付きオブジェクトへ変換する。
  const match = route.pattern.exec(path);
  if (!match) return null;
  const params: Record<string, string> = {};
  route.keys.forEach((key, index) => {
    params[key] = decodeURIComponent(match[index + 1]);
  });
  return params;
}

async function parseBody(request: Request): Promise<unknown> {
  // 目的: メソッドと content-type に応じて req.body を最小限で解釈する。
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await request.clone().json();
    } catch {
      return undefined;
    }
  }

  const text = await request.clone().text();
  return text.length > 0 ? text : undefined;
}

interface WorkerExpressApp {
  use(...handlers: Handler[]): WorkerExpressApp;
  get(path: string, ...handlers: Handler[]): WorkerExpressApp;
  post(path: string, ...handlers: Handler[]): WorkerExpressApp;
  put(path: string, ...handlers: Handler[]): WorkerExpressApp;
  patch(path: string, ...handlers: Handler[]): WorkerExpressApp;
  delete(path: string, ...handlers: Handler[]): WorkerExpressApp;
  fetch(request: Request, env?: unknown, ctx?: unknown): Promise<Response>;
}

function express(): WorkerExpressApp {
  const middlewares: Handler[] = [];
  const routes: Route[] = [];

  function register(method: string, path: string, handlers: Handler[]): void {
    if (!handlers.length) {
      throw new Error(`No handlers provided for ${method} ${path}`);
    }
    const normalizedPath = normalizePath(path);
    const { keys, pattern } = compilePath(normalizedPath);
    routes.push({ method, path: normalizedPath, keys, pattern, handlers });
  }

  const app: WorkerExpressApp = {
    use(...handlers) {
      middlewares.push(...handlers);
      return this;
    },
    get(path, ...handlers) {
      register("GET", path, handlers);
      return this;
    },
    post(path, ...handlers) {
      register("POST", path, handlers);
      return this;
    },
    put(path, ...handlers) {
      register("PUT", path, handlers);
      return this;
    },
    patch(path, ...handlers) {
      register("PATCH", path, handlers);
      return this;
    },
    delete(path, ...handlers) {
      register("DELETE", path, handlers);
      return this;
    },
    async fetch(request, env, ctx) {
      // 目的: 受信した Request を解析し、ミドルウェアとルートハンドラの実行チェーンを開始する。
      const url = new URL(request.url);
      const path = normalizePath(url.pathname);

      // 処理: ルート一致確認と params 抽出を一括で行い、重複計算を避ける。
      let matchedParams: Record<string, string> | null = null;
      const matchedRoute = routes.find((route) => {
        if (route.method !== request.method) return false;
        matchedParams = matchRoute(route, path);
        return matchedParams !== null;
      });

      const req: WorkerExpressRequest = {
        method: request.method,
        url: request.url,
        path,
        query: parseQuery(url.searchParams),
        params: matchedParams || {},
        headers: request.headers,
        body: await parseBody(request),
        raw: request,
        env,
        ctx,
      };

      const res = createResponseToolkit();
      const stack = [...middlewares, ...(matchedRoute?.handlers ?? [])];

      let index = -1;

      const dispatch = async (i: number, err?: unknown): Promise<Response> => {
        // 目的: ミドルウェア/ハンドラの実行順序を制御し、二重呼び出しを防止する。
        if (i <= index) throw new Error("next() called multiple times");
        index = i;

        if (err) {
          // 処理: 現状は統一エラーハンドラ未実装のため、next(err) は即時 500 へ集約する。
          return new Response("Internal Server Error", {
            status: 500,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }

        const handler = stack[i];
        if (!handler) {
          // 目的: スタック終了時に未送信なら、状況に応じて 404 を返す。
          if (!res.headersSent) {
            res.status(404).send("Not Found");
          }
          return res.toResponse();
        }

        try {
          let nextCalled = false;
          let nextResult: Promise<Response> | undefined;

          // 処理: ハンドラを実行し、next() が呼ばれた場合のみ後続へ進むよう制御する。
          const maybePromise = handler(req, res, (nextErr) => {
            nextCalled = true;
            nextResult = dispatch(i + 1, nextErr);
            return nextResult;
          });
          await maybePromise;

          if (nextCalled) {
            return nextResult as Promise<Response>;
          }

          // 目的: next() 未呼び出しかつ未送信の停止は成功扱いにせず、404 fallthrough を返す。
          // 処理: チェーンはここで止めるが、未処理リクエストとして最終 404 と同じ応答に揃える。
          if (!res.headersSent) {
            res.status(404).send("Not Found");
          }
          return res.toResponse();
        } catch {
          return new Response("Internal Server Error", {
            status: 500,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
      };

      return dispatch(0);
    },
  };

  return app;
}

export default express;
