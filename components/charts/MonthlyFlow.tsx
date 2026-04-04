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

type FinancialMonth = {
  start: string
  end: string
  label: string
  shortLabel: string
  year: number
  month: number
}

type Props = {
  financialMonths: FinancialMonth[]
}

export default function MonthlyFlow({ financialMonths }: Props) {

  const selectedYear = useFinanceStore((s) => s.selectedFinancialYear)
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
        mes: month.shortLabel,
        entrada,
        saida
      }

    })

  }, [transactions, financialMonths])



  return (

    <div className="bg-white rounded-2xl shadow-md p-6 h-[340px]">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-lg font-semibold text-slate-800">
          Entradas vs Saídas
        </h2>

        <div className="text-sm text-slate-400">
          {selectedYear}
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