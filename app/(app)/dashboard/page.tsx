"use client"

import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useFinanceStore } from "@/store/financeStore"

import MonthlyFlow from "../../../components/charts/MonthlyFlow"
import dynamic from "next/dynamic"
import CreditCardsStatus from "../../../components/cards/CreditCardsStatus"
import TransactionsPreview from "@/components/tables/TransactionsPreview"

const CategoryDonut = dynamic(
  () => import("../../../components/charts/CategoryDonut"),
  { ssr: false }
)

const BalanceTrend = dynamic(
  () => import("../../../components/charts/BalanceTrend"),
  { ssr: false }
)

const financialMonths = [

{ start: "2025-12-30", end: "2026-01-29", label: "Jan" },
{ start: "2026-01-30", end: "2026-02-26", label: "Fev" },
{ start: "2026-02-27", end: "2026-03-29", label: "Mar" },
{ start: "2026-03-30", end: "2026-04-29", label: "Abr" },
{ start: "2026-04-30", end: "2026-05-28", label: "Mai" },
{ start: "2026-05-29", end: "2026-06-29", label: "Jun" },
{ start: "2026-06-30", end: "2026-07-29", label: "Jul" },
{ start: "2026-07-30", end: "2026-08-27", label: "Ago" },
{ start: "2026-08-28", end: "2026-09-29", label: "Set" },
{ start: "2026-09-30", end: "2026-10-29", label: "Out" },
{ start: "2026-10-30", end: "2026-11-29", label: "Nov" },
{ start: "2026-11-30", end: "2026-12-29", label: "Dez" }

]

export default function Dashboard() {

  const transactions = useFinanceStore((s) => s.transactions)
  const loadTransactions = useFinanceStore((s) => s.loadTransactions)

  const months = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez"
  ]

  function getCurrentMonthLabel(){

    const today = new Date().toISOString().slice(0,10)

    const current = financialMonths.find(m =>
      today >= m.start && today <= m.end
    )

    return current?.label ?? "Jan"
  }

  const [monthFilter, setMonthFilter] = useState(getCurrentMonthLabel())

  useEffect(() => {

    async function init(){

      const { data } = await supabase.auth.getUser()
      const user = data.user

      if(!user){
        return
      }

      await loadTransactions(user.id)

    }

    init()

  },[loadTransactions])

  const financialRange = useMemo(()=>{

    return financialMonths.find(m => m.label === monthFilter)!

  },[monthFilter])

  const filteredTransactions = useMemo(()=>{

    if(!financialRange) return transactions

    return transactions.filter(t =>
      t.date >= financialRange.start &&
      t.date <= financialRange.end
    )

  },[transactions,financialRange])

  const currentMonthStart = useMemo(()=>{

    const today = new Date().toISOString().slice(0,10)

    const current = financialMonths.find(m =>
      today >= m.start && today <= m.end
    )

    return current?.start ?? financialMonths[0].start

  },[])

  const metrics = useMemo(()=>{

    let entradasPagas = 0
    let saidasPagas = 0

    let entradasPrev = 0
    let saidasPrev = 0

    filteredTransactions.forEach(t=>{

      if(t.status === "PAGO"){

        if(t.type === "ENTRADA") entradasPagas += t.value
        if(t.type === "SAÍDA") saidasPagas += t.value

      }

      if(t.status === "PREVISTO"){

        if(t.type === "ENTRADA") entradasPrev += t.value
        if(t.type === "SAÍDA") saidasPrev += t.value

      }

    })

    let entradasPagasLiquido = 0
    let saidasPagasLiquido = 0
    let entradasPrevLiquido = 0
    let saidasPrevLiquido = 0

    transactions
      .filter(t => t.date >= currentMonthStart)
      .forEach(t=>{

        if(t.status === "PAGO"){

          if(t.type === "ENTRADA") entradasPagasLiquido += t.value
          if(t.type === "SAÍDA") saidasPagasLiquido += t.value

        }

        if(t.status === "PREVISTO"){

          if(t.type === "ENTRADA") entradasPrevLiquido += t.value
          if(t.type === "SAÍDA") saidasPrevLiquido += t.value

        }

      })

    const saldo = entradasPagas - saidasPagas

    const liquidoMes =
      (entradasPagas - saidasPagas) +
      (entradasPrev - saidasPrev)

    const liquidoAcumulado =
      (entradasPagasLiquido - saidasPagasLiquido) +
      (entradasPrevLiquido - saidasPrevLiquido)

    return{
      saldo,
      liquidoMes,
      liquidoAcumulado
    }

  },[filteredTransactions,transactions,currentMonthStart])

  function money(v:number){

    return v.toLocaleString("pt-BR",{
      style:"currency",
      currency:"BRL"
    })

  }
  function formatDate(date:string){

    const [y,m,d] = date.split("-")

    return `${d}/${m}/${y}`

  }

  return(

    <div className="p-10">

      {/* seletor de meses */}
      <div className="mb-2 text-sm text-gray-500">
        📅 <span className="font-medium text-gray-700">
        {formatDate(financialRange.start)} → {formatDate(financialRange.end)}
        </span>
      </div>
      <div className="mb-6 bg-white/60 backdrop-blur-sm border border-gray-200 p-2 rounded-2xl shadow-sm">

        <div className="grid grid-cols-12 gap-2">

          {months.map(month=>{

            const active = monthFilter === month

            return(

              <button
                key={month}
                onClick={()=>setMonthFilter(month)}
                className={`py-2 text-sm font-medium rounded-xl transition-all duration-200
                ${
                  active
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-[1.05]"
                  : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                {month}
              </button>

            )

          })}

        </div>

      </div>

      {/* cards */}

      <div className="grid grid-cols-3 gap-8">

        <Card
          title="Saldo do mês"
          value={money(metrics.saldo)}
          dynamic={metrics.saldo}
        />

        <Card
          title="Líquido do mês"
          value={money(metrics.liquidoMes)}
          dynamic={metrics.liquidoMes}
        />

        <Card
          title="Líquido acumulado"
          value={money(metrics.liquidoAcumulado)}
          dynamic={metrics.liquidoAcumulado}
        />

      </div>

      {/* PRINCIPAL — evolução + cartões */}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <BalanceTrend />

        <CreditCardsStatus financialRange={financialRange} />

      </div>

      {/* ANALÍTICO */}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <MonthlyFlow />

        <CategoryDonut financialRange={financialRange} />

      </div>

      {/* transações */}

      <div className="mt-6">

        <TransactionsPreview financialRange={financialRange} />

      </div>

    </div>

  )

}

function Card({title,value,dynamic}:any){

  let color = "text-slate-800"

  if(dynamic >= 0) color = "text-emerald-600"
  if(dynamic < 0) color = "text-rose-500"

  return(

    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">

      <p className="text-gray-500 text-sm mb-2">
        {title}
      </p>

      <h2 className={`text-3xl font-semibold tracking-tight ${color}`}>
        {value}
      </h2>

    </div>

  )

}