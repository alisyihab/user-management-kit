import { createProxyMiddleware } from "http-proxy-middleware";
import { Request, Response, NextFunction } from "express";
import { RoutesMap } from "@libs/config/src/";

export function createNestProxyMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // api/v1/... proxy (as before)
    const apiMatch = Object.entries(RoutesMap).find(([, r]) =>
      req.url.startsWith(`/api/v1${r.basePath}`),
    );
    if (apiMatch) {
      const [, route] = apiMatch;
      return createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        pathRewrite: { "^/api/v1": "" },
        on: {
          proxyReq: (proxyReq) => {
            proxyReq.setHeader("x-internal-key", route.key || "");
          },
        },
      })(req, res, next);
    }

    // docs-json proxy
    // e.g. GET /docs-json/auth → proxy to AUTH_SERVICE_URL/docs-json
    const docsMatch = req.url.match(/^\/docs-json\/(auth|backoffice)/);
    if (docsMatch) {
      const svc = docsMatch[1];
      const route = RoutesMap[svc as keyof typeof RoutesMap];

      if (!route || !route.target) {
        console.error(`❌ Invalid route config for service: ${svc}`);
        return res.status(500).json({ error: "Invalid route config" });
      }

      const targetUrl = `${route.target}/docs-json`;

      return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: { [`^/docs-json/${svc}`]: "" },
        on: {
          proxyReq: (proxyReq) => {
            proxyReq.setHeader("x-internal-key", route.key || "");
          },
        },
      })(req, res, next);
    }

    // if nothing matches, fall through to Nest or 404
    return next();
  };
}
