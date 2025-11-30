"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Settings, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import MessageBubble from "@/components/message-bubble"
import TypingIndicator from "@/components/typing-indicator"
import { toast } from "sonner"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: string
  modelName?: string
  processingTime?: number
  tokensUsed?: number
}

interface AIConfig {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  autoSwitchModel?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [config, setConfig] = useState<AIConfig>({
    model: "auto", // 'auto' for automatic switching
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    stream: true,
    autoSwitchModel: true,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input, config }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "فشل في جلب الرد من AI")
      }

      const data = await response.json()

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.response,
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          modelName: data.data.metadata?.model,
          processingTime: data.data.metadata?.processing_time,
          tokensUsed: data.data.metadata?.tokens_used,
        }
        setMessages((prevMessages) => [...prevMessages, aiMessage])
      } else {
        throw new Error(data.error || "حدث خطأ غير معروف")
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error("خطأ في الدردشة", {
        description: error.message || "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
      })
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          text: `عذراً، حدث خطأ: ${error.message || "فشل في جلب الرد."} يرجى المحاولة مرة أخرى.`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          modelName: "Error",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async (messageToRegenerate: string) => {
    const lastUserMessage = messages.findLast((msg) => msg.isUser && msg.text === messageToRegenerate)
    if (!lastUserMessage) return

    // Remove the last AI response if it exists
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messages[messages.length - 1].id || msg.isUser),
    )
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: lastUserMessage.text, config }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "فشل في جلب الرد من AI")
      }

      const data = await response.json()

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.response,
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          modelName: data.data.metadata?.model,
          processingTime: data.data.metadata?.processing_time,
          tokensUsed: data.data.metadata?.tokens_used,
        }
        setMessages((prevMessages) => [...prevMessages, aiMessage])
      } else {
        throw new Error(data.error || "حدث خطأ غير معروف")
      }
    } catch (error: any) {
      console.error("Error regenerating message:", error)
      toast.error("خطأ في إعادة التوليد", {
        description: error.message || "حدث خطأ أثناء إعادة توليد الرد. يرجى المحاولة مرة أخرى.",
      })
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          text: `عذراً، حدث خطأ أثناء إعادة التوليد: ${error.message || "فشل في جلب الرد."} يرجى المحاولة مرة أخرى.`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          modelName: "Error",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = (messageId: string, feedback: "up" | "down") => {
    toast.success(`تم تسجيل تقييمك (${feedback === "up" ? "إعجاب" : "عدم إعجاب"}) للرسالة!`)
    // Here you would typically send this feedback to your backend
    console.log(`Feedback for message ${messageId}: ${feedback}`)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
        <h1 className="text-xl font-bold text-white">DrX AI Chat</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
          <Settings className="h-5 w-5 text-gray-400 hover:text-white" />
          <span className="sr-only">الإعدادات</span>
        </Button>
      </header>

      <main className="flex-1 overflow-hidden p-4 flex">
        <div className="flex-1 flex flex-col bg-gray-900 rounded-lg shadow-lg p-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg.text}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                  modelName={msg.modelName}
                  processingTime={msg.processingTime}
                  tokensUsed={msg.tokensUsed}
                  onRegenerate={msg.isUser ? () => handleRegenerate(msg.text) : undefined}
                  onFeedback={!msg.isUser ? (feedback) => handleFeedback(msg.id, feedback) : undefined}
                />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <Input
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
              placeholder="اكتب رسالتك هنا..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">إرسال</span>
            </Button>
          </form>
        </div>

        {isSettingsOpen && (
          <Card className="w-80 ml-4 bg-gray-900 text-gray-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">إعدادات AI</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
                <span className="sr-only">إغلاق</span>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="model-select" className="text-sm">
                  النموذج
                </Label>
                <Select value={config.model} onValueChange={(value) => setConfig({ ...config, model: value })}>
                  <SelectTrigger id="model-select" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="اختر نموذجًا" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="auto">تلقائي (OpenAI / DeepSeek)</SelectItem>
                    <SelectItem value="deepseek">DeepSeek (Reasoner)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT‑5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="temperature-slider" className="text-sm flex justify-between">
                  <span>درجة الحرارة</span>
                  <span>{config.temperature?.toFixed(1)}</span>
                </Label>
                <Slider
                  id="temperature-slider"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.temperature || 0.7]}
                  onValueChange={(value) => setConfig({ ...config, temperature: value[0] })}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max-tokens-slider" className="text-sm flex justify-between">
                  <span>الحد الأقصى للرموز</span>
                  <span>{config.maxTokens}</span>
                </Label>
                <Slider
                  id="max-tokens-slider"
                  min={128}
                  max={4096}
                  step={128}
                  value={[config.maxTokens || 1024]}
                  onValueChange={(value) => setConfig({ ...config, maxTokens: value[0] })}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="top-p-slider" className="text-sm flex justify-between">
                  <span>Top P</span>
                  <span>{config.topP?.toFixed(1)}</span>
                </Label>
                <Slider
                  id="top-p-slider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[config.topP || 0.9]}
                  onValueChange={(value) => setConfig({ ...config, topP: value[0] })}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="stream-switch" className="text-sm">
                  تدفق الرد
                </Label>
                <Switch
                  id="stream-switch"
                  checked={config.stream}
                  onCheckedChange={(checked) => setConfig({ ...config, stream: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-switch-model" className="text-sm">
                  تبديل النموذج تلقائياً
                </Label>
                <Switch
                  id="auto-switch-model"
                  checked={config.autoSwitchModel}
                  onCheckedChange={(checked) => setConfig({ ...config, autoSwitchModel: checked })}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <p className="text-xs text-gray-500">تغيير الإعدادات سيؤثر على الردود المستقبلية.</p>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  )
}
