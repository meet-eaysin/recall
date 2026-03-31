import { DomainException } from './domain.exception';

export class UnprocessableDomainException extends DomainException {
  constructor(message: string, code = 'UNPROCESSABLE_ENTITY') {
    super(message, code, 422);
  }
}
