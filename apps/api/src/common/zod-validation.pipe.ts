import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

// Parses a request body against its schema from @arena/contracts and hands the
// handler the inferred type. Shape errors stop here as a 400 that lists every
// issue; business rules stay imperative in services (backend-conventions §3).
//
//   @Body(new ZodValidationPipe(matchBodySchema)) body: MatchBody
export class ZodValidationPipe<
  TSchema extends z.ZodType,
> implements PipeTransform<unknown, z.output<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      // "gamesB: A match cannot end in a draw"; a body-level issue has no path.
      throw new BadRequestException(
        result.error.issues.map((issue) => {
          const path = issue.path.map(String).join('.');

          return path ? `${path}: ${issue.message}` : issue.message;
        }),
      );
    }

    return result.data;
  }
}
