"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  title?: string
  placeholder?: string
  variant?: "teacher" | "student-1" | "student-2"
  compact?: boolean
}

export function ChatPanel({
  title = "AI Assistant",
  placeholder = "Ask a question...",
  variant = "teacher",
  compact = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI tutor. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const variantColors = {
    teacher: "border-node-teacher/30",
    "student-1": "border-node-student-1/30",
    "student-2": "border-node-student-2/30",
  }

  const variantAccent = {
    teacher: "bg-node-teacher text-background",
    "student-1": "bg-node-student-1 text-background",
    "student-2": "bg-node-student-2 text-background",
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const simulateResponse = () => {
    const responses = [
      "That's a great question! Let me explain the concept in more detail.",
      "I understand what you're asking. The key point here is to focus on the fundamentals.",
      "Good thinking! This relates to what we covered earlier in the lesson.",
      "Let me break this down step by step for better understanding.",
      "Excellent question! This is a common area of confusion, so let's clarify.",
    ]
    
    setIsLoading(true)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: responses[Math.floor(Math.random() * responses.length)],
        },
      ])
      setIsLoading(false)
    }, 800 + Math.random() * 800)
  }

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      },
    ])
    setInput("")
    simulateResponse()
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg bg-card border",
        variantColors[variant],
        compact ? "h-[200px]" : "h-[300px]"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className={cn("w-2 h-2 rounded-full", variantAccent[variant])} />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={cn(
            "flex flex-col",
            message.role === "user" ? "items-end" : "items-start"
          )}>
            <div
              className={cn(
                "max-w-[85%] px-3 py-2 rounded-lg text-sm",
                message.role === "user"
                  ? cn("ml-auto", variantAccent[variant])
                  : "bg-primary/10 border border-primary/20 text-foreground"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs">AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 p-2 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={cn(variantAccent[variant], "hover:opacity-90 disabled:opacity-50")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </Button>
      </div>
    </div>
  )
}
