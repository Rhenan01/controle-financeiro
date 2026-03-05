"use client"

import Link from "next/link"
import { LayoutDashboard, Wallet, Settings } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Sidebar() {

  const pathname = usePathname()
  const router = useRouter()

  const [mounted,setMounted] = useState(false)

  useEffect(()=>{
    setMounted(true)

    router.prefetch("/dashboard")
    router.prefetch("/lancamentos")
    router.prefetch("/configuracoes")

  },[])

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

    <aside className="w-52 fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 flex flex-col">

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

      <div className="mt-auto opacity-40 text-xs pt-10">
        v0.1
      </div>

    </aside>

  )

}