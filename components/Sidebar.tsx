"use client"

import Link from "next/link"

import {
  LayoutDashboard,
  LogOut,
  Repeat2,
  Settings,
  Wallet
} from "lucide-react"

import {
  usePathname,
  useRouter
} from "next/navigation"

import {
  useEffect,
  useState
} from "react"

import { supabase } from "@/lib/supabase"

type MenuItem = {
  name: string
  mobileName: string
  path: string
  icon: typeof LayoutDashboard
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)

    router.prefetch("/dashboard")
    router.prefetch("/lancamentos")
    router.prefetch("/recorrencias")
    router.prefetch("/configuracoes")

    async function loadUser() {
      const { data } =
        await supabase.auth.getUser()

      setUser(data.user)
    }

    loadUser()
  }, [router])

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

  const menu: MenuItem[] = [
    {
      name: "Dashboard",
      mobileName: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard"
    },
    {
      name: "Lançamentos",
      mobileName: "Lançamentos",
      icon: Wallet,
      path: "/lancamentos"
    },
    {
      name: "Recorrências",
      mobileName: "Recorrências",
      icon: Repeat2,
      path: "/recorrencias"
    },
    {
      name: "Configurações",
      mobileName: "Ajustes",
      icon: Settings,
      path: "/configuracoes"
    }
  ]

  return (
    <aside
      className="
        fixed inset-x-0 bottom-0 z-50
        flex h-[76px] w-full flex-col
        bg-gradient-to-r from-slate-900 to-slate-800
        px-1.5 py-2 text-white
        shadow-[0_-8px_30px_rgba(15,23,42,0.18)]

        sm:h-20
        sm:px-2

        lg:static
        lg:h-screen
        lg:w-52
        lg:shrink-0
        lg:bg-gradient-to-b
        lg:p-6
        lg:shadow-none
      "
    >
      <h1
        className="
          mb-8 hidden
          text-xl font-semibold tracking-tight
          lg:block
        "
      >
        Finanças
      </h1>

      <nav
        className="
          grid h-full grid-cols-5 gap-0.5

          sm:gap-1

          lg:flex
          lg:h-auto
          lg:flex-col
          lg:gap-2
        "
      >
        {menu.map((item) => {
          const Icon = item.icon

          const active =
            pathname === item.path ||
            pathname.startsWith(
              `${item.path}/`
            )

          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch
              aria-label={item.name}
              aria-current={
                active ? "page" : undefined
              }
              className={`
                flex min-w-0
                flex-col items-center justify-center
                gap-1 rounded-xl
                px-0.5 py-1.5
                text-[9px] leading-none
                transition-all

                sm:px-1
                sm:py-2
                sm:text-[10px]

                lg:flex-row
                lg:justify-start
                lg:gap-3
                lg:px-4
                lg:text-sm
                lg:leading-normal

                ${
                  active
                    ? "bg-white/15 text-white shadow-inner"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <Icon
                className="
                  h-[19px] w-[19px] shrink-0
                  sm:h-5 sm:w-5
                "
              />

              <span
                className="
                  block max-w-full truncate
                  lg:hidden
                "
              >
                {item.mobileName}
              </span>

              <span
                className="
                  hidden max-w-full truncate
                  lg:block
                "
              >
                {item.name}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair da conta"
          className="
            flex min-w-0
            flex-col items-center justify-center
            gap-1 rounded-xl
            px-0.5 py-1.5
            text-[9px] leading-none
            text-red-300
            transition-all
            hover:bg-white/5
            hover:text-red-200

            sm:px-1
            sm:py-2
            sm:text-[10px]

            lg:hidden
          "
        >
          <LogOut
            className="
              h-[19px] w-[19px] shrink-0
              sm:h-5 sm:w-5
            "
          />

          <span>Sair</span>
        </button>
      </nav>

      <div
        className="
          mt-auto hidden
          border-t border-white/10
          pt-10
          lg:block
        "
      >
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