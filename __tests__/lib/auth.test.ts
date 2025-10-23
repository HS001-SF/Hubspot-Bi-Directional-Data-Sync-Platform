import { hashPassword, verifyPassword } from '@/lib/auth'

describe('Authentication Functions', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 characters
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Salt should make them different
    })

    it('should handle empty password', async () => {
      const password = ''
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should reject empty password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('', hash)

      expect(isValid).toBe(false)
    })

    it('should return false for invalid hash', async () => {
      const password = 'TestPassword123!'
      const invalidHash = 'not-a-valid-hash'

      // bcrypt returns false for invalid hash instead of throwing
      const isValid = await verifyPassword(password, invalidHash).catch(() => false)
      expect(isValid).toBe(false)
    })
  })
})
