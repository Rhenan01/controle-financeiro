"use client"

import { useMemo } from "react"
import { useFinanceStore } from "@/store/financeStore"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts"



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



function moneyAxis(value: number | string | undefined) {

  const v = Number(value ?? 0)

  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  })

}



function moneyTooltip(value: number | string | undefined) {

  const v = Number(value ?? 0)

  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

}



export default function MonthlyFlow() {

  const transactions = useFinanceStore((s) => s.transactions)



  const data = useMemo(() => {

    return financialMonths.map(month => {

      let entrada = 0
      let saida = 0

      transactions.forEach(t => {

        if (
          t.date >= month.start &&
          t.date <= month.end
        ) {

          if (t.type === "ENTRADA") entrada += t.value
          if (t.type === "SAÍDA") saida += t.value

        }

      })

      return {
        mes: month.label,
        entrada,
        saida
      }

    })

  }, [transactions])



  return (

    <div className="bg-white rounded-2xl shadow-md p-6 h-[340px]">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-lg font-semibold text-slate-800">
          Entradas vs Saídas
        </h2>

        <div className="text-sm text-slate-400">
          2026
        </div>

      </div>



      <ResponsiveContainer width="100%" height="90%">

        <BarChart data={data} barGap={4}>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />

          <XAxis
            dataKey="mes"
            tick={{ fill: "#64748b", fontSize: 12 }}
          />

          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => moneyAxis(value)}
          />

          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
            formatter={(value: number | string | undefined) => moneyTooltip(value)}
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
            }}
            labelStyle={{
              color: "#1e293b",
              fontWeight: "600"
            }}
          />

          <Legend />

          <Bar
            dataKey="entrada"
            name="Entradas"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
          />

          <Bar
            dataKey="saida"
            name="Saídas"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  )

}