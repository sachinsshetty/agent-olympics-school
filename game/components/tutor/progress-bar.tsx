"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  variant?: "teacher" | "student-1" | "student-2"
  size?: "sm" | "md" | "lg"
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  variant = "teacher",
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)

  const variantColors = {
    teacher: "bg-node-teacher",
    "student-1": "bg-node-student-1",
    "student-2": "bg-node-student-2",
  }

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }

  return (
    <div className="space-y-1">
      {(label || showValue) && (
        <div className="flex justify-between text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="text-foreground font-medium">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-secondary rounded-full overflow-hidden", sizeStyles[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            variantColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
