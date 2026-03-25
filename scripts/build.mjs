import { mkdir, copyFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('src/index.js', 'dist/index.js');
console.log('Built dist/index.js');
