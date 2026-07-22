// Ergänzt den statischen Vite-Build um den Cloudflare-Worker-Einstieg für OpenAI Sites
import { mkdir, writeFile } from 'node:fs/promises';

const workerSource = `// Serviert die gebaute Single-Page-App über OpenAI Sites
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (!acceptsHtml) return response;

    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  },
};
`;

await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/server/index.js', import.meta.url), workerSource);
