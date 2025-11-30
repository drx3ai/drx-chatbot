export interface AIProviderConfig {
  /**
   * The provider to call.  Supported values:
   * - `deepseek`: calls DeepSeek's chat completion API using the
   *   `deepseek-reasoner` model.  This produces both a chain‑of‑thought
   *   (reasoning_content) and a final answer【436649618173805†L58-L93】.
   * - `openai`: calls OpenAI's chat completions API using the `gpt-5` model.
   */
  provider: "deepseek" | "openai"
  model?: string
  temperature?: number
  max_tokens?: number
}

export interface AIResponse {
  success: boolean
  response?: string
  error?: string
  metadata?: {
    provider: string
    model: string
    processing_time: number
    tokens_used?: number
  }
}

// DeepSeek AI implementation
class DeepSeekAI {
  /** The API key used for authenticating requests to DeepSeek. */
  private apiKey: string
  /** Base URL for the DeepSeek API. */
  private baseUrl = "https://api.deepseek.com"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string, options: AIProviderConfig): Promise<AIResponse> {
    const startTime = Date.now()
    try {
      // The deepseek‑reasoner model produces both reasoning_content and content【436649618173805†L58-L93】.
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-reasoner",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          // max_tokens is optional but included if provided by the caller.
          max_tokens: options.max_tokens,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime
      const choice = data.choices?.[0]?.message ?? {}
      const text = choice.content || choice.reasoning_content || ""

      return {
        success: true,
        response: text || "لم يتم إنتاج رد",
        metadata: {
          provider: "deepseek",
          model: "deepseek-reasoner",
          processing_time: processingTime,
          tokens_used: data.usage?.total_tokens ?? 0,
        },
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error("DeepSeek API Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
        metadata: {
          provider: "deepseek",
          model: "unknown",
          processing_time: processingTime,
        },
      }
    }
  }
}

// OpenAI implementation
class OpenAIProvider {
  /** API key for authenticating requests to OpenAI. */
  private apiKey: string
  /** Base URL for the OpenAI API. */
  private baseUrl = "https://api.openai.com/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string, options: AIProviderConfig): Promise<AIResponse> {
    const startTime = Date.now()
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 2000,
          stream: false,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }
      const data = await response.json()
      const processingTime = Date.now() - startTime
      return {
        success: true,
        response: data.choices?.[0]?.message?.content || "لم يتم إنتاج رد",
        metadata: {
          provider: "openai",
          model: "gpt-5",
          processing_time: processingTime,
          tokens_used: data.usage?.total_tokens ?? 0,
        },
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error("OpenAI API Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
        metadata: {
          provider: "openai",
          model: "unknown",
          processing_time: processingTime,
        },
      }
    }
  }
}

// Main AI orchestrator
export class DrXAI {
  private deepseek: DeepSeekAI
  private openai: OpenAIProvider

  constructor() {
    this.deepseek = new DeepSeekAI(process.env.DEEPSEEK_API_KEY || "")
    this.openai = new OpenAIProvider(process.env.OPENAI_API_KEY || "")
  }

  async generateResponse(
    prompt: string,
    options: AIProviderConfig = { provider: "deepseek" },
  ): Promise<AIResponse> {
    try {
      let response: AIResponse

      if (options.provider === "deepseek" && process.env.DEEPSEEK_API_KEY) {
        response = await this.deepseek.generateText(prompt, options)
        // fallback to OpenAI if DeepSeek fails
        if (!response.success && process.env.OPENAI_API_KEY) {
          console.warn("DeepSeek failed, falling back to OpenAI:", response.error)
          response = await this.openai.generateText(prompt, { ...options, provider: "openai" })
        }
      } else if (options.provider === "openai" && process.env.OPENAI_API_KEY) {
        response = await this.openai.generateText(prompt, options)
        // fallback to DeepSeek if OpenAI fails
        if (!response.success && process.env.DEEPSEEK_API_KEY) {
          console.warn("OpenAI failed, falling back to DeepSeek:", response.error)
          response = await this.deepseek.generateText(prompt, { ...options, provider: "deepseek" })
        }
      } else {
        return {
          success: false,
          error: "لا توجد مفاتيح API صالحة متاحة",
        }
      }
      return response
    } catch (error) {
      console.error("DrXAI Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      }
    }
  }

  async getAvailableProviders(): Promise<string[]> {
    const providers: string[] = []
    if (process.env.OPENAI_API_KEY) {
      providers.push("openai")
    }
    if (process.env.DEEPSEEK_API_KEY) {
      providers.push("deepseek")
    }
    return providers
  }

  /**
   * Test each provider by sending a simple prompt.  Returns an object mapping
   * provider names to booleans indicating whether the call was successful.
   */
  async testProviders(): Promise<Record<string, boolean>> {
    const tests: Record<string, boolean> = {}
    const prompt = "اختبار الاتصال" // Arabic for "connection test"

    // Test DeepSeek if API key is available
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const res = await this.deepseek.generateText(prompt, { provider: "deepseek" })
        tests["deepseek"] = res.success
      } catch {
        tests["deepseek"] = false
      }
    }

    // Test OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const res = await this.openai.generateText(prompt, { provider: "openai" })
        tests["openai"] = res.success
      } catch {
        tests["openai"] = false
      }
    }
    return tests
  }

  /**
   * Returns a simple health report for each provider and the environment.  The
   * string values are either `online` or `offline`.  A provider is considered
   * online if its API key is set and a basic call succeeds.
   */
  async getSystemHealth(): Promise<Record<string, string>> {
    const health: Record<string, string> = {}
    const tests = await this.testProviders()
    for (const provider of Object.keys(tests)) {
      health[provider] = tests[provider] ? "online" : "offline"
    }
    // Include database and cache flags if environment variables are defined
    health["database"] = process.env.DATABASE_URL ? "online" : "offline"
    health["cache"] = process.env.KV_REST_API_URL ? "online" : "offline"
    return health
  }
}

export const aiOrchestrator = new DrXAI()
export default DrXAI
