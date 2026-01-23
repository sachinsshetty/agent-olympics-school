"use client"

import { cn } from "@/lib/utils"

interface ConnectionLineProps {
  direction?: "horizontal" | "vertical" | "diagonal-down" | "diagonal-up"
  animated?: boolean
  variant?: "teacher" | "student-1" | "student-2"
}

export function ConnectionLine({
  direction = "horizontal",
  animated = false,
  variant = "teacher",
}: ConnectionLineProps) {
  const variantColors = {
    teacher: "bg-node-teacher",
    "student-1": "bg-node-student-1",
    "student-2": "bg-node-student-2",
  }

  if (direction === "horizontal") {
    return (
      <div className="relative flex items-center h-8 w-8">
        <div
          className={cn(
            "h-0.5 w-full",
            variantColors[variant],
            animated && "animate-pulse"
          )}
        />
        {animated && (
          <div
            className={cn(
              "absolute w-2 h-2 rounded-full animate-flow-right",
              variantColors[variant]
            )}
          />
        )}
      </div>
    )
  }

  if (direction === "vertical") {
    return (
      <div className="relative flex justify-center w-8 h-8">
        <div
          className={cn(
            "w-0.5 h-full",
            variantColors[variant],
            animated && "animate-pulse"
          )}
        />
        {animated && (
          <div
            className={cn(
              "absolute w-2 h-2 rounded-full animate-flow-down",
              variantColors[variant]
            )}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative w-8 h-8">
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <path
          d={
            direction === "diagonal-down"
              ? "M 0 16 Q 16 16 16 32"
              : "M 0 16 Q 16 16 16 0"
          }
          fill="none"
          className={cn(
            "stroke-2",
            variant === "teacher" && "stroke-node-teacher",
            variant === "student-1" && "stroke-node-student-1",
            variant === "student-2" && "stroke-node-student-2"
          )}
        />
      </svg>
    </div>
  )
}
