import { NextRequest } from 'next/server'

// TODO: Implement Apollo Server for GraphQL
export async function POST(request: NextRequest) {
  return Response.json(
    { message: 'GraphQL endpoint - Coming soon' },
    { status: 501 }
  )
}

export async function GET() {
  return Response.json(
    { message: 'GraphQL Playground - Coming soon' },
    { status: 501 }
  )
}