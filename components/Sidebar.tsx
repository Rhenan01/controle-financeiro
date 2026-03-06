"use client"

import Link from "next/link"
import { LayoutDashboard, Wallet, Settings, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Sidebar() {

  const pathname = usePathname()
  const router = useRouter()

  const [mounted,setMounted] = useState(false)
  const [user,setUser] = useState<any>(null)

  useEffect(()=>{

    setMounted(true)

    router.prefetch("/dashboard")
    router.prefetch("/lancamentos")
    router.prefetch("/configuracoes")

    async function loadUser(){

      const { data } = await supabase.auth.getUser()

      setUser(data.user)

    }

    loadUser()

  },[])

  async function handleLogout(){

    await supabase.auth.signOut()

    router.push("/")

  }

  if(!mounted){
    return null
  }

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard"
    },
    {
      name: "Lançamentos",
      icon: Wallet,
      path: "/lancamentos"
    },
    {
      name: "Configurações",
      icon: Settings,
      path: "/configuracoes"
    }
  ]

  return (

    <aside className="w-52 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 flex flex-col">

      <h1 className="text-xl font-semibold mb-8 tracking-tight">
        Finanças
      </h1>

      <nav className="flex flex-col gap-2">

        {menu.map((item) => {

          const Icon = item.icon
          const active = pathname === item.path

          return (

            <Link
              key={item.name}
              href={item.path}
              prefetch
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all
              ${active
                ? "bg-white/10 text-white shadow-inner"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >

              <Icon size={18} />

              {item.name}

            </Link>

          )

        })}

      </nav>

      {/* usuário logado */}

      <div className="mt-auto pt-10 border-t border-white/10">

        {user && (

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {user.email?.[0].toUpperCase()}
            </div>

            <div className="flex-1 text-xs min-w-0">

              <p
                className="opacity-80 truncate"
                title={user.email}
              >
                {user.email}
              </p>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 mt-1"
              >
                <LogOut size={14} />
                sair
              </button>

            </div>

          </div>

        )}

      </div>

    </aside>

  )

}