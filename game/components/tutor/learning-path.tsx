"use client"

import { FlowNode } from "./flow-node"
import { ConnectionLine } from "./connection-line"

interface LearningNode {
  id: string
  title: string
  status: "completed" | "in-progress" | "pending" | "locked"
  type: "lesson" | "quiz" | "project"
}

interface LearningPathProps {
  nodes: LearningNode[]
  variant?: "teacher" | "student-1" | "student-2"
  compact?: boolean
}

export function LearningPath({ nodes, variant = "teacher", compact = false }: LearningPathProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {nodes.map((node, index) => (
        <div key={node.id} className="flex items-center">
          <FlowNode
            id={node.id}
            title={compact ? node.title.split(" ")[0] : node.title}
            status={node.status}
            type={node.type}
            variant={variant}
          />
          {index < nodes.length - 1 && (
            <ConnectionLine
              direction="horizontal"
              animated={node.status === "in-progress"}
              variant={variant}
            />
          )}
        </div>
      ))}
    </div>
  )
}
