import 'express';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user.type';

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
