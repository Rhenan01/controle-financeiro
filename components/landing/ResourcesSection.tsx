"use client"

import { motion } from "framer-motion"

import {
  ArrowLeftRight,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  History,
  RotateCcw,
} from "lucide-react"

const resources = [
  {
    icon: CalendarDays,
    title: "Mês financeiro personalizado",
    description:
      "Acompanhe seu mês com base no dia do seu salário, sem ficar preso ao calendário tradicional.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transações e categorias",
    description:
      "Registre entradas e saídas e organize suas movimentações por categoria.",
  },
  {
    icon: CreditCard,
    title: "Cartões e parcelas",
    description:
      "Acompanhe formas de pagamento, cartões e compras parceladas nos próximos meses.",
  },
  {
    icon: RotateCcw,
    title: "Estornos e reembolsos",
    description:
      "Mantenha compras e estornos vinculados para não distorcer seus números.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Painel e filtros",
    description:
      "Visualize indicadores e gráficos por período, mês financeiro e ano selecionado.",
  },
  {
    icon: History,
    title: "Histórico financeiro",
    description:
      "Consulte suas movimentações e acompanhe suas finanças ao longo do tempo.",
  },
]

export function ResourcesSection() {
  return (
    <section
      id="recursos"
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
      {/* Brilho suave */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-[180px]
          w-[550px]
          -translate-x-1/2
          bg-indigo-600/[0.05]
          blur-[100px]

          md:w-[900px]
        "
      />

      {/* Grid contínuo */}
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

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-[1280px]
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
            amount: 0.35,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            flex
            flex-col
            gap-4

            xl:flex-row
            xl:items-end
            xl:justify-between
            xl:gap-8
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.24em]
                text-indigo-400
              "
            >
              Recursos
            </p>

            <h2
              className="
                mt-2
                max-w-[580px]
                text-[28px]
                font-light
                leading-[1.1]
                tracking-[-0.04em]
                text-white

                sm:text-[32px]

                lg:text-[34px]

                xl:text-[36px]
              "
            >
              Tudo o que você precisa para entender seu dinheiro.
            </h2>
          </div>

        </motion.div>

        {/* Cards */}
        <div
          className="
            mt-7
            grid
            grid-cols-1
            gap-3

            sm:grid-cols-2

            lg:mt-6
            lg:grid-cols-3
          "
        >
          {resources.map(
            (resource, index) => {
              const Icon =
                resource.icon

              return (
                <motion.article
                  key={resource.title}
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.15,
                  }}
                  transition={{
                    duration: 0.4,
                    delay:
                      index * 0.04,
                  }}
                  whileHover={{
                    y: -3,
                  }}
                  className="
                    group
                    relative
                    min-h-[132px]
                    overflow-hidden
                    rounded-[18px]
                    border
                    border-white/[0.07]
                    bg-white/[0.022]
                    p-4
                    backdrop-blur-xl
                    transition-colors
                    hover:border-indigo-400/25
                    hover:bg-indigo-500/[0.035]

                    lg:h-[132px]
                  "
                >
                  {/* Glow */}
                  <div
                    className="
                      pointer-events-none
                      absolute
                      -right-10
                      -top-10
                      h-28
                      w-28
                      rounded-full
                      bg-indigo-500/[0.06]
                      blur-3xl
                    "
                  />

                  <div
                    className="
                      relative
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-[10px]
                      border
                      border-indigo-400/20
                      bg-indigo-500/[0.055]
                      text-indigo-300
                    "
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <h3
                    className="
                      relative
                      mt-3
                      text-[14px]
                      font-medium
                      text-white
                    "
                  >
                    {resource.title}
                  </h3>

                  <p
                    className="
                      relative
                      mt-1.5
                      text-[11.5px]
                      leading-[1.5]
                      text-slate-400
                    "
                  >
                    {resource.description}
                  </p>
                </motion.article>
              )
            }
          )}
        </div>
      </div>
    </section>
  )
}