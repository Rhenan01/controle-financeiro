"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import { useFinanceStore } from "../../store/financeStore"
import { Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Transaction = {
  id: string
  date: string
  type: "ENTRADA" | "SAÍDA"
  description: string
  value: number
  status: "PAGO" | "PREVISTO"
  payment: string
  card?: string
  installment?: string
}

type Filters = {
  type:string[]
  description:string[]
  value:string[]
  status:string[]
  payment:string[]
  card:string[]
  installment:string[]
}

type Props = {
  transactions: Transaction[]
}

export default function TransactionsTable({ transactions }: Props) {

  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)

  const [selected,setSelected] = useState<string[]>([])
  const [sortDirection,setSortDirection] = useState<"asc" | "desc">("asc")
  const [collapsedDays,setCollapsedDays] = useState<Record<string,boolean>>({})
  const [mounted,setMounted] = useState(false)

  const [cards,setCards] = useState<any[]>([])

  useEffect(()=>{

    async function loadCards(){

      const {data} = await supabase
        .from("cards")
        .select("name,color")

      if(data){
        setCards(data)
      }

    }

    loadCards()

  },[])

  const cardColorMap = useMemo(()=>{

    const map:any = {}

    cards.forEach(c=>{
      map[c.name] = c.color
    })

    return map

  },[cards])

  const [filters,setFilters] = useState<Filters>({
    type:[],
    description:[],
    value:[],
    status:[],
    payment:[],
    card:[],
    installment:[]
  })

  const [openFilter,setOpenFilter] = useState<string | null>(null)
  const [search,setSearch] = useState("")

  useEffect(()=>{
    setMounted(true)
  },[])

  useEffect(()=>{

    const today = new Date().toISOString().slice(0,10)

    const initial:any = {}

    transactions.forEach(t=>{
      initial[t.date] = t.date < today
    })

    setCollapsedDays(initial)

  },[transactions])

  useEffect(()=>{

    function clear(){
      setFilters({
        type:[],
        description:[],
        value:[],
        status:[],
        payment:[],
        card:[],
        installment:[]
      })
    }

    window.addEventListener("clearTableFilters",clear)

    return ()=>window.removeEventListener("clearTableFilters",clear)

  },[])

  useEffect(()=>{

    function close(){
      setOpenFilter(null)
    }

    window.addEventListener("click",close)

    return ()=>window.removeEventListener("click",close)

  },[])

  function toggleDay(date:string){

    setCollapsedDays(prev=>({
      ...prev,
      [date]:!prev[date]
    }))

  }

  const filteredData = useMemo(()=>{

    return transactions.filter(t=>{

      if(filters.type.length && !filters.type.includes(t.type)) return false
      if(filters.description.length && !filters.description.includes(t.description)) return false
      if(filters.status.length && !filters.status.includes(t.status)) return false
      if(filters.payment.length && !filters.payment.includes(t.payment)) return false

      const card = t.card ?? "(vazio)"
      if(filters.card.length && !filters.card.includes(card)) return false

      const inst = t.installment ?? "(vazio)"
      if(filters.installment.length && !filters.installment.includes(inst)) return false

      const value = t.value.toString()
      if(filters.value.length && !filters.value.includes(value)) return false

      return true

    })

  },[transactions,filters])

  const sortedTransactions = useMemo(()=>{

    return [...filteredData].sort((a,b)=>{

      if(sortDirection==="asc") return a.date.localeCompare(b.date)

      return b.date.localeCompare(a.date)

    })

  },[filteredData,sortDirection])

  const groupedByDate = useMemo(()=>{

    const map:Record<string,Transaction[]> = {}

    sortedTransactions.forEach(t=>{
      if(!map[t.date]) map[t.date] = []
      map[t.date].push(t)
    })

    return map

  },[sortedTransactions])

  const transactionsWithBalance = useMemo(()=>{

    let balance = 0

    return sortedTransactions.map(t=>{

      if(t.type==="ENTRADA") balance += t.value
      else balance -= t.value

      return {...t,balance}

    })

  },[sortedTransactions])

  const balanceMap = useMemo(()=>{

    const map:Record<string,number> = {}

    transactionsWithBalance.forEach(t=>{
      map[t.id] = t.balance
    })

    return map

  },[transactionsWithBalance])

  function toggleFilter(key:keyof Filters,value:string){

    setFilters(prev=>{

      const arr = prev[key]

      if(arr.includes(value)){
        return {...prev,[key]:arr.filter(v=>v!==value)}
      }

      return {...prev,[key]:[...arr,value]}

    })

  }

  function toggleSelect(id:string){

    setSelected(prev=>{

      if(prev.includes(id)){
        return prev.filter(i=>i!==id)
      }

      return [...prev,id]

    })

  }

  function toggleSelectAll(){

    if(selected.length===filteredData.length){
      setSelected([])
    }else{
      setSelected(filteredData.map(t=>t.id))
    }

  }

  async function deleteSelected(){

    for(const id of selected){
      await deleteTransaction(id)
    }

    setSelected([])

  }

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

  function weekday(date:string){

    const d = new Date(date)
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"]

    return days[d.getDay()]
  }

  function uniqueValues(key:keyof Filters){

    const values = filteredData.map(t=>{

      if(key==="card") return t.card ?? "(vazio)"
      if(key==="installment") return t.installment ?? "(vazio)"
      if(key==="value") return t.value.toString()

      return (t as any)[key]

    })

    return [...new Set(values)]

  }

  function FilterDropdown({column}:{column:keyof Filters}){

    const values = uniqueValues(column)

    return(

      <div
      onClick={(e)=>e.stopPropagation()}
      className="absolute z-20 bg-white border rounded shadow-lg p-2 text-xs w-56 max-h-64 overflow-auto">

        {column==="description" && (

          <input
            className="w-full border p-1 mb-2 text-xs"
            placeholder="Buscar..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />

        )}

        {values
        .filter(v=>{
          if(column!=="description") return true
          return v.toLowerCase().includes(search.toLowerCase())
        })
        .map(v=>(

          <label key={v} className="flex gap-2">

            <input
              type="checkbox"
              checked={filters[column].includes(v)}
              onChange={()=>toggleFilter(column,v)}
            />

            {v}

          </label>

        ))}

      </div>

    )

  }

  return (

    <div className="bg-white border border-slate-200 rounded-xl overflow-visible">

      {selected.length>0 &&(

        <div className="flex justify-between items-center p-3 bg-blue-50 border-b">

          <span className="text-sm text-blue-700 font-medium">
            {selected.length} selecionados
          </span>

          <button
            onClick={deleteSelected}
            className="text-sm text-red-600 hover:underline"
          >
            Excluir selecionados
          </button>

        </div>

      )}

      <table className="w-full text-sm">

        <thead className="bg-slate-50 text-slate-700 border-b">

          <tr>

            <th className="p-3 text-center w-[40px]">

              <input
                type="checkbox"
                checked={selected.length===filteredData.length && filteredData.length>0}
                onChange={toggleSelectAll}
              />

            </th>

            <th
              className="p-3 text-left font-semibold cursor-pointer"
              onClick={()=>setSortDirection(sortDirection==="asc"?"desc":"asc")}
            >
              Data {sortDirection==="asc"?"↑":"↓"}
            </th>

            {[
              ["type","Tipo"],
              ["description","Descrição"],
              ["value","Valor"],
              ["status","Status"],
              ["payment","Pagamento"],
              ["card","Cartão"],
              ["installment","Parcela"]
            ].map(([key,label])=>(

              <th key={key} className="p-3 text-center font-semibold relative">

                <div className="inline-flex items-center gap-1">

                  {label}

                  <button
                    onClick={(e)=>{
                      e.stopPropagation()
                      setOpenFilter(openFilter===key?null:key)
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ▾
                  </button>

                </div>

                {openFilter===key && <FilterDropdown column={key as keyof Filters}/>}

              </th>

            ))}

            <th className="p-3 text-center font-semibold">Saldo</th>
            <th className="p-3 text-center font-semibold">Ações</th>

          </tr>

        </thead>

        <tbody className="text-slate-800">

          {Object.entries(groupedByDate).map(([date,list])=>{

            const collapsed = collapsedDays[date]
            const dayBalance = balanceMap[list[list.length-1].id]

            return(

              <Fragment key={date}>

                <tr className="bg-slate-50">

                  <td></td>

                  <td colSpan={10} className="px-2 py-2 text-sm">

                    <span
                      onClick={()=>toggleDay(date)}
                      className="cursor-pointer mr-2 text-slate-600"
                    >
                      {collapsed?"▸":"▾"}
                    </span>

                    <span className="font-semibold text-slate-700">
                      {formatDate(date)} ({weekday(date)})
                    </span>

                    <span className="ml-3 text-slate-500">
                      saldo do dia: {money(dayBalance ?? 0)}
                    </span>

                  </td>

                </tr>

                {!collapsed && list.map(t=>(

                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">

                    <td className="p-3 text-center">

                      <input
                        type="checkbox"
                        checked={selected.includes(t.id)}
                        onChange={()=>toggleSelect(t.id)}
                      />

                    </td>

                    <td></td>

                    <td
                      className={`p-3 text-center font-semibold ${
                        t.type === "ENTRADA" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type}
                    </td>

                    <td className="p-3 text-center">
                      {t.description}
                    </td>

                    <td className="p-3 text-center">
                      {money(t.value)}
                    </td>

                    <td className="p-3 text-center">
                      {t.status}
                    </td>

                    <td className="p-3 text-center">
                      {t.payment}
                    </td>

                    <td
                      className="p-3 text-center font-medium"
                      style={{color: t.card ? cardColorMap[t.card] ?? "#334155" : "#334155"}}
                    >
                      {t.card ?? "-"}
                    </td>

                    <td className="p-3 text-center">
                      {t.installment ?? "-"}
                    </td>

                    <td className="p-3 text-center font-semibold">
                      {money(balanceMap[t.id])}
                    </td>

                    <td className="p-3 text-center">

                      <div className="flex justify-center gap-3">

                        <button
                          onClick={()=>window.dispatchEvent(
                            new CustomEvent("openEditTransaction",{detail:t})
                          )}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={16}/>
                        </button>

                        <button
                          onClick={()=>deleteTransaction(t.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16}/>
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </Fragment>

            )

          })}

        </tbody>

      </table>

    </div>

  )

}