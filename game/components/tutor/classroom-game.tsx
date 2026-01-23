"use client"

import { useRef, useState, useEffect, Suspense, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html, Text, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { CollaborativeLearning } from "./collaborative-learning"
import { AIAssistance } from "./ai-assistance"
import { GamificationSystem } from "./gamification-system"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

// Types
interface Player {
  id: string
  name: string
  role: "teacher" | "student" | "mentor" | "learner"
  color: string
  position: [number, number, number]
  status: "alive" | "ejected" | "winner"
  score: number
  strikes: number
  currentAnswer?: string
  level: number
  badges: string[]
  streak: number
  collaborationScore: number
  isHelping: boolean
  helpedBy: string[]
}

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  topic: string
  difficulty: "easy" | "medium" | "hard"
  hints: string[]
  explanation: string
  collaborative?: boolean
  timeLimit?: number
  points: number
}

interface GameMode {
  id: string
  name: string
  description: string
  rules: string[]
  maxPlayers: number
  timeLimit: number
  objectives: string[]
}

// Game Modes
const GAME_MODES: GameMode[] = [
  {
    id: "classic",
    name: "Classic Quiz",
    description: "Traditional Among Us-style quiz with elimination",
    rules: ["Answer questions correctly", "3 wrong answers = elimination", "Last player standing wins"],
    maxPlayers: 8,
    timeLimit: 600,
    objectives: ["Answer correctly", "Help teammates", "Avoid elimination"]
  },
  {
    id: "mentorship",
    name: "Mentorship Mode",
    description: "Experienced players help newcomers learn",
    rules: ["Mentors guide learners", "Collaborative answers", "Knowledge sharing rewarded"],
    maxPlayers: 6,
    timeLimit: 900,
    objectives: ["Teach others", "Learn from mentors", "Build knowledge together"]
  },
  {
    id: "collaboration",
    name: "Team Challenge",
    description: "Work together to solve complex problems",
    rules: ["Team-based questions", "Shared knowledge", "All must contribute"],
    maxPlayers: 4,
    timeLimit: 1200,
    objectives: ["Share knowledge", "Help teammates", "Solve together"]
  },
  {
    id: "time-attack",
    name: "Speed Learning",
    description: "Race against time to answer questions",
    rules: ["Fast answers required", "Time bonuses", "Quick thinking rewarded"],
    maxPlayers: 6,
    timeLimit: 300,
    objectives: ["Answer quickly", "Think fast", "Beat the clock"]
  }
]

// Enhanced Quiz questions with educational features
const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the capital of France, and why is it called the 'City of Light'?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    topic: "Geography",
    difficulty: "medium",
    hints: ["It's known for its cultural landmarks", "Home to the Eiffel Tower"],
    explanation: "Paris is the capital of France and earned the nickname 'City of Light' due to its role as a center of education and ideas during the Age of Enlightenment, and its early adoption of street lighting.",
    collaborative: false,
    timeLimit: 30,
    points: 10
  },
  {
    id: 2,
    question: "If a rectangle has length 15 units and width 8 units, what's its area?",
    options: ["110 square units", "120 square units", "130 square units", "140 square units"],
    correctAnswer: 1,
    topic: "Math",
    difficulty: "easy",
    hints: ["Area = length × width", "Think: 10×8 = 80, 5×8 = 40, 80+40 = ?"],
    explanation: "Area of a rectangle = length × width = 15 × 8 = 120 square units. This is a fundamental geometry concept.",
    collaborative: false,
    timeLimit: 20,
    points: 5
  },
  {
    id: 3,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    topic: "Science",
  },
  {
    id: 4,
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: 1,
    topic: "Literature",
  },
  {
    id: 5,
    question: "What is the chemical symbol for water?",
    options: ["O2", "CO2", "H2O", "NaCl"],
    correctAnswer: 2,
    topic: "Chemistry",
  },
  {
    id: 6,
    question: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    topic: "History",
  },
  {
    id: 7,
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswer: 1,
    topic: "Biology",
  },
  {
    id: 8,
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2,
    topic: "Math",
  },
  {
    id: 9,
    question: "Which element has the atomic number 6?",
    options: ["Nitrogen", "Carbon", "Oxygen", "Hydrogen"],
    correctAnswer: 1,
    topic: "Chemistry",
  },
  {
    id: 10,
    question: "What is the speed of light (approx)?",
    options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
    correctAnswer: 0,
    topic: "Physics",
  },
]

// Floating animation for players
function PlayerCharacter({
  player,
  isSelected,
  onClick,
  showEjection,
}: {
  player: Player
  isSelected: boolean
  onClick: () => void
  showEjection: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [floatOffset] = useState(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (groupRef.current) {
      // Idle bobbing animation
      if (player.status === "alive") {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + floatOffset) * 0.1
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + floatOffset) * 0.1
      }
      // Ejection animation - fly up and spin
      if (showEjection && player.status === "ejected") {
        groupRef.current.position.y += 0.15
        groupRef.current.rotation.x += 0.2
        groupRef.current.rotation.z += 0.15
      }
    }
  })

  if (player.status === "ejected" && !showEjection) return null

  return (
    <group
      ref={groupRef}
      position={player.position}
      scale={player.status === "alive" ? 2.2 : 1.8}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Body - pill shape like Among Us */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.25, 0.4, 12, 24]} />
        <meshStandardMaterial
          color={player.status === "ejected" ? "#4a5568" : player.color}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      {/* Visor */}
      <mesh position={[0.15, 0.6, 0.18]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.14, 24, 24, 0, Math.PI]} />
        <meshStandardMaterial
          color={player.status === "ejected" ? "#1a1a2e" : "#7dd3fc"}
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={2}
        />
      </mesh>

      {/* Backpack */}
      <mesh position={[-0.2, 0.4, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.25]} />
        <meshStandardMaterial
          color={player.status === "ejected" ? "#374151" : player.color}
          metalness={0.2}
          roughness={0.7}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && player.status === "alive" && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Name tag */}
      <Html position={[0, 1.3, 0]} center distanceFactor={8}>
        <div
          className={cn(
            "px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-all",
            player.status === "ejected"
              ? "bg-destructive/90 text-destructive-foreground line-through"
              : isSelected
                ? "bg-accent text-accent-foreground scale-110"
                : "bg-card/90 text-foreground"
          )}
        >
          {player.name}
          {player.status === "alive" && (
            <span className="ml-1.5 text-muted-foreground">
              {player.strikes > 0 && (
                <span className="text-destructive">{"X".repeat(player.strikes)}</span>
              )}
            </span>
          )}
        </div>
      </Html>

      {/* Strike indicators above head */}
      {player.status === "alive" && player.strikes > 0 && (
        <group position={[0, 1.6, 0]}>
          {Array.from({ length: player.strikes }).map((_, i) => (
            <mesh key={i} position={[(i - (player.strikes - 1) / 2) * 0.25, 0, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

// Classroom floor with grid
function ClassroomFloor() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`h-${i}`} position={[0, 0, (i - 7.5) * 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 0.02]} />
          <meshBasicMaterial color="#334155" transparent opacity={0.3} />
        </mesh>
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={`v-${i}`} position={[(i - 9.5) * 1.5, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[25, 0.02]} />
          <meshBasicMaterial color="#334155" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Large display screen for questions
function QuestionScreen({ question, timeLeft }: { question: Question | null; timeLeft: number }) {
  return (
    <group position={[0, 4, -11]}>
      {/* Screen frame */}
      <RoundedBox args={[14, 6, 0.3]} radius={0.1}>
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.5} />
      </RoundedBox>

      {/* Screen surface */}
      <mesh position={[0, 0, 0.16]}>
        <planeGeometry args={[13.5, 5.5]} />
        <meshStandardMaterial color="#020617" emissive="#020617" emissiveIntensity={0.1} />
      </mesh>

      {/* Timer bar */}
      <mesh position={[0, 2.5, 0.17]}>
        <planeGeometry args={[13 * (timeLeft / 15), 0.2]} />
        <meshStandardMaterial
          color={timeLeft > 5 ? "#22c55e" : "#ef4444"}
          emissive={timeLeft > 5 ? "#22c55e" : "#ef4444"}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Question text */}
      {question && (
        <>
          <Text
            position={[0, 1.2, 0.2]}
            fontSize={0.4}
            color="#f8fafc"
            font="/fonts/Geist-Bold.ttf"
            anchorX="center"
            anchorY="middle"
            maxWidth={12}
            textAlign="center"
          >
            {question.question}
          </Text>

          <Text
            position={[0, 2, 0.2]}
            fontSize={0.25}
            color="#94a3b8"
            font="/fonts/Geist-Regular.ttf"
            anchorX="center"
            anchorY="middle"
          >
            {question.topic}
          </Text>
        </>
      )}
    </group>
  )
}

// Ejection message overlay
function EjectionOverlay({
  player,
  wasCorrect,
  onDismiss,
}: {
  player: Player | null
  wasCorrect: boolean
  onDismiss: () => void
}) {
  if (!player) return null

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-500">
      <div className="text-center space-y-6 max-w-md">
        <div
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center animate-bounce"
          style={{ backgroundColor: player.color }}
        >
          <div className="w-10 h-6 bg-sky-300 rounded-full opacity-90" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">{player.name} was ejected</h2>
          <p className="text-lg text-muted-foreground">
            {wasCorrect
              ? "They got 3 wrong answers out of 10 questions."
              : "They couldn't keep up with the class."}
          </p>
          <p className="text-sm text-destructive font-mono">3 STRIKES - YOU'RE OUT!</p>
          
          {/* Educational feedback */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm font-medium mb-2">💡 Learning Opportunity:</p>
            <p className="text-xs text-muted-foreground">
              Don't worry! This is a chance to review the concepts. You can still learn from watching others and join the next round.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onDismiss} size="lg" variant="outline" className="flex-1">
            Watch & Learn
          </Button>
          <Button onClick={onDismiss} size="lg" className="flex-1">
            Continue Game
          </Button>
        </div>
      </div>
    </div>
  )
}

// Game over screen
function GameOverScreen({
  players,
  onRestart,
}: {
  players: Player[]
  onRestart: () => void
}) {
  const alivePlayers = players.filter((p) => p.status === "alive" || p.status === "winner")
  const ejectedPlayers = players.filter((p) => p.status === "ejected")

  return (
    <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-50 animate-in fade-in duration-500">
      <div className="text-center space-y-8 max-w-lg p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">GAME OVER</h1>
          <p className="text-muted-foreground">The quiz session has ended</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Survivors</h3>
          <div className="flex justify-center gap-4">
            {alivePlayers.map((p) => (
              <div key={p.id} className="text-center">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: p.color }}
                >
                  <div className="w-6 h-4 bg-sky-300 rounded-full opacity-90" />
                </div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.score} pts</p>
              </div>
            ))}
          </div>

          {ejectedPlayers.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-muted-foreground mt-6">Ejected</h3>
              <div className="flex justify-center gap-4 opacity-50">
                {ejectedPlayers.map((p) => (
                  <div key={p.id} className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
                      <div className="w-4 h-3 bg-muted-foreground rounded-full opacity-50" />
                    </div>
                    <p className="text-xs line-through">{p.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Button onClick={onRestart} size="lg" className="w-full">
          Play Again
        </Button>
      </div>
    </div>
  )
}

// Main Component
export function ClassroomGame() {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "answering" | "results" | "ejection" | "gameover">("waiting")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [ejectedPlayer, setEjectedPlayer] = useState<Player | null>(null)
  const [showEjectionAnim, setShowEjectionAnim] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  const [players, setPlayers] = useState<Player[]>([
    {
      id: "teacher",
      name: "Ms. Chen",
      role: "teacher",
      color: "#f97316",
      position: [0, 0, -6],
      status: "alive",
      score: 0,
      strikes: 0,
      level: 5,
      badges: ["Mentor", "Expert"],
      streak: 0,
      collaborationScore: 95,
      isHelping: false,
      helpedBy: []
    },
    {
      id: "student-1",
      name: "Alex",
      role: "student",
      color: "#3b82f6",
      position: [-4, 0, 2],
      status: "alive",
      score: 0,
      strikes: 0,
      level: 2,
      badges: ["Quick Learner"],
      streak: 3,
      collaborationScore: 78,
      isHelping: false,
      helpedBy: ["teacher"]
    },
    {
      id: "student-2",
      name: "Jordan",
      role: "student",
      color: "#8b5cf6",
      position: [4, 0, 2],
      status: "alive",
      score: 0,
      strikes: 0,
      level: 1,
      badges: [],
      streak: 1,
      collaborationScore: 65,
      isHelping: false,
      helpedBy: []
    },
  ])

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex] || null
  const aliveStudents = players.filter((p) => p.role === "student" && p.status === "alive")

  // Start game
  const startGame = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        status: "alive" as const,
        score: 0,
        strikes: 0,
        currentAnswer: undefined,
      }))
    )
    setCurrentQuestionIndex(0)
    setTimeLeft(15)
    setGameState("playing")
    setEjectedPlayer(null)
  }, [])

  // Submit answer for a student
  const submitAnswer = useCallback(
    (playerId: string, answerIndex: number) => {
      if (gameState !== "answering") return

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === playerId) {
            return { ...p, currentAnswer: answerIndex.toString() }
          }
          return p
        })
      )
    },
    [gameState]
  )

  // Process answers after time runs out
  const processAnswers = useCallback(() => {
    if (!currentQuestion) return

    let newEjectedPlayer: Player | null = null

    setPlayers((prev) => {
      const updated = prev.map((p) => {
        if (p.role !== "student" || p.status !== "alive") return p

        const answerIndex = p.currentAnswer !== undefined ? parseInt(p.currentAnswer) : -1
        const isCorrect = answerIndex === currentQuestion.correctAnswer

        let newStrikes = p.strikes
        let newScore = p.score
        let newStatus = p.status

        if (isCorrect) {
          newScore += 100
        } else {
          newStrikes += 1
          if (newStrikes >= 3) {
            newStatus = "ejected" as const
            newEjectedPlayer = { ...p, status: "ejected", strikes: newStrikes }
          }
        }

        return {
          ...p,
          score: newScore,
          strikes: newStrikes,
          status: newStatus,
          currentAnswer: undefined,
        }
      })

      return updated
    })

    // Check if someone was ejected
    if (newEjectedPlayer) {
      setEjectedPlayer(newEjectedPlayer)
      setShowEjectionAnim(true)
      setGameState("ejection")
      return
    }

    // Check if game should continue
    if (currentQuestionIndex >= 9) {
      setGameState("gameover")
      return
    }

    setGameState("results")
  }, [currentQuestion, currentQuestionIndex])

  // Timer logic
  useEffect(() => {
    if (gameState !== "answering") return

    if (timeLeft <= 0) {
      processAnswers()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, gameState, processAnswers])

  // Auto-advance from playing to answering
  useEffect(() => {
    if (gameState === "playing") {
      const timer = setTimeout(() => {
        setTimeLeft(15)
        setGameState("answering")

        // Simulate AI answers for students
        const answerDelay = () => Math.random() * 8000 + 2000
        aliveStudents.forEach((student) => {
          setTimeout(() => {
            // 70% chance of correct answer
            const isCorrect = Math.random() > 0.3
            const answer = isCorrect
              ? currentQuestion?.correctAnswer || 0
              : Math.floor(Math.random() * 4)
            submitAnswer(student.id, answer)
          }, answerDelay())
        })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState, aliveStudents, currentQuestion, submitAnswer])

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (aliveStudents.length === 0) {
      setGameState("gameover")
      return
    }

    setCurrentQuestionIndex((prev) => prev + 1)
    setTimeLeft(15)
    setGameState("playing")
  }, [aliveStudents])

  // Handle ejection dismissal
  const handleEjectionDismiss = useCallback(() => {
    setShowEjectionAnim(false)
    setEjectedPlayer(null)

    if (aliveStudents.length <= 1 || currentQuestionIndex >= 9) {
      setGameState("gameover")
    } else {
      nextQuestion()
    }
  }, [aliveStudents, currentQuestionIndex, nextQuestion])

  return (
    <div className="w-full h-full overflow-hidden bg-background relative">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 15, 20], fov: 55 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <Environment preset="night" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
          <pointLight position={[0, 10, 0]} intensity={0.5} color="#22c55e" />

          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={40}
            minPolarAngle={0.3}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 2, 0]}
          />

          {/* Classroom */}
          <ClassroomFloor />
          <QuestionScreen question={gameState !== "waiting" ? currentQuestion : null} timeLeft={timeLeft} />

          {/* Walls */}
          <mesh position={[0, 4, -12]}>
            <planeGeometry args={[30, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[-15, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[25, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[25, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Players */}
          {players.map((player) => (
            <PlayerCharacter
              key={player.id}
              player={player}
              isSelected={selectedPlayer === player.id}
              onClick={() => setSelectedPlayer(player.id)}
              showEjection={showEjectionAnim && player.status === "ejected"}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Game UI Overlay */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none">
        <div className="grid grid-cols-12 gap-3 items-start">
          {/* Left HUD (stable stack) */}
          <div className="col-span-12 sm:col-span-5 lg:col-span-3 flex flex-col gap-3 pointer-events-auto">
            {/* Question counter */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 cursor-help">
                  <div className="text-xs text-muted-foreground mb-1">Question</div>
                  <div className="text-2xl font-bold text-foreground">
                    {currentQuestionIndex + 1}
                    <span className="text-muted-foreground text-lg">/10</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current question number out of 10 total questions</p>
              </TooltipContent>
            </Tooltip>

            {/* Timer */}
            {gameState === "answering" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 cursor-help">
                    <div className="text-xs text-muted-foreground mb-1 text-center">Time</div>
                    <div
                      className={cn(
                        "text-3xl font-mono font-bold text-center",
                        timeLeft <= 5 ? "text-destructive animate-pulse" : "text-primary"
                      )}
                    >
                      {timeLeft}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Time remaining to answer. Answer quickly to earn bonus points!</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Players status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 cursor-help">
                  <div className="text-xs text-muted-foreground mb-2">Players</div>
                  <div className="space-y-2">
                    {players
                      .filter((p) => p.role === "student")
                      .map((player) => (
                        <div
                          key={player.id}
                          className={cn(
                            "flex items-center gap-2 text-sm",
                            player.status === "ejected" && "opacity-40 line-through"
                          )}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                          <span className="font-medium">{player.name}</span>
                          <span className="text-muted-foreground ml-auto tabular-nums">{player.score}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  i < player.strikes ? "bg-destructive" : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Player status: Score and strikes (3 strikes = ejection)</p>
              </TooltipContent>
            </Tooltip>

            {/* Mobile tools drawer trigger */}
            {gameState === "answering" && (
              <div className="lg:hidden">
                <Drawer open={toolsOpen} onOpenChange={setToolsOpen}>
                  <DrawerTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
                        >
                          Tools (AI • Team • Rewards)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open learning tools: AI assistance, collaboration, and achievements</p>
                      </TooltipContent>
                    </Tooltip>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                      <DrawerTitle>Learning Tools</DrawerTitle>
                      <DrawerDescription>
                        Use collaboration, AI hints, and rewards without cluttering the game.
                      </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 pb-4 space-y-3 overflow-y-auto">
                      <div className="bg-card/90 border border-border rounded-lg p-3">
                        <CollaborativeLearning
                          players={players}
                          currentQuestion={currentQuestion}
                          onContribution={(type, content) => {
                            console.log(`Collaboration: ${type} - ${content}`)
                          }}
                          onHelpRequest={(playerId) => {
                            console.log(`Help requested from: ${playerId}`)
                          }}
                        />
                      </div>

                      <div className="bg-card/90 border border-border rounded-lg p-3">
                        <AIAssistance
                          currentQuestion={currentQuestion}
                          playerProgress={{ level: 2, correct: 3, total: 5 }}
                          gameState={gameState}
                          onAIHelp={(type, content) => {
                            console.log(`AI Help: ${type} - ${content}`)
                          }}
                        />
                      </div>

                      <div className="bg-card/90 border border-border rounded-lg p-3">
                        <GamificationSystem
                          player={players.find((p) => p.id === "student-1")}
                          gameStats={{ correct: 3, total: 5, streak: 2 }}
                          onAchievementUnlock={(achievement) => {
                            console.log(`Achievement unlocked: ${achievement.name}`)
                          }}
                        />
                      </div>

                      <Button type="button" variant="outline" className="w-full" onClick={() => setToolsOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            )}
          </div>

          {/* Right HUD (learning tools) */}
          <div className="hidden lg:flex lg:col-span-4 lg:col-start-9 flex-col gap-3 pointer-events-auto">
            {gameState === "answering" && (
              <>
                <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 max-h-64 overflow-y-auto">
                  <CollaborativeLearning
                    players={players}
                    currentQuestion={currentQuestion}
                    onContribution={(type, content) => {
                      console.log(`Collaboration: ${type} - ${content}`)
                    }}
                    onHelpRequest={(playerId) => {
                      console.log(`Help requested from: ${playerId}`)
                    }}
                  />
                </div>

                <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <AIAssistance
                    currentQuestion={currentQuestion}
                    playerProgress={{ level: 2, correct: 3, total: 5 }}
                    gameState={gameState}
                    onAIHelp={(type, content) => {
                      console.log(`AI Help: ${type} - ${content}`)
                    }}
                  />
                </div>

                <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 max-h-64 overflow-y-auto">
                  <GamificationSystem
                    player={players.find((p) => p.id === "student-1")}
                    gameStats={{ correct: 3, total: 5, streak: 2 }}
                    onAchievementUnlock={(achievement) => {
                      console.log(`Achievement unlocked: ${achievement.name}`)
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Answer options */}
      {gameState === "answering" && currentQuestion && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2">
            {currentQuestion.options.map((option, i) => {
              const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"]
              return (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    colors[i],
                    "p-4 rounded-lg text-white font-bold text-sm hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Students are answering...
          </p>
        </div>
      )}

      {/* Waiting screen */}
      {gameState === "waiting" && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md p-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">AI Tutor Quiz</h1>
              <p className="text-muted-foreground">
                Answer 10 questions correctly. Get 3 wrong and you're ejected!
              </p>
            </div>

            <div className="flex justify-center gap-4">
              {players
                .filter((p) => p.role === "student")
                .map((p) => (
                  <div key={p.id} className="text-center">
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: p.color }}
                    >
                      <div className="w-6 h-4 bg-sky-300 rounded-full opacity-90" />
                    </div>
                    <p className="text-sm font-medium">{p.name}</p>
                  </div>
                ))}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={startGame} size="lg" className="w-full">
                  Start Game
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Begin the educational quiz game. Answer questions correctly to avoid ejection!</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Results screen */}
      {gameState === "results" && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md p-8">
            <h2 className="text-2xl font-bold text-foreground">Results</h2>
            <div className="space-y-2">
              {players
                .filter((p) => p.role === "student" && p.status === "alive")
                .map((p) => {
                  const answered = p.currentAnswer !== undefined
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-card p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{p.score} pts</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                i < p.strikes ? "bg-destructive" : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={nextQuestion} size="lg" className="w-full">
                  Next Question
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Continue to the next question in the quiz</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Ejection overlay */}
      {gameState === "ejection" && (
        <EjectionOverlay player={ejectedPlayer} wasCorrect onDismiss={handleEjectionDismiss} />
      )}

      {/* Game over screen */}
      {gameState === "gameover" && <GameOverScreen players={players} onRestart={startGame} />}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur border border-border rounded-full px-4 py-1.5 text-[10px] text-muted-foreground pointer-events-none">
        Drag to rotate | Scroll to zoom | 3 wrong answers = EJECTED
      </div>
    </div>
  )
}
