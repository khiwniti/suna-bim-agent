import { Container, getRandom } from "cloudflare:containers";

export class BackendContainer extends Container {
  defaultPort = 8000;
  sleepAfter = "10m";

  override async fetch(request: Request): Promise<Response> {
    return super.fetch(request);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Add CORS headers for frontend requests
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

    const container = getRandom(env.BACKEND);
    const response = await container.fetch(request);

    // Add CORS headers to real responses
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
} satisfies ExportedHandler<Env>;

interface Env {
  BACKEND: DurableObjectNamespace<BackendContainer>;
}
