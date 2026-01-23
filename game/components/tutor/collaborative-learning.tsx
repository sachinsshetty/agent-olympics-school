"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface CollaborativeChallenge {
  id: string
  title: string
  description: string
  type: "group-problem" | "peer-review" | "knowledge-share" | "debate"
  participants: string[]
  status: "waiting" | "active" | "completed"
  timeLimit: number
  progress: number
  contributions: Contribution[]
}

interface Contribution {
  playerId: string
  playerName: string
  type: "hint" | "explanation" | "question" | "answer"
  content: string
  timestamp: Date
  helpful: number
}

interface MentorshipPair {
  mentor: string
  learner: string
  topic: string
  progress: number
  achievements: string[]
}

export function CollaborativeLearning({
  players,
  currentQuestion,
  onContribution,
  onHelpRequest,
  className
}: {
  players: any[]
  currentQuestion: any
  onContribution: (type: string, content: string) => void
  onHelpRequest: (playerId: string) => void
  className?: string
}) {
  const [activeChallenges, setActiveChallenges] = useState<CollaborativeChallenge[]>([])
  const [mentorshipPairs, setMentorshipPairs] = useState<MentorshipPair[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<CollaborativeChallenge | null>(null)
  const [contributionText, setContributionText] = useState("")
  const [contributionType, setContributionType] = useState<"hint" | "explanation" | "question" | "answer">("hint")

  // Initialize collaborative challenges based on game mode
  useEffect(() => {
    if (currentQuestion?.collaborative) {
      const challenge: CollaborativeChallenge = {
        id: `challenge-${currentQuestion.id}`,
        title: "Group Problem Solving",
        description: currentQuestion.question,
        type: "group-problem",
        participants: players.filter(p => p.status === "alive").map(p => p.id),
        status: "active",
        timeLimit: currentQuestion.timeLimit || 60,
        progress: 0,
        contributions: []
      }
      setActiveChallenges([challenge])
      setSelectedChallenge(challenge)
    }
  }, [currentQuestion, players])

  const handleContribution = () => {
    if (!contributionText.trim() || !selectedChallenge) return

    const contribution: Contribution = {
      playerId: "current-player", // Would come from context
      playerName: "You",
      type: contributionType,
      content: contributionText,
      timestamp: new Date(),
      helpful: 0
    }

    setSelectedChallenge(prev => prev ? {
      ...prev,
      contributions: [...prev.contributions, contribution]
    } : null)

    onContribution(contributionType, contributionText)
    setContributionText("")
  }

  const getContributionIcon = (type: string) => {
    switch (type) {
      case "hint": return "💡"
      case "explanation": return "📚"
      case "question": return "❓"
      case "answer": return "✅"
      default: return "💭"
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              🤝 Collaborative Challenges
              <Badge variant="secondary">{activeChallenges.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeChallenges.map(challenge => (
              <div key={challenge.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{challenge.title}</span>
                  <Badge variant={challenge.status === "active" ? "default" : "secondary"}>
                    {challenge.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{challenge.description}</p>
                <Progress value={challenge.progress} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>👥 {challenge.participants.length} participants</span>
                  <span>⏱️ {Math.floor(challenge.timeLimit / 60)}:{(challenge.timeLimit % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Collaboration Panel */}
      {selectedChallenge && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">💬 Group Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Contributions */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedChallenge.contributions.map((contrib, index) => (
                <div key={index} className="flex gap-2 p-2 bg-muted/50 rounded">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {contrib.playerName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs">
                      <span>{getContributionIcon(contrib.type)}</span>
                      <span className="font-medium">{contrib.playerName}</span>
                      <span className="text-muted-foreground">
                        {contrib.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs mt-1">{contrib.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contribution Input */}
            <div className="space-y-2">
              <div className="flex gap-1">
                {["hint", "explanation", "question", "answer"].map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant={contributionType === type ? "default" : "outline"}
                    onClick={() => setContributionType(type as any)}
                    className="text-xs h-7"
                  >
                    {getContributionIcon(type)} {type}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={contributionText}
                  onChange={(e) => setContributionText(e.target.value)}
                  placeholder={`Share a ${contributionType}...`}
                  className="text-xs min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleContribution()
                    }
                  }}
                />
                <Button size="sm" onClick={handleContribution} disabled={!contributionText.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mentorship Status */}
      {mentorshipPairs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">🎓 Active Mentorship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mentorshipPairs.map(pair => (
              <div key={`${pair.mentor}-${pair.learner}`} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-xs">👨‍🏫 {pair.mentor} → 👨‍🎓 {pair.learner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={pair.progress} className="w-16 h-2" />
                  <span className="text-xs text-muted-foreground">{pair.progress}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Help Request System */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">🆘 Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {players
              .filter(p => p.status === "alive" && p.role === "mentor")
              .map(mentor => (
                <Button
                  key={mentor.id}
                  size="sm"
                  variant="outline"
                  onClick={() => onHelpRequest(mentor.id)}
                  className="text-xs h-8"
                >
                  Ask {mentor.name}
                </Button>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  )
}