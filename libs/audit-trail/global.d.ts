import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    oldData?: any;
  }
}
