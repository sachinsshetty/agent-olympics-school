"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

const BACKEND_URL = "https://school-server.dwani.ai/"

interface AIHint {
  type: "hint" | "explanation" | "strategy" | "analogy"
  content: string
  confidence: number
  difficulty: "easy" | "medium" | "hard"
}

interface AISuggestion {
  id: string
  type: "approach" | "concept" | "practice"
  title: string
  description: string
  relevance: number
  timeEstimate: number
}

export function AIAssistance({
  currentQuestion,
  playerProgress,
  gameState,
  onAIHelp,
  className
}: {
  currentQuestion: any
  playerProgress: any
  gameState: string
  onAIHelp: (helpType: string, content: string) => void
  className?: string
}) {
  const [aiHints, setAiHints] = useState<AIHint[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedHint, setSelectedHint] = useState<AIHint | null>(null)
  const [customQuestion, setCustomQuestion] = useState("")

  // Generate AI hints based on current question
  useEffect(() => {
    if (currentQuestion) {
      generateAIHints()
      generateSuggestions()
    }
  }, [currentQuestion])

  const generateAIHints = async () => {
    setIsLoading(true)
    try {
      // Simulate AI hint generation (would call backend in real implementation)
      const mockHints: AIHint[] = [
        {
          type: "hint",
          content: "Think about what you know about this topic from previous lessons.",
          confidence: 0.85,
          difficulty: "easy"
        },
        {
          type: "strategy",
          content: "Break down the problem into smaller, manageable parts.",
          confidence: 0.92,
          difficulty: "medium"
        },
        {
          type: "analogy",
          content: "This is similar to [related concept] you learned last week.",
          confidence: 0.78,
          difficulty: "medium"
        }
      ]

      // In real implementation, this would call the AI backend
      // const response = await fetch(`${BACKEND_URL}/ai/hints`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ question: currentQuestion })
      // })
      // const hints = await response.json()

      setTimeout(() => {
        setAiHints(mockHints)
        setIsLoading(false)
      }, 1000)

    } catch (error) {
      console.error("Error generating AI hints:", error)
      setIsLoading(false)
    }
  }

  const generateSuggestions = () => {
    const mockSuggestions: AISuggestion[] = [
      {
        id: "1",
        type: "approach",
        title: "Step-by-Step Method",
        description: "Work through this systematically, one step at a time.",
        relevance: 0.9,
        timeEstimate: 5
      },
      {
        id: "2",
        type: "concept",
        title: "Review Key Concepts",
        description: "Make sure you understand the fundamental principles first.",
        relevance: 0.85,
        timeEstimate: 3
      },
      {
        id: "3",
        type: "practice",
        title: "Practice Similar Problems",
        description: "Try solving 2-3 similar problems to reinforce understanding.",
        relevance: 0.75,
        timeEstimate: 15
      }
    ]
    setSuggestions(mockSuggestions)
  }

  const askCustomQuestion = async () => {
    if (!customQuestion.trim()) return

    setIsLoading(true)
    try {
      // In real implementation, this would call the AI backend
      // const response = await fetch(`${BACKEND_URL}/ai/ask`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     question: customQuestion,
      //     context: currentQuestion,
      //     playerProgress
      //   })
      // })
      // const answer = await response.json()

      // Mock response
      const mockAnswer = {
        type: "answer",
        content: "Based on what you've shared, here's my explanation...",
        confidence: 0.88
      }

      onAIHelp("custom-question", mockAnswer.content)
      setCustomQuestion("")
    } catch (error) {
      console.error("Error asking AI:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getHintIcon = (type: string) => {
    switch (type) {
      case "hint": return "💡"
      case "explanation": return "📖"
      case "strategy": return "🎯"
      case "analogy": return "🔗"
      default: return "🤔"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500"
      case "medium": return "bg-yellow-500"
      case "hard": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  if (gameState !== "playing") return null

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Hints */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            🤖 AI Learning Assistant
            {isLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {aiHints.length > 0 ? (
            <div className="space-y-2">
              {aiHints.map((hint, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getHintIcon(hint.type)}</span>
                      <span className="font-medium text-sm capitalize">{hint.type}</span>
                      <div className={cn("w-2 h-2 rounded-full", getDifficultyColor(hint.difficulty))} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(hint.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm">{hint.content}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAIHelp(hint.type, hint.content)}
                    className="text-xs h-7"
                  >
                    Use This Hint
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">AI hints will appear here...</p>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">🎯 Personalized Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="p-2 border rounded space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{suggestion.title}</span>
                <div className="flex items-center gap-1">
                  <Progress value={suggestion.relevance * 100} className="w-12 h-2" />
                  <span className="text-xs text-muted-foreground">
                    {suggestion.timeEstimate}m
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{suggestion.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Question */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">❓ Ask AI Anything</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask the AI for help with this question..."
            className="text-sm min-h-[60px]"
          />
          <Button
            onClick={askCustomQuestion}
            disabled={!customQuestion.trim() || isLoading}
            className="w-full"
            size="sm"
          >
            {isLoading ? "Thinking..." : "Ask AI"}
          </Button>
        </CardContent>
      </Card>

      {/* AI Status */}
      <Alert>
        <AlertDescription className="text-xs">
          💡 AI assistance is available to help you learn. Use hints strategically - they help build understanding!
        </AlertDescription>
      </Alert>
    </div>
  )
}