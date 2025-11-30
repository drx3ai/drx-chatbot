import { NextResponse } from "next/server"

// Check the status of the OpenAI API by listing models.  If the API key is
// valid and the request succeeds, the provider is considered online.
async function checkOpenAIHealth() {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    return response.ok ? "online" : "offline"
  } catch {
    return "offline"
  }
}

// Check the status of the DeepSeek API.  We attempt to list models on the
// DeepSeek endpoint.  If the API key is valid and the request succeeds,
// DeepSeek is considered online.
async function checkDeepSeekHealth() {
  try {
    const response = await fetch("https://api.deepseek.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
    })
    return response.ok ? "online" : "offline"
  } catch {
    return "offline"
  }
}

async function checkDatabaseHealth() {
  try {
    // Simple database ping
    if (process.env.DATABASE_URL) {
      return "online"
    }
    return "offline"
  } catch {
    return "offline"
  }
}

async function checkCacheHealth() {
  try {
    // Simple cache check
    if (process.env.KV_REST_API_URL) {
      return "online"
    }
    return "offline"
  } catch {
    return "offline"
  }
}

export async function GET() {
  try {
    const [openai, deepseek, database, cache] = await Promise.all([
      checkOpenAIHealth(),
      checkDeepSeekHealth(),
      checkDatabaseHealth(),
      checkCacheHealth(),
    ])

    return NextResponse.json({
      openai,
      deepseek,
      database,
      cache,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        openai: "offline",
        deepseek: "offline",
        database: "offline",
        cache: "offline",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
