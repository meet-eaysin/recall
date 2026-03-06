import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dtos/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((res) => {
        // Handle cases where the controller already formatted the response
        const data =
          res && typeof res === 'object' && 'data' in res ? res.data : res;
        const message =
          res && typeof res === 'object' && 'message' in res
            ? res.message
            : 'Operation successful';
        const success =
          res && typeof res === 'object' && 'success' in res
            ? res.success
            : true;

        return {
          success,
          statusCode,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
