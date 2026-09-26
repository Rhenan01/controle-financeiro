"use client"

import {
  FormEvent,
  useEffect,
  useState,
} from "react"

import { useRouter } from "next/navigation"

import {
  AnimatePresence,
  motion,
} from "framer-motion"

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react"

import { supabase } from "@/lib/supabase"


export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] =
    useState("")

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("")

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false)

  const [loading, setLoading] =
    useState(false)

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true)

  const [
    recoverySession,
    setRecoverySession,
  ] = useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")


  /*
   * Quando o usuário clica no link
   * enviado pelo Supabase, uma sessão
   * temporária de recuperação é criada.
   *
   * Aqui verificamos se essa sessão
   * realmente existe antes de permitir
   * a alteração da senha.
   */
  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      if (
        mounted &&
        session
      ) {
        setRecoverySession(true)
      }

      if (mounted) {
        setCheckingSession(false)
      }
    }


    checkSession()


    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          if (
            event ===
              "PASSWORD_RECOVERY" ||
            session
          ) {
            setRecoverySession(true)
            setCheckingSession(false)
          }
        }
      )


    return () => {
      mounted = false

      subscription.unsubscribe()
    }
  }, [])


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError("")
    setSuccess("")


    if (
      !password ||
      !confirmPassword
    ) {
      setError(
        "Preencha os dois campos de senha."
      )

      return
    }


    if (password.length < 8) {
      setError(
        "A nova senha deve ter pelo menos 8 caracteres."
      )

      return
    }


    if (
      password !==
      confirmPassword
    ) {
      setError(
        "As senhas não coincidem."
      )

      return
    }


    setLoading(true)


    const {
      error: updateError,
    } =
      await supabase.auth.updateUser(
        {
          password,
        }
      )


    if (updateError) {
      setError(
        "Não foi possível alterar a senha. Solicite um novo link de recuperação."
      )

      setLoading(false)

      return
    }


    setSuccess(
      "Senha alterada com sucesso."
    )


    /*
     * Encerra somente a sessão
     * utilizada na recuperação.
     *
     * Assim o usuário fará login
     * novamente usando a nova senha.
     */
    await supabase.auth.signOut({
      scope: "local",
    })


    setLoading(false)


    setTimeout(() => {
      router.push("/")
      router.refresh()
    }, 1800)
  }


  const submitDisabled =
    loading ||
    !password ||
    !confirmPassword


  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-[#020617]
        px-4
        py-10
      "
    >
      {/* Fundo */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[
            radial-gradient(
              circle_at_50%_30%,
              rgba(79,70,229,.16),
              transparent_38%
            )
          ]
        "
      />


      <motion.div
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
        }}
        className="
          relative
          w-full
          max-w-[390px]
          overflow-hidden
          rounded-[26px]
          border
          border-indigo-400/25
          bg-[#070c25]/80
          p-6
          shadow-[
            0_25px_80px_rgba(0,0,0,.42),
            0_0_50px_rgba(79,70,229,.12)
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


        <div className="relative">
          <div className="mb-6">
            <h1
              className="
                text-[25px]
                font-medium
                tracking-[-0.03em]
                text-white
              "
            >
              Defina sua nova senha
            </h1>

            <p
              className="
                mt-1.5
                text-sm
                leading-6
                text-slate-400
              "
            >
              Escolha uma nova senha para acessar sua conta.
            </p>
          </div>


          {checkingSession ? (
            <div
              className="
                flex
                min-h-[190px]
                items-center
                justify-center
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-slate-400
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
            <div
              className="
                rounded-xl
                border
                border-amber-500/20
                bg-amber-500/[0.07]
                p-4
              "
            >
              <p
                className="
                  text-sm
                  leading-6
                  text-amber-200
                "
              >
                Este link de recuperação não é válido ou já expirou.
              </p>


              <button
                type="button"
                onClick={() => {
                  router.push("/")
                }}
                className="
                  mt-4
                  text-sm
                  font-medium
                  text-indigo-400
                  transition
                  hover:text-indigo-300
                "
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-4"
            >
              {/* Nova senha */}
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
                  Nova senha
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
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(
                      event
                    ) => {
                      setPassword(
                        event.target.value
                      )

                      if (error) {
                        setError("")
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


                  <button
                    type="button"
                    onMouseDown={(
                      event
                    ) => {
                      event.preventDefault()
                    }}
                    onClick={() => {
                      setShowPassword(
                        !showPassword
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


              {/* Confirmar senha */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="
                    mb-1.5
                    block
                    text-xs
                    font-medium
                    text-slate-300
                  "
                >
                  Confirmar nova senha
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
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event
                    ) => {
                      setConfirmPassword(
                        event.target.value
                      )

                      if (error) {
                        setError("")
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


                  <button
                    type="button"
                    onMouseDown={(
                      event
                    ) => {
                      event.preventDefault()
                    }}
                    onClick={() => {
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }}
                    aria-label={
                      showConfirmPassword
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
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>


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
                      height: "auto",
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
                      leading-5
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
                      height: "auto",
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="
                      flex
                      items-center
                      gap-2
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
                    <CheckCircle2
                      className="
                        h-4
                        w-4
                        shrink-0
                      "
                    />

                    {success}
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
                        y: -2,
                      }
                }
                whileTap={
                  submitDisabled
                    ? undefined
                    : {
                        scale: 0.985,
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
                        group-hover:translate-x-1
                      "
                    />
                  </>
                )}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  )
}