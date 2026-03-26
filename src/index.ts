export type NextFunction = (err?: unknown) => Promise<Response> | Response | void;

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
  end(payload?: unknown): WorkerExpressResponse;
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
  if (!path) return '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function parseQuery(searchParams: URLSearchParams): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (Object.hasOwn(query, key)) {
      const current = query[key];
      query[key] = Array.isArray(current) ? [...current, value] : [current, value];
    } else {
      query[key] = value;
    }
  }
  return query;
}

function compilePath(path: string): CompiledPath {
  const keys: string[] = [];
  const escaped = path
    .split('/')
    .map((segment) => {
      if (!segment) return '';
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return {
    keys,
    pattern: new RegExp(`^${escaped}$`),
  };
}

function createResponseToolkit(): WorkerExpressResponse {
  const headers = new Headers();
  let statusCode = 200;
  let body: BodyInit | null | undefined;
  let finalized = false;

  const res: WorkerExpressResponse = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    set(name, value) {
      headers.set(name, value);
      return this;
    },
    send(payload = '') {
      if (finalized) return this;
      body = typeof payload === 'string' ? payload : String(payload);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'text/plain; charset=utf-8');
      }
      finalized = true;
      this.headersSent = true;
      return this;
    },
    json(data) {
      if (finalized) return this;
      body = JSON.stringify(data);
      headers.set('content-type', 'application/json; charset=utf-8');
      finalized = true;
      this.headersSent = true;
      return this;
    },
    end(payload) {
      if (payload !== undefined && payload !== null) {
        return this.send(payload);
      }
      finalized = true;
      this.headersSent = true;
      return this;
    },
    toResponse() {
      const responseBody = [204, 205, 304].includes(statusCode) ? null : body;
      return new Response(responseBody, { status: statusCode, headers });
    },
  };

  return res;
}

function matchRoute(route: CompiledPath, path: string): Record<string, string> | null {
  const match = route.pattern.exec(path);
  if (!match) return null;
  const params: Record<string, string> = {};
  route.keys.forEach((key, index) => {
    params[key] = decodeURIComponent(match[index + 1]);
  });
  return params;
}

async function parseBody(request: Request): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
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
      register('GET', path, handlers);
      return this;
    },
    post(path, ...handlers) {
      register('POST', path, handlers);
      return this;
    },
    put(path, ...handlers) {
      register('PUT', path, handlers);
      return this;
    },
    patch(path, ...handlers) {
      register('PATCH', path, handlers);
      return this;
    },
    delete(path, ...handlers) {
      register('DELETE', path, handlers);
      return this;
    },
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = normalizePath(url.pathname);
      const matched = routes.find((route) => route.method === request.method && matchRoute(route, path));

      const req: WorkerExpressRequest = {
        method: request.method,
        url: request.url,
        path,
        query: parseQuery(url.searchParams),
        params: {},
        headers: request.headers,
        body: await parseBody(request),
        raw: request,
        env,
        ctx,
      };

      const res = createResponseToolkit();

      if (!matched) {
        return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      }

      req.params = matchRoute(matched, path) || {};
      const stack = [...middlewares, ...matched.handlers];

      let index = -1;

      const dispatch = async (i: number, err?: unknown): Promise<Response> => {
        if (i <= index) throw new Error('next() called multiple times');
        index = i;

        if (err) {
          return new Response('Internal Server Error', {
            status: 500,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          });
        }

        const handler = stack[i];
        if (!handler) {
          if (!res.headersSent) {
            res.status(204).end();
          }
          return res.toResponse();
        }

        try {
          let nextCalled = false;
          let nextResult: Promise<Response> | undefined;
          const maybePromise = handler(req, res, (nextErr) => {
            nextCalled = true;
            nextResult = dispatch(i + 1, nextErr);
            return nextResult;
          });
          await maybePromise;

          if (nextCalled) {
            return nextResult as Promise<Response>;
          }

          if (res.headersSent) {
            return res.toResponse();
          }

          if (i === stack.length - 1) {
            return res.toResponse();
          }

          return dispatch(i + 1);
        } catch {
          return new Response('Internal Server Error', {
            status: 500,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          });
        }
      };

      return dispatch(0);
    },
  };

  return app;
}

export default express;
