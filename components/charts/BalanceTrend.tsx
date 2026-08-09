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

function money(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export default function BalanceTrend({ financialMonths }: Props) {
  const transactions = useFinanceStore((s) => s.transactions)
  const selectedYear = useFinanceStore((s) => s.selectedFinancialYear)

  const { months, data } = useMemo(() => {
    const liquidoPorMes: number[] = []

    financialMonths.forEach((month) => {
      let entradasPagas = 0
      let saidasPagas = 0
      let entradasPrev = 0
      let saidasPrev = 0

      transactions.forEach((t) => {
        if (t.date >= month.start && t.date <= month.end) {
          if (t.status === "PAGO") {
            if (t.type === "ENTRADA") entradasPagas += t.value
            if (t.type === "SAÍDA") saidasPagas += t.value
          }

          if (t.status === "PREVISTO") {
            if (t.type === "ENTRADA") entradasPrev += t.value
            if (t.type === "SAÍDA") saidasPrev += t.value
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
  }, [transactions, financialMonths])

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: "#64748b",
      parentHeightOffset: 0,
      animations: {
        enabled: true,
        speed: 500
      }
    },

    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex }) {
        const value = series[seriesIndex][dataPointIndex]
        const label = months[dataPointIndex]

        const positive = value >= 0
        const color = positive ? "#10b981" : "#ef4444"
        const arrow = positive ? "▲" : "▼"
        const signal = positive ? "+" : ""

        return `
          <div style="
            background:rgba(255,255,255,0.97);
            backdrop-filter:blur(10px);
            border:1px solid rgba(226,232,240,0.9);
            border-radius:12px;
            padding:12px 14px;
            box-shadow:0 12px 30px rgba(15,23,42,0.12);
            font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
            min-width:145px;
          ">
            <div style="
              font-size:12px;
              color:#64748b;
              margin-bottom:6px;
              font-weight:600;
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
                width:7px;
                height:7px;
                background:${color};
                border-radius:50%;
                display:inline-block;
              "></span>

              <span style="
                font-size:11px;
                color:#64748b;
              ">
                Resultado
              </span>
            </div>

            <div style="
              font-size:17px;
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

    colors: ["#2563eb"],

    stroke: {
      curve: "smooth",
      width: 3
    },

    markers: {
      size: 4,
      colors: ["#2563eb"],
      strokeColors: "#ffffff",
      strokeWidth: 2,
      hover: {
        size: 6
      }
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.03,
        stops: [0, 100]
      }
    },

    xaxis: {
      categories: months,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: "11px",
          colors: "#64748b"
        }
      }
    },

    yaxis: {
      labels: { show: false }
    },

    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
      padding: {
        top: 18,
        right: 8,
        bottom: 0,
        left: 8
      }
    },

    dataLabels: {
      enabled: true,
      formatter: (val: number) => money(val),
      offsetY: -8,
      style: {
        fontSize: "10px",
        fontWeight: 600,
        colors: ["#1e3a8a"]
      },
      background: {
        enabled: true,
        foreColor: "#ffffff",
        borderRadius: 5,
        padding: 3,
        opacity: 0.92,
        borderWidth: 0
      }
    }
  }

  const series = [
    {
      name: "Líquido do mês",
      data
    }
  ]

  return (
    <div
      className="
        h-full
        min-w-0
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white/90
        p-5
        shadow-sm
        backdrop-blur-sm
      "
    >
      <div
        className="
          mb-3
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <h3 className="text-lg font-semibold text-slate-800">
          Evolução do Resultado Mensal
        </h3>

        <span
          className="
            flex-shrink-0
            rounded-full
            bg-slate-100
            px-2.5
            py-1
            text-xs
            font-medium
            text-slate-500
          "
        >
          {selectedYear}
        </span>
      </div>

      <Chart
        options={options}
        series={series}
        type="area"
        height={335}
      />
    </div>
  )
}