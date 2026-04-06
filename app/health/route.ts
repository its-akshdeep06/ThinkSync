import { NextResponse } from 'next/server'

// GET /health — simple health check used by the frontend api.health() call.
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'thinksync-api',
    timestamp: new Date().toISOString(),
  })
}
