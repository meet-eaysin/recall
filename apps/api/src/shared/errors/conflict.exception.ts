import { DomainException } from './domain.exception';

export class ConflictDomainException extends DomainException {
  constructor(message: string, code = 'CONFLICT') {
    super(message, code, 409);
  }
}
