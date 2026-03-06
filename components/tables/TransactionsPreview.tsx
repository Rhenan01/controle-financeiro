"use client"

import { useFinanceStore } from "@/store/financeStore"
import { useEffect,useState,useMemo } from "react"
import { supabase } from "@/lib/supabase"

type Props = {
  financialRange:{
    start:string
    end:string
    label:string
  }
}

export default function TransactionsPreview({financialRange}:Props){

  const transactions = useFinanceStore((s)=>s.transactions)
  const selectedCategory = useFinanceStore((s)=>s.selectedCategory)
  const setSelectedCategory = useFinanceStore((s)=>s.setSelectedCategory)

  const [descriptionCategories,setDescriptionCategories] = useState<any[]>([])

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

  const filtered = useMemo(()=>{

    let list = transactions.filter(t=>
      t.date >= financialRange.start &&
      t.date <= financialRange.end
    )

    if(selectedCategory){

      // FILTRO POR CATEGORIA
      list = list.filter(t=>{

        const cat = categoryMap[t.description] ?? "Outros"

        return cat === selectedCategory

      })

      // ORDEM POR VALOR (como já era)
      return list
        .sort((a,b)=>Math.abs(b.value) - Math.abs(a.value))
        .slice(0,10)

    }else{

      // ÚLTIMAS MOVIMENTAÇÕES

      list = list.filter(t=>t.status === "PAGO")

      // ORDEM POR DATA MAIS RECENTE
      return list
        .sort((a,b)=>b.date.localeCompare(a.date))
        .slice(0,10)

    }

  },[transactions,financialRange,selectedCategory,categoryMap])

  function formatDate(date:string){

    const [y,m,d] = date.split("-")
    return `${d}/${m}`

  }

  return(

    <div className="bg-white border border-gray-200 rounded-xl shadow p-5">

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-lg font-semibold text-slate-800">

          {selectedCategory
            ? `Gastos - ${selectedCategory}`
            : "Últimas movimentações"
          }

        </h2>

        {selectedCategory && (

          <button
            onClick={()=>setSelectedCategory(null)}
            className="text-sm text-blue-600 hover:underline"
          >
            voltar
          </button>

        )}

      </div>

      <table className="w-full text-sm">

        <thead className="text-gray-500 border-b">

          <tr>
            <th className="text-left py-2">Data</th>
            <th className="text-left">Descrição</th>
            <th className="text-left">Categoria</th>
            <th className="text-right">Valor</th>
          </tr>

        </thead>

        <tbody>

          {filtered.map((t)=>{

            const category = categoryMap[t.description] ?? "Outros"

            return(

              <tr key={t.id} className="border-b last:border-none">

                <td className="py-2 text-slate-700 font-medium">
                  {formatDate(t.date)}
                </td>

                <td className="text-slate-800 font-medium">
                  {t.description}
                </td>

                <td className="text-gray-500">
                  {category}
                </td>

                <td className={`text-right font-medium ${
                  t.type==="ENTRADA"
                  ? "text-emerald-600"
                  : "text-rose-500"
                }`}>

                  {t.type==="ENTRADA" ? "+" : "-"}
                  R$ {Math.abs(t.value).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}

                </td>

              </tr>

            )

          })}

        </tbody>

      </table>

    </div>

  )

}