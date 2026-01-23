"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Star, Zap, Heart, Target, BookOpen } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlockedAt?: Date
  progress: number
  maxProgress: number
}

interface PlayerStats {
  level: number
  xp: number
  xpToNext: number
  streak: number
  totalCorrect: number
  totalQuestions: number
  badges: string[]
  achievements: Achievement[]
  weeklyStats: {
    questionsAnswered: number
    correctAnswers: number
    timeSpent: number
    collaborationScore: number
  }
}

const ACHIEVEMENT_LIST: Achievement[] = [
  {
    id: "first-correct",
    name: "First Steps",
    description: "Answer your first question correctly",
    icon: "🎯",
    rarity: "common",
    progress: 0,
    maxProgress: 1
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Answer 10 questions in under 30 seconds each",
    icon: "⚡",
    rarity: "rare",
    progress: 0,
    maxProgress: 10
  },
  {
    id: "helper",
    name: "Knowledge Sharer",
    description: "Help 5 teammates with hints or explanations",
    icon: "🤝",
    rarity: "rare",
    progress: 0,
    maxProgress: 5
  },
  {
    id: "streak-master",
    name: "Streak Master",
    description: "Maintain a 10-question correct answer streak",
    icon: "🔥",
    rarity: "epic",
    progress: 0,
    maxProgress: 10
  },
  {
    id: "mentor",
    name: "Wise Mentor",
    description: "Successfully mentor 3 learners to level up",
    icon: "🎓",
    rarity: "epic",
    progress: 0,
    maxProgress: 3
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Achieve 100% accuracy on a full game",
    icon: "💎",
    rarity: "legendary",
    progress: 0,
    maxProgress: 1
  }
]

export function GamificationSystem({
  player,
  gameStats,
  onAchievementUnlock,
  className
}: {
  player: any
  gameStats: any
  onAchievementUnlock: (achievement: Achievement) => void
  className?: string
}) {
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: player?.level || 1,
    xp: player?.score || 0,
    xpToNext: 100,
    streak: player?.streak || 0,
    totalCorrect: 0,
    totalQuestions: 0,
    badges: player?.badges || [],
    achievements: ACHIEVEMENT_LIST.map(a => ({
      ...a,
      unlockedAt: player?.achievements?.includes(a.id) ? new Date() : undefined
    })),
    weeklyStats: {
      questionsAnswered: 0,
      correctAnswers: 0,
      timeSpent: 0,
      collaborationScore: 0
    }
  })

  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null)

  // Calculate level and XP
  useEffect(() => {
    const calculateLevel = (xp: number) => {
      // Level up every 100 XP, with increasing requirements
      let level = 1
      let required = 100
      while (xp >= required) {
        xp -= required
        level++
        required = Math.floor(required * 1.2) // Increasing difficulty
      }
      return { level, xpToNext: required - xp }
    }

    const { level, xpToNext } = calculateLevel(playerStats.xp)
    setPlayerStats(prev => ({
      ...prev,
      level,
      xpToNext
    }))
  }, [playerStats.xp])

  // Check for achievements
  useEffect(() => {
    const checkAchievements = () => {
      const newAchievements = playerStats.achievements.filter(a => !a.unlockedAt)

      newAchievements.forEach(achievement => {
        let shouldUnlock = false

        switch (achievement.id) {
          case "first-correct":
            shouldUnlock = playerStats.totalCorrect >= 1
            break
          case "speed-demon":
            shouldUnlock = achievement.progress >= achievement.maxProgress
            break
          case "streak-master":
            shouldUnlock = playerStats.streak >= 10
            break
          // Add more achievement logic
        }

        if (shouldUnlock) {
          const unlockedAchievement = {
            ...achievement,
            unlockedAt: new Date()
          }
          setShowAchievement(unlockedAchievement)
          onAchievementUnlock(unlockedAchievement)

          setTimeout(() => setShowAchievement(null), 3000)
        }
      })
    }

    checkAchievements()
  }, [playerStats, onAchievementUnlock])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-gray-400 bg-gray-50"
      case "rare": return "border-blue-400 bg-blue-50"
      case "epic": return "border-purple-400 bg-purple-50"
      case "legendary": return "border-yellow-400 bg-yellow-50"
      default: return "border-gray-400 bg-gray-50"
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "legendary": return <Trophy className="w-3 h-3 text-yellow-600" />
      case "epic": return <Star className="w-3 h-3 text-purple-600" />
      case "rare": return <Zap className="w-3 h-3 text-blue-600" />
      default: return <Target className="w-3 h-3 text-gray-600" />
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Level and XP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {playerStats.level}
              </AvatarFallback>
            </Avatar>
            Level {playerStats.level}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>XP Progress</span>
            <span>{playerStats.xp} / {playerStats.xp + playerStats.xpToNext} XP</span>
          </div>
          <Progress value={(playerStats.xp / (playerStats.xp + playerStats.xpToNext)) * 100} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {playerStats.xpToNext} XP to next level
          </div>
        </CardContent>
      </Card>

      {/* Current Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">📊 Current Game Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{playerStats.streak}</div>
              <div className="text-muted-foreground">Answer Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {playerStats.totalQuestions > 0
                  ? Math.round((playerStats.totalCorrect / playerStats.totalQuestions) * 100)
                  : 0}%
              </div>
              <div className="text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{playerStats.badges.length}</div>
              <div className="text-muted-foreground">Badges Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {playerStats.achievements.filter(a => a.unlockedAt).length}
              </div>
              <div className="text-muted-foreground">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">🏆 Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {playerStats.achievements.map(achievement => (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg transition-all",
                  achievement.unlockedAt
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                    : "bg-muted/20 border-muted",
                  showAchievement?.id === achievement.id && "ring-2 ring-yellow-400"
                )}
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium text-sm",
                      achievement.unlockedAt ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {achievement.name}
                    </span>
                    {achievement.unlockedAt && (
                      <Badge variant="secondary" className="text-xs">
                        Unlocked!
                      </Badge>
                    )}
                    {getRarityIcon(achievement.rarity)}
                  </div>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  {!achievement.unlockedAt && achievement.maxProgress > 1 && (
                    <div className="mt-1">
                      <Progress
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">📈 Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Questions Answered</span>
              <span className="font-medium">{playerStats.weeklyStats.questionsAnswered}</span>
            </div>
            <div className="flex justify-between">
              <span>Correct Answers</span>
              <span className="font-medium text-green-600">{playerStats.weeklyStats.correctAnswers}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Spent Learning</span>
              <span className="font-medium">{Math.round(playerStats.weeklyStats.timeSpent / 60)}m</span>
            </div>
            <div className="flex justify-between">
              <span>Collaboration Score</span>
              <span className="font-medium text-blue-600">{playerStats.weeklyStats.collaborationScore}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{showAchievement.icon}</div>
                <div>
                  <div className="font-bold text-sm">Achievement Unlocked!</div>
                  <div className="text-sm text-muted-foreground">{showAchievement.name}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}