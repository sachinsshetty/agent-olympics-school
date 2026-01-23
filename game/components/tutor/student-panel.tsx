"use client"

import { useState } from "react"
import { ChatPanel } from "./chat-panel"
import { ProgressBar } from "./progress-bar"
import { LearningPath } from "./learning-path"
import { cn } from "@/lib/utils"

interface StudentPanelProps {
  studentId: "1" | "2"
}

const studentData = {
  "1": {
    name: "Alex",
    variant: "student-1" as const,
    progress: 72,
    streak: 7,
    xp: 2450,
    level: 8,
    rank: "Intermediate",
    currentLesson: "Data Structures",
    learningPath: [
      { id: "1", title: "Intro", status: "completed" as const, type: "lesson" as const },
      { id: "2", title: "Basics", status: "completed" as const, type: "lesson" as const },
      { id: "3", title: "Quiz 1", status: "completed" as const, type: "quiz" as const },
      { id: "4", title: "Data Struct", status: "in-progress" as const, type: "lesson" as const },
      { id: "5", title: "Practice", status: "pending" as const, type: "project" as const },
    ],
  },
  "2": {
    name: "Jordan",
    variant: "student-2" as const,
    progress: 58,
    streak: 3,
    xp: 1820,
    level: 5,
    rank: "Beginner",
    currentLesson: "Algorithms",
    learningPath: [
      { id: "1", title: "Intro", status: "completed" as const, type: "lesson" as const },
      { id: "2", title: "Basics", status: "completed" as const, type: "lesson" as const },
      { id: "3", title: "Algorithms", status: "in-progress" as const, type: "lesson" as const },
      { id: "4", title: "Quiz 2", status: "pending" as const, type: "quiz" as const },
      { id: "5", title: "Challenge", status: "locked" as const, type: "project" as const },
    ],
  },
}

export function StudentPanel({ studentId }: StudentPanelProps) {
  const [activeTab, setActiveTab] = useState<"learn" | "chat">("learn")
  const student = studentData[studentId]

  const borderColor = student.variant === "student-1" 
    ? "border-node-student-1/30" 
    : "border-node-student-2/30"

  const accentBg = student.variant === "student-1"
    ? "bg-node-student-1/20"
    : "bg-node-student-2/20"

  const accentText = student.variant === "student-1"
    ? "text-node-student-1"
    : "text-node-student-2"

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-xl border overflow-hidden", borderColor)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/50">
        <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg", accentBg)}>
          <svg
            className={cn("w-4 h-4", accentText)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{student.name}</h2>
          <p className="text-xs text-muted-foreground">Level {student.level} - {student.rank}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className={cn(
            "w-2 h-2 rounded-full animate-pulse", 
            student.variant === "student-1" ? "bg-node-student-1" : "bg-node-student-2"
          )} />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("learn")}
          className={cn(
            "flex-1 py-2 text-xs font-medium transition-colors",
            activeTab === "learn"
              ? cn("border-b-2", student.variant === "student-1" ? "border-node-student-1 text-foreground" : "border-node-student-2 text-foreground")
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Learning Path
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 py-2 text-xs font-medium transition-colors",
            activeTab === "chat"
              ? cn("border-b-2", student.variant === "student-1" ? "border-node-student-1 text-foreground" : "border-node-student-2 text-foreground")
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          AI Tutor
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === "learn" ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className={cn("p-2 rounded-lg text-center", accentBg)}>
                <p className={cn("text-lg font-bold", accentText)}>{student.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className={cn("p-2 rounded-lg text-center", accentBg)}>
                <p className={cn("text-lg font-bold", accentText)}>{student.xp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP Points</p>
              </div>
              <div className={cn("p-2 rounded-lg text-center", accentBg)}>
                <p className={cn("text-lg font-bold", accentText)}>{student.progress}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>

            {/* Current Topic Banner */}
            <div className={cn("p-3 rounded-lg border", accentBg, borderColor)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Now Learning</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full", accentBg, accentText)}>
                  4/6 lessons
                </span>
              </div>
              <p className={cn("text-sm font-medium", accentText)}>{student.currentLesson}</p>
            </div>

            {/* Current Progress */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Course Progress</h3>
              <ProgressBar value={student.progress} variant={student.variant} />
            </div>

            {/* Learning Path */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Your Learning Path</h3>
              <div className="overflow-x-auto pb-2">
                <LearningPath nodes={student.learningPath} variant={student.variant} compact />
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground px-1">Recent Activity</h3>
              {[
                { action: "Completed quiz", time: "2 min ago", type: "success" },
                { action: "Started lesson", time: "15 min ago", type: "info" },
                { action: "Asked AI tutor", time: "1 hr ago", type: "neutral" },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30"
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      activity.type === "success" && "bg-primary",
                      activity.type === "info" && (student.variant === "student-1" ? "bg-node-student-1" : "bg-node-student-2"),
                      activity.type === "neutral" && "bg-muted-foreground"
                    )}
                  />
                  <span className="text-xs text-foreground flex-1">{activity.action}</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <ChatPanel
            title="AI Tutor"
            placeholder="Ask about your lesson..."
            variant={student.variant}
          />
        )}
      </div>
    </div>
  )
}
