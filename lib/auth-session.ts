import type { SupabaseClient, User } from "@supabase/supabase-js"

export type AuthState =
  | { status: "checking"; user: null }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated"; user: null }
  | { status: "error"; user: null; message: string }

// O observador vive acima das rotas, inclusive da página de login.
export function observeAuthSession(
  auth: SupabaseClient["auth"],
  onChange: (state: AuthState) => void
) {
  let active = true
  let revision = 0
  let verifiedUserId: string | null = null
  let signingOut = false
  let timer: ReturnType<typeof setTimeout> | undefined

  function publish(state: AuthState) {
    if (active) onChange(state)
  }

  const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
    if (!active || signingOut) return
    const currentRevision = ++revision
    clearTimeout(timer)

    if (!session) {
      verifiedUserId = null
      publish({ status: "unauthenticated", user: null })
      return
    }

    if (verifiedUserId === session.user.id) {
      publish({ status: "authenticated", user: session.user })
      return
    }

    verifiedUserId = null
    publish({ status: "checking", user: null })

    // Fora do callback do Supabase para não bloquear o lock de autenticação.
    timer = setTimeout(async () => {
      try {
        const { data, error } = await auth.getUser(session.access_token)
        if (!active || revision !== currentRevision) return
        if (error || !data.user || data.user.id !== session.user.id) {
          publish({ status: "unauthenticated", user: null })
          return
        }
        verifiedUserId = data.user.id
        publish({ status: "authenticated", user: data.user })
      } catch {
        if (!active || revision !== currentRevision) return
        publish({
          status: "error", user: null,
          message: "Não foi possível validar sua sessão. Tente novamente."
        })
      }
    }, 0)
  })

  return {
    async signOut() {
      if (signingOut || !active) return false
      signingOut = true
      ++revision
      clearTimeout(timer)
      verifiedUserId = null
      publish({ status: "checking", user: null })
      try {
        const { error } = await auth.signOut()
        if (error) throw error
        publish({ status: "unauthenticated", user: null })
        return true
      } catch {
        publish({
          status: "error", user: null,
          message: "Não foi possível encerrar sua sessão. Tente sair novamente."
        })
        return false
      } finally {
        signingOut = false
      }
    },
    stop() {
      active = false
      ++revision
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }
}
