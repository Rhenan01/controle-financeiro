"use client"

import { useMemo } from "react"
import Chart from "react-apexcharts"
import { useFinanceStore } from "@/store/financeStore"

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

function money(v:number){

  return v.toLocaleString("pt-BR",{
    style:"currency",
    currency:"BRL",
    minimumFractionDigits:2,
    maximumFractionDigits:2
  })

}

export default function BalanceTrend({financialMonths}:Props){

  const transactions = useFinanceStore((s) => s.transactions)
  const selectedYear = useFinanceStore((s) => s.selectedFinancialYear)

  const { months, data } = useMemo(()=>{

    const liquidoPorMes:number[] = []

    financialMonths.forEach(month=>{

      let entradasPagas = 0
      let saidasPagas = 0
      let entradasPrev = 0
      let saidasPrev = 0

      transactions.forEach(t=>{

        if(
          t.date >= month.start &&
          t.date <= month.end
        ){

          if(t.status === "PAGO"){

            if(t.type === "ENTRADA") entradasPagas += t.value
            if(t.type === "SAÍDA") saidasPagas += t.value

          }

          if(t.status === "PREVISTO"){

            if(t.type === "ENTRADA") entradasPrev += t.value
            if(t.type === "SAÍDA") saidasPrev += t.value

          }

        }

      })

      const liquidoMes =
        (entradasPagas - saidasPagas) +
        (entradasPrev - saidasPrev)

      liquidoPorMes.push(liquidoMes)

    })

    return {
      months: financialMonths.map((m) => m.shortLabel),
      data: liquidoPorMes
    }

  },[transactions,financialMonths])



  const options: ApexCharts.ApexOptions = {

    chart:{
      type:"area",
      toolbar:{ show:false },
      zoom:{ enabled:false },
      foreColor:"#64748b"
    },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }) {

        const value = series[seriesIndex][dataPointIndex]

        const label = months[dataPointIndex]

        const positive = value >= 0

        const color = positive ? "#10b981" : "#ef4444"

        const arrow = positive ? "▲" : "▼"

        const signal = positive ? "+" : ""

        return `
          <div style="
            background:rgba(255,255,255,0.96);
            backdrop-filter: blur(8px);
            border:1px solid rgba(226,232,240,0.9);
            border-radius:14px;
            padding:14px 16px;
            box-shadow:0 12px 32px rgba(0,0,0,0.12);
            font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
            min-width:150px;
          ">

            <div style="
              font-size:12px;
              color:#64748b;
              margin-bottom:6px;
              font-weight:600;
              letter-spacing:0.02em;
            ">
              ${label}
            </div>

            <div style="
              display:flex;
              align-items:center;
              gap:6px;
              margin-bottom:4px;
            ">

              <span style="
                width:8px;
                height:8px;
                background:${color};
                border-radius:50%;
                display:inline-block;
              "></span>

              <span style="
                font-size:12px;
                color:#64748b;
              ">
                Resultado
              </span>

            </div>

            <div style="
              font-size:18px;
              font-weight:700;
              color:${color};
              letter-spacing:-0.02em;
            ">
              ${arrow} ${signal}${money(value)}
            </div>

          </div>
        `
      }
    },
    colors:["#2563eb"],

    stroke:{
      curve:"smooth",
      width:3
    },

    markers:{
      size:4,
      colors:["#2563eb"],
      strokeColors:"#fff",
      strokeWidth:2
    },

    fill:{
      type:"gradient",
      gradient:{
        shadeIntensity:1,
        opacityFrom:0.35,
        opacityTo:0.05,
        stops:[0,100]
      }
    },

    xaxis:{
      categories:months,
      axisBorder:{ show:false },
      axisTicks:{ show:false }
    },

    yaxis:{
      labels:{ show:false }
    },

    grid:{
      borderColor:"#e5e7eb",
      strokeDashArray:4
    },

    dataLabels:{
      enabled:true,
      formatter:(val:number)=>money(val),
      offsetY:-8,
      style:{
        fontSize:"11px",
        colors:["#1e3a8a"]
      },
      background:{
        enabled:true,
        foreColor:"#fff",
        borderRadius:6,
        padding:4,
        opacity:0.9
      }
    }

  }

  const series = [
    {
      name:"Líquido do mês",
      data:data
    }
  ]

  return(

    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200">

      <div className="flex justify-between items-center mb-4">

        <h3 className="text-lg font-semibold text-slate-800">
          Evolução do Resultado Mensal
        </h3>

        <span className="text-sm text-slate-400">
          {selectedYear}
        </span>

      </div>

      <Chart
        options={options}
        series={series}
        type="area"
        height={320}
      />

    </div>

  )

}