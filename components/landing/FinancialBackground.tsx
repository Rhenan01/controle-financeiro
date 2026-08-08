"use client"

import { motion } from "framer-motion"

export function FinancialBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#020617]">
      
      {/* Gradiente principal */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#06132c] to-[#07152d]" />

      {/* Grid tecnológico discreto */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(circle at center, black 20%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 20%, transparent 80%)",
        }}
      />

      {/* Luz azul */}
      <motion.div
        animate={{
          x: [0, 70, 0],
          y: [0, 40, 0],
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -left-40
          top-10
          h-[600px]
          w-[600px]
          rounded-full
          bg-blue-600/20
          blur-[160px]
        "
      />

      {/* Luz violeta secundária */}
      <motion.div
        animate={{
          x: [0, -60, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -right-52
          bottom-0
          h-[650px]
          w-[650px]
          rounded-full
          bg-violet-700/15
          blur-[180px]
        "
      />

      {/* Glow central */}
      <div
        className="
          absolute
          left-1/2
          top-[25%]
          h-[350px]
          w-[500px]
          -translate-x-1/2
          rounded-full
          bg-cyan-500/[0.05]
          blur-[150px]
        "
      />
    </div>
  )
}