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

export default function Dashboard() {

  const transactions = useFinanceStore((s)=>s.transactions)
  const loadTransactions = useFinanceStore((s)=>s.loadTransactions)

  const [salaryDays,setSalaryDays] = useState<string[]>([])

  const [monthFilter,setMonthFilter] = useState<string>("")
  const selectedYear = useFinanceStore((s) => s.selectedFinancialYear)
  const setSelectedYear = useFinanceStore((s) => s.setSelectedFinancialYear)

  useEffect(()=>{

    async function init(){

      const { data } = await supabase.auth.getUser()
      const user = data.user

      if(!user) return

      await loadTransactions(user.id)

      const { data:days } = await supabase
        .from("salary_days")
        .select("payment_date")
        .order("payment_date")

      if(days){

        const list = days.map(d=>d.payment_date)

        setSalaryDays(list)

      }

    }

    init()

  },[loadTransactions])



  const financialMonths = useMemo(() => {
    if (salaryDays.length < 2) return []

    function parseDate(dateStr: string) {
      const [year, month, day] = dateStr.split("-").map(Number)
      return new Date(year, month - 1, day)
    }

    function toISO(date: Date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    const months: {
      start: string
      end: string
      label: string
      shortLabel: string
      year: number
      month: number
    }[] = []

    for (let i = 0; i < salaryDays.length - 1; i++) {
      const start = salaryDays[i]
      const next = salaryDays[i + 1]

      const startDate = parseDate(start)
      const nextDate = parseDate(next)

      const endDate = new Date(nextDate)
      endDate.setDate(endDate.getDate() - 1)

      const end = toISO(endDate)

      // Conta quantos dias do período caem em cada mês/ano
      const daysPerMonth = new Map<string, number>()
      const cursor = new Date(startDate)

      while (cursor <= endDate) {
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}` // ex: 2026-4
        daysPerMonth.set(key, (daysPerMonth.get(key) ?? 0) + 1)
        cursor.setDate(cursor.getDate() + 1)
      }

      // Em caso de empate, prefere o mês do endDate
      const preferredKey = `${endDate.getFullYear()}-${endDate.getMonth()}`

      let chosenKey = ""
      let maxDays = -1

      for (const [key, count] of daysPerMonth.entries()) {
        if (
          count > maxDays ||
          (count === maxDays && key === preferredKey)
        ) {
          chosenKey = key
          maxDays = count
        }
      }

      const [yearStr, monthIndexStr] = chosenKey.split("-")
      const chosenYear = Number(yearStr)
      const chosenMonthIndex = Number(monthIndexStr)

      const referenceDate = new Date(chosenYear, chosenMonthIndex, 1)

      const shortLabelBase = referenceDate
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "")

      const shortLabel =
        shortLabelBase.charAt(0).toUpperCase() + shortLabelBase.slice(1)

      months.push({
        start,
        end,
        shortLabel,
        label: `${shortLabel}/${chosenYear}`,
        year: chosenYear,
        month: chosenMonthIndex + 1
      })
    }

    return months
  }, [salaryDays])
  const availableYears = useMemo(() => {
  const years = financialMonths.map((m) => m.year)
  return [...new Set(years)].sort((a, b) => a - b)
}, [financialMonths])
const financialMonthsOfYear = useMemo(() => {
  return financialMonths.filter((m) => m.year === selectedYear)
}, [financialMonths, selectedYear])
const financialYearStart = financialMonthsOfYear[0]?.start ?? ""
const financialYearEnd =
  financialMonthsOfYear[financialMonthsOfYear.length - 1]?.end ?? ""


  useEffect(() => {
    if (financialMonthsOfYear.length === 0) {
      setMonthFilter("")
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const current = financialMonthsOfYear.find(
      (m) => today >= m.start && today <= m.end
    )

    setMonthFilter(current?.label ?? financialMonthsOfYear[0].label)
  }, [financialMonthsOfYear])



  const months = financialMonthsOfYear.map((m) => m.label)



const financialRange = useMemo(() => {
  return financialMonthsOfYear.find((m) => m.label === monthFilter)
}, [financialMonthsOfYear, monthFilter])



  const filteredTransactions = useMemo(()=>{

    if(!financialRange) return transactions

    return transactions.filter(t=>

      t.date >= financialRange.start &&
      t.date <= financialRange.end

    )

  },[transactions,financialRange])



  const currentMonthStart = useMemo(()=>{

    if(financialMonths.length === 0) return ""

    const today = new Date().toISOString().slice(0,10)

    const current = financialMonths.find(m=>
      today >= m.start && today <= m.end
    )

    return current?.start ?? financialMonths[0].start

  },[financialMonths])



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
        .filter(
          (t) =>
            t.date >= currentMonthStart &&
            t.date <= financialYearEnd
        )
        .forEach((t) => {

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

  }, [filteredTransactions, transactions, currentMonthStart, financialYearEnd])



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



  if (financialMonthsOfYear.length === 0) {
    return (
      <div className="p-10">
        <div className="mb-4 bg-white/70 backdrop-blur-sm border border-gray-200 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-2">

            </div>

            {availableYears.map((year) => {
              const active = selectedYear === year

              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`min-w-[88px] px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300
                  ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.04]"
                      : "bg-white text-slate-600 border border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:-translate-y-0.5"
                  }`}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-slate-600">
          Não há períodos financeiros cadastrados para este ano.
        </div>
      </div>
    )
  }

if (!financialRange) return null



  return(

    <div className="p-2">

    <div className="mb-4 bg-white/70 backdrop-blur-sm border border-gray-200 p-3 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-2">

        </div>

        {availableYears.map((year) => {
          const active = selectedYear === year

          return (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`min-w-[88px] px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300
              ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.04]"
                  : "bg-white text-slate-600 border border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:-translate-y-0.5"
              }`}
            >
              {year}
            </button>
          )
        })}
      </div>
    </div>

      <div className="mb-2 text-sm text-gray-500">

        📅 <span className="font-medium text-gray-700">

        {formatDate(financialRange.start)} → {formatDate(financialRange.end)}

        </span>

      </div>



      <div className="mb-6 bg-white/60 backdrop-blur-sm border border-gray-200 p-2 rounded-2xl shadow-sm">

        <div className="grid grid-cols-12 gap-2">

          {financialMonthsOfYear.map((month) => {
            const active = monthFilter === month.label

            return (
              <button
                key={month.label}
                onClick={() => setMonthFilter(month.label)}
                className={`py-2 text-sm font-medium rounded-xl transition-all duration-200
                ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-[1.05]"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                {month.shortLabel}
              </button>
            )
          })}

        </div>

      </div>



      <div className="grid grid-cols-3 gap-8">

        <Card title="Saldo do mês" value={money(metrics.saldo)} dynamic={metrics.saldo} />

        <Card title="Líquido do mês" value={money(metrics.liquidoMes)} dynamic={metrics.liquidoMes} />

        <Card title="Líquido acumulado" value={money(metrics.liquidoAcumulado)} dynamic={metrics.liquidoAcumulado} />

      </div>



      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <BalanceTrend financialMonths={financialMonthsOfYear} />

        <CreditCardsStatus financialRange={financialRange} />

      </div>



      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <MonthlyFlow financialMonths={financialMonthsOfYear} />

        <CategoryDonut financialRange={financialRange} />

      </div>



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

      <p className="text-gray-500 text-sm mb-2">{title}</p>

      <h2 className={`text-3xl font-semibold tracking-tight ${color}`}>
        {value}
      </h2>

    </div>

  )

}