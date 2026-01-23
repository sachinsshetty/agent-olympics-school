"use client"

import { useRef, useState, useEffect, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html, Text, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import { cn } from "@/lib/utils"

// Types
interface User {
  id: string
  name: string
  role: "teacher" | "student"
  color: string
  position: [number, number, number]
  status: "teaching" | "working" | "hand-raised" | "chatting" | "idle"
  message?: string
}

interface DeskProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  occupied?: boolean
  onClick?: () => void
}

interface CharacterProps {
  user: User
  isSelected: boolean
  onClick: () => void
}

// Desk Component
function Desk({ position, rotation = [0, 0, 0], occupied, onClick }: DeskProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position} rotation={rotation} scale={1.5}>
      <RoundedBox
        args={[1.2, 0.08, 0.8]}
        position={[0, 0.72, 0]}
        radius={0.02}
        smoothness={4}
        onPointerOver={() => !occupied && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={hovered && !occupied ? "#4a5568" : "#374151"}
          metalness={0.1}
          roughness={0.8}
        />
      </RoundedBox>
      {[
        [-0.5, 0.35, 0.3],
        [0.5, 0.35, 0.3],
        [-0.5, 0.35, -0.3],
        [0.5, 0.35, -0.3],
      ].map((legPos, i) => (
        <mesh key={i} position={legPos as [number, number, number]}>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
      <group position={[0, 0, 0.7]}>
        <RoundedBox args={[0.5, 0.06, 0.5]} position={[0, 0.45, 0]} radius={0.02}>
          <meshStandardMaterial color="#1e3a5f" roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[0.5, 0.5, 0.06]} position={[0, 0.72, -0.22]} radius={0.02}>
          <meshStandardMaterial color="#1e3a5f" roughness={0.9} />
        </RoundedBox>
        {[
          [-0.2, 0.22, 0.15],
          [0.2, 0.22, 0.15],
          [-0.2, 0.22, -0.15],
          [0.2, 0.22, -0.15],
        ].map((legPos, i) => (
          <mesh key={i} position={legPos as [number, number, number]}>
            <boxGeometry args={[0.04, 0.44, 0.04]} />
            <meshStandardMaterial color="#111827" metalness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// Character Component (Among Us style)
function Character({ user, isSelected, onClick }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [showMessage, setShowMessage] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = user.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.03
    }
  })

  useEffect(() => {
    if (user.message) {
      setShowMessage(true)
      const timer = setTimeout(() => setShowMessage(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [user.message])

  return (
    <group
      ref={groupRef}
      position={user.position}
      scale={2}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Body */}
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.2, 0.35, 8, 16]} />
        <meshStandardMaterial color={user.color} metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Visor */}
      <mesh position={[0.1, 0.5, 0.12]}>
        <sphereGeometry args={[0.12, 16, 16, 0, Math.PI]} />
        <meshStandardMaterial color="#87ceeb" metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Backpack */}
      <mesh position={[-0.15, 0.35, 0]}>
        <boxGeometry args={[0.12, 0.25, 0.2]} />
        <meshStandardMaterial color={user.color} metalness={0.2} roughness={0.7} />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.4, 32]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Hand raised indicator */}
      {user.status === "hand-raised" && (
        <group position={[0.3, 1, 0]}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
          </mesh>
          <Html center>
            <div className="text-lg animate-bounce">?</div>
          </Html>
        </group>
      )}

      {/* Chat bubble */}
      {showMessage && user.message && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs max-w-[150px] shadow-lg whitespace-nowrap">
            {user.message}
          </div>
        </Html>
      )}

      {/* Name tag */}
      <Html position={[0, 0.95, 0]} center>
        <div
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap",
            user.role === "teacher" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          {user.name}
        </div>
      </Html>
    </group>
  )
}

// Whiteboard Component
function Whiteboard({ topic }: { topic: string }) {
  return (
    <group position={[0, 2.5, -4.8]} scale={1.8}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[5, 2.5, 0.1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Board surface */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[4.8, 2.3]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Topic text */}
      <Text
        position={[0, 0.5, 0.1]}
        fontSize={0.2}
        color="#22c55e"
        font="/fonts/Geist-Bold.ttf"
        anchorX="center"
        anchorY="middle"
      >
        {topic}
      </Text>
      <Text
        position={[0, -0.2, 0.1]}
        fontSize={0.12}
        color="#9ca3af"
        font="/fonts/Geist-Regular.ttf"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
      >
        Interactive AI-Assisted Learning
      </Text>
    </group>
  )
}

// Room Component
function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 4, -9]}>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-12, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Right wall */}
      <mesh position={[12, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Windows on left wall */}
      {[-4, 0, 4].map((z, i) => (
        <mesh key={i} position={[-11.95, 4, z]}>
          <planeGeometry args={[0.1, 3]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// AI Terminal Component
function AITerminal() {
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (screenRef.current) {
      const material = screenRef.current.material as THREE.MeshStandardMaterial
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })

  return (
    <group position={[8, 0, -3]} scale={1.6}>
      {/* Terminal body */}
      <RoundedBox args={[1, 2, 0.8]} position={[0, 1, 0]} radius={0.05}>
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </RoundedBox>
      {/* Screen */}
      <mesh ref={screenRef} position={[0.51, 1.3, 0]}>
        <planeGeometry args={[0.02, 0.8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
      </mesh>
      {/* Label */}
      <Text
        position={[0.52, 0.6, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.1}
        color="#9ca3af"
        font="/fonts/Geist-Regular.ttf"
      >
        AI TUTOR
      </Text>
    </group>
  )
}

// Scene Component
function Scene({
  users,
  selectedUser,
  onSelectUser,
  currentTopic,
}: {
  users: User[]
  selectedUser: string | null
  onSelectUser: (id: string | null) => void
  currentTopic: string
}) {
  const deskPositions: [number, number, number][] = [
    [-4, 0, 0], [0, 0, 0], [4, 0, 0],
    [-4, 0, 3.5], [0, 0, 3.5], [4, 0, 3.5],
    [-4, 0, 7], [0, 0, 7], [4, 0, 7],
  ]

  return (
    <>
      <Environment preset="night" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#22c55e" />

      <Room />
      <Whiteboard topic={currentTopic} />
      <AITerminal />

      {/* Teacher desk */}
      <Desk position={[6, 0, -5]} rotation={[0, -Math.PI / 4, 0]} occupied />

      {/* Student desks */}
      {deskPositions.map((pos, i) => {
        const occupiedByUser = users.find(
          (u) => u.role === "student" && Math.abs(u.position[0] - pos[0]) < 0.5 && Math.abs(u.position[2] - pos[2]) < 0.5
        )
        return <Desk key={i} position={pos} occupied={!!occupiedByUser} />
      })}

      {/* Characters */}
      {users.map((user) => (
        <Character
          key={user.id}
          user={user}
          isSelected={selectedUser === user.id}
          onClick={() => onSelectUser(selectedUser === user.id ? null : user.id)}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={35}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 2, 2]}
      />
    </>
  )
}

// Main Component
export function Classroom3D() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([
    {
      id: "teacher",
      name: "Ms. Chen",
      role: "teacher",
      color: "#f97316",
      position: [5, 0, -4],
      status: "teaching",
    },
    {
      id: "student-1",
      name: "Alex",
      role: "student",
      color: "#3b82f6",
      position: [-4, 0, 1],
      status: "working",
    },
    {
      id: "student-2",
      name: "Jordan",
      role: "student",
      color: "#8b5cf6",
      position: [0, 0, 4.5],
      status: "idle",
    },
  ])

  const [activities] = useState([
    { time: "Now", text: "Class in session" },
    { time: "2m ago", text: "Alex started the quiz" },
    { time: "5m ago", text: "Ms. Chen shared new material" },
  ])

  const currentTopic = "Introduction to Machine Learning"

  // Simulate activity changes
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => {
          if (user.role === "student" && Math.random() > 0.7) {
            const statuses: User["status"][] = ["working", "hand-raised", "chatting", "idle"]
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
            const messages = ["I have a question!", "Got it!", "Can you explain?", "Interesting!"]
            return {
              ...user,
              status: newStatus,
              message: newStatus === "chatting" ? messages[Math.floor(Math.random() * messages.length)] : undefined,
            }
          }
          return user
        })
      )
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const selectedUserData = users.find((u) => u.id === selectedUser)

  return (
    <div className="w-full h-full overflow-hidden bg-background relative">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 12, 18], fov: 60 }} shadows style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <Scene
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            currentTopic={currentTopic}
          />
        </Suspense>
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        {/* Topic banner */}
        <div className="bg-card/90 backdrop-blur border border-border rounded-lg px-4 py-2 pointer-events-auto">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Lesson</div>
          <div className="text-sm font-medium text-foreground">{currentTopic}</div>
        </div>

        {/* Participants */}
        <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 pointer-events-auto min-w-[180px]">
          <div className="text-xs font-medium text-foreground mb-2">Participants</div>
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                className={cn(
                  "w-full flex items-center gap-2 p-1.5 rounded transition-colors text-left",
                  selectedUser === user.id ? "bg-primary/20" : "hover:bg-secondary"
                )}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                <span className="text-xs text-foreground flex-1">{user.name}</span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    user.status === "hand-raised"
                      ? "bg-yellow-400 animate-pulse"
                      : user.status === "working"
                        ? "bg-green-400"
                        : user.status === "chatting"
                          ? "bg-blue-400"
                          : "bg-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg p-3 max-w-[220px] pointer-events-auto">
        <div className="text-xs font-medium text-foreground mb-2">Activity</div>
        <div className="space-y-1.5">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span className="text-muted-foreground w-12 shrink-0">{activity.time}</span>
              <span className="text-foreground">{activity.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected user panel */}
      {selectedUserData && (
        <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur border border-border rounded-lg p-4 w-[200px] pointer-events-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: selectedUserData.color }} />
            <div>
              <div className="text-sm font-medium text-foreground">{selectedUserData.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{selectedUserData.role}</div>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-foreground capitalize">{selectedUserData.status.replace("-", " ")}</span>
            </div>
            {selectedUserData.role === "student" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground">65%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "65%" }} />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="flex-1 px-2 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium"
            >
              Message
            </button>
            <button
              type="button"
              className="flex-1 px-2 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur border border-border rounded-full px-4 py-1.5 text-[10px] text-muted-foreground pointer-events-none">
        Drag to rotate | Scroll to zoom | Click characters to select
      </div>
    </div>
  )
}
