"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const BACKEND_URL = "https://school-server.dwani.ai/"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Student {
  id: string
  name: string
  grade_level: string
}

interface Topic {
  id: string
  name: string
}

interface ConversationResponse {
  student_response: string
  turn_number: number
  analysis: {
    understanding_level: number
    justification: string
  }
  suggestion: {
    suggested_response: string
  }
}

export function AITutorChatbot() {
  const [student, setStudent] = useState<Student | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("Ready to start")
  const [understandingLevel, setUnderstandingLevel] = useState(3)
  const [analysis, setAnalysis] = useState("")
  const [suggestion, setSuggestion] = useState("")
  const [turnNumber, setTurnNumber] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const startRandomSession = async () => {
    setIsLoading(true)
    setStatus("Loading session...")

    try {
      // Randomly select set type
      const setTypes = ["mini_dev", "dev", "eval"]
      const selectedSet = setTypes[Math.floor(Math.random() * setTypes.length)]

      // Get students
      const studentsResp = await fetch(`${BACKEND_URL}/students?set_type=${selectedSet}`)
      const studentsData = await studentsResp.json()
      const students = studentsData.students || []

      if (!students.length) {
        throw new Error("No students found")
      }

      const selectedStudent = students[Math.floor(Math.random() * students.length)]
      setStudent(selectedStudent)

      // Get topics for student
      const topicsResp = await fetch(`${BACKEND_URL}/students/${selectedStudent.id}/topics`)
      const topicsData = await topicsResp.json()
      const topics = topicsData.topics || []

      if (!topics.length) {
        throw new Error("No topics found")
      }

      const selectedTopic = topics[Math.floor(Math.random() * topics.length)]
      setTopic(selectedTopic)

      // Start conversation
      const startResp = await fetch(`${BACKEND_URL}/conversations/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          topic_id: selectedTopic.id,
          set_type: selectedSet,
        }),
      })

      const startData = await startResp.json()
      const convId = startData.conversation_id
      setConversationId(convId)

      setMessages([])
      setUnderstandingLevel(3)
      setAnalysis("")
      setSuggestion("")
      setTurnNumber(0)
      setStatus(`🚀 Ready (${selectedSet})`)

    } catch (error) {
      console.error("Error starting session:", error)
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !conversationId) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setStatus("AI is thinking...")

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }])

    try {
      const payload = {
        conversation_id: conversationId,
        tutor_message: userMessage,
        topic_name: topic?.name || "Topic",
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      }

      const resp = await fetch(`${BACKEND_URL}/conversations/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data: ConversationResponse = await resp.json()

      // Add assistant response
      setMessages(prev => [...prev, { role: "assistant", content: data.student_response }])

      // Update analysis data
      setTurnNumber(data.turn_number)
      setUnderstandingLevel(data.analysis?.understanding_level || 3)
      setAnalysis(data.analysis?.justification || "")
      setSuggestion(data.suggestion?.suggested_response || "")

      setStatus(`Turn ${data.turn_number}/10`)

    } catch (error) {
      console.error("Error sending message:", error)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Sorry, there was an error processing your message. Please try again."
      }])
      setStatus("Error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getUnderstandingColor = (level: number) => {
    if (level >= 4) return "bg-green-500"
    if (level >= 3) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getUnderstandingLabel = (level: number) => {
    if (level >= 4) return "Advanced"
    if (level >= 3) return "Good"
    if (level >= 2) return "Needs Work"
    return "Struggling"
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">🧑‍🏫 AI Tutor Chatbot</h2>
          <p className="text-sm text-muted-foreground">Interactive tutoring sessions with real students</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={startRandomSession}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              🎲 New Session
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start a new tutoring session with a random student and topic</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Student and Topic Info */}
      {(student || topic) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {student && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">👨‍🎓 Student</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">Grade {student.grade_level}</p>
              </CardContent>
            </Card>
          )}
          {topic && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">📚 Topic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{topic.name}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">💬 Conversation</CardTitle>
                <Badge variant="outline">{status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>👋 Start a new session to begin tutoring!</p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div key={index} className={cn(
                    "flex flex-col",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div
                      className={cn(
                        "max-w-[80%] px-4 py-2 rounded-lg text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted text-foreground"
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

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Enter your tutoring message..."
                  disabled={isLoading || !conversationId}
                  className="flex-1 min-h-[60px] resize-none"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim() || !conversationId}
                      className="self-end"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send your tutoring message (or press Enter)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-4">
          {/* Understanding Level */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📊 Understanding Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 rounded-full",
                  getUnderstandingColor(understandingLevel)
                )} />
                <span className="font-medium">{understandingLevel}/5</span>
                <Badge variant="outline">{getUnderstandingLabel(understandingLevel)}</Badge>
              </div>
              {turnNumber > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Turn {turnNumber}/10
                </p>
              )}
            </CardContent>
          </Card>

          {/* Analysis */}
          {analysis && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">🔍 Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis}</p>
              </CardContent>
            </Card>
          )}

          {/* Suggestion */}
          {suggestion && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">💡 Suggestion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{suggestion}</p>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Alert>
            <AlertDescription className="text-sm">
              {conversationId
                ? "✅ Session active - Start tutoring!"
                : "🎲 Click 'New Session' to begin tutoring a student"
              }
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}