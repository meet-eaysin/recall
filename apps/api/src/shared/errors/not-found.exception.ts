import { DomainException } from './domain.exception';

export class NotFoundDomainException extends DomainException {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, code, 404);
  }
}
