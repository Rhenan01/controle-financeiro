"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)

    router.prefetch("/dashboard")
    router.prefetch("/lancamentos")
    router.prefetch("/configuracoes")

    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    loadUser()
  }, [])

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email ||
    "Usuário"

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (!mounted) {
    return null
  }

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Lançamentos",
      icon: Wallet,
      path: "/lancamentos",
    },
    {
      name: "Configurações",
      icon: Settings,
      path: "/configuracoes",
    },
  ]

  return (
    <aside
      className="
        fixed inset-x-0 bottom-0 z-50
        flex h-20 w-full flex-col
        bg-gradient-to-r from-slate-900 to-slate-800
        p-2 text-white
        shadow-[0_-8px_30px_rgba(15,23,42,0.18)]

        lg:static
        lg:h-screen
        lg:w-52
        lg:shrink-0
        lg:bg-gradient-to-b
        lg:p-6
        lg:shadow-none
      "
    >
      <h1 className="mb-8 hidden text-xl font-semibold tracking-tight lg:block">
        Finanças
      </h1>

      <nav
        className="
          grid h-full grid-cols-4 gap-1

          lg:flex
          lg:h-auto
          lg:flex-col
          lg:gap-2
        "
      >
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.path

          return (
            <Link
              key={item.name}
              href={item.path}
              prefetch
              className={`
                flex min-w-0
                flex-col items-center justify-center
                gap-1 rounded-xl
                px-1 py-2
                text-[11px]
                transition-all

                lg:flex-row
                lg:justify-start
                lg:gap-3
                lg:px-4
                lg:text-sm

                ${
                  active
                    ? "bg-white/15 text-white shadow-inner"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <Icon className="shrink-0" size={20} />

              <span className="max-w-full truncate">
                {item.name}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="
            flex min-w-0
            flex-col items-center justify-center
            gap-1 rounded-xl
            px-1 py-2
            text-[11px] text-red-300
            transition-all
            hover:bg-white/5
            hover:text-red-200

            lg:hidden
          "
        >
          <LogOut className="shrink-0" size={20} />

          <span>Sair</span>
        </button>
      </nav>

      <div className="mt-auto hidden border-t border-white/10 pt-10 lg:block">
        {user && (
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-full bg-white/20
                text-sm font-semibold
              "
            >
              {displayName?.[0]?.toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 text-xs">
              <p
                className="truncate opacity-80"
                title={displayName}
              >
                {displayName}
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  mt-1 flex items-center gap-1
                  text-red-400
                  hover:text-red-300
                "
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}