import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Safe Prisma client initialization for Vercel builds
// Prevents database connection errors during build time
const createPrismaClient = (): PrismaClient => {
  try {
    // During build time, DATABASE_URL might not be set yet
    // Prisma will handle connection errors at runtime when queries are executed
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL not set - Prisma client will fail at runtime if database is accessed')
    }

    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.error('❌ Failed to create Prisma client:', error)
    console.warn('⚠️  Creating Prisma client anyway - will fail at runtime if database is accessed')
    // Always return a PrismaClient instance, never null
    // The client will throw errors at runtime if database is actually needed
    return new PrismaClient()
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma