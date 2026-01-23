"use client"

import { useState } from "react"
import { MetricsCard } from "./metrics-card"
import { ChatPanel } from "./chat-panel"
import { ProgressBar } from "./progress-bar"
import { LearningPath } from "./learning-path"
import { cn } from "@/lib/utils"

const teacherLearningPath = [
  { id: "1", title: "Intro", status: "completed" as const, type: "lesson" as const },
  { id: "2", title: "Basics", status: "completed" as const, type: "lesson" as const },
  { id: "3", title: "Quiz 1", status: "completed" as const, type: "quiz" as const },
  { id: "4", title: "Advanced", status: "in-progress" as const, type: "lesson" as const },
  { id: "5", title: "Project", status: "pending" as const, type: "project" as const },
]

const students = [
  {
    id: "student-1",
    name: "Alex",
    progress: 72,
    currentLesson: "Data Structures",
    status: "active" as const,
    variant: "student-1" as const,
    xp: 2450,
    streak: 7,
  },
  {
    id: "student-2",
    name: "Jordan",
    progress: 58,
    currentLesson: "Algorithms",
    status: "needs-help" as const,
    variant: "student-2" as const,
    xp: 1820,
    streak: 3,
  },
]

export function TeacherPanel() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  const avgProgress = Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-node-teacher/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-node-teacher/20">
          <svg
            className="w-4 h-4 text-node-teacher"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Teacher Dashboard</h2>
          <p className="text-xs text-muted-foreground">Control Center</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricsCard
            title="Total Students"
            value={students.length.toString()}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1"
                />
              </svg>
            }
            variant="info"
          />
          <MetricsCard
            title="Avg. Progress"
            value={`${avgProgress}%`}
            change="+12%"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
            variant="success"
          />
        </div>

        {/* Class Status */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-primary">Current Session</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">active</span>
          </div>
          <p className="text-sm font-medium text-foreground">Introduction to Machine Learning</p>
        </div>

        {/* Learning Path Overview */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Course Flow</h3>
          <div className="overflow-x-auto pb-2">
            <LearningPath nodes={teacherLearningPath} variant="teacher" compact />
          </div>
        </div>

        {/* Student Cards */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground px-1">Student Progress</h3>
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() =>
                setSelectedStudent(selectedStudent === student.id ? null : student.id)
              }
              className={cn(
                "w-full p-3 rounded-lg bg-secondary/50 border transition-all text-left",
                selectedStudent === student.id
                  ? "border-primary shadow-[0_0_10px_var(--glow)]"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-background",
                      student.variant === "student-1"
                        ? "bg-node-student-1"
                        : "bg-node-student-2"
                    )}
                  >
                    {student.name[0]}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{student.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{student.xp} XP</span>
                      <span>|</span>
                      <span>{student.streak} day streak</span>
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    student.status === "active"
                      ? "bg-primary/20 text-primary"
                      : student.status === "needs-help"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {student.status === "needs-help" ? "Needs Help" : student.status}
                </span>
              </div>
              <ProgressBar
                value={student.progress}
                label={student.currentLesson}
                variant={student.variant}
                size="sm"
              />
            </button>
          ))}
        </div>

        {/* AI Configuration */}
        <ChatPanel
          title="AI Tutor Config"
          placeholder="Configure AI behavior..."
          variant="teacher"
          compact
        />
      </div>
    </div>
  )
}
