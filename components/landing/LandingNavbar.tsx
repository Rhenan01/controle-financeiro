"use client"

import { useEffect, useState } from "react"

import {
  AnimatePresence,
  motion,
} from "framer-motion"

import {
  ChartNoAxesCombined,
  Menu,
  X,
} from "lucide-react"

type SectionId =
  | "inicio"
  | "recursos"
  | "como-funciona"

const sections: {
  id: SectionId
  label: string
}[] = [
  {
    id: "inicio",
    label: "Início",
  },
  {
    id: "recursos",
    label: "Recursos",
  },
  {
    id: "como-funciona",
    label: "Como funciona",
  },
]

export function LandingNavbar() {
  const [activeSection, setActiveSection] =
    useState<SectionId>("inicio")

  const [mobileOpen, setMobileOpen] =
    useState(false)

  /*
   * Detecta a seção visível.
   */
  useEffect(() => {
    function updateActiveSection() {
      const referencePoint =
        window.innerHeight * 0.42

      for (const section of sections) {
        const element =
          document.getElementById(section.id)

        if (!element) continue

        const rect =
          element.getBoundingClientRect()

        if (
          rect.top <= referencePoint &&
          rect.bottom > referencePoint
        ) {
          setActiveSection(section.id)

          return
        }
      }
    }

    function handleResize() {
      updateActiveSection()

      /*
       * Ao voltar para desktop,
       * fecha automaticamente o menu mobile.
       */
      if (window.innerWidth >= 768) {
        setMobileOpen(false)
      }
    }

    updateActiveSection()

    window.addEventListener(
      "scroll",
      updateActiveSection,
      {
        passive: true,
      }
    )

    window.addEventListener(
      "resize",
      handleResize
    )

    return () => {
      window.removeEventListener(
        "scroll",
        updateActiveSection
      )

      window.removeEventListener(
        "resize",
        handleResize
      )
    }
  }, [])

  function cleanUrl() {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`
    )
  }

  function scrollToSection(
    id: SectionId
  ) {
    const section =
      document.getElementById(id)

    if (!section) return

    setActiveSection(id)
    setMobileOpen(false)

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })

    cleanUrl()
  }

  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
      }}
      className="
        fixed
        left-0
        right-0
        top-0
        z-50
        border-b
        border-white/[0.045]
        bg-[#020617]/80
        backdrop-blur-xl
      "
    >
      <nav
        className="
          relative
          mx-auto
          flex
          h-[72px]
          max-w-[1500px]
          items-center
          justify-between
          px-4

          sm:px-6

          lg:px-10

          2xl:px-14
        "
      >
        {/* Marca */}
        <button
          type="button"
          onClick={() =>
            scrollToSection("inicio")
          }
          className="
            flex
            items-center
            gap-2.5
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-[10px]
              border
              border-indigo-400/20
              bg-indigo-500/[0.07]
              text-indigo-300
            "
          >
            <ChartNoAxesCombined className="h-4 w-4" />
          </div>

          <span
            className="
              text-[13px]
              font-semibold
              tracking-tight
              text-white

              sm:text-sm
            "
          >
            Controle Financeiro
          </span>
        </button>

        {/* Navegação desktop */}
        <div
          className="
            absolute
            left-1/2
            hidden
            -translate-x-1/2
            items-center
            gap-1
            rounded-full
            border
            border-white/[0.075]
            bg-white/[0.025]
            p-1
            backdrop-blur-xl

            md:flex
          "
        >
          {sections.map((section) => {
            const active =
              activeSection === section.id

            return (
              <button
                key={section.id}
                type="button"
                onClick={() =>
                  scrollToSection(section.id)
                }
                className={`
                  relative
                  rounded-full
                  px-4
                  py-2
                  text-xs
                  font-medium
                  transition-all
                  duration-300

                  lg:px-5

                  ${
                    active
                      ? `
                        bg-white/[0.08]
                        text-white
                        shadow-[inset_0_0_0_1px_rgba(129,140,248,.30),0_0_22px_rgba(79,70,229,.10)]
                      `
                      : `
                        text-slate-400
                        hover:bg-white/[0.04]
                        hover:text-slate-200
                      `
                  }
                `}
              >
                {section.label}

                {active && (
                  <motion.span
                    layoutId="navbar-active"
                    className="
                      absolute
                      -bottom-[5px]
                      left-1/2
                      h-[2px]
                      w-6
                      -translate-x-1/2
                      rounded-full
                      bg-gradient-to-r
                      from-blue-500
                      to-violet-400
                      shadow-[0_0_9px_rgba(99,102,241,.8)]
                    "
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Botão mobile */}
        <button
          type="button"
          aria-label={
            mobileOpen
              ? "Fechar menu"
              : "Abrir menu"
          }
          aria-expanded={mobileOpen}
          onClick={() => {
            setMobileOpen(
              (current) => !current
            )
          }}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-[11px]
            border
            border-white/[0.08]
            bg-white/[0.035]
            text-slate-300
            transition
            hover:bg-white/[0.07]
            hover:text-white

            md:hidden
          "
        >
          {mobileOpen ? (
            <X className="h-[18px] w-[18px]" />
          ) : (
            <Menu className="h-[18px] w-[18px]" />
          )}
        </button>
      </nav>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.2,
            }}
            className="
              absolute
              left-0
              right-0
              top-[72px]
              border-b
              border-white/[0.06]
              bg-[#020617]/95
              px-4
              pb-4
              pt-2
              shadow-[0_20px_40px_rgba(0,0,0,.25)]
              backdrop-blur-2xl

              md:hidden
            "
          >
            <div
              className="
                mx-auto
                flex
                max-w-[500px]
                flex-col
                gap-1
              "
            >
              {sections.map((section) => {
                const active =
                  activeSection ===
                  section.id

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      scrollToSection(
                        section.id
                      )
                    }
                    className={`
                      flex
                      h-11
                      items-center
                      rounded-xl
                      px-4
                      text-left
                      text-sm
                      transition

                      ${
                        active
                          ? `
                            bg-indigo-500/[0.10]
                            text-white
                          `
                          : `
                            text-slate-400
                            hover:bg-white/[0.04]
                            hover:text-slate-200
                          `
                      }
                    `}
                  >
                    {section.label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}