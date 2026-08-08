"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export type MascotState =
  | "idle"
  | "email"
  | "password"
  | "passwordPeek"
  | "loading"
  | "error"
  | "success"

type FinanceMascotProps = {
  state?: MascotState
}

export function FinanceMascot({
  state = "idle",
}: FinanceMascotProps) {
  const mascotRef = useRef<HTMLDivElement>(null)

  /*
   * Guarda o estado anterior.
   *
   * Isso permite usar uma animação mais suave
   * especificamente quando o Fin está saindo
   * do estado de senha.
   */
  const previousStateRef = useRef<MascotState>(state)

  const [eyePosition, setEyePosition] = useState({
    x: 0,
    y: 0,
  })

  const [blink, setBlink] = useState(false)

  const previousState = previousStateRef.current

  const isPasswordState =
    state === "password" ||
    state === "passwordPeek"

  const wasPasswordState =
    previousState === "password" ||
    previousState === "passwordPeek"

  const isLeavingPassword =
    wasPasswordState &&
    !isPasswordState

  /*
   * Atualiza o estado anterior somente
   * depois que a renderização atual aconteceu.
   */
  useEffect(() => {
    previousStateRef.current = state
  }, [state])

  /*
   * No estado normal, os olhos acompanham
   * suavemente a posição do mouse.
   */
  useEffect(() => {
    if (state !== "idle") return

    function handleMouseMove(event: MouseEvent) {
      if (!mascotRef.current) return

      const rect =
        mascotRef.current.getBoundingClientRect()

      const centerX =
        rect.left + rect.width / 2

      const centerY =
        rect.top + rect.height * 0.3

      const deltaX =
        event.clientX - centerX

      const deltaY =
        event.clientY - centerY

      const distance = Math.sqrt(
        deltaX * deltaX +
          deltaY * deltaY
      )

      if (!distance) return

      const limit = 6

      setEyePosition({
        x:
          (deltaX / distance) *
          limit,

        y:
          (deltaY / distance) *
          limit,
      })
    }

    window.addEventListener(
      "mousemove",
      handleMouseMove
    )

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      )
    }
  }, [state])

  /*
   * Piscada espontânea.
   *
   * Só acontece quando o Fin está
   * completamente em repouso.
   */
  useEffect(() => {
    if (state !== "idle") {
      setBlink(false)
      return
    }

    let blinkTimer:
      | ReturnType<typeof setTimeout>
      | undefined

    let reopenTimer:
      | ReturnType<typeof setTimeout>
      | undefined

    function scheduleBlink() {
      blinkTimer = setTimeout(
        () => {
          setBlink(true)

          reopenTimer = setTimeout(
            () => {
              setBlink(false)
              scheduleBlink()
            },
            130
          )
        },
        2500 +
          Math.random() * 3500
      )
    }

    scheduleBlink()

    return () => {
      if (blinkTimer) {
        clearTimeout(blinkTimer)
      }

      if (reopenTimer) {
        clearTimeout(reopenTimer)
      }

      setBlink(false)
    }
  }, [state])

  /*
   * Direção dos olhos.
   */
  const eyeTarget =
    state === "email"
      ? {
          x: 7,
          y: 2,
        }
      : state === "error"
        ? {
            x: 0,
            y: 5,
          }
        : state === "success"
          ? {
              x: 0,
              y: -3,
            }
          : eyePosition

  /*
   * BRAÇO ESQUERDO
   *
   * password:
   * sobe e tampa o olho.
   *
   * passwordPeek:
   * permanece exatamente onde está.
   *
   * Outros estados:
   * volta suavemente para baixo.
   */
  const leftArmAnimation =
    isPasswordState
      ? {
          x: -8,
          y: -16,
          rotate: -145,
        }
      : {
          x: 0,
          y: 0,
          rotate: -6,
        }

  /*
   * BRAÇO DIREITO
   *
   * password:
   * tampa o olho.
   *
   * passwordPeek:
   * desce.
   *
   * normal/e-mail:
   * permanece embaixo.
   */
  const rightArmAnimation =
    state === "password"
      ? {
          x: 8,
          y: -16,
          rotate: 145,
        }
      : {
          x: 0,
          y: 0,
          rotate: 6,
        }

  /*
   * OLHO ESQUERDO
   *
   * Diferente das versões anteriores,
   * este mesmo elemento existe em TODOS
   * os estados.
   */
  const leftEyeAnimation =
    isPasswordState
      ? {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 0.12,
          rotate: 0,
        }
      : {
          x: eyeTarget.x,
          y: eyeTarget.y,
          scaleX: 1,

          scaleY:
            state === "idle" &&
            blink
              ? 0.08
              : 1,

          rotate: 0,
        }

  /*
   * OLHO DIREITO
   *
   * password:
   * fechado.
   *
   * passwordPeek:
   * abre parcialmente.
   *
   * normal/e-mail:
   * abre completamente.
   */
  const rightEyeAnimation =
    state === "password"
      ? {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 0.12,
          rotate: 0,
        }
      : state === "passwordPeek"
        ? {
            x: 0,
            y: 0,
            scaleX: 0.78,
            scaleY: 0.48,
            rotate: -2,
          }
        : {
            x: eyeTarget.x,
            y: eyeTarget.y,
            scaleX: 1,

            scaleY:
              state === "idle" &&
              blink
                ? 0.08
                : 1,

            rotate: 0,
          }

  /*
   * Transição vertical dos olhos.
   *
   * Ao sair da senha usamos uma mola
   * perceptível para evitar o "estalo".
   *
   * A piscada comum continua rápida.
   */
  const eyeScaleTransition =
    isLeavingPassword
      ? {
          type: "spring" as const,
          stiffness: 72,
          damping: 13,
          mass: 0.95,
        }
      : isPasswordState
        ? {
            type: "spring" as const,
            stiffness: 82,
            damping: 13,
            mass: 0.9,
          }
        : {
            duration: 0.08,
          }

  return (
    <div
      ref={mascotRef}
      className="
        relative
        flex
        h-[390px]
        w-[310px]
        items-center
        justify-center
      "
    >
      {/* Halo */}
      <motion.div
        animate={{
          scale: [
            1,
            1.07,
            1,
          ],

          opacity: [
            0.26,
            0.44,
            0.26,
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          h-[300px]
          w-[300px]
          rounded-full
          bg-indigo-600/25
          blur-[85px]
        "
      />

      {/* Sombra */}
      <motion.div
        animate={{
          scaleX: [
            1,
            0.88,
            1,
          ],

          opacity: [
            0.28,
            0.15,
            0.28,
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          bottom-5
          h-8
          w-44
          rounded-[100%]
          bg-blue-700/30
          blur-xl
        "
      />

      {/* Fin completo */}
      <motion.div
        animate={
          state === "success"
            ? {
                y: [
                  0,
                  -24,
                  0,
                ],

                rotate: [
                  0,
                  -3,
                  3,
                  0,
                ],
              }
            : state === "error"
              ? {
                  x: [
                    0,
                    -6,
                    6,
                    -5,
                    5,
                    0,
                  ],
                }
              : {
                  y: [
                    0,
                    -8,
                    0,
                  ],
                }
        }
        transition={
          state === "error"
            ? {
                duration: 0.4,
              }
            : {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        className="
          relative
          h-[335px]
          w-[270px]
        "
      >
        {/* Antena */}
        <div
          className="
            absolute
            -top-8
            left-1/2
            z-20
            h-[62px]
            w-7
            -translate-x-1/2
          "
        >
          <div
            className="
              absolute
              bottom-0
              left-1/2
              h-11
              w-3
              -translate-x-1/2
              rounded-full
              bg-gradient-to-r
              from-[#111849]
              via-indigo-500
              to-[#111849]
            "
          />

          <motion.div
            animate={{
              opacity: [
                0.65,
                1,
                0.65,
              ],

              boxShadow: [
                "0 0 8px rgba(255,255,255,.4)",
                "0 0 25px rgba(129,140,248,.95)",
                "0 0 8px rgba(255,255,255,.4)",
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
            className="
              absolute
              left-1/2
              top-0
              h-8
              w-4
              -translate-x-1/2
              rounded-full
              bg-white
            "
          />
        </div>

        {/* Corpo */}
        <div
          className="
            absolute
            bottom-0
            left-1/2
            z-20
            h-[190px]
            w-[164px]
            -translate-x-1/2
            rounded-[58px]
            border
            border-indigo-400/15
            bg-gradient-to-br
            from-[#222f82]
            via-[#11194d]
            to-[#070b29]
            shadow-[
              inset_10px_8px_24px_rgba(255,255,255,.07),
              inset_-14px_-14px_28px_rgba(0,0,0,.34),
              0_25px_50px_rgba(49,46,129,.3)
            ]
          "
        >
          {/* Peitoral */}
          <div
            className="
              absolute
              left-1/2
              top-[58px]
              flex
              h-[76px]
              w-[76px]
              -translate-x-1/2
              items-center
              justify-center
              rounded-[23px]
              border
              border-indigo-400/25
              bg-[#090e32]/70
              shadow-[
                inset_0_0_20px_rgba(79,70,229,.18),
                0_0_26px_rgba(79,70,229,.16)
              ]
            "
          >
            <span
              className="
                text-[27px]
                font-semibold
                tracking-[-0.05em]
                text-white
                drop-shadow-[0_0_12px_rgba(129,140,248,.9)]
              "
            >
              Fin
            </span>
          </div>
        </div>

        {/*
         * BRAÇO ESQUERDO
         *
         * Mantemos a mesma camada durante
         * toda a animação.
         *
         * Isso evita desaparecer atrás da
         * cabeça antes de terminar o movimento.
         */}
        <motion.div
          animate={
            leftArmAnimation
          }
          transition={{
            x: {
              type: "spring",
              stiffness: 58,
              damping: 13,
              mass: 1,
            },

            y: {
              type: "spring",
              stiffness: 58,
              damping: 13,
              mass: 1,
            },

            rotate: {
              type: "spring",
              stiffness: 58,
              damping: 13,
              mass: 1,
            },
          }}
          style={{
            transformOrigin:
              "top center",
          }}
          className="
            absolute
            left-[14px]
            top-[185px]
            z-40
            h-[112px]
            w-[50px]
          "
        >
          {/* Braço */}
          <div
            className="
              absolute
              left-1/2
              top-0
              h-[86px]
              w-[42px]
              -translate-x-1/2
              rounded-[24px]
              border
              border-indigo-400/15
              bg-gradient-to-r
              from-[#0d143e]
              via-[#2b3789]
              to-[#111949]
              shadow-[inset_5px_4px_12px_rgba(255,255,255,.05)]
            "
          />

          {/* Mão */}
          <div
            className="
              absolute
              bottom-0
              left-1/2
              h-[46px]
              w-[46px]
              -translate-x-1/2
              rounded-full
              border
              border-indigo-300/20
              bg-gradient-to-br
              from-[#8585f4]
              to-[#3d43ae]
              shadow-[0_0_18px_rgba(99,102,241,.4)]
            "
          />
        </motion.div>

        {/* Braço direito */}
        <motion.div
          animate={
            rightArmAnimation
          }
          transition={{
            x: {
              type: "spring",
              stiffness: 58,
              damping: 13,
              mass: 1,
            },

            y: {
              type: "spring",
              stiffness: 58,
              damping: 13,
              mass: 1,
            },

            rotate: {
              type: "spring",
              stiffness: 58,
              damping: 13,
              mass: 1,
            },
          }}
          style={{
            transformOrigin:
              "top center",
          }}
          className="
            absolute
            right-[14px]
            top-[185px]
            z-40
            h-[112px]
            w-[50px]
          "
        >
          {/* Braço */}
          <div
            className="
              absolute
              left-1/2
              top-0
              h-[86px]
              w-[42px]
              -translate-x-1/2
              rounded-[24px]
              border
              border-indigo-400/15
              bg-gradient-to-l
              from-[#0d143e]
              via-[#2b3789]
              to-[#111949]
              shadow-[inset_5px_4px_12px_rgba(255,255,255,.05)]
            "
          />

          {/* Mão */}
          <div
            className="
              absolute
              bottom-0
              left-1/2
              h-[46px]
              w-[46px]
              -translate-x-1/2
              rounded-full
              border
              border-indigo-300/20
              bg-gradient-to-br
              from-[#8585f4]
              to-[#3d43ae]
              shadow-[0_0_18px_rgba(99,102,241,.4)]
            "
          />
        </motion.div>

        {/* Cabeça */}
        <motion.div
          animate={{
            rotate:
              state === "email"
                ? 3
                : state === "password"
                  ? -1
                  : state === "passwordPeek"
                    ? -2
                    : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 75,
            damping: 14,
            mass: 0.9,
          }}
          className="
            absolute
            left-1/2
            top-0
            z-30
            h-[170px]
            w-[238px]
            -translate-x-1/2
            rounded-[64px]
            border
            border-indigo-300/25
            bg-gradient-to-br
            from-[#3845aa]
            via-[#1b286d]
            to-[#090e32]
            p-[10px]
            shadow-[
              inset_10px_10px_25px_rgba(255,255,255,.10),
              inset_-18px_-18px_30px_rgba(0,0,0,.32),
              0_0_40px_rgba(79,70,229,.42)
            ]
          "
        >
          {/* Face */}
          <div
            className="
              relative
              flex
              h-full
              w-full
              items-center
              justify-center
              overflow-hidden
              rounded-[54px]
              border
              border-indigo-300/15
              bg-gradient-to-br
              from-[#101747]
              via-[#070c2d]
              to-[#03051a]
              shadow-[
                inset_7px_7px_22px_rgba(99,102,241,.18),
                inset_-10px_-10px_24px_rgba(0,0,0,.45)
              ]
            "
          >
            {/* Reflexo */}
            <div
              className="
                absolute
                left-5
                top-4
                h-12
                w-24
                rounded-full
                bg-indigo-400/10
                blur-xl
              "
            />

            {/*
             * Somente o loading troca
             * a expressão completa.
             *
             * Todos os outros estados utilizam
             * exatamente os MESMOS dois olhos.
             */}
            {state === "loading" ? (
              <div className="flex gap-3">
                {[0, 1, 2].map(
                  (index) => (
                    <motion.div
                      key={index}
                      animate={{
                        y: [
                          0,
                          -7,
                          0,
                        ],

                        opacity: [
                          0.4,
                          1,
                          0.4,
                        ],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay:
                          index *
                          0.14,
                      }}
                      className="
                        h-3.5
                        w-3.5
                        rounded-full
                        bg-white
                        shadow-[0_0_14px_rgba(255,255,255,.8)]
                      "
                    />
                  )
                )}
              </div>
            ) : (
              <div
                className="
                  flex
                  items-center
                  gap-7
                "
              >
                {/* OLHO ESQUERDO */}
                <motion.div
                  animate={
                    leftEyeAnimation
                  }
                  transition={{
                    x: {
                      type: "spring",
                      stiffness: 130,
                      damping: 17,
                    },

                    y: {
                      type: "spring",
                      stiffness: 130,
                      damping: 17,
                    },

                    scaleX: {
                      type: "spring",
                      stiffness: 80,
                      damping: 13,
                    },

                    scaleY:
                      eyeScaleTransition,

                    rotate: {
                      type: "spring",
                      stiffness: 90,
                      damping: 14,
                    },
                  }}
                  className="
                    h-[50px]
                    w-[47px]
                    rounded-[16px]
                    bg-white
                    shadow-[0_0_27px_rgba(255,255,255,.8)]
                  "
                />

                {/* OLHO DIREITO */}
                <motion.div
                  animate={
                    rightEyeAnimation
                  }
                  transition={{
                    x: {
                      type: "spring",
                      stiffness: 130,
                      damping: 17,
                    },

                    y: {
                      type: "spring",
                      stiffness: 130,
                      damping: 17,
                    },

                    scaleX: {
                      type: "spring",
                      stiffness: 80,
                      damping: 13,
                    },

                    scaleY:
                      eyeScaleTransition,

                    rotate: {
                      type: "spring",
                      stiffness: 90,
                      damping: 14,
                    },
                  }}
                  className="
                    h-[50px]
                    w-[47px]
                    rounded-[16px]
                    bg-white
                    shadow-[0_0_27px_rgba(255,255,255,.8)]
                  "
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}