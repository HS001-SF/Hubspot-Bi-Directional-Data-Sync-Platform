import { isValidEmail, isStrongPassword } from '@/lib/validation'

describe('Validation Functions', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@company.co.uk',
        'name+tag@domain.org',
        'user123@sub.domain.com',
      ]

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
        '',
        'user@domain',
      ]

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false)
      })
    })
  })

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'Test1234User',
        'SecureP@ss1',
        'MyStr0ngPwd!',
      ]

      strongPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(true)
      })
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',          // Too short
        'alllowercase1',  // No uppercase
        'ALLUPPERCASE1',  // No lowercase
        'NoNumbers!',     // No numbers
        'password',       // Too common
        '12345678',       // Only numbers
      ]

      weakPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(false)
      })
    })

    it('should require minimum length', () => {
      expect(isStrongPassword('Test1')).toBe(false)    // 5 chars
      expect(isStrongPassword('Test12')).toBe(false)   // 6 chars
      expect(isStrongPassword('Test123')).toBe(false)  // 7 chars
      expect(isStrongPassword('Test1234')).toBe(true)  // 8 chars
    })

    it('should handle empty password', () => {
      expect(isStrongPassword('')).toBe(false)
    })
  })
})
