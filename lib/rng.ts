export function rand(): number {
  return Math.random();
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function bernoulli(p: number): boolean {
  return Math.random() < p;
}

export function normal(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

export function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
