export function assertEnvExist(env: string | undefined): asserts env is string {
  if (!env) {
    console.error('env not exist');
    throw Error('env not exist');
  }
}
