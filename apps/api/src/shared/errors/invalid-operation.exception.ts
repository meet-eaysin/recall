import { DomainException } from './domain.exception';

export class InvalidOperationDomainException extends DomainException {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, code, 400);
  }
}
