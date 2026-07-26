"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useFinanceStore } from "@/store/financeStore"

import TransactionsTable from "../../../components/tables/TransactionsTable"
import NewTransactionModal from "../../../components/modals/NewTransactionModal"

export default function Lancamentos() {

  const [openModal, setOpenModal] = useState(false)
  const [monthFilter, setMonthFilter] = useState("current")
  const [salaryDays,setSalaryDays] = useState<string[]>([])

  const transactions = useFinanceStore((s) => s.transactions)
  const loadTransactions = useFinanceStore((s) => s.loadTransactions)

  useEffect(() => {

    async function init() {

      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) return

      await loadTransactions(user.id)

      const { data: salaryData } = await supabase
        .from("salary_days")
        .select("payment_date")
        .order("payment_date")

      if (salaryData) {
        setSalaryDays(salaryData.map(d => d.payment_date))
      }

    }

    init()

  }, [loadTransactions])


  useEffect(() => {

    function handleEdit() {
      setOpenModal(true)
    }

    window.addEventListener("openEditTransaction", handleEdit)

    return () => {
      window.removeEventListener("openEditTransaction", handleEdit)
    }

  }, [])


  function clearFilters() {
    window.dispatchEvent(new Event("clearTableFilters"))
  }


  function subtractOneDay(date:string){

    const d = new Date(date)
    d.setDate(d.getDate()-1)

    return d.toISOString().slice(0,10)

  }


  const financialMonths = useMemo(()=>{

    if(salaryDays.length < 2) return []

    const months:any[] = []

    for(let i=0;i<salaryDays.length-1;i++){

      const start = salaryDays[i]
      const nextPayment = salaryDays[i+1]

      const end = subtractOneDay(nextPayment)

      const startDate = new Date(start)
      const endDate = new Date(end)

      // pega o meio do período
      const middleTime = (startDate.getTime() + endDate.getTime()) / 2
      const date = new Date(middleTime)

      const label = date.toLocaleDateString("pt-BR",{
        month:"short",
        year:"numeric"
      })

      months.push({
        start,
        end,
        label: label.charAt(0).toUpperCase()+label.slice(1)
      })

    }

    return months

  },[salaryDays])

  
  const financialRange = useMemo(() => {

    if (monthFilter === "all") return null

    if (monthFilter === "current") {

      const today = new Date().toISOString().slice(0,10)

      const current = financialMonths.find(m =>
        today >= m.start && today <= m.end
      )

      return current ?? financialMonths[0]

    }

    const month = financialMonths.find(m => m.label === monthFilter)

    return month ?? null

  }, [monthFilter,financialMonths])


  const filteredTransactions = useMemo(() => {

    if (!financialRange) return transactions

    return transactions.filter((t) =>
      t.date >= financialRange.start &&
      t.date <= financialRange.end
    )

  }, [transactions, financialRange])


  const currentMonthStart = useMemo(() => {

    const today = new Date().toISOString().slice(0,10)

    const current = financialMonths.find(m =>
      today >= m.start && today <= m.end
    )

    return current?.start ?? financialMonths[0]?.start

  }, [financialMonths])


  const metrics = useMemo(() => {

    let entradas = 0
    let saidas = 0

    let entradasPagas = 0
    let saidasPagas = 0

    let entradasPrev = 0
    let saidasPrev = 0

    filteredTransactions.forEach((t) => {

      if (t.type === "ENTRADA") entradas += t.value
      if (t.type === "SAÍDA") saidas += t.value

      if (t.status === "PAGO") {

        if (t.type === "ENTRADA") entradasPagas += t.value
        if (t.type === "SAÍDA") saidasPagas += t.value

      }

      if (t.status === "PREVISTO") {

        if (t.type === "ENTRADA") entradasPrev += t.value
        if (t.type === "SAÍDA") saidasPrev += t.value

      }

    })


    let entradasLiquido = 0
    let saidasLiquido = 0

    if (monthFilter === "all") {

      const today = new Date().toISOString().slice(0,10)

      const current = financialMonths.find(m =>
        today >= m.start && today <= m.end
      )

      const start = current?.start

      transactions
        .filter(t => start ? t.date >= start : true)
        .forEach((t) => {

          if (t.type === "ENTRADA") entradasLiquido += t.value
          if (t.type === "SAÍDA") saidasLiquido += t.value

        })

    }
    else if (financialRange) {

      transactions
        .filter(t =>
          t.date >= financialRange.start &&
          t.date <= financialRange.end
        )
        .forEach((t) => {

          if (t.type === "ENTRADA") entradasLiquido += t.value
          if (t.type === "SAÍDA") saidasLiquido += t.value

        })

    }

    const saldo = entradasPagas - saidasPagas
    const previsto = entradasPrev - saidasPrev

    const liquido = entradasLiquido - saidasLiquido

    return {
      entradas,
      saidas,
      saldo,
      previsto,
      liquido
    }

    }, [filteredTransactions, transactions, financialRange, monthFilter, financialMonths])

  const rangeLabel = useMemo(()=>{

    if(monthFilter === "all"){

      if(financialMonths.length === 0) return ""

      const first = financialMonths[0].start
      const last = financialMonths[financialMonths.length-1].end

      return `${formatDate(first)} → ${formatDate(last)}`
    }

    if(!financialRange) return ""

    return `${formatDate(financialRange.start)} → ${formatDate(financialRange.end)}`

  },[financialRange,financialMonths,monthFilter])


  function money(v: number) {

    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })

  }

  function formatDate(date: string) {

    const [y,m,d] = date.split("-")
    return `${d}/${m}/${y}`

  }


  return (

    <div className="mx-auto w-full min-w-0 max-w-[1400px] p-3 sm:p-5 lg:p-5 xl:p-8">

      <h1 className="mb-4 text-2xl font-semibold text-slate-800 sm:mb-6 sm:text-3xl">
        Lançamentos
      </h1>


      <div className="mb-3 flex flex-col gap-3 sm:mb-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 sm:w-auto"
          >

            <option value="all">Todos</option>
            <option value="current">Mês atual</option>

            {financialMonths.map((m) => (

              <option key={m.label} value={m.label}>
                {m.label}
              </option>

            ))}

          </select>


          <button
            onClick={clearFilters}
            className="
              w-full rounded-lg border border-slate-300
              bg-white px-4 py-2 text-sm text-slate-700
              shadow-sm transition
              hover:border-slate-400 hover:bg-slate-100
              active:scale-[0.97] active:shadow-inner
              sm:w-auto
            "
          >
            Limpar filtros
          </button>


          {rangeLabel && (

            <span className="w-full break-words text-xs font-medium text-slate-500 sm:w-auto sm:text-sm">
              {rangeLabel}
            </span>

          )}

        </div>


        <button
          onClick={() => setOpenModal(true)}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
        >
          + Novo lançamento
        </button>

      </div>


      <div className="mb-4 py-0 lg:sticky lg:top-0 lg:z-30 lg:py-2">

        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">

          <Card title="Entradas" value={money(metrics.entradas)} positive />
          <Card title="Saídas" value={money(metrics.saidas)} negative />
          <Card title="Saldo atual" value={money(metrics.saldo)} dynamic={metrics.saldo} />
          <Card title="Previsto" value={money(metrics.previsto)} dynamic={metrics.previsto} />
          <Card title="Líquido do mês" value={money(metrics.liquido)} dynamic={metrics.liquido} />

        </div>

      </div>


      <TransactionsTable transactions={filteredTransactions} />


      <NewTransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        financialMonths={financialMonths}
      />

    </div>

  )

}


function Card({ title, value, positive, negative, dynamic }: any) {
  let color = "text-slate-800"

  if (positive) color = "text-green-600"
  if (negative) color = "text-red-600"

  if (dynamic !== undefined) {
    if (dynamic >= 0) color = "text-green-600"
    if (dynamic < 0) color = "text-red-600"
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-xs text-slate-500 sm:text-sm">
        {title}
      </p>

      <p
        className={`mt-1 whitespace-nowrap font-semibold leading-tight tabular-nums text-lg sm:text-xl lg:text-base xl:text-xl ${color}`}
      >
        {value}
      </p>
    </div>
  )
}