"use client"

import {
  FormEvent,
  useState,
} from "react"

import { useRouter } from "next/navigation"

import {
  AnimatePresence,
  motion,
} from "framer-motion"

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

import type { MascotState } from "./FinanceMascot"


type AuthMode =
  | "login"
  | "signup"
  | "forgot"


function translateAuthError(message: string) {
  const normalizedMessage =
    message.toLowerCase()

  if (
    normalizedMessage.includes(
      "invalid login credentials"
    )
  ) {
    return "E-mail ou senha incorretos."
  }

  if (
    normalizedMessage.includes(
      "email not confirmed"
    )
  ) {
    return "Confirme seu e-mail antes de entrar."
  }

  if (
    normalizedMessage.includes(
      "user already registered"
    )
  ) {
    return "Este e-mail já está cadastrado."
  }

  if (
    normalizedMessage.includes(
      "password should be at least"
    )
  ) {
    return "A senha deve ter pelo menos 6 caracteres."
  }

  if (
    normalizedMessage.includes(
      "invalid email"
    )
  ) {
    return "Informe um e-mail válido."
  }

  if (
    normalizedMessage.includes(
      "email rate limit exceeded"
    )
  ) {
    return "Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente."
  }

  return "Não foi possível realizar a autenticação. Tente novamente."
}


type AuthCardProps = {
  onMascotStateChange: (
    state: MascotState
  ) => void
}


export function AuthCard({
  onMascotStateChange,
}: AuthCardProps) {
  const router = useRouter()

  const [mode, setMode] =
    useState<AuthMode>("login")

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")


  const isSubmitDisabled =
    loading ||
    !email ||
    (
      mode !== "forgot" &&
      !password
    )


  function changeMode(
    nextMode: AuthMode
  ) {
    if (loading) return

    setMode(nextMode)

    setEmail("")
    setPassword("")
    setError("")
    setSuccess("")
    setShowPassword(false)

    onMascotStateChange("idle")
  }


  async function handleAuth(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      !email ||
      (
        mode !== "forgot" &&
        !password
      ) ||
      loading
    ) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    onMascotStateChange(
      "loading"
    )


    /*
     * Recuperação de senha.
     *
     * O Supabase enviará um e-mail
     * contendo o link de recuperação.
     *
     * Depois do clique, o usuário será
     * redirecionado para:
     *
     * /reset-password
     */
    if (mode === "forgot") {
      const {
        error: resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          }
        )

      if (resetError) {
        setError(
          translateAuthError(
            resetError.message
          )
        )

        setLoading(false)

        onMascotStateChange(
          "error"
        )

        return
      }

      /*
       * A mensagem é propositalmente
       * genérica.
       *
       * Assim não informamos publicamente
       * se determinado e-mail possui ou
       * não uma conta cadastrada.
       */
      setSuccess(
        "Se existir uma conta com este e-mail, enviaremos um link para redefinir sua senha."
      )

      setLoading(false)

      onMascotStateChange(
        "success"
      )

      return
    }


    /*
     * Login.
     */
    if (mode === "login") {
      const {
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        )

      if (loginError) {
        setError(
          translateAuthError(
            loginError.message
          )
        )

        setLoading(false)

        onMascotStateChange(
          "error"
        )

        return
      }

      onMascotStateChange(
        "success"
      )

      setTimeout(() => {
        router.push(
          "/dashboard"
        )

        router.refresh()
      }, 650)

      return
    }


    /*
     * Cadastro.
     */
    const {
      error: signupError,
    } =
      await supabase.auth.signUp(
        {
          email,
          password,
        }
      )

    if (signupError) {
      setError(
        translateAuthError(
          signupError.message
        )
      )

      setLoading(false)

      onMascotStateChange(
        "error"
      )

      return
    }

    onMascotStateChange(
      "success"
    )

    setTimeout(() => {
      router.push(
        "/dashboard"
      )

      router.refresh()
    }, 650)
  }


  return (
    <motion.div
      id="acesso"
      initial={{
        opacity: 0,
        x: 25,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.65,
        delay: 0.2,
      }}
      className="
        relative
        w-full
        max-w-[365px]
        overflow-hidden
        rounded-[26px]
        border
        border-indigo-400/25
        bg-[#070c25]/75
        shadow-[
          0_25px_80px_rgba(0,0,0,.38),
          0_0_40px_rgba(79,70,229,.10)
        ]
        backdrop-blur-2xl
      "
    >
      {/* Glow */}
      <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-20
          h-48
          w-48
          rounded-full
          bg-indigo-600/20
          blur-[70px]
        "
      />


      <div className="relative p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{
              opacity: 0,
              x: 12,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -12,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            {/* Cabeçalho */}
            <div className="mb-5">
              <h2
                className="
                  text-[24px]
                  font-medium
                  tracking-[-0.03em]
                  text-white
                "
              >
                {mode === "login"
                  ? "Bem-vindo de volta"
                  : mode === "signup"
                    ? "Crie sua conta"
                    : "Recuperar senha"}
              </h2>


              <p
                className="
                  mt-1.5
                  text-sm
                  text-slate-400
                "
              >
                {mode === "login"
                  ? "Faça login para continuar."
                  : mode === "signup"
                    ? "Comece a organizar suas finanças."
                    : "Informe seu e-mail para receber o link de recuperação."}
              </p>
            </div>


            <form
              onSubmit={
                handleAuth
              }
              className="space-y-4"
            >
              {/* E-mail */}
              <div>
                <label
                  htmlFor="email"
                  className="
                    mb-1.5
                    block
                    text-xs
                    font-medium
                    text-slate-300
                  "
                >
                  E-mail
                </label>


                <div className="group relative">
                  <Mail
                    className="
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-500
                      transition
                      group-focus-within:text-indigo-400
                    "
                  />


                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onFocus={() => {
                      /*
                       * E-mail:
                       * olhos abertos olhando
                       * para o formulário.
                       */
                      onMascotStateChange(
                        "email"
                      )
                    }}
                    onBlur={() => {
                      if (!loading) {
                        onMascotStateChange(
                          "idle"
                        )
                      }
                    }}
                    onChange={(
                      event
                    ) => {
                      setEmail(
                        event.target
                          .value
                      )

                      /*
                       * Mantém o estado
                       * correto enquanto
                       * digita no e-mail.
                       */
                      onMascotStateChange(
                        "email"
                      )

                      if (error) {
                        setError("")
                      }

                      if (success) {
                        setSuccess("")
                      }
                    }}
                    className="
                      h-[48px]
                      w-full
                      rounded-[13px]
                      border
                      border-white/10
                      bg-white/[0.035]
                      pl-11
                      pr-4
                      text-sm
                      text-white
                      outline-none
                      transition-all
                      placeholder:text-slate-600
                      hover:border-white/20
                      focus:border-indigo-500/70
                      focus:bg-indigo-500/[0.04]
                      focus:ring-4
                      focus:ring-indigo-500/[0.08]
                    "
                  />
                </div>
              </div>


              {/* Senha */}
              {mode !== "forgot" && (
                <div>
                  <label
                    htmlFor="password"
                    className="
                      mb-1.5
                      block
                      text-xs
                      font-medium
                      text-slate-300
                    "
                  >
                    Senha
                  </label>


                  <div className="group relative">
                    <LockKeyhole
                      className="
                        absolute
                        left-4
                        top-1/2
                        h-4
                        w-4
                        -translate-y-1/2
                        text-slate-500
                        transition
                        group-focus-within:text-indigo-400
                      "
                    />


                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete={
                        mode ===
                        "login"
                          ? "current-password"
                          : "new-password"
                      }
                      placeholder="••••••••"
                      value={
                        password
                      }
                      onFocus={() => {
                        onMascotStateChange(
                          showPassword
                            ? "passwordPeek"
                            : "password"
                        )
                      }}
                      onBlur={() => {
                        if (!loading) {
                          onMascotStateChange(
                            "idle"
                          )
                        }
                      }}
                      onChange={(
                        event
                      ) => {
                        setPassword(
                          event.target
                            .value
                        )

                        /*
                         * Enquanto digita,
                         * mantém o estado
                         * correspondente à
                         * visibilidade da senha.
                         */
                        onMascotStateChange(
                          showPassword
                            ? "passwordPeek"
                            : "password"
                        )

                        if (error) {
                          setError("")
                        }

                        if (success) {
                          setSuccess("")
                        }
                      }}
                      className="
                        h-[48px]
                        w-full
                        rounded-[13px]
                        border
                        border-white/10
                        bg-white/[0.035]
                        pl-11
                        pr-11
                        text-sm
                        text-white
                        outline-none
                        transition-all
                        placeholder:text-slate-600
                        hover:border-white/20
                        focus:border-indigo-500/70
                        focus:bg-indigo-500/[0.04]
                        focus:ring-4
                        focus:ring-indigo-500/[0.08]
                      "
                    />


                    {/* Mostrar / ocultar senha */}
                    <button
                      type="button"
                      onMouseDown={(
                        event
                      ) => {
                        /*
                         * O campo não perde
                         * foco ao clicar no olho.
                         */
                        event.preventDefault()
                      }}
                      onClick={() => {
                        const next =
                          !showPassword

                        setShowPassword(
                          next
                        )

                        /*
                         * Mostrar:
                         * Fin bisóia.
                         *
                         * Ocultar:
                         * Fin cobre os olhos.
                         */
                        onMascotStateChange(
                          next
                            ? "passwordPeek"
                            : "password"
                        )
                      }}
                      aria-label={
                        showPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-500
                        transition
                        hover:text-slate-300
                      "
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}


              {/* Esqueceu a senha */}
              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      changeMode(
                        "forgot"
                      )
                    }}
                    className="
                      text-xs
                      font-medium
                      text-indigo-400
                      transition
                      hover:text-indigo-300
                    "
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}


              {/* Erro */}
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
                      overflow-hidden
                      rounded-xl
                      border
                      border-red-500/20
                      bg-red-500/[0.07]
                      px-3.5
                      py-2.5
                      text-xs
                      text-red-300
                    "
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Sucesso */}
              <AnimatePresence>
                {success && (
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
                      overflow-hidden
                      rounded-xl
                      border
                      border-emerald-500/20
                      bg-emerald-500/[0.07]
                      px-3.5
                      py-2.5
                      text-xs
                      text-emerald-300
                    "
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Botão principal */}
              <motion.button
                type="submit"
                disabled={
                  isSubmitDisabled
                }
                whileHover={
                  isSubmitDisabled
                    ? undefined
                    : {
                        y: -2,
                      }
                }
                whileTap={
                  isSubmitDisabled
                    ? undefined
                    : {
                        scale:
                          0.985,
                      }
                }
                className="
                  group
                  flex
                  h-[50px]
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[13px]
                  bg-gradient-to-r
                  from-blue-600
                  via-indigo-600
                  to-violet-600
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_12px_35px_rgba(79,70,229,.27)]
                  transition
                  hover:brightness-110
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      className="
                        h-4
                        w-4
                        animate-spin
                      "
                    />

                    Aguarde...
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Entrar"
                      : mode === "signup"
                        ? "Criar conta"
                        : "Enviar link"}

                    <ArrowRight
                      className="
                        h-4
                        w-4
                        transition-transform
                        group-hover:translate-x-1
                      "
                    />
                  </>
                )}
              </motion.button>
            </form>


            {/* Navegação entre login, cadastro e recuperação */}
            <div
              className="
                mt-5
                border-t
                border-white/[0.07]
                pt-4
                text-center
                text-xs
                text-slate-500
              "
            >
              {mode === "login" ? (
                <>
                  Ainda não tem
                  uma conta?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      changeMode(
                        "signup"
                      )
                    }}
                    className="
                      font-medium
                      text-indigo-400
                      transition
                      hover:text-indigo-300
                    "
                  >
                    Criar conta
                  </button>
                </>
              ) : mode === "signup" ? (
                <>
                  Já tem uma
                  conta?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      changeMode(
                        "login"
                      )
                    }}
                    className="
                      font-medium
                      text-indigo-400
                      transition
                      hover:text-indigo-300
                    "
                  >
                    Fazer login
                  </button>
                </>
              ) : (
                <>
                  Lembrou sua senha?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      changeMode(
                        "login"
                      )
                    }}
                    className="
                      font-medium
                      text-indigo-400
                      transition
                      hover:text-indigo-300
                    "
                  >
                    Voltar para o login
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}