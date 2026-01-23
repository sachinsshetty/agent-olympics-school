"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  role: "teacher" | "student"
  color: string
  position: { x: number; y: number }
  status: "idle" | "working" | "hand-raised" | "chatting"
  message?: string
  messageTime?: number
  seatId?: string
}

interface Desk {
  id: string
  x: number
  y: number
  occupied?: string
}

interface ClassroomItem {
  id: string
  type: "whiteboard" | "teacher-desk" | "bookshelf" | "plant" | "clock" | "door" | "window" | "ai-terminal"
  x: number
  y: number
  width: number
  height: number
  label?: string
}

const STUDENT_DESKS: Desk[] = [
  // Row 1
  { id: "desk-1", x: 20, y: 40 },
  { id: "desk-2", x: 38, y: 40 },
  { id: "desk-3", x: 56, y: 40 },
  // Row 2
  { id: "desk-4", x: 20, y: 58 },
  { id: "desk-5", x: 38, y: 58 },
  { id: "desk-6", x: 56, y: 58 },
  // Row 3
  { id: "desk-7", x: 20, y: 76 },
  { id: "desk-8", x: 38, y: 76 },
  { id: "desk-9", x: 56, y: 76 },
]

const CLASSROOM_ITEMS: ClassroomItem[] = [
  { id: "whiteboard", type: "whiteboard", x: 15, y: 5, width: 50, height: 12, label: "Interactive Whiteboard" },
  { id: "teacher-desk", type: "teacher-desk", x: 70, y: 8, width: 18, height: 10 },
  { id: "ai-terminal", type: "ai-terminal", x: 78, y: 40, width: 14, height: 20, label: "AI Tutor" },
  { id: "bookshelf", type: "bookshelf", x: 78, y: 65, width: 14, height: 18 },
  { id: "door", type: "door", x: 2, y: 85, width: 8, height: 12 },
  { id: "window-1", type: "window", x: 2, y: 20, width: 6, height: 20 },
  { id: "window-2", type: "window", x: 2, y: 50, width: 6, height: 20 },
  { id: "clock", type: "clock", x: 68, y: 3, width: 5, height: 5 },
  { id: "plant-1", type: "plant", x: 92, y: 5, width: 5, height: 8 },
  { id: "plant-2", type: "plant", x: 92, y: 88, width: 5, height: 8 },
]

const INITIAL_USERS: User[] = [
  { id: "teacher", name: "Dr. Smith", role: "teacher", color: "bg-node-teacher", position: { x: 79, y: 13 }, status: "working" },
  { id: "student-1", name: "Alex", role: "student", color: "bg-node-student-1", position: { x: 20, y: 40 }, status: "working", seatId: "desk-1" },
  { id: "student-2", name: "Jordan", role: "student", color: "bg-node-student-2", position: { x: 56, y: 40 }, status: "idle", seatId: "desk-3" },
]

const CHAT_MESSAGES = [
  { userId: "teacher", text: "Let's review chapter 3" },
  { userId: "student-1", text: "I have a question!" },
  { userId: "student-2", text: "Makes sense now" },
  { userId: "teacher", text: "Great work everyone" },
  { userId: "student-1", text: "Can we try another?" },
  { userId: "student-2", text: "Need help with this" },
]

const ACTIVITIES = [
  { user: "Alex", action: "raised hand", icon: "hand", time: "just now" },
  { user: "Dr. Smith", action: "updated whiteboard", icon: "edit", time: "1m ago" },
  { user: "Jordan", action: "completed exercise", icon: "check", time: "2m ago" },
  { user: "Alex", action: "asked AI tutor", icon: "bot", time: "3m ago" },
  { user: "Jordan", action: "took notes", icon: "pencil", time: "5m ago" },
]

export function RealtimeMap() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [activities, setActivities] = useState(ACTIVITIES)
  const [whiteboardContent, setWhiteboardContent] = useState("Introduction to Algorithms")

  // Simulate small movements at desks
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => {
          // Small fidget movements
          const basePos = user.seatId 
            ? STUDENT_DESKS.find(d => d.id === user.seatId) 
            : { x: 79, y: 13 }
          
          if (basePos && Math.random() > 0.6) {
            const offsetX = (Math.random() - 0.5) * 2
            const offsetY = (Math.random() - 0.5) * 2
            return { 
              ...user, 
              position: { 
                x: basePos.x + offsetX, 
                y: basePos.y + offsetY 
              } 
            }
          }
          return user
        })
      )
    }, 1500)

    return () => clearInterval(moveInterval)
  }, [])

  // Simulate status changes
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => {
          if (user.role === "student" && Math.random() > 0.7) {
            const statuses: User["status"][] = ["working", "idle", "hand-raised"]
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
            return { ...user, status: newStatus }
          }
          return user
        })
      )
    }, 4000)

    return () => clearInterval(statusInterval)
  }, [])

  // Simulate chat bubbles
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const randomMessage = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)]
      setUsers((prev) =>
        prev.map((user) =>
          user.id === randomMessage.userId
            ? { ...user, message: randomMessage.text, messageTime: Date.now(), status: "chatting" }
            : user
        )
      )

      setTimeout(() => {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === randomMessage.userId && user.messageTime && Date.now() - user.messageTime > 2500
              ? { ...user, message: undefined, messageTime: undefined }
              : user
          )
        )
      }, 3000)
    }, 5000)

    return () => clearInterval(chatInterval)
  }, [])

  // Whiteboard content changes
  useEffect(() => {
    const topics = [
      "Introduction to Algorithms",
      "Data Structures: Arrays",
      "Binary Search Trees",
      "Graph Theory Basics",
      "Recursion Fundamentals",
    ]
    const wbInterval = setInterval(() => {
      setWhiteboardContent(topics[Math.floor(Math.random() * topics.length)])
    }, 12000)

    return () => clearInterval(wbInterval)
  }, [])

  // Update activities
  useEffect(() => {
    const activityInterval = setInterval(() => {
      const actions = [
        { action: "raised hand", icon: "hand" },
        { action: "took notes", icon: "pencil" },
        { action: "completed task", icon: "check" },
        { action: "asked question", icon: "question" },
      ]
      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      const newActivities = [
        { user: users[Math.floor(Math.random() * users.length)].name, ...randomAction, time: "just now" },
        ...activities.slice(0, 4).map((a, i) => ({ ...a, time: `${i + 1}m ago` })),
      ]
      setActivities(newActivities)
    }, 8000)

    return () => clearInterval(activityInterval)
  }, [activities, users])

  const handleSeatClick = (desk: Desk) => {
    // Move a student to the clicked desk
    const availableStudents = users.filter(u => u.role === "student" && u.seatId !== desk.id)
    if (availableStudents.length > 0) {
      const student = availableStudents[Math.floor(Math.random() * availableStudents.length)]
      setUsers(prev => prev.map(u => 
        u.id === student.id 
          ? { ...u, position: { x: desk.x, y: desk.y }, seatId: desk.id }
          : u
      ))
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-3">
      {/* Main Classroom Area */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="font-semibold text-foreground">Classroom View</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Live
            </span>
            <span>3 participants</span>
          </div>
        </div>

        {/* Classroom Canvas */}
        <div className="flex-1 relative p-4 overflow-hidden">
          <div className="absolute inset-4 bg-secondary/20 rounded-lg border border-border/50" style={{ background: "linear-gradient(135deg, hsl(var(--secondary)/0.3) 0%, hsl(var(--secondary)/0.1) 100%)" }}>
            {/* Floor pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="floor" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#floor)" />
            </svg>

            {/* Classroom Items */}
            {CLASSROOM_ITEMS.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "absolute rounded transition-all",
                  item.type === "whiteboard" && "bg-foreground/90 border-4 border-border flex items-center justify-center",
                  item.type === "teacher-desk" && "bg-node-teacher/20 border-2 border-node-teacher/40 rounded-lg",
                  item.type === "ai-terminal" && "bg-primary/10 border-2 border-primary/40 rounded-lg flex flex-col items-center justify-center gap-1",
                  item.type === "bookshelf" && "bg-accent/10 border-2 border-accent/30 rounded",
                  item.type === "door" && "bg-secondary border-2 border-border rounded",
                  item.type === "window" && "bg-node-student-1/10 border-2 border-node-student-1/20 rounded",
                  item.type === "clock" && "bg-card border-2 border-border rounded-full flex items-center justify-center",
                  item.type === "plant" && "flex items-end justify-center"
                )}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                }}
              >
                {item.type === "whiteboard" && (
                  <div className="text-background text-center p-2">
                    <p className="text-[10px] uppercase tracking-wider opacity-60">Today's Topic</p>
                    <p className="text-xs font-medium mt-1">{whiteboardContent}</p>
                  </div>
                )}
                {item.type === "teacher-desk" && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-node-teacher/60">Teacher</span>
                )}
                {item.type === "ai-terminal" && (
                  <>
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[8px] text-primary">{item.label}</span>
                  </>
                )}
                {item.type === "bookshelf" && (
                  <div className="h-full w-full flex flex-col justify-around p-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-2 bg-accent/20 rounded-sm" />
                    ))}
                  </div>
                )}
                {item.type === "door" && (
                  <span className="text-[8px] text-muted-foreground">EXIT</span>
                )}
                {item.type === "clock" && (
                  <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                )}
                {item.type === "plant" && (
                  <svg className="w-4 h-4 text-primary/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9s9 4.03 9 9c0 4.97-4.03 9-9 9zm0-16c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
              </div>
            ))}

            {/* Student Desks */}
            {STUDENT_DESKS.map((desk) => {
              const occupant = users.find(u => u.seatId === desk.id)
              return (
                <button
                  key={desk.id}
                  type="button"
                  onClick={() => handleSeatClick(desk)}
                  className={cn(
                    "absolute w-[14%] h-[12%] rounded-lg border-2 transition-all",
                    occupant 
                      ? "bg-secondary/50 border-border" 
                      : "bg-secondary/20 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5"
                  )}
                  style={{
                    left: `${desk.x - 7}%`,
                    top: `${desk.y - 3}%`,
                  }}
                >
                  {!occupant && (
                    <span className="text-[8px] text-muted-foreground/50">Empty</span>
                  )}
                </button>
              )
            })}

            {/* Connection lines for interactions */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              {/* Teacher to student helping */}
              {users.filter(u => u.status === "hand-raised").map(student => {
                const teacher = users.find(u => u.role === "teacher")
                if (!teacher) return null
                return (
                  <g key={`help-${student.id}`}>
                    <line
                      x1={`${teacher.position.x}%`}
                      y1={`${teacher.position.y}%`}
                      x2={`${student.position.x}%`}
                      y2={`${student.position.y}%`}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      className="text-accent/50"
                    />
                    {/* Animated dot along the line */}
                    <circle r="3" className="text-accent fill-current">
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={`M${teacher.position.x * 3},${teacher.position.y * 3} L${student.position.x * 3},${student.position.y * 3}`}
                      />
                    </circle>
                  </g>
                )
              })}
            </svg>

            {/* Users */}
            {users.map((user) => (
              <div
                key={user.id}
                className="absolute transition-all duration-700 ease-out z-10"
                style={{
                  left: `${user.position.x}%`,
                  top: `${user.position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Chat bubble */}
                {user.message && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-card rounded-lg border border-border shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300 z-20">
                    <p className="text-xs text-foreground">{user.message}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="border-4 border-transparent border-t-card" />
                    </div>
                  </div>
                )}

                {/* Hand raised indicator */}
                {user.status === "hand-raised" && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                    <span className="text-lg">&#9995;</span>
                  </div>
                )}

                {/* User avatar - Among Us style pill shape */}
                <button
                  type="button"
                  onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                  className={cn(
                    "relative w-8 h-10 rounded-t-full rounded-b-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 shadow-lg",
                    user.color,
                    "text-background",
                    selectedUser === user.id && "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                  )}
                  style={{
                    boxShadow: `0 4px 12px ${user.role === "teacher" ? "var(--node-teacher)" : user.id === "student-1" ? "var(--node-student-1)" : "var(--node-student-2)"}40`
                  }}
                >
                  {/* Visor */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-3 bg-node-student-1/80 rounded-full border border-background/20" 
                    style={{ background: "linear-gradient(135deg, rgba(200,230,255,0.9) 0%, rgba(100,180,255,0.7) 100%)" }}
                  />
                  
                  {/* Status indicator */}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                      user.status === "working" && "bg-primary",
                      user.status === "chatting" && "bg-accent animate-pulse",
                      user.status === "hand-raised" && "bg-accent",
                      user.status === "idle" && "bg-muted-foreground"
                    )}
                  />
                </button>

                {/* Name label */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-center">
                  <p className="text-[10px] font-medium text-foreground whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded">{user.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-2 border-t border-border flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-5 rounded-t-full rounded-b-sm bg-node-teacher" />
            <span className="text-muted-foreground">Teacher</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-5 rounded-t-full rounded-b-sm bg-node-student-1" />
            <span className="text-muted-foreground">Alex</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-5 rounded-t-full rounded-b-sm bg-node-student-2" />
            <span className="text-muted-foreground">Jordan</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Working</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">Hand Up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-72 flex flex-col gap-3">
        {/* Classroom Status */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Classroom Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Topic</span>
              <span className="text-xs font-medium text-foreground">{whiteboardContent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Engaged</span>
              <span className="text-xs font-medium text-primary">{users.filter(u => u.status === "working" || u.status === "chatting").length}/{users.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Hands Raised</span>
              <span className="text-xs font-medium text-accent">{users.filter(u => u.status === "hand-raised").length}</span>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            Participants
          </h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                  selectedUser === user.id ? "bg-secondary" : "hover:bg-secondary/50"
                )}
                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
              >
                <div className={cn("w-6 h-7 rounded-t-full rounded-b-sm flex items-center justify-center text-[10px] font-bold text-background shadow", user.color)}>
                  <div className="w-4 h-2 bg-node-student-1/60 rounded-full mt-0.5" style={{ background: "linear-gradient(135deg, rgba(200,230,255,0.8) 0%, rgba(100,180,255,0.6) 100%)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {user.status === "hand-raised" && <span className="text-xs">&#9995;</span>}
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      user.status === "working" && "bg-primary",
                      user.status === "chatting" && "bg-accent",
                      user.status === "hand-raised" && "bg-accent",
                      user.status === "idle" && "bg-muted-foreground"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 bg-card rounded-xl border border-border p-4 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Activity
          </h3>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {activities.map((activity, i) => (
              <div key={i} className={cn("p-2 rounded-lg bg-secondary/50 transition-all", i === 0 && "animate-in slide-in-from-top-2 duration-300")}>
                <p className="text-xs text-foreground">
                  <span className="font-medium">{activity.user}</span> {activity.action}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Controls */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3">Teacher Controls</h3>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="p-2 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
              Attention
            </button>
            <button type="button" className="p-2 text-xs font-medium bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors">
              Start Quiz
            </button>
            <button type="button" className="p-2 text-xs font-medium bg-node-student-1/10 hover:bg-node-student-1/20 text-node-student-1 rounded-lg transition-colors">
              Group Work
            </button>
            <button type="button" className="p-2 text-xs font-medium bg-node-student-2/10 hover:bg-node-student-2/20 text-node-student-2 rounded-lg transition-colors">
              Share Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
