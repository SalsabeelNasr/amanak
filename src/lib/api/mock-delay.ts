export async function applyMockDelay(
  simulateDelay?: boolean,
  ms = 450,
): Promise<void> {
  if (simulateDelay) {
    await new Promise((r) => setTimeout(r, ms));
  }
}
