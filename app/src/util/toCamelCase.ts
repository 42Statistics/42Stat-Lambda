import camelcaseKeys from 'camelcase-keys';
// need CamelCasedPropertiesDeep because of https://github.com/sindresorhus/camelcase-keys/issues/77#issuecomment-1339844470
import type { CamelCasedPropertiesDeep } from 'type-fest';
import { z, ZodEffects } from 'zod';

export const zodToCamelCase = <T extends z.ZodTypeAny>(
  zod: T,
): ZodEffects<z.infer<T>, CamelCasedPropertiesDeep<T['_output']>> =>
  zod.transform(
    (val) => camelcaseKeys(val, { deep: true }) as CamelCasedPropertiesDeep<T>,
  );
