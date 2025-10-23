/**
 * Client-side validation utilities
 * These functions can be used in both client and server components
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return minLength && hasUpperCase && hasLowerCase && hasNumber;
}

export function getPasswordStrength(password: string): {
  score: number;
  message: string;
  color: string;
} {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    longLength: password.length >= 12,
  };

  // Calculate score
  if (checks.length) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;
  if (checks.longLength) score += 1;

  // Determine strength
  if (score <= 2) {
    return { score, message: 'Weak', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score, message: 'Medium', color: 'bg-yellow-500' };
  } else {
    return { score, message: 'Strong', color: 'bg-green-500' };
  }
}

export function getPasswordStrengthMessage(password: string): string {
  const missing: string[] = [];

  if (password.length < 8) {
    missing.push('at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    missing.push('one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    missing.push('one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    missing.push('one number');
  }

  if (missing.length === 0) {
    return 'Password is strong';
  }

  return `Password must contain ${missing.join(', ')}`;
}
