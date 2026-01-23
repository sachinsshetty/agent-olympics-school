"use client"

import dynamic from "next/dynamic"

const Classroom3DInner = dynamic(
  () => import("./classroom-3d").then((mod) => mod.Classroom3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-card rounded-xl border border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading 3D Classroom...</p>
        </div>
      </div>
    ),
  }
)

export function Classroom3D() {
  return <Classroom3DInner />
}
