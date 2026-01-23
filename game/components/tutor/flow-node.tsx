"use client"

import { cn } from "@/lib/utils"

interface FlowNodeProps {
  id: string
  title: string
  status: "completed" | "in-progress" | "pending" | "locked"
  type: "lesson" | "quiz" | "project"
  position?: { x: number; y: number }
  onClick?: () => void
  variant?: "teacher" | "student-1" | "student-2"
}

export function FlowNode({
  title,
  status,
  type,
  onClick,
  variant = "teacher",
}: FlowNodeProps) {
  const statusColors = {
    completed: "bg-primary/20 border-primary text-primary",
    "in-progress": "bg-accent/20 border-accent text-accent animate-pulse",
    pending: "bg-muted border-border text-muted-foreground",
    locked: "bg-muted/50 border-border/50 text-muted-foreground/50",
  }

  const typeIcons = {
    lesson: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    quiz: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    project: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    ),
  }

  const variantGlow = {
    teacher: "shadow-[0_0_15px_var(--node-teacher)]",
    "student-1": "shadow-[0_0_15px_var(--node-student-1)]",
    "student-2": "shadow-[0_0_15px_var(--node-student-2)]",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-md border-2 transition-all duration-300 min-w-[120px]",
        statusColors[status],
        status === "in-progress" && variantGlow[variant],
        status !== "locked" && "hover:scale-105 cursor-pointer",
        status === "locked" && "cursor-not-allowed"
      )}
    >
      <span className="flex-shrink-0">{typeIcons[type]}</span>
      <span className="text-sm font-medium truncate">{title}</span>
      {status === "completed" && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
      )}
    </button>
  )
}
