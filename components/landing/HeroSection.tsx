"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

import {
  FinanceMascot,
  type MascotState,
} from "./FinanceMascot"

import { AuthCard } from "./AuthCard"

export function HeroSection() {
  const [mascotState, setMascotState] =
    useState<MascotState>("idle")

  return (
    <section
      id="inicio"
      className="
        relative
        min-h-[100svh]
        overflow-hidden
        bg-[#020617]
        text-white

        [@media(max-height:500px)]:h-[100svh]
        [@media(max-height:500px)]:min-h-0

        xl:h-[100svh]
        xl:min-h-[560px]
      "
    >
      {/* Fundo principal */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-b
          from-[#020617]
          via-[#050a20]
          to-[#020617]
        "
      />

      {/* Grid */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.055]
          sm:opacity-[0.065]
        "
        style={{
          backgroundImage: `
            linear-gradient(rgba(129,140,248,.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(129,140,248,.4) 1px, transparent 1px)
          `,
          backgroundSize: "62px 62px",
        }}
      />

      {/* Luz central */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[40%]
          h-[340px]
          w-[500px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-indigo-700/10
          blur-[100px]

          xl:left-[62%]
          xl:top-[42%]
          xl:h-[420px]
          xl:w-[650px]
          xl:blur-[120px]
        "
      />

      {/* Horizonte */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-[-420px]
          left-1/2
          h-[520px]
          w-[850px]
          -translate-x-1/2
          rounded-[50%]
          border-t
          border-blue-300/45
          bg-gradient-to-b
          from-blue-500/[0.09]
          via-blue-950/[0.07]
          to-transparent
          shadow-[0_-3px_20px_rgba(96,165,250,0.35)]

          sm:w-[1050px]

          [@media(max-height:500px)]:bottom-[-480px]
          [@media(max-height:500px)]:opacity-60

          xl:bottom-[-445px]
          xl:h-[570px]
          xl:w-[1250px]
          xl:border-blue-300/75
          xl:from-blue-500/[0.13]
          xl:via-blue-950/[0.10]
          xl:shadow-[0_-3px_20px_rgba(96,165,250,0.5)]
        "
      />

      {/* Brilho do horizonte */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-[75px]
          left-1/2
          h-[30px]
          w-[360px]
          -translate-x-1/2
          rounded-full
          bg-indigo-500/15
          blur-[40px]

          sm:w-[550px]

          [@media(max-height:500px)]:bottom-[25px]
          [@media(max-height:500px)]:opacity-50

          xl:bottom-[112px]
          xl:h-[35px]
          xl:w-[750px]
          xl:bg-indigo-500/20
          xl:blur-[45px]
        "
      />

      {/* Onda esquerda */}
      <motion.div
        animate={{
          x: [-30, 20, -30],
          opacity: [0.2, 0.38, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -bottom-24
          -left-52
          h-44
          w-[480px]
          rotate-[7deg]
          rounded-[100%]
          bg-gradient-to-r
          from-cyan-500/15
          via-violet-600/25
          to-transparent
          blur-2xl

          [@media(max-height:500px)]:opacity-40

          xl:-left-40
          xl:w-[580px]
        "
      />

      {/* Onda direita */}
      <motion.div
        animate={{
          x: [25, -25, 25],
          opacity: [0.18, 0.34, 0.18],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -bottom-24
          -right-52
          h-44
          w-[480px]
          -rotate-[7deg]
          rounded-[100%]
          bg-gradient-to-l
          from-blue-500/15
          via-violet-600/20
          to-transparent
          blur-2xl

          [@media(max-height:500px)]:opacity-40

          xl:-right-40
          xl:w-[580px]
        "
      />

      {/* Conteúdo */}
      <div
        className="
          relative
          z-10
          mx-auto
          flex
          min-h-[100svh]
          w-full
          max-w-[1500px]
          items-start
          px-4
          pb-16
          pt-[88px]

          sm:px-6
          sm:pb-20
          sm:pt-[96px]

          lg:px-10

          [@media(max-height:500px)]:h-[100svh]
          [@media(max-height:500px)]:min-h-0
          [@media(max-height:500px)]:items-center
          [@media(max-height:500px)]:px-6
          [@media(max-height:500px)]:pb-2
          [@media(max-height:500px)]:pt-[72px]

          xl:h-full
          xl:min-h-0
          xl:items-center
          xl:px-10
          xl:pb-8
          xl:pt-[82px]

          2xl:px-14
        "
      >
        <div
          className="
            grid
            w-full
            grid-cols-1
            items-start
            gap-7

            [@media(max-height:500px)]:grid-cols-[minmax(0,1fr)_300px]
            [@media(max-height:500px)]:items-center
            [@media(max-height:500px)]:gap-5

            lg:grid-cols-[minmax(0,1fr)_365px]
            lg:gap-10

            xl:grid-cols-[0.94fr_0.62fr_0.76fr]
            xl:items-center
            xl:gap-3
          "
        >
          {/* TEXTO */}
          <div
            className="
              relative
              z-20
              order-1
              mx-auto
              w-full
              max-w-[560px]

              lg:mx-0

              [@media(max-height:500px)]:max-w-[335px]

              xl:order-1
            "
          >
            {/* Badge */}
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
              }}
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-indigo-400/20
                bg-indigo-500/[0.045]
                px-3
                py-1.5
                text-[10px]
                font-medium
                text-indigo-300
                backdrop-blur-xl

                sm:mb-4
                sm:px-3.5
                sm:py-2
                sm:text-xs

                [@media(max-height:500px)]:mb-2
                [@media(max-height:500px)]:px-2.5
                [@media(max-height:500px)]:py-1
                [@media(max-height:500px)]:text-[9px]

                xl:mb-5
              "
            >
              <Sparkles className="h-3.5 w-3.5" />

              Seu dinheiro. Suas decisões.
            </motion.div>

            {/* Título */}
            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.07,
              }}
              className="
                text-[36px]
                font-light
                leading-[0.98]
                tracking-[-0.052em]
                text-white

                min-[420px]:text-[39px]

                sm:text-[48px]

                md:text-[52px]

                lg:text-[54px]

                [@media(max-height:500px)]:text-[27px]
                [@media(max-height:500px)]:leading-[0.93]

                xl:text-[58px]

                2xl:text-[64px]
              "
            >
              Transforme
              <br />

              suas finanças
              <br />

              em{" "}
              <span
                className="
                  bg-gradient-to-r
                  from-indigo-400
                  via-violet-400
                  to-blue-400
                  bg-clip-text
                  text-transparent
                "
              >
                decisões
              </span>

              <br />

              <span
                className="
                  bg-gradient-to-r
                  from-violet-400
                  via-indigo-400
                  to-blue-400
                  bg-clip-text
                  text-transparent
                "
              >
                inteligentes.
              </span>
            </motion.h1>

            {/* Descrição */}
            <motion.p
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.17,
              }}
              className="
                mt-4
                max-w-[440px]
                text-[12px]
                leading-[1.6]
                text-slate-400

                sm:mt-5
                sm:text-[14px]
                sm:leading-6

                [@media(max-height:500px)]:mt-2.5
                [@media(max-height:500px)]:max-w-[315px]
                [@media(max-height:500px)]:text-[10px]
                [@media(max-height:500px)]:leading-[1.4]

                xl:mt-6
                xl:text-[15px]
              "
            >
              Entenda seus gastos, acompanhe suas receitas e
              despesas e tenha uma visão mais clara do seu mês
              financeiro.
            </motion.p>
          </div>

          {/* LOGIN */}
          <div
            className="
              relative
              z-30
              order-2
              flex
              w-full
              justify-center

              lg:justify-end

              [@media(max-height:500px)]:h-[295px]
              [@media(max-height:500px)]:items-start
              [@media(max-height:500px)]:justify-end
              [@media(max-height:500px)]:self-center

              xl:order-3
            "
          >
            {/*
             * No celular deitado:
             * o AuthCard continua internamente idêntico.
             * Reduzimos o cartão como uma unidade.
             */}
            <div
              className="
                w-full
                max-w-[365px]

                [@media(max-height:500px)]:w-[365px]
                [@media(max-height:500px)]:max-w-none
                [@media(max-height:500px)]:origin-top-right
                [@media(max-height:500px)]:scale-[0.72]
              "
            >
              <AuthCard
                onMascotStateChange={setMascotState}
              />
            </div>
          </div>

          {/* FIN */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.92,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.75,
              delay: 0.18,
            }}
            className="
              relative
              z-20
              hidden

              xl:order-2
              xl:flex
              xl:h-[350px]
              xl:items-center
              xl:justify-center

              [@media(max-height:500px)]:hidden

              2xl:h-[390px]
            "
          >
            <div
              className="
                absolute
                left-1/2
                top-1/2
                origin-center
                -translate-x-1/2
                -translate-y-1/2

                xl:scale-[0.88]

                2xl:scale-100
              "
            >
              <FinanceMascot state={mascotState} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fade */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-0
          right-0
          z-30
          h-[85px]
          bg-gradient-to-b
          from-transparent
          via-[#020617]/55
          to-[#020617]

          [@media(max-height:500px)]:h-[35px]

          xl:h-[125px]
          xl:via-[#020617]/65
        "
      />
    </section>
  )
}