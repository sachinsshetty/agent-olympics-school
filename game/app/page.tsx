"use client"

import { useState } from "react"
import { TeacherPanel } from "@/components/tutor/teacher-panel"
import { StudentPanel } from "@/components/tutor/student-panel"
import { RealtimeMap } from "@/components/tutor/realtime-map"
import { Classroom3D } from "@/components/tutor/classroom-3d-wrapper"
import { ClassroomGame } from "@/components/tutor/classroom-game-wrapper"
import { AITutorChatbot } from "@/components/tutor/ai-tutor-chatbot"
import { cn } from "@/lib/utils"

type ViewMode = "split" | "realtime" | "classroom-3d" | "game-mode" | "teacher" | "student-1" | "student-2" | "chatbot"

export default function FactorioTutor() {
  const [viewMode, setViewMode] = useState<ViewMode>("split")

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">AI Tutor Factory</h1>
            <p className="text-xs text-muted-foreground">Knowledge Flow System</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              viewMode === "split"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("realtime")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
              viewMode === "realtime"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Realtime 2D
          </button>
          <button
            type="button"
            onClick={() => setViewMode("classroom-3d")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
              viewMode === "classroom-3d"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3L2 9l10 6 10-6-10-6z" />
              <path d="M2 17l10 6 10-6" />
              <path d="M2 13l10 6 10-6" />
            </svg>
            3D Class
          </button>
          <button
            type="button"
            onClick={() => setViewMode("game-mode")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
              viewMode === "game-mode"
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            Game Mode
          </button>
          <button
            type="button"
            onClick={() => setViewMode("teacher")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              viewMode === "teacher"
                ? "bg-node-teacher text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => setViewMode("student-1")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              viewMode === "student-1"
                ? "bg-node-student-1 text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Alex
          </button>
          <button
            type="button"
            onClick={() => setViewMode("student-2")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              viewMode === "student-2"
                ? "bg-node-student-2 text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Jordan
          </button>
          <button
            type="button"
            onClick={() => setViewMode("chatbot")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
              viewMode === "chatbot"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Chatbot
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-3 overflow-hidden relative">
        {viewMode === "split" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            {/* Teacher Panel - Full height on desktop, first on mobile */}
            <div className="h-[500px] lg:h-full">
              <TeacherPanel />
            </div>
            {/* Student 1 */}
            <div className="h-[500px] lg:h-full">
              <StudentPanel studentId="1" />
            </div>
            {/* Student 2 */}
            <div className="h-[500px] lg:h-full">
              <StudentPanel studentId="2" />
            </div>
          </div>
        ) : viewMode === "realtime" ? (
          <div className="h-full min-h-[600px]">
            <RealtimeMap />
          </div>
        ) : viewMode === "classroom-3d" ? (
          <div className="absolute inset-0">
            <Classroom3D />
          </div>
        ) : viewMode === "game-mode" ? (
          <div className="absolute inset-0">
            <ClassroomGame />
          </div>
        ) : viewMode === "teacher" ? (
          <div className="h-full max-w-2xl mx-auto">
            <TeacherPanel />
          </div>
        ) : viewMode === "student-1" ? (
          <div className="h-full max-w-2xl mx-auto">
            <StudentPanel studentId="1" />
          </div>
        ) : viewMode === "chatbot" ? (
          <div className="h-full max-w-6xl mx-auto">
            <AITutorChatbot />
          </div>
        ) : (
          <div className="h-full max-w-2xl mx-auto">
            <StudentPanel studentId="2" />
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/50 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">System Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Connections:</span>
            <span className="text-node-teacher">Teacher</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-node-student-1">Alex</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-node-student-2">Jordan</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">Knowledge Flow: <span className="text-primary">Active</span></span>
          <span className="text-muted-foreground">AI Status: <span className="text-primary">Online</span></span>
        </div>
      </footer>
    </main>
  )
}
