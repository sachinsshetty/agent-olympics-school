"use client"

import dynamic from "next/dynamic"

const ClassroomGameComponent = dynamic(
  () => import("./classroom-game").then((mod) => ({ default: mod.ClassroomGame })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading Game Mode...</p>
        </div>
      </div>
    ),
  }
)

export function ClassroomGame() {
  return <ClassroomGameComponent />
}
