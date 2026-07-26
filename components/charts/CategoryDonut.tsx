"use client"

import { useMemo,useState,useEffect } from "react"
import { useFinanceStore } from "@/store/financeStore"
import { supabase } from "@/lib/supabase"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts"

type Props = {
  financialRange:{
    start:string
    end:string
    label:string
  }
}

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#14b8a6",
  "#e11d48",
  "#84cc16",
  "#f97316"
]

function money(v:number){

  return v.toLocaleString("pt-BR",{
    style:"currency",
    currency:"BRL",
    minimumFractionDigits:2
  })

}

export default function CategoryDonut({financialRange}:Props){

  const transactions = useFinanceStore((s)=>s.transactions)
  const setSelectedCategory = useFinanceStore((s)=>s.setSelectedCategory)

  const [mounted,setMounted] = useState(false)

  const [descriptionCategories,setDescriptionCategories] = useState<any[]>([])

  useEffect(()=>{
    setMounted(true)
  },[])

  useEffect(()=>{

    async function load(){

      const {data} = await supabase
        .from("description_categories")
        .select("*")

      if(data){
        setDescriptionCategories(data)
      }

    }

    load()

  },[])

  const categoryMap = useMemo(()=>{

    const map:any = {}

    descriptionCategories.forEach(c=>{
      map[c.description] = c.category
    })

    return map

  },[descriptionCategories])

  const {data,total,entradas} = useMemo(()=>{

    const filtered = transactions.filter(t=>
      t.date >= financialRange.start &&
      t.date <= financialRange.end
    )

    let entradas = 0

    const categories:any = {}

    filtered.forEach(t=>{

      if(t.type==="ENTRADA" && t.payment !== "AJUSTE"){
        entradas += t.value
      }

      if(t.type==="SAÍDA" && t.payment !== "AJUSTE"){

        const category = categoryMap[t.description] ?? "Outros"

        if(!categories[category]) categories[category] = 0

        categories[category] += t.value

      }

    })

    const data = Object.entries(categories)
      .map(([name,value])=>({name,value}))
      .sort((a:any,b:any)=>b.value-a.value)

    const total = data.reduce((acc:any,i:any)=>acc+i.value,0)

    return {data,total,entradas}

  },[transactions,financialRange,categoryMap])

  const percentOfIncome = entradas
    ? ((total/entradas)*100).toFixed(2)
    : "0.00"

  if(!mounted){
    return null
  }

  return(

    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-md sm:p-6">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">

        <h2 className="text-lg font-semibold text-slate-800">
          Gastos por Categoria
        </h2>

        <div className="text-sm text-slate-400">
          {financialRange.label}
        </div>

      </div>

      <div className="grid min-w-0 grid-cols-1 items-center gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">

        <div className="relative mx-auto h-[220px] w-[220px] sm:h-[240px] sm:w-[240px]">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={100}
                paddingAngle={3}
                cx="50%"
                cy="50%"
                onClick={(d:any)=>setSelectedCategory(d.name)}
              >

                {data.map((entry,index)=>(
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}

              </Pie>

              <Tooltip
                formatter={(value:any,name:any)=>{

                  const percent = ((value/total)*100).toFixed(2)

                  return [
                    `${money(value)} (${percent}%)`,
                    name
                  ]

                }}
                wrapperStyle={{ zIndex: 1000 }}
                contentStyle={{
                  backgroundColor:"#fff",
                  border:"1px solid #e5e7eb",
                  borderRadius:"10px",
                  boxShadow:"0 8px 20px rgba(0,0,0,0.08)"
                }}
              />

            </PieChart>

          </ResponsiveContainer>

          {/* TEXTO CENTRAL */}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">

            <div className="text-3xl font-semibold text-slate-800">
              {percentOfIncome}%
            </div>

            <div className="text-sm text-slate-400">
              das entradas
            </div>

          </div>

        </div>

        {/* LEGENDA */}

        <div className="grid min-w-0 grid-cols-2 gap-2 sm:max-h-[240px] sm:grid-cols-1 sm:overflow-y-auto sm:pr-1">

          {data.map((item:any,index)=>{

            const percent = ((item.value/total)*100).toFixed(2)

            return(

              <div
                key={index}
                onClick={()=>setSelectedCategory(item.name)}
                className="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-xs hover:bg-slate-50 sm:text-sm"
              >

                <div className="flex min-w-0 items-center gap-2">

                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{backgroundColor:COLORS[index % COLORS.length]}}
                  />

                  <span className="truncate text-slate-700">
                    {item.name}
                  </span>

                </div>

                <span className="shrink-0 text-xs text-slate-500">
                  {percent}%
                </span>

              </div>

            )

          })}

        </div>

      </div>

    </div>

  )

}