// VULN: A06 Insecure Design - CWE-1333 Inefficient Regular Expression
// Complexity (ReDoS)
// This email pattern uses nested quantifiers ((...+)+) which can be forced
// into catastrophic backtracking by a crafted input, causing the event
// loop to hang (denial of service).
const EMAIL_REGEX = /^([a-zA-Z0-9._%+-]+)+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
