/** Demo gate for mock patient/staff login (value is visible in the client bundle). */
export const LOGIN_GATE_PASSWORD = "Test!1" as const;

export function isLoginGatePassword(value: string): boolean {
  return value === LOGIN_GATE_PASSWORD;
}
