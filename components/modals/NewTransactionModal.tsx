"use client"

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { useFinanceStore } from "../../store/financeStore"
import { v4 as uuidv4 } from "uuid"

type Props = {
  open: boolean
  onClose: () => void
}

export default function NewTransactionModal({ open, onClose }: Props) {

  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const updateTransaction = useFinanceStore((s) => s.updateTransaction)

  const [editId, setEditId] = useState<string | null>(null)

  const [data, setData] = useState("")
  const [tipo, setTipo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [status, setStatus] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("")
  const [cartao, setCartao] = useState("")

  const [parcelaAtual, setParcelaAtual] = useState("")
  const [parcelaTotal, setParcelaTotal] = useState("")

  const [descriptions,setDescriptions] = useState<string[]>([])
  const [payments,setPayments] = useState<string[]>([])
  const [cards,setCards] = useState<string[]>([])

  const inputStyle =
  "w-full border border-gray-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"

  function resetForm() {

    setEditId(null)
    setData("")
    setTipo("")
    setDescricao("")
    setValor("")
    setStatus("")
    setFormaPagamento("")
    setCartao("")
    setParcelaAtual("")
    setParcelaTotal("")

  }

  function handleClose() {
    resetForm()
    onClose()
  }

  const formatCurrency = (value: string) => {

    const number = value.replace(/\D/g, "")
    const amount = Number(number) / 100

    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })

  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const formatted = formatCurrency(e.target.value)
    setValor(formatted)

  }

  // carregar dados das configurações
  useEffect(()=>{

    async function loadConfig(){

      const {data:desc} = await supabase
      .from("description_categories")
      .select("description")
      .order("description")

      const {data:pay} = await supabase
      .from("payment_methods")
      .select("name")
      .order("name")

      const {data:cards} = await supabase
      .from("cards")
      .select("name")
      .order("name")

      if(desc) setDescriptions(desc.map(i=>i.description))
      if(pay) setPayments(pay.map(i=>i.name))
      if(cards) setCards(cards.map(i=>i.name))

    }

    loadConfig()

  },[])


  useEffect(() => {

    function handleEdit(event: any) {

      const t = event.detail

      setEditId(t.id)

      setData(t.date)
      setTipo(t.type || "")
      setDescricao(t.description || "")

      setValor(
        t.value
          ? Number(t.value).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })
          : ""
      )

      setStatus(t.status || "")
      setFormaPagamento(t.payment || "")
      setCartao(t.card || "")

      if (t.installment) {

        const [atual, total] = t.installment.split("/")
        setParcelaAtual(atual)
        setParcelaTotal(total)

      }

    }

    window.addEventListener("openEditTransaction", handleEdit)

    return () => {
      window.removeEventListener("openEditTransaction", handleEdit)
    }

  }, [])


  useEffect(() => {

    function handleEsc(e: KeyboardEvent) {

      if (e.key === "Escape") {
        handleClose()
      }

    }

    if (open) {
      window.addEventListener("keydown", handleEsc)
    }

    return () => {
      window.removeEventListener("keydown", handleEsc)
    }

  }, [open])


  if (!open) return null


  function formatDateLocal(date: Date) {

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")

    return `${yyyy}-${mm}-${dd}`

  }


  async function handleSave() {

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) return

    const valorNumerico = Number(valor.replace(/\D/g, "")) / 100

    if (!editId && formaPagamento === "CRÉDITO" && parcelaTotal) {

      const total = Number(parcelaTotal)
      const atual = Number(parcelaAtual || 1)

      const [year, month, day] = data.split("-").map(Number)

      for (let i = atual; i <= total; i++) {

        const parcelaDate = new Date(year, month - 1 + (i - atual), day)

        await addTransaction(
          {
            id: uuidv4(),
            date: formatDateLocal(parcelaDate),
            type: tipo as "ENTRADA" | "SAÍDA",
            description: descricao,
            value: valorNumerico,
            status: status as "PAGO" | "PREVISTO",
            payment: formaPagamento,
            card: cartao,
            installment: `${i}/${total}`
          },
          user.id
        )

      }

    } else {

      const transaction = {
        id: editId ?? uuidv4(),
        date: data,
        type: tipo as "ENTRADA" | "SAÍDA",
        description: descricao,
        value: valorNumerico,
        status: status as "PAGO" | "PREVISTO",
        payment: formaPagamento,
        card: cartao,
        installment: parcelaTotal ? `${parcelaAtual}/${parcelaTotal}` : undefined
      }

      if (editId) {

        await updateTransaction(editId, transaction)

      } else {

        await addTransaction(transaction, user.id)

      }

    }

    handleClose()

  }


  return (

    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-[520px] rounded-2xl shadow-xl p-7"
      >

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-xl font-semibold text-slate-800">
            {editId ? "Editar lançamento" : "Novo lançamento"}
          </h2>

          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 text-lg"
          >
            ✕
          </button>

        </div>

        <div className="grid gap-4">

          <input
            type="date"
            value={data || ""}
            onChange={(e) => setData(e.target.value)}
            className={inputStyle}
          />

          <select
            value={tipo || ""}
            onChange={(e) => setTipo(e.target.value)}
            className={inputStyle}
          >
            <option value="">Tipo</option>
            <option>ENTRADA</option>
            <option>SAÍDA</option>
          </select>


          {/* DESCRIÇÃO DINÂMICA */}

          <select
            value={descricao || ""}
            onChange={(e)=>setDescricao(e.target.value)}
            className={inputStyle}
          >

            <option value="">Descrição</option>

            {descriptions.map(d=>(
              <option key={d} value={d}>{d}</option>
            ))}

          </select>


          <input
            value={valor || ""}
            onChange={handleValueChange}
            placeholder="R$ 0,00"
            className={inputStyle}
          />


          <select
            value={status || ""}
            onChange={(e) => setStatus(e.target.value)}
            className={inputStyle}
          >
            <option value="">Status</option>
            <option>PAGO</option>
            <option>PREVISTO</option>
          </select>


          {/* PAGAMENTO DINÂMICO */}

          <select
            value={formaPagamento || ""}
            onChange={(e)=>setFormaPagamento(e.target.value)}
            className={inputStyle}
          >

            <option value="">Forma de pagamento</option>

            {payments.map(p=>(
              <option key={p} value={p}>{p}</option>
            ))}

          </select>


          {(formaPagamento === "CRÉDITO" || formaPagamento === "DÉBITO") && (

            <select
              value={cartao || ""}
              onChange={(e)=>setCartao(e.target.value)}
              className={inputStyle}
            >

              <option value="">Cartão</option>

              {cards.map(c=>(
                <option key={c} value={c}>{c}</option>
              ))}

            </select>

          )}


          {formaPagamento === "CRÉDITO" && (

            <div className="grid grid-cols-2 gap-3">

              <input
                value={parcelaAtual || ""}
                onChange={(e) => setParcelaAtual(e.target.value)}
                placeholder="Parcela atual"
                className={inputStyle}
              />

              <input
                value={parcelaTotal || ""}
                onChange={(e) => setParcelaTotal(e.target.value)}
                placeholder="Total parcelas"
                disabled={!!editId}
                className={`${inputStyle} disabled:bg-gray-100`}
              />

            </div>

          )}

        </div>


        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition"
          >
            Salvar
          </button>

        </div>

      </div>

    </div>

  )

}