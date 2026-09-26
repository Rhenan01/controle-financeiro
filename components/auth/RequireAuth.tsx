"use client"

import { Fragment, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (state.status === "unauthenticated") router.replace("/")
  }, [state.status, router])

  if (state.status === "authenticated") {
    // Trocar a conta desmonta também estados locais e consultas das páginas.
    return <Fragment key={state.user.id}>{children}</Fragment>
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md space-y-4 text-center text-slate-700" role="status">
        <p>{state.status === "error" ? state.message : "Validando sua sessão..."}</p>
        {state.status === "error" && (
          <div className="flex justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-lg border px-4 py-2">
              Tentar novamente
            </button>
            <button type="button" onClick={() => void signOut()} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
              Sair da conta
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
