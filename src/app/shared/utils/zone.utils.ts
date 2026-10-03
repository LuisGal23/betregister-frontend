export function zoneDay(value: string, zone = 'America/Mexico_City') {
  const date = new Date(
    value.includes('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : value.replace(' ', 'T') + 'Z',
  );
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function instant(value: string): number {
  return new Date(/[zZ]$|[+-]\d\d:\d\d$/.test(value) ? value : value.replace(' ', 'T') + 'Z').getTime();
}

/** Convert calendar midnight in the profile's zone to an actual instant. */
export function zoneMidnight(day: string, zone = 'America/Mexico_City'): number {
  const target = Date.parse(day + 'T00:00:00Z');
  let guess = target;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 4; i++) {
    const parts = formatter.formatToParts(new Date(guess));
    const p = (key: string) => parts.find(x => x.type === key)!.value;
    const local = Date.parse(`${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}:${p('second')}Z`);
    guess += target - local;
  }
  return guess;
}
