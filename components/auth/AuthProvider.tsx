"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { observeAuthSession, type AuthState } from "@/lib/auth-session"
import { supabase } from "@/lib/supabase"
import { useFinanceStore } from "@/store/financeStore"

type AuthContextValue = {
  state: AuthState
  signOut: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "checking", user: null })
  const observer = useRef<ReturnType<typeof observeAuthSession> | null>(null)

  useEffect(() => {
    const current = observeAuthSession(supabase.auth, (next) => {
      useFinanceStore.getState().setSessionUser(next.user?.id ?? null)
      setState(next)
    })
    observer.current = current
    return () => {
      current.stop()
      observer.current = null
      useFinanceStore.getState().setSessionUser(null)
    }
  }, [])

  async function signOut() {
    return observer.current ? observer.current.signOut() : false
  }

  return <AuthContext.Provider value={{ state, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider")
  return context
}
