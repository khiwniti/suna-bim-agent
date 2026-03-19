// Proxy Worker: forwards all requests to the Dokploy backend VM.
// BACKEND_HOST and BACKEND_PORT are injected from wrangler.toml [vars].
interface Env {
  BACKEND_HOST: string;
  BACKEND_PORT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const BACKEND_URL = `http://${env.BACKEND_HOST}:${env.BACKEND_PORT}`;
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Proxy the request to the Dokploy backend
    const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
    const proxyRequest = new Request(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });

    let response: Response;
    try {
      response = await fetch(proxyRequest);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Backend unavailable", detail: String(err) }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Forward the response with CORS headers added
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler;

