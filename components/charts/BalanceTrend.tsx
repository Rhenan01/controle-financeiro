"use client"

import { useMemo } from "react"
import Chart from "react-apexcharts"
import { useFinanceStore } from "@/store/financeStore"



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



function money(v:number){

  return v.toLocaleString("pt-BR",{
    style:"currency",
    currency:"BRL",
    minimumFractionDigits:2,
    maximumFractionDigits:2
  })

}



export default function BalanceTrend(){

  const transactions = useFinanceStore((s)=>s.transactions)



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
      months: financialMonths.map(m=>m.label),
      data: liquidoPorMes
    }

  },[transactions])



  const options: ApexCharts.ApexOptions = {

    chart:{
      type:"area",
      toolbar:{ show:false },
      zoom:{ enabled:false },
      foreColor:"#64748b"
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
      labels:{
        show:false,
      }
    },

    grid:{
      borderColor:"#e5e7eb",
      strokeDashArray:4
    },

    dataLabels:{
      enabled:true,

      formatter:function(val:number){
        return money(val)
      },

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

    },

    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }) {

        const value = series[seriesIndex][dataPointIndex]
        const label = w.globals.labels[dataPointIndex]

        return `
          <div style="
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:12px;
            padding:12px 14px;
            box-shadow:0 12px 30px rgba(0,0,0,0.08);
            font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
            min-width:140px;
          ">

            <div style="
              font-size:12px;
              color:#64748b;
              margin-bottom:6px;
              font-weight:500;
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
                background:#2563eb;
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
              font-size:16px;
              font-weight:700;
              color:#0f172a;
            ">
              ${money(value)}
            </div>

          </div>
        `
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
          2026
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