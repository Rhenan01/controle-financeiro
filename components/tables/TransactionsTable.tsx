"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import { useFinanceStore } from "../../store/financeStore"
import { 
  Pencil, 
  Trash2, 
  X, 
  CalendarDays, 
  BadgeCheck, 
  ListChecks,
  Clock,
  AlertTriangle,
  Link2,
  ShieldAlert
} from "lucide-react"
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
  related_transaction_id?: string | null
  related_transaction_role?: "PRINCIPAL" | "ESTORNO_REEMBOLSO" | null
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
  const [bulkDate, setBulkDate] = useState("")
  const [bulkStatus, setBulkStatus] = useState<"PAGO" | "PREVISTO" | "">("")
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [bulkValue, setBulkValue] = useState("")

  const [cards,setCards] = useState<any[]>([])
  const loadTransactions = useFinanceStore((s) => s.loadTransactions)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleteAlsoRelated, setDeleteAlsoRelated] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  function getLinkedTransaction(transaction: Transaction) {
    if (transaction.related_transaction_id) {
      return transactions.find((t) => t.id === transaction.related_transaction_id) || null
    }

    return transactions.find((t) => t.related_transaction_id === transaction.id) || null
  }
  async function getUserId() {

    const { data } = await supabase.auth.getUser()

    return data.user?.id

  }
  async function toggleStatus(transaction: Transaction) {

    const newStatus =
      transaction.status === "PAGO"
        ? "PREVISTO"
        : "PAGO"

    const { error } = await supabase
      .from("transactions")
      .update({ status: newStatus })
      .eq("id", transaction.id)

    if (!error) {

      const userId = await getUserId()

      if (userId) {
        await loadTransactions(userId)
      }

    }

  }
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
  const relatedInfoMap = useMemo(() => {
    const map: Record<string, string> = {}

    transactions.forEach((t) => {
      let related: Transaction | undefined

      if (t.related_transaction_id) {
        related = transactions.find((r) => r.id === t.related_transaction_id)
      } else {
        related = transactions.find((r) => r.related_transaction_id === t.id)
      }

      if (!related) return

      const dataFormatada = formatDate(related.date)
      const valorFormatado = money(related.value)
      const cartaoTexto = related.card ? ` • Cartão: ${related.card}` : ""

      map[t.id] = `${related.description} • ${valorFormatado} • ${dataFormatada}${cartaoTexto}`
    })

    return map
  }, [transactions])
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
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((arr) => arr.length > 0)
  }, [filters])
  useEffect(()=>{
    setMounted(true)
  },[])
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
useEffect(() => {
  const today = new Date().toISOString().slice(0, 10)

  setCollapsedDays((prev: Record<string, boolean>) => {
    const updated: Record<string, boolean> = { ...prev }

    const dateSet: Set<string> = new Set(
      filteredData.map((t: Transaction) => t.date)
    )

    const dates: string[] = Array.from(dateSet)

    dates.forEach((date: string) => {
      if (hasActiveFilters) {
        updated[date] = false
      } else if (updated[date] === undefined) {
        updated[date] = date < today
      }
    })

    return updated
  })
}, [filteredData, hasActiveFilters])

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
      setSearch("")
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

const selectedTotal = useMemo(()=>{

    return transactions
      .filter(t => selected.includes(t.id))
      .reduce((sum,t)=>sum + t.value,0)

  },[selected,transactions])

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
  function clearSelection() {
    setSelected([])
    setBulkDate("")
    setBulkStatus("")
  }
  function askDeleteTransaction(transaction: Transaction) {
    const linked = getLinkedTransaction(transaction)

    if (linked) {
      setDeleteTarget(transaction)
      setDeleteAlsoRelated(true)
      setDeleteModalOpen(true)
      return
    }

    deleteWithChoice(transaction, false)
  }
  async function confirmDeleteTransaction() {
    if (!deleteTarget || isDeleting) return

    setIsDeleting(true)

    try {
      await deleteWithChoice(deleteTarget, deleteAlsoRelated)
      setDeleteModalOpen(false)
      setDeleteTarget(null)
      setDeleteAlsoRelated(true)
    } finally {
      setIsDeleting(false)
    }
  }
  async function deleteWithChoice(transaction: Transaction, deleteLinked: boolean) {
    const linked = getLinkedTransaction(transaction)

    const idsToDelete = deleteLinked && linked
      ? [transaction.id, linked.id]
      : [transaction.id]

    for (const id of idsToDelete) {
      await deleteTransaction(id)
    }

    if (!deleteLinked && linked) {
      if (transaction.related_transaction_role === "PRINCIPAL") {
        await supabase
          .from("transactions")
          .update({
            related_transaction_id: null,
            related_transaction_role: null
          })
          .eq("id", transaction.id)

        await supabase
          .from("transactions")
          .update({
            related_transaction_id: null,
            related_transaction_role: null
          })
          .eq("id", linked.id)
      } else if (transaction.related_transaction_role === "ESTORNO_REEMBOLSO") {
        await supabase
          .from("transactions")
          .update({
            related_transaction_id: null,
            related_transaction_role: null
          })
          .eq("id", linked.id)
      }
    }

    const userId = await getUserId()
    if (userId) {
      await loadTransactions(userId)
    }
  }
  async function deleteSelected() {
    const idsToDelete = new Set<string>()

    transactions.forEach((t) => {
      if (selected.includes(t.id)) {
        idsToDelete.add(t.id)

        if (t.related_transaction_id) {
          idsToDelete.add(t.related_transaction_id)
        }

        const relatedBack = transactions.find(
          (item) => item.related_transaction_id === t.id
        )

        if (relatedBack) {
          idsToDelete.add(relatedBack.id)
        }
      }
    })

    for (const id of idsToDelete) {
      await deleteTransaction(id)
    }

    setSelected([])
  }
async function updateSelectedDate() {
  if (!bulkDate || selected.length === 0 || isBulkUpdating) return

  setIsBulkUpdating(true)

  try {
    const { error } = await supabase
      .from("transactions")
      .update({ date: bulkDate })
      .in("id", selected)

    if (error) {
      console.error("Erro ao atualizar datas:", error)
      alert("Não foi possível atualizar a data dos lançamentos selecionados.")
      return
    }

    const userId = await getUserId()
    if (userId) {
      await loadTransactions(userId)
    }

    setBulkDate("")
  } finally {
    setIsBulkUpdating(false)
  }
}

  async function updateSelectedStatus() {
    if (!bulkStatus || selected.length === 0 || isBulkUpdating) return

    setIsBulkUpdating(true)

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: bulkStatus })
        .in("id", selected)

      if (error) {
        console.error("Erro ao atualizar status:", error)
        alert("Não foi possível atualizar o status dos lançamentos selecionados.")
        return
      }

      const userId = await getUserId()
      if (userId) {
        await loadTransactions(userId)
      }

      setBulkStatus("")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  function money(v:number){

    return v.toLocaleString("pt-BR",{
      style:"currency",
      currency:"BRL"
    })

  }
  async function updateSelectedValue() {
    if (!bulkValue || selected.length === 0 || isBulkUpdating) return

    const numericValue = Number(bulkValue.replace(/\D/g, "")) / 100

    setIsBulkUpdating(true)

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ value: numericValue })
        .in("id", selected)

      if (error) {
        console.error("Erro ao atualizar valores:", error)
        alert("Não foi possível atualizar o valor dos lançamentos.")
        return
      }

      const userId = await getUserId()
      if (userId) {
        await loadTransactions(userId)
      }

      setBulkValue("")
    } finally {
      setIsBulkUpdating(false)
    }
  }
  function formatDate(date:string){

    const [y,m,d] = date.split("-")
    return `${d}/${m}/${y}`
  }

  function weekday(date: string) {
    const [y, m, d] = date.split("-").map(Number)

    const dt = new Date(y, m - 1, d)

    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"]

    return days[dt.getDay()]
  }

  function uniqueValues(key: keyof Filters) {
  const dataRespectingOtherFilters = transactions.filter((t) => {
    if (key !== "type" && filters.type.length && !filters.type.includes(t.type)) return false
    if (key !== "description" && filters.description.length && !filters.description.includes(t.description)) return false
    if (key !== "status" && filters.status.length && !filters.status.includes(t.status)) return false
    if (key !== "payment" && filters.payment.length && !filters.payment.includes(t.payment)) return false

    const card = t.card ?? "(vazio)"
    if (key !== "card" && filters.card.length && !filters.card.includes(card)) return false

    const inst = t.installment ?? "(vazio)"
    if (key !== "installment" && filters.installment.length && !filters.installment.includes(inst)) return false

    const value = t.value.toString()
    if (key !== "value" && filters.value.length && !filters.value.includes(value)) return false

    return true
  })

  const values = dataRespectingOtherFilters.map((t) => {
    if (key === "card") return t.card ?? "(vazio)"
    if (key === "installment") return t.installment ?? "(vazio)"
    if (key === "value") return t.value.toString()

    return (t as any)[key]
  })

  const unique = [...new Set(values)]

return unique.sort((a, b) => {
  if (key === "value") {
    return Number(a) - Number(b)
  }

  if (key === "installment") {
    const [aAtual = "0", aTotal = "0"] = a.split("/")
    const [bAtual = "0", bTotal = "0"] = b.split("/")

    const diffTotal = Number(aTotal) - Number(bTotal)
    if (diffTotal !== 0) return diffTotal

    return Number(aAtual) - Number(bAtual)
  }

  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
})
}

  function toggleSelectDay(date:string){

    const ids = groupedByDate[date].map(t=>t.id)

    const allSelected = ids.every(id=>selected.includes(id))

    if(allSelected){
      setSelected(prev => prev.filter(id => !ids.includes(id)))
    }else{
      setSelected(prev => [...new Set([...prev,...ids])])
    }

  }

  function FilterDropdown({column}:{column:keyof Filters}){

  const values = uniqueValues(column)

    return(

      <div
      onClick={(e)=>e.stopPropagation()}
      className="absolute z-20 bg-white border rounded shadow-lg p-2 text-xs w-56 max-h-64 overflow-auto">

        {column==="description" && (

          <input
            autoFocus
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

    {selected.length > 0 && (

      <div className="sticky top-[119px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 border border-blue-100">
              <ListChecks size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-slate-700">
                {selected.length} selecionados
              </span>
              <span className="text-sm text-slate-500">•</span>
              <span className="text-sm font-semibold text-blue-700">
                {money(selectedTotal)}
              </span>
            </div>

            <button
              onClick={clearSelection}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition"
              title="Limpar seleção"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <CalendarDays size={16} className="text-slate-500" />
              <input
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
              <button
                onClick={updateSelectedDate}
                disabled={!bulkDate || isBulkUpdating}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                Aplicar
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

              {/* PREVISTO */}
              <button
                onClick={() => setBulkStatus("PREVISTO")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  bulkStatus === "PREVISTO"
                    ? "bg-amber-100 text-amber-700"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Clock size={14} />
                Previsto
              </button>

              {/* PAGO */}
              <button
                onClick={() => setBulkStatus("PAGO")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  bulkStatus === "PAGO"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <BadgeCheck size={14} />
                Pago
              </button>

              {/* BOTÃO APLICAR */}
              <button
                onClick={updateSelectedStatus}
                disabled={!bulkStatus || isBulkUpdating}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                Aplicar
              </button>

            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">

              <span className="text-slate-500 text-sm">R$</span>

              <input
                value={bulkValue}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, "")
                  const formatted = (Number(onlyNumbers) / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })
                  setBulkValue(formatted)
                }}
                placeholder="Valor"
                className="bg-transparent text-sm text-slate-700 outline-none w-28"
              />

              <button
                onClick={updateSelectedValue}
                disabled={!bulkValue || isBulkUpdating}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                Aplicar
              </button>

            </div>
            <button
              onClick={deleteSelected}
              disabled={isBulkUpdating}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-sm"
            >
              <Trash2 size={16} />
              <span>Excluir</span>
            </button>

          </div>

        </div>
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

                      if(openFilter===key){
                        setOpenFilter(null)
                        setSearch("")
                      }else{
                        setOpenFilter(key)
                      }

                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ▾
                  </button>

                </div>

                {openFilter===key && (
                  <FilterDropdown
                    key={key}
                    column={key as keyof Filters}
                  />
                )}

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

                  <td className="text-center">

                    <input
                      type="checkbox"
                      checked={groupedByDate[date].every(t => selected.includes(t.id))}
                      onChange={()=>toggleSelectDay(date)}
                    />

                  </td>

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

                  <tr
  key={t.id}
  className={`border-t border-slate-100 transition-colors ${
    selected.includes(t.id)
      ? "bg-blue-50/70 hover:bg-blue-100/70"
      : "hover:bg-slate-50"
  }`}
>

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
                      <span title={relatedInfoMap[t.id] || ""}>
                        {t.description}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {money(t.value)}
                    </td>

                    <td className="p-3 text-center">

                      <label className="flex items-center justify-center gap-2 cursor-pointer">

                        <input
                          type="checkbox"
                          checked={t.status === "PAGO"}
                          onChange={() => toggleStatus(t)}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />

                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full transition
                          ${
                            t.status === "PAGO"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {t.status}
                        </span>

                      </label>

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
                          onClick={() => askDeleteTransaction(t)}
                          className="
                          w-8 h-8
                          flex items-center justify-center
                          rounded-md
                          text-red-600
                          hover:bg-red-50
                          hover:text-red-700
                          transition
                          "
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

      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Confirmar exclusão</h3>
                  <p className="text-sm text-slate-300">
                    Esse lançamento possui vínculo com outro lançamento.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500 mb-1">Lançamento selecionado</p>
                <p className="font-semibold text-slate-800">{deleteTarget.description}</p>
                <p className="text-sm text-slate-500">
                  {money(deleteTarget.value)} • {formatDate(deleteTarget.date)}
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="radio"
                  name="delete-linked-choice"
                  checked={deleteAlsoRelated === true}
                  onChange={() => setDeleteAlsoRelated(true)}
                  className="mt-1"
                />
                <div>
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    <Link2 size={16} className="text-indigo-600" />
                    Excluir também o lançamento vinculado
                  </span>
                  <p className="text-sm text-slate-500 mt-1">
                    Principal e estorno/reembolso serão removidos juntos.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="radio"
                  name="delete-linked-choice"
                  checked={deleteAlsoRelated === false}
                  onChange={() => setDeleteAlsoRelated(false)}
                  className="mt-1"
                />
                <div>
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    <AlertTriangle size={16} className="text-amber-600" />
                    Excluir somente este lançamento
                  </span>
                  <p className="text-sm text-slate-500 mt-1">
                    O vínculo será removido e o outro lançamento continuará existindo.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDeleteTarget(null)
                  setDeleteAlsoRelated(true)
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>

              <button
                onClick={confirmDeleteTransaction}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 transition shadow-lg disabled:opacity-60"
              >
                {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}