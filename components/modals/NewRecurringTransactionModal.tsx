"use client"

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react"
import { Loader2, Repeat2, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { supabase } from "@/lib/supabase"
import { useFinanceStore } from "@/store/financeStore"

type FinancialMonth = {
  start: string
  end: string
  label: string
}

type Props = {
  open: boolean
  onClose: () => void
  financialMonths: FinancialMonth[]
}

type TransactionType = "ENTRADA" | "SAÍDA"
type TransactionStatus = "PAGO" | "PREVISTO"
type DateMode =
  | "FIXED_DAY"
  | "SALARY_DAY"
  | "DAYS_AFTER_SALARY"

type PreviewItem = {
  period: FinancialMonth
  date: string | null
}

const inputStyle =
  "w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"

function normalizePayment(payment: string) {
  return payment
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}

function isCardPayment(payment: string) {
  const normalized = normalizePayment(payment)

  return (
    normalized === "CREDITO" ||
    normalized === "DEBITO"
  )
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) return ""

  const amount = Number(digits) / 100

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) return Number.NaN

  return Number(digits) / 100
}

function parseISODate(date: string) {
  const [year, month, day] =
    date.split("-").map(Number)

  return new Date(
    Date.UTC(year, month - 1, day)
  )
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatDate(date: string) {
  const [year, month, day] =
    date.split("-")

  return `${day}/${month}/${year}`
}

function addDays(
  dateString: string,
  quantity: number
) {
  const date = parseISODate(dateString)

  date.setUTCDate(
    date.getUTCDate() + quantity
  )

  return toISODate(date)
}

/*
  O mês financeiro pode começar no fim do mês
  anterior. Para descobrir qual mês-calendário
  representa o período, usamos o ponto central,
  mesma ideia utilizada na tela de Lançamentos.
*/
function getFinancialCalendarMonth(
  period: FinancialMonth
) {
  const start = parseISODate(period.start)
  const end = parseISODate(period.end)

  const middleTimestamp =
    start.getTime() +
    (end.getTime() - start.getTime()) / 2

  const middleDate =
    new Date(middleTimestamp)

  return {
    year: middleDate.getUTCFullYear(),
    monthIndex: middleDate.getUTCMonth()
  }
}

/*
  Cria o dia fixo no mês-calendário representado
  pelo mês financeiro.

  Exemplo:
  período 30/09 -> 29/10 representa Out/2026.
  Se o usuário escolher dia 1, gera 01/10/2026.

  Se o usuário escolher 31 e o mês tiver menos
  dias, usa o último dia daquele mês.
*/
function getFixedDateForFinancialMonth(
  period: FinancialMonth,
  fixedDay: number
) {
  const { year, monthIndex } =
    getFinancialCalendarMonth(period)

  const lastDayOfMonth =
    new Date(
      Date.UTC(year, monthIndex + 1, 0)
    ).getUTCDate()

  const safeDay =
    Math.min(fixedDay, lastDayOfMonth)

  const targetDate =
    toISODate(
      new Date(
        Date.UTC(
          year,
          monthIndex,
          safeDay
        )
      )
    )

  /*
    Proteção extra: a data precisa continuar
    pertencendo ao período financeiro selecionado.
  */
  if (
    targetDate < period.start ||
    targetDate > period.end
  ) {
    return null
  }

  return targetDate
}

function findDefaultPeriodStart(
  financialMonths: FinancialMonth[]
) {
  if (financialMonths.length === 0) {
    return ""
  }

  const today = new Date()

  const todayISO =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`

  const current =
    financialMonths.find(
      (month) =>
        todayISO >= month.start &&
        todayISO <= month.end
    )

  if (current) {
    return current.start
  }

  const next =
    financialMonths.find(
      (month) =>
        month.start > todayISO
    )

  return (
    next?.start ??
    financialMonths[0].start
  )
}

export default function NewRecurringTransactionModal({
  open,
  onClose,
  financialMonths
}: Props) {
  const loadTransactions =
    useFinanceStore(
      (state) => state.loadTransactions
    )

  const [saving, setSaving] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage
  ] = useState("")

  const [tipo, setTipo] =
    useState<TransactionType>("SAÍDA")

  const [descricao, setDescricao] =
    useState("")

  const [valor, setValor] =
    useState("")

  const [status, setStatus] =
    useState<TransactionStatus>(
      "PREVISTO"
    )

  const [
    compraCartao,
    setCompraCartao
  ] = useState(false)

  const [
    formaPagamento,
    setFormaPagamento
  ] = useState("")

  const [cartao, setCartao] =
    useState("")

  const [dateMode, setDateMode] =
    useState<DateMode>("FIXED_DAY")

  const [fixedDay, setFixedDay] =
    useState("1")

  const [
    daysAfterSalary,
    setDaysAfterSalary
  ] = useState("5")

  const [
    startPeriod,
    setStartPeriod
  ] = useState("")

  const [
    endPeriod,
    setEndPeriod
  ] = useState("")

  const [
    descriptions,
    setDescriptions
  ] = useState<string[]>([])

  const [payments, setPayments] =
    useState<string[]>([])

  const [cards, setCards] =
    useState<string[]>([])

  function resetForm() {
    const defaultStart =
      findDefaultPeriodStart(
        financialMonths
      )

    setTipo("SAÍDA")
    setDescricao("")
    setValor("")
    setStatus("PREVISTO")
    setCompraCartao(false)
    setFormaPagamento("")
    setCartao("")
    setDateMode("FIXED_DAY")
    setFixedDay("1")
    setDaysAfterSalary("5")
    setStartPeriod(defaultStart)
    setEndPeriod(defaultStart)
    setErrorMessage("")
    setSaving(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  useEffect(() => {
    if (!open) return

    resetForm()

    async function loadOptions() {
      const { data: authData } =
        await supabase.auth.getUser()

      const user = authData.user

      if (!user) {
        setErrorMessage(
          "Não foi possível identificar o usuário."
        )
        return
      }

      const [
        descriptionsResponse,
        paymentsResponse,
        cardsResponse
      ] = await Promise.all([
        supabase
          .from(
            "description_categories"
          )
          .select("description")
          .eq("user_id", user.id)
          .order("description"),

        supabase
          .from("payment_methods")
          .select("name")
          .eq("user_id", user.id)
          .order("name"),

        supabase
          .from("cards")
          .select("name")
          .eq("user_id", user.id)
          .order("name")
      ])

      setDescriptions(
        Array.from(
          new Set(
            (
              descriptionsResponse.data ??
              []
            )
              .map(
                (item) =>
                  item.description
              )
              .filter(Boolean)
          )
        )
      )

      setPayments(
        Array.from(
          new Set(
            (
              paymentsResponse.data ??
              []
            )
              .map(
                (item) =>
                  item.name
              )
              .filter(Boolean)
          )
        )
      )

      setCards(
        Array.from(
          new Set(
            (
              cardsResponse.data ??
              []
            )
              .map(
                (item) =>
                  item.name
              )
              .filter(Boolean)
          )
        )
      )
    }

    void loadOptions()
  }, [open, financialMonths])

  useEffect(() => {
    if (!open) return

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        handleClose()
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [open, financialMonths])

  const startIndex = useMemo(
    () =>
      financialMonths.findIndex(
        (month) =>
          month.start === startPeriod
      ),
    [financialMonths, startPeriod]
  )

  const availableEndPeriods =
    useMemo(() => {
      if (startIndex < 0) {
        return financialMonths
      }

      return financialMonths.slice(
        startIndex
      )
    }, [
      financialMonths,
      startIndex
    ])

  const preview =
    useMemo<PreviewItem[]>(() => {
      if (
        !startPeriod ||
        !endPeriod
      ) {
        return []
      }

      const firstIndex =
        financialMonths.findIndex(
          (month) =>
            month.start ===
            startPeriod
        )

      const lastIndex =
        financialMonths.findIndex(
          (month) =>
            month.start === endPeriod
        )

      if (
        firstIndex < 0 ||
        lastIndex < firstIndex
      ) {
        return []
      }

      const selectedPeriods =
        financialMonths.slice(
          firstIndex,
          lastIndex + 1
        )

      if (
        dateMode === "SALARY_DAY"
      ) {
        return selectedPeriods.map(
          (period) => ({
            period,
            date: period.start
          })
        )
      }

      if (
        dateMode ===
        "DAYS_AFTER_SALARY"
      ) {
        const quantity =
          Number(daysAfterSalary)

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 0 ||
          quantity > 31
        ) {
          return selectedPeriods.map(
            (period) => ({
              period,
              date: null
            })
          )
        }

        return selectedPeriods.map(
          (period) => {
            const calculatedDate =
              addDays(
                period.start,
                quantity
              )

            return {
              period,
              date:
                calculatedDate <=
                period.end
                  ? calculatedDate
                  : null
            }
          }
        )
      }

      const numericFixedDay =
        Number(fixedDay)

      if (
        !Number.isInteger(
          numericFixedDay
        ) ||
        numericFixedDay < 1 ||
        numericFixedDay > 31
      ) {
        return selectedPeriods.map(
          (period) => ({
            period,
            date: null
          })
        )
      }

      return selectedPeriods.map(
        (period) => ({
          period,
          date:
            getFixedDateForFinancialMonth(
              period,
              numericFixedDay
            )
        })
      )
    }, [
      dateMode,
      daysAfterSalary,
      endPeriod,
      financialMonths,
      fixedDay,
      startPeriod
    ])

  const numericValue = useMemo(
    () => parseCurrency(valor),
    [valor]
  )

  const totalValue = useMemo(() => {
    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return 0
    }

    return (
      numericValue *
      preview.length
    )
  }, [
    numericValue,
    preview.length
  ])

  const hasInvalidDates =
    preview.some(
      (item) => !item.date
    )

  const paymentOptions = useMemo(
    () => {
      if (compraCartao) {
        return payments.filter(
          isCardPayment
        )
      }

      return payments.filter(
        (payment) =>
          !isCardPayment(payment)
      )
    },
    [compraCartao, payments]
  )

  function handleCardPurchaseChange(
    checked: boolean
  ) {
    setCompraCartao(checked)
    setFormaPagamento("")
    setCartao("")
  }

  function handleStartPeriodChange(
    value: string
  ) {
    setStartPeriod(value)

    const newStartIndex =
      financialMonths.findIndex(
        (month) =>
          month.start === value
      )

    const currentEndIndex =
      financialMonths.findIndex(
        (month) =>
          month.start === endPeriod
      )

    if (
      currentEndIndex <
      newStartIndex
    ) {
      setEndPeriod(value)
    }
  }

  function validate() {
    if (
      financialMonths.length === 0
    ) {
      return "Não existem meses financeiros disponíveis."
    }

    if (!descricao) {
      return "Selecione a descrição."
    }

    if (
      !Number.isFinite(
        numericValue
      ) ||
      numericValue <= 0
    ) {
      return "Informe um valor válido."
    }

    if (!formaPagamento) {
      return "Selecione a forma de pagamento."
    }

    if (
      compraCartao &&
      !cartao
    ) {
      return "Selecione o cartão."
    }

    if (
      !startPeriod ||
      !endPeriod
    ) {
      return "Selecione o período inicial e o período final."
    }

    if (
      dateMode ===
      "FIXED_DAY"
    ) {
      const day =
        Number(fixedDay)

      if (
        !Number.isInteger(day) ||
        day < 1 ||
        day > 31
      ) {
        return "O dia fixo precisa estar entre 1 e 31."
      }
    }

    if (
      dateMode ===
      "DAYS_AFTER_SALARY"
    ) {
      const quantity =
        Number(daysAfterSalary)

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 0 ||
        quantity > 31
      ) {
        return "A quantidade de dias após o pagamento precisa estar entre 0 e 31."
      }
    }

    if (
      preview.length === 0
    ) {
      return "Nenhum lançamento será gerado."
    }

    if (hasInvalidDates) {
      return "Uma ou mais datas ficaram fora do mês financeiro selecionado."
    }

    return null
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (saving) return

    const validationError =
      validate()

    if (validationError) {
      setErrorMessage(
        validationError
      )
      return
    }

    setSaving(true)
    setErrorMessage("")

    try {
      const { data: authData } =
        await supabase.auth.getUser()

      const user = authData.user

      if (!user) {
        throw new Error(
          "Usuário não identificado."
        )
      }

      const rows = preview.map(
        (item) => ({
          id: uuidv4(),
          user_id: user.id,
          date: item.date as string,
          type: tipo,
          description: descricao,
          value: numericValue,
          status,
          payment:
            formaPagamento,
          card: compraCartao
            ? cartao
            : null,
          installment: null,
          related_transaction_id:
            null,
          related_transaction_role:
            null,
          recurring_transaction_id:
            null,
          financial_period_start:
            item.period.start,
          financial_period_end:
            item.period.end
        })
      )

      const { error } =
        await supabase
          .from("transactions")
          .insert(rows)

      if (error) {
        throw error
      }

      await loadTransactions(
        user.id
      )

      handleClose()
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao criar os lançamentos."

      setErrorMessage(
        `Não foi possível criar os lançamentos: ${text}`
      )
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-2 sm:p-4"
      onClick={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) =>
          event.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-transaction-modal-title"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Repeat2
              size={20}
              className="shrink-0 text-blue-600"
            />

            <h2
              id="recurring-transaction-modal-title"
              className="truncate text-lg font-semibold text-slate-800 sm:text-xl"
            >
              Novo lançamento recorrente
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid gap-4">
            {financialMonths.length ===
              0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Cadastre pelo menos duas datas de pagamento em Configurações para formar meses financeiros.
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">
                  Tipo
                </span>

                <select
                  value={tipo}
                  onChange={(
                    event
                  ) =>
                    setTipo(
                      event.target
                        .value as TransactionType
                    )
                  }
                  className={
                    inputStyle
                  }
                >
                  <option value="SAÍDA">
                    SAÍDA
                  </option>
                  <option value="ENTRADA">
                    ENTRADA
                  </option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">
                  Status
                </span>

                <select
                  value={status}
                  onChange={(
                    event
                  ) =>
                    setStatus(
                      event.target
                        .value as TransactionStatus
                    )
                  }
                  className={
                    inputStyle
                  }
                >
                  <option value="PREVISTO">
                    PREVISTO
                  </option>
                  <option value="PAGO">
                    PAGO
                  </option>
                </select>
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">
                Descrição
              </span>

              <select
                value={descricao}
                onChange={(event) =>
                  setDescricao(
                    event.target.value
                  )
                }
                className={inputStyle}
              >
                <option value="">
                  Selecione a descrição
                </option>

                {descriptions.map(
                  (description) => (
                    <option
                      key={
                        description
                      }
                      value={
                        description
                      }
                    >
                      {description}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">
                Valor de cada mês
              </span>

              <input
                value={valor}
                onChange={(event) =>
                  setValor(
                    formatCurrencyInput(
                      event.target
                        .value
                    )
                  )
                }
                placeholder="R$ 0,00"
                className={inputStyle}
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <p className="text-sm font-semibold text-slate-700">
                Data do lançamento
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="date-mode"
                    value="FIXED_DAY"
                    checked={
                      dateMode ===
                      "FIXED_DAY"
                    }
                    onChange={() =>
                      setDateMode(
                        "FIXED_DAY"
                      )
                    }
                    className="accent-blue-600"
                  />
                  Dia fixo
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="date-mode"
                    value="SALARY_DAY"
                    checked={
                      dateMode ===
                      "SALARY_DAY"
                    }
                    onChange={() =>
                      setDateMode(
                        "SALARY_DAY"
                      )
                    }
                    className="accent-blue-600"
                  />
                  Data do pagamento
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="date-mode"
                    value="DAYS_AFTER_SALARY"
                    checked={
                      dateMode ===
                      "DAYS_AFTER_SALARY"
                    }
                    onChange={() =>
                      setDateMode(
                        "DAYS_AFTER_SALARY"
                      )
                    }
                    className="accent-blue-600"
                  />
                  Após pagamento
                </label>
              </div>

              {dateMode ===
                "FIXED_DAY" && (
                <label className="mt-3 block space-y-1">
                  <span className="text-xs font-medium text-slate-600">
                    Dia do mês
                  </span>

                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={fixedDay}
                    onChange={(
                      event
                    ) =>
                      setFixedDay(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputStyle
                    }
                  />

                  <span className="block text-xs text-slate-500">
                    Se o mês tiver menos dias, será usado o último dia dele.
                  </span>
                </label>
              )}

              {dateMode ===
                "DAYS_AFTER_SALARY" && (
                <label className="mt-3 block space-y-1">
                  <span className="text-xs font-medium text-slate-600">
                    Quantos dias após o pagamento?
                  </span>

                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={
                      daysAfterSalary
                    }
                    onChange={(
                      event
                    ) =>
                      setDaysAfterSalary(
                        event.target
                          .value
                      )
                    }
                    placeholder="Ex: 5"
                    className={
                      inputStyle
                    }
                  />

                  <span className="block text-xs text-slate-500">
                    Exemplo: pagamento em 30/09 + 5 dias = lançamento em 05/10.
                  </span>
                </label>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={
                    compraCartao
                  }
                  onChange={(
                    event
                  ) =>
                    handleCardPurchaseChange(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                Compra no cartão
              </label>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">
                    Forma de pagamento
                  </span>

                  <select
                    value={
                      formaPagamento
                    }
                    onChange={(
                      event
                    ) => {
                      setFormaPagamento(
                        event.target
                          .value
                      )

                      if (
                        !isCardPayment(
                          event.target
                            .value
                        )
                      ) {
                        setCartao("")
                      }
                    }}
                    className={
                      inputStyle
                    }
                  >
                    <option value="">
                      Selecione a forma de pagamento
                    </option>

                    {paymentOptions.map(
                      (payment) => (
                        <option
                          key={
                            payment
                          }
                          value={
                            payment
                          }
                        >
                          {payment}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {compraCartao && (
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-slate-600">
                      Cartão
                    </span>

                    <select
                      value={cartao}
                      onChange={(
                        event
                      ) =>
                        setCartao(
                          event
                            .target
                            .value
                        )
                      }
                      className={
                        inputStyle
                      }
                    >
                      <option value="">
                        Selecione o cartão
                      </option>

                      {cards.map(
                        (card) => (
                          <option
                            key={
                              card
                            }
                            value={
                              card
                            }
                          >
                            {card}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">
                  Começar no mês financeiro
                </span>

                <select
                  value={
                    startPeriod
                  }
                  onChange={(
                    event
                  ) =>
                    handleStartPeriodChange(
                      event.target
                        .value
                    )
                  }
                  className={
                    inputStyle
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  {financialMonths.map(
                    (month) => (
                      <option
                        key={
                          month.start
                        }
                        value={
                          month.start
                        }
                      >
                        {month.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">
                  Até o mês financeiro
                </span>

                <select
                  value={endPeriod}
                  onChange={(
                    event
                  ) =>
                    setEndPeriod(
                      event.target
                        .value
                    )
                  }
                  className={
                    inputStyle
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  {availableEndPeriods.map(
                    (month) => (
                      <option
                        key={
                          month.start
                        }
                        value={
                          month.start
                        }
                      >
                        {month.label}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            {preview.length >
              0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Prévia
                    </p>

                    <p className="text-xs text-slate-500">
                      {
                        preview.length
                      }{" "}
                      lançamento(s)
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    Total:{" "}
                    {totalValue.toLocaleString(
                      "pt-BR",
                      {
                        style:
                          "currency",
                        currency:
                          "BRL"
                      }
                    )}
                  </p>
                </div>

                <div className="max-h-52 overflow-y-auto">
                  {preview.map(
                    (item) => (
                      <div
                        key={
                          item.period
                            .start
                        }
                        className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0"
                      >
                        <span className="min-w-0 truncate text-slate-700">
                          {
                            item.period
                              .label
                          }
                        </span>

                        <span
                          className={
                            item.date
                              ? "font-medium text-slate-700"
                              : "font-medium text-red-600"
                          }
                        >
                          {item.date
                            ? formatDate(
                                item.date
                              )
                            : "Data fora do período"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-100 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              preview.length === 0 ||
              hasInvalidDates
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm text-white transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-none disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-80 sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Criando...
              </>
            ) : (
              `Criar ${
                preview.length ||
                ""
              } lançamento${
                preview.length === 1
                  ? ""
                  : "s"
              }`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
