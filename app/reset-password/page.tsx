"use client"

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react"

import { useRouter } from "next/navigation"

import {
  AnimatePresence,
  motion,
} from "framer-motion"

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { supabase } from "@/lib/supabase"


type PasswordStrength =
  | "empty"
  | "weak"
  | "medium"
  | "strong"


type PasswordChecks = {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  symbol: boolean
}


function getPasswordChecks(
  password: string
): PasswordChecks {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}


function getPasswordStrength(
  password: string
) {
  if (!password) {
    return {
      score: 0,
      strength:
        "empty" as PasswordStrength,
      label: "Ainda não avaliada",
      description:
        "Comece digitando sua nova senha.",
    }
  }

  const checks =
    getPasswordChecks(password)

  const score =
    Object.values(checks)
      .filter(Boolean)
      .length

  if (score <= 2) {
    return {
      score,
      strength:
        "weak" as PasswordStrength,
      label: "Fraca",
      description:
        "Adicione mais variedade à senha.",
    }
  }

  if (score <= 4) {
    return {
      score,
      strength:
        "medium" as PasswordStrength,
      label: "Média",
      description:
        "Boa, mas ainda pode ficar mais segura.",
    }
  }

  return {
    score,
    strength:
      "strong" as PasswordStrength,
    label: "Forte",
    description:
      "Excelente. Todos os requisitos foram atendidos.",
  }
}


function Requirement({
  checked,
  children,
}: {
  checked: boolean
  children: React.ReactNode
}) {
  return (
    <motion.div
      layout
      transition={{
        duration: 0.2,
      }}
      className={`
        flex
        items-center
        gap-2.5
        rounded-xl
        px-2
        py-1.5
        transition-colors
        duration-200

        ${
          checked
            ? "text-emerald-300"
            : "text-slate-500"
        }
      `}
    >
      <motion.div
        animate={{
          scale:
            checked ? 1 : 0.94,
        }}
        transition={{
          duration: 0.18,
        }}
        className={`
          flex
          h-[18px]
          w-[18px]
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          transition-all
          duration-200

          ${
            checked
              ? `
                border-emerald-400/35
                bg-emerald-400/10
              `
              : `
                border-white/10
                bg-white/[0.02]
              `
          }
        `}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.4,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.4,
              }}
            >
              <Check
                className="
                  h-3
                  w-3
                "
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <span
        className="
          text-xs
          font-medium
        "
      >
        {children}
      </span>
    </motion.div>
  )
}


function PasswordField({
  id,
  label,
  value,
  placeholder,
  visible,
  onToggle,
  onChange,
  status = "default",
}: {
  id: string
  label: string
  value: string
  placeholder: string
  visible: boolean
  onToggle: () => void
  onChange: (
    value: string
  ) => void
  status?:
    | "default"
    | "success"
    | "error"
}) {
  const stateClasses =
    status === "success"
      ? `
        border-emerald-400/30
        focus-within:border-emerald-400/50
        focus-within:ring-emerald-500/[0.06]
      `
      : status === "error"
        ? `
          border-rose-400/35
          focus-within:border-rose-400/55
          focus-within:ring-rose-500/[0.06]
        `
        : `
          border-white/[0.09]
          focus-within:border-indigo-400/55
          focus-within:ring-indigo-500/[0.07]
        `

  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-xs
          font-medium
          text-slate-300
        "
      >
        {label}
      </label>

      <div
        className={`
          group
          relative
          rounded-[15px]
          border
          bg-white/[0.035]
          transition-all
          duration-200
          focus-within:ring-4
          ${stateClasses}
        `}
      >
        <LockKeyhole
          className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-slate-500
            transition-colors
            group-focus-within:text-indigo-300
          "
        />

        <input
          id={id}
          type={
            visible
              ? "text"
              : "password"
          }
          autoComplete="new-password"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(
              event.target.value
            )
          }}
          className="
            h-[50px]
            w-full
            rounded-[15px]
            bg-transparent
            pl-11
            pr-12
            text-sm
            text-white
            outline-none
            placeholder:text-slate-600
          "
        />

        <button
          type="button"
          onMouseDown={(
            event
          ) => {
            event.preventDefault()
          }}
          onClick={onToggle}
          aria-label={
            visible
              ? "Ocultar senha"
              : "Mostrar senha"
          }
          className="
            absolute
            right-2.5
            top-1/2
            flex
            h-8
            w-8
            -translate-y-1/2
            items-center
            justify-center
            rounded-xl
            text-slate-400
            transition-all
            duration-200
            hover:bg-white/[0.06]
            hover:text-white
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-indigo-400/60
          "
        >
          {visible ? (
            <EyeOff
              className="
                h-4
                w-4
              "
            />
          ) : (
            <Eye
              className="
                h-4
                w-4
              "
            />
          )}
        </button>
      </div>
    </div>
  )
}


export default function ResetPasswordPage() {
  const router = useRouter()

  const [
    password,
    setPassword,
  ] =
    useState("")

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("")

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  const [
    showConfirm,
    setShowConfirm,
  ] =
    useState(false)

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    checkingSession,
    setCheckingSession,
  ] =
    useState(true)

  const [
    recoverySession,
    setRecoverySession,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState("")

  const [
    success,
    setSuccess,
  ] =
    useState(false)


  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth
          .getSession()

      if (
        mounted &&
        session
      ) {
        setRecoverySession(
          true
        )
      }

      if (mounted) {
        setCheckingSession(
          false
        )
      }
    }

    checkSession()


    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            session
          ) => {
            if (
              event ===
                "PASSWORD_RECOVERY" ||
              session
            ) {
              setRecoverySession(
                true
              )

              setCheckingSession(
                false
              )
            }
          }
        )


    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])


  const checks =
    useMemo(
      () =>
        getPasswordChecks(
          password
        ),
      [password]
    )


  const strength =
    useMemo(
      () =>
        getPasswordStrength(
          password
        ),
      [password]
    )


  const passwordValid =
    Object.values(checks)
      .every(Boolean)


  const confirmStarted =
    confirmPassword.length > 0


  const passwordsMatch =
    confirmStarted &&
    password ===
      confirmPassword


  const submitDisabled =
    loading ||
    !recoverySession ||
    !passwordValid ||
    !passwordsMatch


  const strengthStyles =
    strength.strength === "strong"
      ? {
          text:
            "text-emerald-300",
          gradient:
            "from-emerald-400 via-emerald-300 to-cyan-300",
          badge:
            "border-emerald-400/20 bg-emerald-400/[0.07]",
        }
      : strength.strength ===
          "medium"
        ? {
            text:
              "text-amber-300",
            gradient:
              "from-amber-400 via-yellow-300 to-orange-300",
            badge:
              "border-amber-400/20 bg-amber-400/[0.07]",
          }
        : strength.strength ===
            "weak"
          ? {
              text:
                "text-rose-300",
              gradient:
                "from-rose-500 via-orange-400 to-amber-300",
              badge:
                "border-rose-400/20 bg-rose-400/[0.07]",
            }
          : {
              text:
                "text-slate-500",
              gradient:
                "from-white/10 to-white/10",
              badge:
                "border-white/[0.07] bg-white/[0.02]",
            }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError("")

    if (!passwordValid) {
      setError(
        "Sua nova senha ainda não atende a todos os requisitos."
      )
      return
    }

    if (!passwordsMatch) {
      setError(
        "As duas senhas precisam ser iguais."
      )
      return
    }

    setLoading(true)

    const {
      error:
        updateError,
    } =
      await supabase.auth
        .updateUser({
          password,
        })

    if (updateError) {
      setError(
        "Não foi possível alterar sua senha. Solicite um novo link e tente novamente."
      )

      setLoading(false)

      return
    }

    setSuccess(true)

    await supabase.auth
      .signOut({
        scope: "local",
      })

    setLoading(false)

    setTimeout(() => {
      router.push("/")
      router.refresh()
    }, 1800)
  }


  return (
    <main
      className="
        relative
        min-h-dvh
        overflow-x-hidden
        bg-[#050714]
        px-4
        py-6

        md:flex
        md:h-dvh
        md:min-h-0
        md:items-center
        md:justify-center
        md:overflow-hidden
        md:py-5
      "
    >
      {/* Grid sutil */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.035]
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
          backgroundSize:
            "48px 48px",
        }}
      />


      {/* Glow azul */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[-260px]
          h-[540px]
          w-[800px]
          -translate-x-1/2
          rounded-full
          bg-indigo-500/[0.13]
          blur-[120px]
        "
      />


      {/* Glow roxo */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-[-300px]
          right-[-200px]
          h-[560px]
          w-[560px]
          rounded-full
          bg-violet-500/[0.08]
          blur-[130px]
        "
      />


      <motion.section
        initial={{
          opacity: 0,
          y: 14,
          scale: 0.99,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.38,
          ease: "easeOut",
        }}
        className="
          relative
          mx-auto
          w-full
          max-w-[820px]
          overflow-hidden
          rounded-[30px]
          border
          border-white/[0.08]
          bg-[#0a0d1e]/88
          shadow-[
            0_35px_120px_rgba(0,0,0,.50),
            0_0_0_1px_rgba(255,255,255,.015)
          ]
          backdrop-blur-2xl
        "
      >
        {/* Borda superior luminosa */}
        <div
          className="
            absolute
            inset-x-12
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-indigo-300/40
            to-transparent
          "
        />


        {/* Luz interna */}
        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-56
            w-56
            rounded-full
            bg-violet-500/[0.09]
            blur-[80px]
          "
        />


        <AnimatePresence
          mode="wait"
        >
          {success ? (
            /* =========================
               SUCESSO
               ========================= */
            <motion.div
              key="success"
              initial={{
                opacity: 0,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="
                flex
                min-h-[430px]
                flex-col
                items-center
                justify-center
                px-6
                py-10
                text-center
              "
            >
              <motion.div
                initial={{
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="
                  mb-5
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-[20px]
                  border
                  border-emerald-400/20
                  bg-emerald-400/[0.07]
                  text-emerald-300
                  shadow-[0_0_50px_rgba(16,185,129,.10)]
                "
              >
                <CheckCircle2
                  className="
                    h-8
                    w-8
                  "
                />
              </motion.div>


              <h1
                className="
                  text-2xl
                  font-semibold
                  tracking-[-0.03em]
                  text-white

                  sm:text-[28px]
                "
              >
                Senha alterada
              </h1>


              <p
                className="
                  mt-2
                  max-w-[370px]
                  text-sm
                  leading-6
                  text-slate-400
                "
              >
                Sua nova senha já está
                ativa. Você será
                redirecionado para entrar
                novamente.
              </p>


              <div
                className="
                  mt-6
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/[0.07]
                  bg-white/[0.025]
                  px-3
                  py-2
                  text-xs
                  text-slate-400
                "
              >
                <LoaderCircle
                  className="
                    h-3.5
                    w-3.5
                    animate-spin
                  "
                />

                Redirecionando
              </div>
            </motion.div>
          ) : (
            /* =========================
               CONTEÚDO PRINCIPAL
               ========================= */
            <motion.div
              key="form"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="
                relative
                p-5

                sm:p-6

                md:p-7
              "
            >
              {/* Cabeçalho */}
              <header
                className="
                  mb-6
                  flex
                  items-start
                  justify-between
                  gap-5
                "
              >
                <div>
                  <div
                    className="
                      mb-3
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-indigo-300/15
                      bg-indigo-400/[0.055]
                      px-3
                      py-1.5
                      text-[11px]
                      font-medium
                      text-indigo-200
                    "
                  >
                    <ShieldCheck
                      className="
                        h-3.5
                        w-3.5
                      "
                    />

                    Segurança da conta
                  </div>


                  <h1
                    className="
                      text-[26px]
                      font-semibold
                      tracking-[-0.04em]
                      text-white

                      sm:text-[30px]
                    "
                  >
                    Defina sua nova senha
                  </h1>


                  <p
                    className="
                      mt-1.5
                      max-w-[500px]
                      text-[13px]
                      leading-5
                      text-slate-400
                    "
                  >
                    Use uma combinação forte
                    e diferente das suas
                    outras senhas.
                  </p>
                </div>


                <div
                  className="
                    hidden
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/[0.07]
                    bg-white/[0.025]
                    text-indigo-300

                    sm:flex
                  "
                >
                  <KeyRound
                    className="
                      h-[18px]
                      w-[18px]
                    "
                  />
                </div>
              </header>


              {checkingSession ? (
                /* Validando */
                <div
                  className="
                    flex
                    min-h-[300px]
                    items-center
                    justify-center
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2.5
                      rounded-2xl
                      border
                      border-white/[0.07]
                      bg-white/[0.025]
                      px-4
                      py-3
                      text-sm
                      text-slate-300
                    "
                  >
                    <LoaderCircle
                      className="
                        h-4
                        w-4
                        animate-spin
                      "
                    />

                    Validando link...
                  </div>
                </div>
              ) : !recoverySession ? (
                /* Link inválido */
                <div
                  className="
                    rounded-2xl
                    border
                    border-amber-400/15
                    bg-amber-400/[0.045]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      gap-3
                    "
                  >
                    <ShieldAlert
                      className="
                        mt-0.5
                        h-5
                        w-5
                        shrink-0
                        text-amber-300
                      "
                    />

                    <div>
                      <h2
                        className="
                          text-sm
                          font-semibold
                          text-white
                        "
                      >
                        Link inválido ou
                        expirado
                      </h2>

                      <p
                        className="
                          mt-1
                          text-sm
                          leading-6
                          text-slate-400
                        "
                      >
                        Solicite um novo link
                        para redefinir sua
                        senha.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          router.push("/")
                        }}
                        className="
                          mt-3
                          text-sm
                          font-medium
                          text-indigo-300
                          transition
                          hover:text-indigo-200
                        "
                      >
                        Voltar para o login
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* =========================
                   FORMULÁRIO
                   ========================= */
                <form
                  onSubmit={
                    handleSubmit
                  }
                >
                  <div
                    className="
                      grid
                      gap-6

                      md:grid-cols-2
                      md:gap-7
                    "
                  >
                    {/* =====================
                        COLUNA ESQUERDA
                        ===================== */}
                    <div
                      className="
                        space-y-4
                      "
                    >
                      <PasswordField
                        id="password"
                        label="Nova senha"
                        placeholder="Digite sua nova senha"
                        value={password}
                        visible={
                          showPassword
                        }
                        onToggle={() => {
                          setShowPassword(
                            !showPassword
                          )
                        }}
                        onChange={(
                          value
                        ) => {
                          setPassword(
                            value
                          )

                          if (error) {
                            setError("")
                          }
                        }}
                      />


                      <div>
                        <PasswordField
                          id="confirmPassword"
                          label="Confirmar nova senha"
                          placeholder="Repita sua nova senha"
                          value={
                            confirmPassword
                          }
                          visible={
                            showConfirm
                          }
                          onToggle={() => {
                            setShowConfirm(
                              !showConfirm
                            )
                          }}
                          onChange={(
                            value
                          ) => {
                            setConfirmPassword(
                              value
                            )

                            if (error) {
                              setError("")
                            }
                          }}
                          status={
                            confirmStarted
                              ? passwordsMatch
                                ? "success"
                                : "error"
                              : "default"
                          }
                        />


                        <AnimatePresence
                          mode="wait"
                        >
                          {confirmStarted && (
                            <motion.div
                              key={
                                passwordsMatch
                                  ? "match"
                                  : "different"
                              }
                              initial={{
                                opacity: 0,
                                y: -3,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              exit={{
                                opacity: 0,
                                y: -3,
                              }}
                              transition={{
                                duration: 0.18,
                              }}
                              className={`
                                mt-2
                                flex
                                items-center
                                gap-1.5
                                text-[11px]
                                font-medium

                                ${
                                  passwordsMatch
                                    ? "text-emerald-300"
                                    : "text-rose-300"
                                }
                              `}
                            >
                              {passwordsMatch ? (
                                <CheckCircle2
                                  className="
                                    h-3.5
                                    w-3.5
                                  "
                                />
                              ) : (
                                <ShieldAlert
                                  className="
                                    h-3.5
                                    w-3.5
                                  "
                                />
                              )}

                              {passwordsMatch
                                ? "As senhas coincidem."
                                : "As senhas estão diferentes."}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>


                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              height: 0,
                            }}
                            animate={{
                              opacity: 1,
                              height:
                                "auto",
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                            }}
                            className="
                              flex
                              gap-2
                              rounded-xl
                              border
                              border-rose-400/15
                              bg-rose-400/[0.05]
                              px-3
                              py-2.5
                              text-xs
                              leading-5
                              text-rose-300
                            "
                          >
                            <ShieldAlert
                              className="
                                mt-0.5
                                h-3.5
                                w-3.5
                                shrink-0
                              "
                            />

                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>


                      <motion.button
                        type="submit"
                        disabled={
                          submitDisabled
                        }
                        whileHover={
                          submitDisabled
                            ? undefined
                            : {
                                y: -1,
                              }
                        }
                        whileTap={
                          submitDisabled
                            ? undefined
                            : {
                                scale:
                                  0.988,
                              }
                        }
                        className="
                          group
                          relative
                          flex
                          h-[50px]
                          w-full
                          items-center
                          justify-center
                          gap-2
                          overflow-hidden
                          rounded-[15px]
                          bg-gradient-to-r
                          from-blue-600
                          via-indigo-600
                          to-violet-600
                          text-sm
                          font-semibold
                          text-white
                          shadow-[0_14px_35px_rgba(79,70,229,.22)]
                          transition-all
                          duration-200
                          hover:brightness-110
                          disabled:cursor-not-allowed
                          disabled:opacity-30
                        "
                      >
                        <div
                          className="
                            pointer-events-none
                            absolute
                            inset-0
                            -translate-x-full
                            bg-gradient-to-r
                            from-transparent
                            via-white/10
                            to-transparent
                            transition-transform
                            duration-700
                            group-hover:translate-x-full
                          "
                        />


                        {loading ? (
                          <>
                            <LoaderCircle
                              className="
                                h-4
                                w-4
                                animate-spin
                              "
                            />

                            Alterando...
                          </>
                        ) : (
                          <>
                            Alterar senha

                            <ArrowRight
                              className="
                                h-4
                                w-4
                                transition-transform
                                group-hover:translate-x-0.5
                              "
                            />
                          </>
                        )}
                      </motion.button>


                      <p
                        className="
                          text-center
                          text-[10px]
                          leading-4
                          text-slate-600
                        "
                      >
                        A alteração será
                        aplicada imediatamente.
                      </p>
                    </div>


                    {/* =====================
                        COLUNA DIREITA
                        ===================== */}
                    <div
                      className="
                        rounded-[20px]
                        border
                        border-white/[0.065]
                        bg-white/[0.022]
                        p-4

                        md:p-5
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >
                        <div>
                          <p
                            className="
                              text-xs
                              font-semibold
                              text-slate-200
                            "
                          >
                            Segurança da senha
                          </p>

                          <AnimatePresence
                            mode="wait"
                          >
                            <motion.p
                              key={
                                strength
                                  .description
                              }
                              initial={{
                                opacity: 0,
                                y: 3,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              exit={{
                                opacity: 0,
                                y: -3,
                              }}
                              className="
                                mt-1
                                text-[11px]
                                leading-4
                                text-slate-500
                              "
                            >
                              {
                                strength.description
                              }
                            </motion.p>
                          </AnimatePresence>
                        </div>


                        <span
                          className={`
                            shrink-0
                            rounded-full
                            border
                            px-2.5
                            py-1
                            text-[10px]
                            font-semibold
                            ${strengthStyles.badge}
                            ${strengthStyles.text}
                          `}
                        >
                          {
                            strength.label
                          }
                        </span>
                      </div>


                      {/* Barra */}
                      <div
                        className="
                          mt-4
                          h-1.5
                          overflow-hidden
                          rounded-full
                          bg-white/[0.07]
                        "
                      >
                        <motion.div
                          initial={false}
                          animate={{
                            width:
                              `${
                                (
                                  strength.score /
                                  5
                                ) *
                                100
                              }%`,
                          }}
                          transition={{
                            duration: 0.28,
                            ease:
                              "easeOut",
                          }}
                          className={`
                            h-full
                            rounded-full
                            bg-gradient-to-r
                            ${strengthStyles.gradient}
                          `}
                        />
                      </div>


                      <div
                        className="
                          my-4
                          h-px
                          bg-white/[0.055]
                        "
                      />


                      <p
                        className="
                          mb-2
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.08em]
                          text-slate-600
                        "
                      >
                        Requisitos
                      </p>


                      <div
                        className="
                          grid
                          gap-1
                        "
                      >
                        <Requirement
                          checked={
                            checks.length
                          }
                        >
                          Pelo menos 8
                          caracteres
                        </Requirement>

                        <Requirement
                          checked={
                            checks.uppercase
                          }
                        >
                          Uma letra maiúscula
                        </Requirement>

                        <Requirement
                          checked={
                            checks.lowercase
                          }
                        >
                          Uma letra minúscula
                        </Requirement>

                        <Requirement
                          checked={
                            checks.number
                          }
                        >
                          Pelo menos um número
                        </Requirement>

                        <Requirement
                          checked={
                            checks.symbol
                          }
                        >
                          Um caractere especial
                        </Requirement>
                      </div>


                      <AnimatePresence>
                        {passwordValid && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: 6,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: 6,
                            }}
                            className="
                              mt-4
                              flex
                              items-center
                              gap-2
                              rounded-xl
                              border
                              border-emerald-400/12
                              bg-emerald-400/[0.045]
                              px-3
                              py-2.5
                              text-[11px]
                              font-medium
                              text-emerald-300
                            "
                          >
                            <ShieldCheck
                              className="
                                h-4
                                w-4
                              "
                            />

                            Sua senha atende a
                            todos os requisitos.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  )
}