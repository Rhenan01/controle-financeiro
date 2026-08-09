"use client"

import Link from "next/link"
import Image from "next/image"

import {
  LayoutDashboard,
  LogOut,
  Repeat2,
  Settings,
  Wallet,
  BarChart3
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
    user?.email?.split("@")[0] ||
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
        fixed
        inset-x-0
        bottom-0
        z-50

        flex
        h-[76px]
        w-full
        flex-col

        border-t
        border-white/10

        bg-gradient-to-r
        from-[#071329]
        via-[#0b1830]
        to-[#101d35]

        px-1.5
        py-2

        text-white

        shadow-[0_-8px_30px_rgba(15,23,42,0.20)]


        sm:h-20
        sm:px-2


        lg:static
        lg:inset-auto
        lg:h-screen
        lg:min-h-screen
        lg:w-48
        lg:shrink-0

        lg:border-r
        lg:border-t-0
        lg:border-white/[0.06]

        lg:bg-gradient-to-b
        lg:from-[#071329]
        lg:via-[#0b1830]
        lg:to-[#111f39]

        lg:px-3
        lg:py-4

        lg:shadow-none
      "
    >


      {/* =====================================================
          LOGO
      ===================================================== */}

      <div
        className="
          mb-6
          hidden
          h-10
          items-center
          gap-2.5
          px-1
          lg:flex
        "
      >

        <div
          className="
            relative

            flex
            h-9
            w-9
            shrink-0

            items-center
            justify-center

            overflow-hidden

            rounded-xl

            border
            border-blue-300/[0.16]

            bg-gradient-to-br
            from-blue-500
            via-blue-600
            to-violet-600

            shadow-[0_5px_18px_rgba(59,130,246,0.22)]
          "
        >
          {/* Reflexo */}
          <span
            className="
              absolute

              -left-2
              -top-3

              h-8
              w-8

              rounded-full

              bg-white/20

              blur-lg
            "
          />

          <BarChart3
            size={18}
            strokeWidth={2}
            className="
              relative
              z-10
              text-white
            "
          />
        </div>


        <h1
          className="
            truncate
            text-[17px]
            font-bold
            tracking-[-0.02em]
            text-white
          "
        >
          Finanças
        </h1>

      </div>


      {/* =====================================================
          MENU
      ===================================================== */}

      <nav
        className="
          grid
          h-full
          grid-cols-5
          gap-0.5

          sm:gap-1

          lg:flex
          lg:h-auto
          lg:flex-col
          lg:gap-1.5
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
                active
                  ? "page"
                  : undefined
              }
              className={`
                group
                relative

                flex
                min-w-0

                flex-col
                items-center
                justify-center

                gap-1

                rounded-xl

                border

                px-0.5
                py-1.5

                text-[9px]
                leading-none

                transition-all
                duration-200


                sm:px-1
                sm:py-2
                sm:text-[10px]


                lg:min-h-[42px]
                lg:flex-row
                lg:justify-start
                lg:gap-3
                lg:px-3
                lg:py-2
                lg:text-[14px]
                lg:leading-normal


                ${
                  active

                    ? `
                      border-blue-400/25

                      bg-gradient-to-r
                      from-blue-600/65
                      to-violet-600/55

                      text-white

                      shadow-[0_5px_18px_rgba(59,130,246,0.14)]
                    `

                    : `
                      border-transparent

                      text-slate-300

                      hover:bg-white/[0.055]
                      hover:text-white
                    `
                }
              `}
            >

              <Icon
                className={`
                  h-[19px]
                  w-[19px]

                  shrink-0

                  transition-colors
                  duration-200

                  sm:h-5
                  sm:w-5

                  ${
                    active
                      ? "text-white"
                      : "text-slate-400 group-hover:text-blue-300"
                  }
                `}
              />


              {/* Mobile */}
              <span
                className="
                  block
                  max-w-full
                  truncate

                  lg:hidden
                "
              >
                {item.mobileName}
              </span>


              {/* Desktop */}
              <span
                className="
                  hidden
                  max-w-full
                  truncate

                  font-medium

                  lg:block
                "
              >
                {item.name}
              </span>

            </Link>

          )

        })}


        {/* =====================================================
            SAIR MOBILE
        ===================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair da conta"
          className="
            flex
            min-w-0

            flex-col
            items-center
            justify-center

            gap-1

            rounded-xl

            px-0.5
            py-1.5

            text-[9px]
            leading-none

            text-red-300

            transition-all
            duration-200

            hover:bg-red-500/10


            sm:px-1
            sm:py-2
            sm:text-[10px]


            lg:hidden
          "
        >

          <LogOut
            className="
              h-[19px]
              w-[19px]

              sm:h-5
              sm:w-5
            "
          />

          <span>
            Sair
          </span>

        </button>

      </nav>


      {/* =====================================================
          ÁREA LIVRE / FIN

          O flex-1 absorve o espaço disponível.

          O Fin:
          - só aparece no desktop;
          - some em telas baixas;
          - não interfere no perfil;
          - não aparece no menu inferior mobile.
      ===================================================== */}

      <div
        className="
          relative
          hidden
          min-h-0
          flex-1

          lg:flex
          lg:items-center
          lg:justify-center

          [@media(max-height:720px)]:hidden
        "
      >

        <div
          className="
            group

            relative

            flex
            flex-col
            items-center
            justify-center

            opacity-80

            transition-all
            duration-300

            hover:opacity-100
            hover:-translate-y-1
          "
        >

          {/* Glow atrás do Fin */}
          <div
            className="
              absolute

              h-24
              w-24

              rounded-full

              bg-blue-500/10

              blur-2xl

              transition-all
              duration-300

              group-hover:bg-blue-500/15
            "
          />


          {/*
            IMPORTANTE:

            Coloque aqui o caminho real da imagem
            do Fin usada na tela de login.

            Exemplo:
            /fin.png
            /images/fin.png
            /mascote-fin.png
          */}

          <Image
            src="/fin.png"
            alt="Fin"
            width={95}
            height={95}
            priority={false}
            className="
              relative
              z-10

              h-auto
              w-[76px]

              object-contain

              drop-shadow-[0_10px_18px_rgba(37,99,235,0.15)]

              xl:w-[88px]

              [@media(max-height:800px)]:w-[68px]
            "
          />


          <span
            className="
              relative
              z-10

              mt-1

              text-[10px]
              font-medium

              tracking-wide

              text-slate-500
            "
          >
            Fin
          </span>

        </div>

      </div>


      {/*
        Quando o Fin some por falta de altura,
        este espaço flexível continua empurrando
        o perfil para baixo.
      */}

      <div
        className="
          hidden
          flex-1

          lg:block

          min-[721px]:hidden
        "
      />


      {/* =====================================================
          PERFIL
      ===================================================== */}

      <div
        className="
          hidden
          flex-shrink-0

          border-t
          border-white/[0.08]

          pt-3

          lg:block
        "
      >

        {user && (

          <div
            className="
              rounded-2xl

              border
              border-white/[0.06]

              bg-white/[0.035]

              p-2.5

              transition-colors
              duration-200

              hover:bg-white/[0.05]
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              {/* Avatar */}
              <div
                className="
                  relative

                  flex
                  h-9
                  w-9

                  shrink-0

                  items-center
                  justify-center

                  rounded-full

                  bg-gradient-to-br
                  from-blue-600
                  to-violet-600

                  text-sm
                  font-bold
                  text-white
                "
              >

                {displayName
                  ?.[0]
                  ?.toUpperCase()}


                <span
                  className="
                    absolute
                    bottom-0
                    right-0

                    h-2.5
                    w-2.5

                    rounded-full

                    border-2
                    border-[#111f39]

                    bg-emerald-400
                  "
                />

              </div>


              {/* Nome */}
              <div
                className="
                  min-w-0
                  flex-1
                "
              >

                <p
                  title={displayName}
                  className="
                    truncate
                    text-sm
                    font-semibold
                    text-slate-200
                  "
                >
                  {displayName}
                </p>

              </div>

            </div>


            {/* Sair */}
            <button
              type="button"
              onClick={handleLogout}
              className="
                mt-3

                flex
                w-full
                items-center
                justify-center

                gap-2

                rounded-xl

                border
                border-red-400/10

                bg-red-500/[0.05]

                px-3
                py-2

                text-xs
                font-medium
                text-red-300

                transition-all
                duration-200

                hover:bg-red-500/[0.09]
                hover:text-red-200
              "
            >

              <LogOut size={14} />

              Sair

            </button>

          </div>

        )}

      </div>

    </aside>

  )

}