export function stakeRisk(stake: number, available: number) {
  const percent = available > 0 ? (stake / available) * 100 : null;
  if (percent === null)
    return {
      percent,
      level: 'Sin saldo',
      message: 'Confirma un depósito antes de registrar la apuesta.',
    };
  if (percent <= 2)
    return {
      percent,
      level: 'Bajo',
      message:
        'Dentro de la referencia de 1–2%. Una exposición baja también puede generar pérdidas.',
    };
  if (percent <= 5)
    return {
      percent,
      level: 'Moderado',
      message: 'Una parte considerable del saldo para una sola apuesta.',
    };
  if (percent <= 10)
    return {
      percent,
      level: 'Alto',
      message: 'Pocas pérdidas seguidas pueden reducir mucho el saldo.',
    };
  return {
    percent,
    level: 'Extremo',
    message: 'Se desaconseja concentrar más del 10% del saldo en una apuesta.',
  };
}
