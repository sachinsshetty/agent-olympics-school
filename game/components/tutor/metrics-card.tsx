"use client"

import React from "react"

import { cn } from "@/lib/utils"

interface MetricsCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  variant?: "default" | "success" | "warning" | "info"
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  variant = "default",
}: MetricsCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-primary/50",
    warning: "border-accent/50",
    info: "border-node-student-1/50",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-card border",
        variantStyles[variant]
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg bg-secondary",
          variant === "success" && "bg-primary/20 text-primary",
          variant === "warning" && "bg-accent/20 text-accent",
          variant === "info" && "bg-node-student-1/20 text-node-student-1"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
      {change && (
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            change.startsWith("+")
              ? "bg-primary/20 text-primary"
              : "bg-destructive/20 text-destructive"
          )}
        >
          {change}
        </span>
      )}
    </div>
  )
}
