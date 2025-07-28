import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";

export function createInternalKeyMiddleware(expectedKey: string): any {
  const PUBLIC_PATHS = ["/docs", "/docs-json"];

  @Injectable()
  class InternalKeyMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
      const { url } = req;

      if (req.url.startsWith("/docs-json")) {
        return next();
      }

      if (PUBLIC_PATHS.some((path) => url.startsWith(path))) {
        console.log("[Middleware] Public path bypassed:", url);
        return next();
      }

      const internalKey = req.headers["x-internal-key"];

      if (internalKey !== expectedKey) {
        console.warn("[Middleware] Invalid internal key");
        throw new ForbiddenException("Access denied: invalid internal key");
      }

      next();
    }
  }

  return InternalKeyMiddleware;
}
