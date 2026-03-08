import 'express';
import { AuthenticatedUser } from '@repo/types';

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
