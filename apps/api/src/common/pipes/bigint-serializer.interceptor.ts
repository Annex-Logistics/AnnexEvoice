import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => JSON.parse(JSON.stringify(data, replacer))));
  }
}

function replacer(_key: string, value: unknown) {
  if (typeof value === 'bigint') return value.toString();
  return value;
}
