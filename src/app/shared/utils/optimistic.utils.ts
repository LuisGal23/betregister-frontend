export async function withOptimisticState<T>(
  read: () => T,
  write: (value: T) => void,
  change: (value: T) => T,
  request: () => Promise<unknown>,
) {
  const previous = read();
  write(change(structuredClone(previous)));
  try {
    return await request();
  } catch (error) {
    write(previous);
    throw error;
  }
}
