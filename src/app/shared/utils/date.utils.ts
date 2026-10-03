export function timestamp(value: string) {
  return value.replace(' ', 'T') + 'Z';
}
