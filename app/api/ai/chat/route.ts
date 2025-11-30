import { type NextRequest, NextResponse } from "next/server"
import { DrXDatabase } from "@/lib/database"

interface ChatRequest {
  message: string
  settings: {
    /**
     * Select which provider to call.  Only two providers are supported:
     * - `deepseek` will call the DeepSeek API at https://api.deepseek.com using
     *   the `deepseek-reasoner` model.  This model produces a chain‑of‑thought
     *   (`reasoning_content`) in addition to the final answer【436649618173805†L58-L93】.
     * - `openai` will call OpenAI's chat completions API at https://api.openai.com
     *   using the `gpt-5` model.
     */
    model: "deepseek" | "openai"
    /** sampling temperature for OpenAI; DeepSeek ignores this parameter */
    temperature: number
    /** maximum tokens to return */
    maxTokens: number
    /** whether to instruct the system prompt to think step by step */
    enableThinking: boolean
    /** whether to instruct the system prompt to perform deep search */
    enableSearch: boolean
  }
  history: Array<{
    role: "user" | "assistant"
    content: string
  }>
}

// DeepSeek API call
async function callDeepSeekAPI(messages: any[], settings: any) {
  // Use the DeepSeek API key; there is no fallback provider.  According to the
  // DeepSeek quick start guide, the base URL is `https://api.deepseek.com` and
  // the `deepseek-reasoner` model produces both a chain‑of‑thought and a final
  // answer【118620677428090†L60-L74】【436649618173805†L58-L93】.
  const apiKey = process.env.DEEPSEEK_API_KEY
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-reasoner",
      messages,
      // DeepSeek's reasoning model ignores temperature and top_p settings【436649618173805†L85-L92】,
      // but we pass max_tokens for safety.  The API will cap at its default if
      // unspecified.
      max_tokens: settings.maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// OpenAI API call
async function callOpenAIAPI(messages: any[], settings: any) {
  // Call OpenAI's chat completions endpoint with the GPT‑5 model.  We use
  // api.openai.com as the base URL and send the list of messages.  See the
  // OpenAI documentation for details on the chat completions API.
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// Create enhanced system prompt
function createSystemPrompt(settings: any): string {
  let prompt = `أنت drx3، مساعد ذكي متخصص في الذكاء الاصطناعي والبرمجة والتكنولوجيا.

خصائصك:
- خبير في Python، JavaScript، الذكاء الاصطناعي، والتعلم الآلي
- تجيب باللغة العربية بشكل أساسي مع دعم الإنجليزية عند الحاجة
- تقدم إجابات منظمة ومفصلة ومفيدة
- تستخدم التنسيق المناسب (عناوين، قوائم، كود)
- تشرح المفاهيم بطريقة واضحة ومنطقية

إرشادات التنسيق:
- استخدم العناوين (# ## ###) لتنظيم المحتوى
- استخدم القوائم المرقمة والنقطية عند الحاجة
- ضع الكود في صناديق مع تحديد اللغة
- استخدم النص الغامق للنقاط المهمة
- نظم الإجابة بشكل هرمي وواضح

إرشادات المحتوى:
- كن دقيقاً ومفيداً
- قدم أمثلة عملية عند الحاجة
- اشرح الخطوات بوضوح
- اربط المفاهيم ببعضها البعض`

  if (settings.enableThinking) {
    prompt += "\n- فكر خطوة بخطوة قبل الإجابة وأظهر عملية التفكير"
  }

  if (settings.enableSearch) {
    prompt += "\n- ابحث في معرفتك بعمق للحصول على أفضل إجابة شاملة"
  }

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, settings = {}, history } = body

    // Validate input
    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "الرسالة مطلوبة ويجب أن تكون نص" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Prepare messages for API
    const messages = [
      {
        role: "system",
        content: createSystemPrompt(settings),
      },
      // Add recent history for context
      ...history.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ]

    const startTime = Date.now()
    let response
    let actualModel = settings.model

    try {
      // Call the selected model
      if (settings.model === "deepseek") {
        response = await callDeepSeekAPI(messages, settings)
        actualModel = "DeepSeek (Reasoner)"
      } else {
        response = await callOpenAIAPI(messages, settings)
        actualModel = "OpenAI (GPT‑5)"
      }
    } catch (error) {
      console.error(`Primary model (${settings.model}) failed:`, error)

      // Try fallback model
      try {
        if (settings.model === "deepseek") {
          response = await callOpenAIAPI(messages, settings)
          actualModel = "OpenAI (GPT‑5) - Fallback"
        } else {
          response = await callDeepSeekAPI(messages, settings)
          actualModel = "DeepSeek (Reasoner) - Fallback"
        }
      } catch (fallbackError) {
        console.error("Fallback model also failed:", fallbackError)
        return NextResponse.json(
          {
            success: false,
            error: "عذراً، أواجه مشكلة تقنية مؤقتة. يرجى المحاولة مرة أخرى.",
            details: "خطأ غير معروف",
          },
          { status: 500, headers: { "Content-Type": "application/json" } },
        )
      }
    }

    const processingTime = Date.now() - startTime
    // The DeepSeek reasoning model returns both `reasoning_content` and `content`.
    // We prioritise the final answer (`content`) if available.  For OpenAI, the
    // standard `content` field is returned.  If neither is present, fall back to
    // a generic apology.
    const choice = response.choices?.[0]?.message ?? {}
    const content = choice.content || choice.reasoning_content || "عذراً، لم أتمكن من إنتاج رد مناسب."

    // Only log usage if not in build process
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
      try {
        await DrXDatabase.logUsage({
          provider: actualModel.split(" (")[0],
          model: actualModel.split(" (")[1].slice(0, -1),
          processing_time_ms: processingTime,
          tokens_used: response.usage?.total_tokens || Math.floor(content.length / 4),
          success: true,
          error_message: null,
          metadata: { message_length: message.length, settings },
        })
      } catch (logError) {
        console.warn("Failed to log usage (database may not be available):", logError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        content,
        model: actualModel,
        tokens: response.usage?.total_tokens || Math.floor(content.length / 4),
        processingTime,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    models: {
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
  })
}
