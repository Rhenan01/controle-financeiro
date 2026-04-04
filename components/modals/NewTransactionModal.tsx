"use client"

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { useFinanceStore } from "../../store/financeStore"
import { v4 as uuidv4 } from "uuid"

type Props = {
  open: boolean
  onClose: () => void
  financialMonths: {
    start: string
    end: string
    label: string
  }[]
}

export default function NewTransactionModal({ open, onClose, financialMonths }: Props) {

  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const updateTransaction = useFinanceStore((s) => s.updateTransaction)

  const [editId, setEditId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
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
  const [gerarEstornoReembolso, setGerarEstornoReembolso] = useState(false)
  const [descricaoEstornoReembolso, setDescricaoEstornoReembolso] = useState("")
  const [ativarDesconto, setAtivarDesconto] = useState(false)
  const [valorDesconto, setValorDesconto] = useState("")
  const [dataDesconto, setDataDesconto] = useState("")

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
    setGerarEstornoReembolso(false)
    setDescricaoEstornoReembolso("")
    setAtivarDesconto(false)
    setValorDesconto("")
    setDataDesconto("")
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
  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setValorDesconto(formatted)
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

  function formatDateLocal(date: Date) {

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")

    return `${yyyy}-${mm}-${dd}`

  }
  useEffect(() => {

function handleEdit(event: any) {
  const t = event.detail


  setEditId(t.id)
  setAtivarDesconto(false)
  setValorDesconto("")
  setDataDesconto(formatDateLocal(new Date()))
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
  } else {
    setParcelaAtual("")
    setParcelaTotal("")
  }

  if (t.related_transaction_id && t.related_transaction_role === "PRINCIPAL") {
    setGerarEstornoReembolso(true)

    supabase
      .from("transactions")
      .select("description")
      .eq("id", t.related_transaction_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar lançamento relacionado:", error)
          setDescricaoEstornoReembolso("")
          return
        }

        setDescricaoEstornoReembolso(data?.description || "")
      })
  } else {
    setGerarEstornoReembolso(false)
    setDescricaoEstornoReembolso("")
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

  const estornoReembolsoOptions = descriptions.filter((d: string) => {
  const texto = d.toUpperCase().trim()
  return texto.startsWith("ESTORNO") || texto.startsWith("REEMBOLSO")
  })

  if (!open) return null




  function subDays(dateString: string, days: number) {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() - days)
    return formatDateLocal(date)
  }
  function getLinkedRefundDate(
    originalDate: string,
    paymentMethod: string,
    financialMonths: { start: string; end: string; label: string }[]
  ) {
    const pagamento = (paymentMethod || "").toUpperCase()

    if (pagamento === "CRÉDITO") {
      return subDays(originalDate, 1)
    }

    const periodo = financialMonths.find(
      (m) => originalDate >= m.start && originalDate <= m.end
    )

    if (periodo) {
      return periodo.end
    }

    return originalDate
  }
  function isFormValid() {
    if (!data || !tipo || !descricao || !valor || !status || !formaPagamento) {
      return false
    }

    const valorNumerico = Number(valor.replace(/\D/g, "")) / 100
    if (valorNumerico <= 0) return false

    if ((formaPagamento === "CRÉDITO" || formaPagamento === "DÉBITO") && !cartao) {
      return false
    }

    const temParcelaAtual = !!parcelaAtual.trim()
    const temParcelaTotal = !!parcelaTotal.trim()

    if ((temParcelaAtual && !temParcelaTotal) || (!temParcelaAtual && temParcelaTotal)) {
      return false
    }

    if (temParcelaAtual && temParcelaTotal) {
      const atual = Number(parcelaAtual)
      const total = Number(parcelaTotal)

      if (
        Number.isNaN(atual) ||
        Number.isNaN(total) ||
        atual <= 0 ||
        total <= 0 ||
        atual > total
      ) {
        return false
      }
    }

    if (gerarEstornoReembolso && !descricaoEstornoReembolso) {
      return false
    }

    if (ativarDesconto) {
      const valorDescontoNumerico = Number(valorDesconto.replace(/\D/g, "")) / 100

      if (!valorDesconto || valorDescontoNumerico <= 0) return false
      if (!dataDesconto) return false
      if (valorDescontoNumerico >= valorNumerico) return false
    }

    return true
  }
  function validateForm() {
    if (!data) {
      alert("Preencha a data.")
      return false
    }

    if (!tipo) {
      alert("Selecione o tipo.")
      return false
    }

    if (!descricao) {
      alert("Selecione a descrição.")
      return false
    }

    const valorNumerico = Number(valor.replace(/\D/g, "")) / 100
    if (!valor || valorNumerico <= 0) {
      alert("Informe um valor válido.")
      return false
    }

    if (!status) {
      alert("Selecione o status.")
      return false
    }

    if (!formaPagamento) {
      alert("Selecione a forma de pagamento.")
      return false
    }

    if ((formaPagamento === "CRÉDITO" || formaPagamento === "DÉBITO") && !cartao) {
      alert("Selecione o cartão.")
      return false
    }

    const temParcelaAtual = !!parcelaAtual.trim()
    const temParcelaTotal = !!parcelaTotal.trim()

    if (temParcelaAtual && !temParcelaTotal) {
      alert("Preencha o total de parcelas.")
      return false
    }

    if (!temParcelaAtual && temParcelaTotal) {
      alert("Preencha a parcela atual.")
      return false
    }

    if (temParcelaAtual && temParcelaTotal) {
      const atual = Number(parcelaAtual)
      const total = Number(parcelaTotal)

      if (
        Number.isNaN(atual) ||
        Number.isNaN(total) ||
        atual <= 0 ||
        total <= 0 ||
        !Number.isInteger(atual) ||
        !Number.isInteger(total)
      ) {
        alert("As parcelas devem ser números inteiros maiores que zero.")
        return false
      }

      if (atual > total) {
        alert("A parcela atual não pode ser maior que o total de parcelas.")
        return false
      }
    }

    if (gerarEstornoReembolso && !descricaoEstornoReembolso) {
      alert("Selecione uma opção de estorno/reembolso.")
      return false
    }

    if (ativarDesconto) {
      const valorDescontoNumerico = Number(valorDesconto.replace(/\D/g, "")) / 100

      if (!valorDesconto || valorDescontoNumerico <= 0) {
        alert("Informe um valor de desconto válido.")
        return false
      }

      if (!dataDesconto) {
        alert("Selecione a data do desconto.")
        return false
      }

      if (valorDescontoNumerico >= valorNumerico) {
        alert("O valor do desconto deve ser menor que o valor atual do lançamento.")
        return false
      }
    }

    return true
  }
  async function handleSave() {
    if (isSaving) return

    setIsSaving(true)

    try {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) return

    if (!validateForm()) return

    const valorNumerico = Number(valor.replace(/\D/g, "")) / 100

    if (!editId && (formaPagamento === "CRÉDITO" || formaPagamento === "PIX") && parcelaTotal) {

      const total = Number(parcelaTotal)
      const atual = Number(parcelaAtual || 1)

      const [year, month, day] = data.split("-").map(Number)

      for (let i = atual; i <= total; i++) {
        const parcelaDate = new Date(year, month - 1 + (i - atual), day)
        const principalDate = formatDateLocal(parcelaDate)

        const principalId = uuidv4()
        const relatedId = gerarEstornoReembolso ? uuidv4() : null

        await addTransaction(
          {
            id: principalId,
            date: principalDate,
            type: tipo as "ENTRADA" | "SAÍDA",
            description: descricao,
            value: valorNumerico,
            status: status as "PAGO" | "PREVISTO",
            payment: formaPagamento,
            card: cartao,
            installment: `${i}/${total}`,
            related_transaction_id: relatedId,
            related_transaction_role: relatedId ? "PRINCIPAL" : null
          },
          user.id
        )

        if (gerarEstornoReembolso && relatedId) {
          await addTransaction(
            {
              id: relatedId,
              date: getLinkedRefundDate(principalDate, formaPagamento, financialMonths),
              type: "ENTRADA",
              description: descricaoEstornoReembolso,
              value: valorNumerico,
              status: status as "PAGO" | "PREVISTO",
              payment: "PIX",
              card: undefined,
              installment: `${i}/${total}`,
              related_transaction_id: principalId,
              related_transaction_role: "ESTORNO_REEMBOLSO"
            },
            user.id
          )
        }
      }

} else {
  if (editId) {
    const valorDescontoNumerico = Number(valorDesconto.replace(/\D/g, "")) / 100

    const valorFinalPrincipal = ativarDesconto
  ? valorNumerico - valorDescontoNumerico
  : valorNumerico
    const transaction = {
      id: editId,
      date: data,
      type: tipo as "ENTRADA" | "SAÍDA",
      description: descricao,
      value: valorFinalPrincipal,
      status: status as "PAGO" | "PREVISTO",
      payment: formaPagamento,
      card:
        formaPagamento === "CRÉDITO" || formaPagamento === "DÉBITO"
          ? cartao
          : undefined,
      installment:
        (formaPagamento === "CRÉDITO" || formaPagamento === "PIX") && parcelaTotal
          ? `${parcelaAtual}/${parcelaTotal}`
          : undefined
    }

    await updateTransaction(editId, transaction)
    await supabase
  .from("transactions")
  .update({
    card:
      formaPagamento === "CRÉDITO" || formaPagamento === "DÉBITO"
        ? cartao
        : null,
    installment:
      formaPagamento === "CRÉDITO" && parcelaTotal
        ? `${parcelaAtual}/${parcelaTotal}`
        : null
  })
  .eq("id", editId)
  if (ativarDesconto) {
    await addTransaction(
      {
        id: uuidv4(),
        date: dataDesconto,
        type: "SAÍDA",
        description: descricao,
        value: valorDescontoNumerico,
        status: "PAGO",
        payment: formaPagamento,
        card:
          formaPagamento === "CRÉDITO" || formaPagamento === "DÉBITO"
            ? cartao
            : undefined,
        installment: undefined
      },
      user.id
    )
  }
    const { data: current } = await supabase
      .from("transactions")
      .select("related_transaction_id, related_transaction_role")
      .eq("id", editId)
      .single()

  if (current?.related_transaction_role === "PRINCIPAL") {
    if (current.related_transaction_id) {
      if (gerarEstornoReembolso) {
        await supabase
          .from("transactions")
          .update({
            date: getLinkedRefundDate(data, formaPagamento, financialMonths),
            type: "ENTRADA",
            description: descricaoEstornoReembolso,
            value: valorNumerico,
            status: status,
            payment: "PIX",
            card:  null,
            installment:   formaPagamento === "CRÉDITO" && parcelaTotal
    ? `${parcelaAtual}/${parcelaTotal}`
    : null
          })
          .eq("id", current.related_transaction_id)
      } else {
        await supabase
          .from("transactions")
          .delete()
          .eq("id", current.related_transaction_id)

        await supabase
          .from("transactions")
          .update({
            related_transaction_id: null,
            related_transaction_role: null
          })
          .eq("id", editId)
      }
    } else if (gerarEstornoReembolso) {
      const relatedId = uuidv4()

      await supabase
        .from("transactions")
        .update({
          related_transaction_id: relatedId,
          related_transaction_role: "PRINCIPAL"
        })
        .eq("id", editId)

      await addTransaction(
        {
          id: relatedId,
          date:getLinkedRefundDate(data, formaPagamento, financialMonths),
          type: "ENTRADA",
          description: descricaoEstornoReembolso,
          value: valorNumerico,
          status: status as "PAGO" | "PREVISTO",
          payment: "PIX",
          card:  undefined,
          installment: parcelaTotal ? `${parcelaAtual}/${parcelaTotal}` : undefined,
          related_transaction_id: editId,
          related_transaction_role: "ESTORNO_REEMBOLSO"
        },
        user.id
      )
    }
  } 
} else {
    const principalId = uuidv4()
    const relatedId = gerarEstornoReembolso ? uuidv4() : null

    await addTransaction(
      {
        id: principalId,
        date: data,
        type: tipo as "ENTRADA" | "SAÍDA",
        description: descricao,
        value: valorNumerico,
        status: status as "PAGO" | "PREVISTO",
        payment: formaPagamento,
        card: cartao,
        installment: parcelaTotal ? `${parcelaAtual}/${parcelaTotal}` : undefined,
        related_transaction_id: relatedId,
        related_transaction_role: relatedId ? "PRINCIPAL" : null
      },
      user.id
    )

    if (gerarEstornoReembolso && relatedId) {
      await addTransaction(
        {
          id: relatedId,
          date: getLinkedRefundDate(data, formaPagamento, financialMonths),
          type: "ENTRADA",
          description: descricaoEstornoReembolso,
          value: valorNumerico,
          status: status as "PAGO" | "PREVISTO",
          payment: "PIX",
          card:undefined,
          installment: parcelaTotal ? `${parcelaAtual}/${parcelaTotal}` : undefined,
          related_transaction_id: principalId,
          related_transaction_role: "ESTORNO_REEMBOLSO"
        },
        user.id
      )
    }
  }
}

    const refreshedUser = await supabase.auth.getUser()

    if (refreshedUser.data.user?.id) {
      await useFinanceStore.getState().loadTransactions(refreshedUser.data.user.id)
    }

    handleClose()

   } catch (error) {
    console.error("Erro ao salvar lançamento:", error)
    alert("Ocorreu um erro ao salvar o lançamento.")
  } finally {
    setIsSaving(false)
  }
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
            value={formaPagamento}
            onChange={(e) => {
              const novoPagamento = e.target.value
              setFormaPagamento(novoPagamento)

              if (novoPagamento !== "CRÉDITO" && novoPagamento !== "DÉBITO") {
                setCartao("")
              }

              if (novoPagamento !== "CRÉDITO" && novoPagamento !== "PIX") {
                setParcelaAtual("")
                setParcelaTotal("")
              }
            }}
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


          {(formaPagamento === "CRÉDITO" || formaPagamento === "PIX") && (

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

        {tipo === "SAÍDA" && (
          <div className="space-y-3 mt-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={gerarEstornoReembolso}
                onChange={(e) => {
                  const checked = e.target.checked
                  setGerarEstornoReembolso(checked)
                  if (!checked) setDescricaoEstornoReembolso("")
                }}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              Gerar estorno/reembolso vinculado automaticamente
            </label>

            {gerarEstornoReembolso && (
              <select
                value={descricaoEstornoReembolso}
                onChange={(e) => setDescricaoEstornoReembolso(e.target.value)}
                className={inputStyle}
              >
                <option value="">Selecione o estorno/reembolso</option>
                {estornoReembolsoOptions.map((d: string) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        {editId && tipo === "SAÍDA" && (
          <div className="space-y-3 mt-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={ativarDesconto}
                onChange={(e) => {
                  const checked = e.target.checked
                  setAtivarDesconto(checked)

                  if (checked) {
                    setDataDesconto(formatDateLocal(new Date()))
                  } else {
                    setValorDesconto("")
                    setDataDesconto("")
                  }
                }}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              Descontar parte deste lançamento
            </label>

            {ativarDesconto && (
              <div className="grid gap-3">
                <input
                  value={valorDesconto}
                  onChange={handleDiscountValueChange}
                  placeholder="Valor a descontar"
                  className={inputStyle}
                />

                <input
                  type="date"
                  value={dataDesconto}
                  onChange={(e) => setDataDesconto(e.target.value)}
                  className={inputStyle}
                />
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>

<button
  onClick={handleSave}
  disabled={isSaving || !isFormValid()}
  className={`
    px-5 py-2 text-sm text-white rounded-xl transition-all duration-300

    ${(isSaving || !isFormValid())
      ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"
      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"}
  `}
>
  {isSaving ? (
    <span className="flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
      Salvando...
    </span>
  ) : (
    "Salvar"
  )}
</button>

        </div>

      </div>

    </div>

  )

}