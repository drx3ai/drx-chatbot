"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, RefreshCcw, ThumbsDown, ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "./markdown-renderer"
import { toast } from "sonner"

interface MessageBubbleProps {
  message: string
  isUser: boolean
  timestamp?: string
  modelName?: string
  processingTime?: number
  tokensUsed?: number
  onRegenerate?: () => void
  onFeedback?: (feedback: "up" | "down") => void
}

export default function MessageBubble({
  message,
  isUser,
  timestamp,
  modelName,
  processingTime,
  tokensUsed,
  onRegenerate,
  onFeedback,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    toast.success("تم نسخ الرسالة!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex items-start gap-3 mb-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder-logo.png" alt="AI Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          "max-w-[70%] rounded-lg shadow-md",
          isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-800 text-gray-100 rounded-bl-none",
        )}
      >
        <CardContent className="p-3">
          <MarkdownRenderer content={message} />
          <div className="mt-2 text-xs text-gray-400 flex justify-between items-center">
            {timestamp && <span>{timestamp}</span>}
            <div className="flex items-center gap-2">
              {modelName && <span className="font-medium">{modelName}</span>}
              {processingTime !== undefined && <span className="text-gray-500">{processingTime.toFixed(2)}ms</span>}
              {tokensUsed !== undefined && <span className="text-gray-500">{tokensUsed} tokens</span>}
              {!isUser && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-6 w-6 text-gray-400 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">{copied ? "تم النسخ!" : "نسخ"}</span>
                  </Button>
                  {onRegenerate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onRegenerate}
                      className="h-6 w-6 text-gray-400 hover:text-white"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      <span className="sr-only">إعادة توليد</span>
                    </Button>
                  )}
                  {onFeedback && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onFeedback("up")}
                        className="h-6 w-6 text-gray-400 hover:text-green-500"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span className="sr-only">إعجاب</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onFeedback("down")}
                        className="h-6 w-6 text-gray-400 hover:text-red-500"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        <span className="sr-only">عدم إعجاب</span>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
