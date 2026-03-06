"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"

export default function Home() {

  const router = useRouter()

  const [mode,setMode] = useState<"login"|"signup">("login")

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")

  const [bubbles,setBubbles] = useState<number[]>([])

useEffect(()=>{

  const values = Array.from({length:8},()=>Math.random()*50)
  setBubbles(values)

},[])

  useEffect(()=>{

    setEmail("")
    setPassword("")
    setError("")

  },[mode])

  async function handleAuth(){

    setLoading(true)
    setError("")

    // garante que nenhuma sessão antiga continue ativa
    await supabase.auth.signOut()

    if(mode === "login"){

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if(error){
        setError(error.message)
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()

    }else{

      const { error } = await supabase.auth.signUp({
        email,
        password
      })

      if(error){
        setError(error.message)
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()

    }

  }

  return (

    <main className="h-screen w-screen flex bg-slate-950 text-white overflow-hidden relative">

      {/* BACKGROUND GRADIENT */}

      <div className="absolute inset-0">

        <motion.div
          animate={{scale:[1,1.2,1],rotate:[0,20,0]}}
          transition={{duration:25,repeat:Infinity,ease:"linear"}}
          className="absolute w-[900px] h-[900px] bg-blue-600 rounded-full blur-[200px] opacity-30 -top-60 -left-60"
        />

        <motion.div
          animate={{scale:[1,1.3,1],rotate:[0,-20,0]}}
          transition={{duration:30,repeat:Infinity,ease:"linear"}}
          className="absolute w-[900px] h-[900px] bg-purple-600 rounded-full blur-[220px] opacity-30 -bottom-60 -right-60"
        />

      </div>

      {/* BOLHAS */}

      <div className="absolute inset-0 pointer-events-none">

        {bubbles.map((value,i)=>(
          <motion.div
            key={i}
            animate={{
              y:[0,-40,0],
              opacity:[0.3,0.6,0.3]
            }}
            transition={{
              duration:6+i,
              repeat:Infinity
            }}
            className="absolute w-6 h-6 bg-white/20 rounded-full backdrop-blur-lg"
            style={{
              left:`${10+i*10}%`,
              bottom:`${value}%`
            }}
          />
        ))}

      </div>

      {/* LADO ESQUERDO */}

      <div className="hidden lg:flex w-1/2 items-center justify-center p-20 relative">

        <div className="max-w-md space-y-6">

          <h1 className="text-5xl font-bold leading-tight">

            Controle
            <br/>
            Financeiro

          </h1>

          <p className="text-lg text-gray-300">

            Organize receitas, despesas e acompanhe
            sua evolução financeira com um painel
            moderno e inteligente.

          </p>

        </div>

      </div>

      {/* LADO DIREITO */}

      <div className="flex w-full lg:w-1/2 items-center justify-center p-10 relative">

        <motion.div
          initial={{opacity:0,y:40}}
          animate={{opacity:1,y:0}}
          transition={{duration:0.6}}
          className="w-full max-w-md p-10 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        >

          <AnimatePresence mode="wait">

            <motion.div
              key={mode}
              initial={{opacity:0,x:40,scale:0.95}}
              animate={{opacity:1,x:0,scale:1}}
              exit={{opacity:0,x:-40,scale:0.95}}
              transition={{duration:0.4,ease:"easeInOut"}}
            >

              <h2 className="text-2xl font-semibold mb-6 text-center">

                {mode === "login"
                  ? "Entrar na sua conta"
                  : "Criar nova conta"
                }

              </h2>

              <div className="space-y-4">

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {error && (

                  <p className="text-red-400 text-sm">
                    {error}
                  </p>

                )}

                <button
                  onClick={handleAuth}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition shadow-lg font-semibold"
                >

                  {loading
                    ? "Carregando..."
                    : mode === "login"
                    ? "Entrar"
                    : "Criar Conta"
                  }

                </button>

              </div>

              <div className="text-center mt-6 text-sm text-gray-300">

                {mode === "login" ? (

                  <>
                    Não tem conta?{" "}
                    <button
                      onClick={()=>setMode("signup")}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Criar conta
                    </button>
                  </>

                ) : (

                  <>
                    Já possui conta?{" "}
                    <button
                      onClick={()=>setMode("login")}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Fazer login
                    </button>
                  </>

                )}

              </div>

            </motion.div>

          </AnimatePresence>

        </motion.div>

      </div>

    </main>

  )

}