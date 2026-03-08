import 'express';
import type { AuthenticatedUser } from '@repo/types';

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
