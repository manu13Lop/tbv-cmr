import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, { status: "ok" | "fail"; latencyMs?: number; error?: string }> = {}

  // Database check
  try {
    const supabase = await createClient()
    const dbStart = Date.now()
    const { error } = await supabase.from("usuarios").select("id").limit(1).single()
    checks.database = {
      status: error ? "fail" : "ok",
      latencyMs: Date.now() - dbStart,
      error: error?.message,
    }
  } catch (e) {
    checks.database = {
      status: "fail",
      error: e instanceof Error ? e.message : "Unknown error",
    }
  }

  // Redis check (optional)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const redisStart = Date.now()
      const res = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
        body: '["PING"]',
      })
      const data = await res.json()
      checks.redis = {
        status: data.result === "PONG" ? "ok" : "fail",
        latencyMs: Date.now() - redisStart,
      }
    } catch (e) {
      checks.redis = {
        status: "fail",
        error: e instanceof Error ? e.message : "Connection failed",
      }
    }
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok")
  const status = allOk ? 200 : 503

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: process.env.npm_package_version ?? "unknown",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  )
}
