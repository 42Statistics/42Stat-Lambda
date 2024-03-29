import { LambdaError } from '#lambda/util/error.js';
import camelcaseKeys from 'camelcase-keys';
import { z } from 'zod';

export const parseFromDtoMany = <T extends z.ZodRawShape>(
  dtos: object[],
  zodSchema: z.ZodObject<T>,
  name: string,
): z.infer<typeof zodSchema>[] => {
  try {
    return zodSchema
      .array()
      .parse(dtos.map((dto) => camelcaseKeys(dto, { deep: true })));
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new LambdaError(
        name + ' parse fail',
        `error: ${JSON.stringify(e.errors, null, '  ')}\ndtos: ${JSON.stringify(
          dtos,
          null,
          '  ',
        )}`,
      );
    }

    throw new LambdaError(
      name + ' parse fail by unknown issue',
      `error: ${JSON.stringify(e, null, '  ')}\ndtos: ${JSON.stringify(
        dtos,
        null,
        '  ',
      )}`,
    );
  }
};
