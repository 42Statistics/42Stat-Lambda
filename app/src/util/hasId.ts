export const hasId = (ids: number[], id: number): boolean => {
  return ids.find((el) => el === id) !== undefined;
};
