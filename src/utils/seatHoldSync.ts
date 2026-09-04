export function shouldDropLocalSelection(options: {
  seatId: number;
  heldIds: Set<string>;
  lockedAt?: number;
  now: number;
  graceMs?: number;
}): boolean {
  if (options.heldIds.has(String(options.seatId))) return false;
  const graceMs = options.graceMs ?? 8000;
  if (options.lockedAt != null && options.now - options.lockedAt < graceMs) return false;
  return true;
}

export function isStaleHeldPoll(responseGeneration: number, currentGeneration: number): boolean {
  return responseGeneration !== currentGeneration;
}
