import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { API_ERROR_CODES, type ApiErrorCode } from '@arena/contracts';

// Re-exported so a service imports the code and its factory from one place.
export { API_ERROR_CODES };

// Nest passes object bodies through verbatim (no statusCode/error merge), so each
// factory stamps the full shape the string form would have produced, plus `code`.
export function codedBadRequest(code: ApiErrorCode, message: string) {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    code,
    message,
  });
}

export function codedConflict(code: ApiErrorCode, message: string) {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    code,
    message,
  });
}

export function codedUnauthorized(code: ApiErrorCode, message: string) {
  return new UnauthorizedException({
    statusCode: 401,
    error: 'Unauthorized',
    code,
    message,
  });
}
