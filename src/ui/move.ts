export function wrapStep(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (((current + delta) % length) + length) % length;
}

export function windowStart(cursor: number, total: number, height: number): number {
  if (total <= height) return 0;
  const half = Math.floor(height / 2);
  return Math.max(0, Math.min(cursor - half, total - height));
}
