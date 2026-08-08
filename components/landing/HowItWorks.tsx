"use client"

import { motion } from "framer-motion"

import {
  ChartNoAxesCombined,
  Layers3,
  PencilLine,
} from "lucide-react"

const steps = [
  {
    number: "01",
    icon: PencilLine,
    title: "Registre",
    description:
      "Adicione receitas e despesas e informe os dados importantes de cada movimentação.",
  },
  {
    number: "02",
    icon: Layers3,
    title: "Organize",
    description:
      "Use categorias, formas de pagamento, cartões, parcelas e vínculos de estorno.",
  },
  {
    number: "03",
    icon: ChartNoAxesCombined,
    title: "Acompanhe",
    description:
      "Analise seu mês financeiro, filtre períodos e use seus indicadores para decidir melhor.",
  },
]

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="
        relative
        scroll-mt-[72px]
        overflow-hidden
        bg-[#020617]
        px-4
        py-20

        sm:px-6
        sm:py-24

        lg:flex
        lg:h-[calc(100svh-72px)]
        lg:min-h-[500px]
        lg:items-center
        lg:px-10
        lg:py-8
      "
    >
      {/* Luz ambiente */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-[200px]
          w-[550px]
          -translate-x-1/2
          rounded-full
          bg-indigo-600/[0.045]
          blur-[100px]

          md:h-[220px]
          md:w-[850px]
          md:blur-[110px]
        "
      />

      {/* Grid */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.03]
        "
        style={{
          backgroundImage: `
            linear-gradient(rgba(129,140,248,.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(129,140,248,.35) 1px, transparent 1px)
          `,
          backgroundSize: "62px 62px",
        }}
      />

      {/* Glow inferior */}
      <div
        className="
          pointer-events-none
          absolute
          -bottom-40
          left-1/2
          h-[260px]
          w-[550px]
          -translate-x-1/2
          rounded-[50%]
          bg-indigo-600/[0.06]
          blur-[80px]

          md:w-[850px]
        "
      />

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-[1250px]
        "
      >
        {/* Cabeçalho */}
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.4,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            mx-auto
            max-w-[620px]
            text-center
          "
        >
          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.24em]
              text-indigo-400
            "
          >
            Como funciona
          </p>

          <h2
            className="
              mt-2
              text-[30px]
              font-light
              tracking-[-0.04em]
              text-white

              sm:text-[34px]

              lg:text-[38px]
            "
          >
            Simples em três passos.
          </h2>

          <p
            className="
              mx-auto
              mt-2
              max-w-[520px]
              text-[12px]
              leading-5
              text-slate-400
            "
          >
            Registre suas movimentações, mantenha tudo organizado
            e acompanhe seus números em um só lugar.
          </p>
        </motion.div>

        {/* Etapas */}
        <div
          className="
            relative
            mt-8
            grid
            grid-cols-1
            gap-5

            md:grid-cols-3
            md:gap-3

            lg:mt-7
          "
        >
          {/* Linha entre os ícones */}
          <div
            className="
              absolute
              left-[16%]
              right-[16%]
              top-[23px]
              hidden
              h-px
              bg-gradient-to-r
              from-transparent
              via-indigo-500/35
              to-transparent

              md:block
            "
          />

          {steps.map(
            (step, index) => {
              const Icon =
                step.icon

              return (
                <motion.article
                  key={step.number}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.25,
                  }}
                  transition={{
                    duration: 0.4,
                    delay:
                      index * 0.08,
                  }}
                  className="
                    relative
                    flex
                    flex-col
                    text-center
                  "
                >
                  <div
                    className="
                      relative
                      z-10
                      mx-auto
                      flex
                      h-[46px]
                      w-[46px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-indigo-400/30
                      bg-[#080d28]
                      text-indigo-300
                      shadow-[0_0_20px_rgba(79,70,229,.14)]
                    "
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  <div
                    className="
                      mt-4
                      flex
                      min-h-[145px]
                      flex-1
                      flex-col
                      justify-center
                      rounded-[18px]
                      border
                      border-white/[0.07]
                      bg-white/[0.02]
                      px-5
                      py-5

                      md:mt-5
                      md:min-h-[160px]

                      lg:h-[138px]
                      lg:min-h-[138px]
                    "
                  >
                    <span
                      className="
                        text-[9px]
                        font-semibold
                        tracking-[0.22em]
                        text-indigo-400
                      "
                    >
                      {step.number}
                    </span>

                    <h3
                      className="
                        mt-2
                        text-[17px]
                        font-medium
                        text-white
                      "
                    >
                      {step.title}
                    </h3>

                    <p
                      className="
                        mx-auto
                        mt-2
                        max-w-[320px]
                        text-[11.5px]
                        leading-[1.55]
                        text-slate-400
                      "
                    >
                      {step.description}
                    </p>
                  </div>
                </motion.article>
              )
            }
          )}
        </div>
      </div>
    </section>
  )
}