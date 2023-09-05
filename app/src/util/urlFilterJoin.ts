export const urlFilterJoin = (values: readonly unknown[]): string => {
  if (!values.length) {
    throw Error('empty filter values');
  }

  return values.join(',');
};
