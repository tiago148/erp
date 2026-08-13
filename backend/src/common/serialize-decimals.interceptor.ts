import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isDecimalLike(value: unknown): value is { toNumber(): number } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  // Duck-typed on shape, not `instanceof`/constructor name: Prisma's bundled
  // Decimal class gets renamed by the bundler (e.g. "Decimal2"), so identity
  // checks are unreliable across versions.
  return (
    typeof candidate.toNumber === 'function' &&
    typeof candidate.toFixed === 'function' &&
    typeof candidate.s === 'number' &&
    typeof candidate.e === 'number' &&
    Array.isArray(candidate.d)
  );
}

function convert(value: unknown): unknown {
  if (isDecimalLike(value)) return value.toNumber();
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(convert);
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = convert(val);
    }
    return result;
  }
  return value;
}

/**
 * Prisma's Decimal fields serialize to JSON as strings (Decimal.prototype.toJSON
 * returns toString()), silently breaking any `sum + entry.amount`-style arithmetic
 * on the frontend. This converts every Decimal in a response to a real number
 * before it reaches res.json().
 */
@Injectable()
export class SerializeDecimalsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => convert(data)));
  }
}
