"use client"

import { useEffect, useState } from "react"

import {
  Check,
  CircleDollarSign,
  Loader2,
  Pencil,
  Plus,
  Power,
  Repeat2,
  Trash2,
  X
} from "lucide-react"

import { supabase } from "@/lib/supabase"

type TransactionType =
  | "ENTRADA"
  | "SAÍDA"

type TransactionStatus =
  | "PAGO"
  | "PREVISTO"

type DateRule =
  | "FIXED_DAY"
  | "SALARY_DAY"
  | "DAYS_AFTER_SALARY"
  | "BUSINESS_DAY_OF_PERIOD"
  | "LAST_DAY_OF_PERIOD"

type RecurringTransaction = {
  id: string
  user_id: string
  active: boolean
  type: TransactionType
  description: string
  value: number | string
  status: TransactionStatus | null
  payment: string | null
  card: string | null
  installment: string | null
  date_rule: DateRule
  fixed_day: number | null
  days_after_salary: number | null
  business_day_number: number | null
  created_at: string
  updated_at: string
}

type FormData = {
  active: boolean
  type: TransactionType
  description: string
  value: string
  payment: string
  card: string
  dateRule: DateRule
  fixedDay: string
  daysAfterSalary: string
  businessDayNumber: string
}

const initialForm: FormData = {
  active: true,
  type: "SAÍDA",
  description: "",
  value: "",
  payment: "",
  card: "",
  dateRule: "FIXED_DAY",
  fixedDay: "1",
  daysAfterSalary: "1",
  businessDayNumber: "1"
}

function formatCurrency(
  value: number | string
) {
  const numericValue = Number(value)

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  )
}

function formatCurrencyInput(
  value: number | string
) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return ""
  }

  return numericValue.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  )
}

function maskCurrencyInput(
  value: string
) {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  const amount = Number(digits) / 100

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return Number.NaN
  }

  return Number(digits) / 100
}

function normalizePayment(
  payment: string
) {
  return payment
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}

function paymentRequiresCard(
  payment: string
) {
  const normalized =
    normalizePayment(payment)

  return (
    normalized === "CREDITO" ||
    normalized === "DEBITO"
  )
}

function uniqueStrings(
  values: Array<
    string | null | undefined
  >
) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          Boolean(value?.trim())
      )
    )
  )
}

function getDateRuleLabel(
  rule: DateRule
) {
  const labels: Record<
    DateRule,
    string
  > = {
    FIXED_DAY: "Dia fixo do mês",
    SALARY_DAY: "No dia do salário",
    DAYS_AFTER_SALARY:
      "X dias depois do salário",
    BUSINESS_DAY_OF_PERIOD:
      "N-ésimo dia útil do período",
    LAST_DAY_OF_PERIOD:
      "Último dia do período financeiro"
  }

  return labels[rule]
}

function getDateRuleDescription(
  model: RecurringTransaction
) {
  if (
    model.date_rule === "FIXED_DAY"
  ) {
    return `Todo dia ${
      model.fixed_day ?? 1
    }`
  }

  if (
    model.date_rule === "SALARY_DAY"
  ) {
    return "Na data de início do período financeiro"
  }

  if (
    model.date_rule ===
    "DAYS_AFTER_SALARY"
  ) {
    const quantity =
      model.days_after_salary ?? 0

    return quantity === 1
      ? "1 dia depois do salário"
      : `${quantity} dias depois do salário`
  }

  if (
    model.date_rule ===
    "BUSINESS_DAY_OF_PERIOD"
  ) {
    return `${
      model.business_day_number ?? 1
    }º dia útil do período`
  }

  return "Na data final do período financeiro"
}

/*
  Converte cada regra em uma posição numérica
  para organizar os modelos em ordem crescente.
*/
function getRecurringSortValue(
  model: RecurringTransaction
) {
  if (
    model.date_rule === "SALARY_DAY"
  ) {
    return 0
  }

  if (
    model.date_rule ===
    "DAYS_AFTER_SALARY"
  ) {
    return (
      model.days_after_salary ?? 0
    )
  }

  if (
    model.date_rule ===
    "BUSINESS_DAY_OF_PERIOD"
  ) {
    return (
      model.business_day_number ?? 1
    )
  }

  if (
    model.date_rule === "FIXED_DAY"
  ) {
    return model.fixed_day ?? 1
  }

  /*
    O último dia do período sempre fica
    depois das demais regras.
  */
  return 9999
}

function sortRecurringModels(
  first: RecurringTransaction,
  second: RecurringTransaction
) {
  const firstPosition =
    getRecurringSortValue(first)

  const secondPosition =
    getRecurringSortValue(second)

  if (
    firstPosition !== secondPosition
  ) {
    return (
      firstPosition -
      secondPosition
    )
  }

  /*
    Quando os modelos ocupam a mesma posição,
    mantém a ordem em que foram criados.
  */
  const firstCreatedAt =
    new Date(
      first.created_at
    ).getTime()

  const secondCreatedAt =
    new Date(
      second.created_at
    ).getTime()

  return (
    firstCreatedAt -
    secondCreatedAt
  )
}

export default function RecurringTransactionsManager() {
  const [userId, setUserId] =
    useState("")

  const [models, setModels] =
    useState<RecurringTransaction[]>([])

  const [
    descriptions,
    setDescriptions
  ] = useState<string[]>([])

  const [payments, setPayments] =
    useState<string[]>([])

  const [cards, setCards] =
    useState<string[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [modalOpen, setModalOpen] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [form, setForm] =
    useState<FormData>({
      ...initialForm
    })

  const [message, setMessage] =
    useState("")

  const [
    errorMessage,
    setErrorMessage
  ] = useState("")

  async function loadModels() {
    setLoading(true)
    setErrorMessage("")

    const { data: authData } =
      await supabase.auth.getUser()

    const user = authData.user

    if (!user) {
      setLoading(false)

      setErrorMessage(
        "Não foi possível identificar o usuário."
      )

      return
    }

    setUserId(user.id)

    const { data, error } =
      await supabase
        .from(
          "recurring_transactions"
        )
        .select("*")
        .eq("user_id", user.id)

    if (error) {
      setErrorMessage(
        `Erro ao carregar os modelos: ${error.message}`
      )

      setModels([])
    } else {
      const loadedModels =
        (data ??
          []) as RecurringTransaction[]

      setModels(
        [...loadedModels].sort(
          sortRecurringModels
        )
      )
    }

    setLoading(false)
  }

  async function loadOptions() {
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
        .order("description"),

      supabase
        .from("payment_methods")
        .select("name")
        .order("name"),

      supabase
        .from("cards")
        .select("name")
        .order("name")
    ])

    const descriptionRows =
      (descriptionsResponse.data ??
        []) as {
        description: string | null
      }[]

    const paymentRows =
      (paymentsResponse.data ??
        []) as {
        name: string | null
      }[]

    const cardRows =
      (cardsResponse.data ??
        []) as {
        name: string | null
      }[]

    setDescriptions(
      uniqueStrings(
        descriptionRows.map(
          (item) => item.description
        )
      )
    )

    setPayments(
      uniqueStrings(
        paymentRows.map(
          (item) => item.name
        )
      )
    )

    setCards(
      uniqueStrings(
        cardRows.map(
          (item) => item.name
        )
      )
    )
  }

  useEffect(() => {
    void loadModels()
    void loadOptions()
  }, [])

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        modalOpen
      ) {
        setModalOpen(false)
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
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return

    const originalOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    return () => {
      document.body.style.overflow =
        originalOverflow
    }
  }, [modalOpen])

  function openNew() {
    setEditingId(null)

    setForm({
      ...initialForm
    })

    setMessage("")
    setErrorMessage("")
    setModalOpen(true)
  }

  function openEdit(
    model: RecurringTransaction
  ) {
    setEditingId(model.id)

    setForm({
      active: model.active,
      type: model.type,

      description:
        model.description ?? "",

      value: formatCurrencyInput(
        model.value ?? 0
      ),

      payment:
        model.payment ?? "",

      card:
        model.card ?? "",

      dateRule: model.date_rule,

      fixedDay: String(
        model.fixed_day ?? 1
      ),

      daysAfterSalary: String(
        model.days_after_salary ?? 1
      ),

      businessDayNumber: String(
        model.business_day_number ?? 1
      )
    })

    setMessage("")
    setErrorMessage("")
    setModalOpen(true)
  }

  function updateForm<
    K extends keyof FormData
  >(
    field: K,
    value: FormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  function validateForm() {
    if (!form.description.trim()) {
      return "Selecione a descrição do modelo."
    }

    const numericValue =
      parseCurrency(form.value)

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      return "Informe um valor válido."
    }

    if (!form.payment) {
      return "Selecione a forma de pagamento."
    }

    if (
      paymentRequiresCard(
        form.payment
      ) &&
      !form.card
    ) {
      return "Selecione o cartão."
    }

    if (
      form.dateRule === "FIXED_DAY"
    ) {
      const fixedDay = Number(
        form.fixedDay
      )

      if (
        !Number.isInteger(fixedDay) ||
        fixedDay < 1 ||
        fixedDay > 31
      ) {
        return "O dia fixo precisa estar entre 1 e 31."
      }
    }

    if (
      form.dateRule ===
      "DAYS_AFTER_SALARY"
    ) {
      const daysAfterSalary =
        Number(
          form.daysAfterSalary
        )

      if (
        !Number.isInteger(
          daysAfterSalary
        ) ||
        daysAfterSalary < 0 ||
        daysAfterSalary > 366
      ) {
        return "A quantidade de dias precisa estar entre 0 e 366."
      }
    }

    if (
      form.dateRule ===
      "BUSINESS_DAY_OF_PERIOD"
    ) {
      const businessDayNumber =
        Number(
          form.businessDayNumber
        )

      if (
        !Number.isInteger(
          businessDayNumber
        ) ||
        businessDayNumber < 1 ||
        businessDayNumber > 31
      ) {
        return "O número do dia útil precisa estar entre 1 e 31."
      }
    }

    return null
  }

  async function saveModel() {
    const validationError =
      validateForm()

    if (validationError) {
      setErrorMessage(
        validationError
      )

      return
    }

    if (!userId) {
      setErrorMessage(
        "Usuário não identificado."
      )

      return
    }

    setSaving(true)
    setErrorMessage("")
    setMessage("")

    const numericValue =
      parseCurrency(form.value)

    const payload = {
      user_id: userId,
      active: form.active,
      type: form.type,

      description:
        form.description
          .trim()
          .toUpperCase(),

      value: numericValue,

      /*
        Todo lançamento gerado por uma
        recorrência começa como previsto.
      */
      status: "PREVISTO",

      payment: form.payment,

      card: paymentRequiresCard(
        form.payment
      )
        ? form.card
        : null,

      installment: null,

      date_rule: form.dateRule,

      fixed_day:
        form.dateRule ===
        "FIXED_DAY"
          ? Number(form.fixedDay)
          : null,

      days_after_salary:
        form.dateRule ===
        "DAYS_AFTER_SALARY"
          ? Number(
              form.daysAfterSalary
            )
          : null,

      business_day_number:
        form.dateRule ===
        "BUSINESS_DAY_OF_PERIOD"
          ? Number(
              form.businessDayNumber
            )
          : null,

      updated_at:
        new Date().toISOString()
    }

    let error

    if (editingId) {
      const response =
        await supabase
          .from(
            "recurring_transactions"
          )
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId)

      error = response.error
    } else {
      const response =
        await supabase
          .from(
            "recurring_transactions"
          )
          .insert(payload)

      error = response.error
    }

    setSaving(false)

    if (error) {
      setErrorMessage(
        `Não foi possível salvar: ${error.message}`
      )

      return
    }

    setModalOpen(false)

    setMessage(
      editingId
        ? "Modelo atualizado com sucesso."
        : "Modelo criado com sucesso."
    )

    await loadModels()
  }

  async function toggleActive(
    model: RecurringTransaction
  ) {
    setErrorMessage("")
    setMessage("")

    const { error } =
      await supabase
        .from(
          "recurring_transactions"
        )
        .update({
          active: !model.active,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", model.id)
        .eq("user_id", userId)

    if (error) {
      setErrorMessage(
        `Não foi possível alterar o modelo: ${error.message}`
      )

      return
    }

    await loadModels()
  }

  async function removeModel(
    model: RecurringTransaction
  ) {
    const confirmed =
      window.confirm(
        `Deseja excluir o modelo "${model.description}"?`
      )

    if (!confirmed) return

    setErrorMessage("")
    setMessage("")

    const { error } =
      await supabase
        .from(
          "recurring_transactions"
        )
        .delete()
        .eq("id", model.id)
        .eq("user_id", userId)

    if (error) {
      setErrorMessage(
        `Não foi possível excluir: ${error.message}`
      )

      return
    }

    setMessage(
      "Modelo excluído com sucesso."
    )

    await loadModels()
  }

  const descriptionOptions =
    uniqueStrings([
      ...descriptions,
      form.description
    ])

  const paymentOptions =
    uniqueStrings([
      ...payments,
      form.payment
    ])

  const cardOptions =
    uniqueStrings([
      ...cards,
      form.card
    ])

  const showCard =
    paymentRequiresCard(
      form.payment
    )

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Repeat2 size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-slate-800">
                Modelos recorrentes
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Cadastre os lançamentos que se repetem nos períodos financeiros.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openNew}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus size={17} />
            Novo modelo
          </button>
        </div>

        {(message ||
          errorMessage) && (
          <div className="space-y-2 px-4 pt-4 sm:px-5">
            {message && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin text-blue-600"
              />

              Carregando modelos...
            </div>
          ) : models.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              <CircleDollarSign
                size={32}
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 font-medium text-slate-700">
                Nenhum modelo recorrente
              </p>

              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                Crie o primeiro modelo para salário, aluguel, internet, reserva ou outra movimentação recorrente.
              </p>

              <button
                type="button"
                onClick={openNew}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Plus size={16} />
                Criar primeiro modelo
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {models.map(
                (model) => (
                  <article
                    key={model.id}
                    className={`rounded-xl border p-4 transition ${
                      model.active
                        ? "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                        : "border-slate-200 bg-slate-50 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold text-slate-800">
                            {
                              model.description
                            }
                          </h3>

                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                              model.type ===
                              "ENTRADA"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {model.type}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                              model.active
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {model.active
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </div>

                        <p
                          className={`mt-2 text-xl font-semibold ${
                            model.type ===
                            "ENTRADA"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            model.value
                          )}
                        </p>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <span className="block text-xs text-slate-400">
                              Regra
                            </span>

                            <span className="mt-0.5 block">
                              {getDateRuleLabel(
                                model.date_rule
                              )}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <span className="block text-xs text-slate-400">
                              Data calculada
                            </span>

                            <span className="mt-0.5 block">
                              {getDateRuleDescription(
                                model
                              )}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2 xl:col-span-1">
                            <span className="block text-xs text-slate-400">
                              Pagamento
                            </span>

                            <span className="mt-0.5 block break-words">
                              {model.payment ||
                                "Não informado"}

                              {model.card
                                ? ` • ${model.card}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-end gap-1 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              model
                            )
                          }
                          className={`rounded-lg p-2 transition ${
                            model.active
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={
                            model.active
                              ? "Desativar"
                              : "Ativar"
                          }
                        >
                          <Power
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              model
                            )
                          }
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Editar"
                        >
                          <Pencil
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeModel(
                              model
                            )
                          }
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-2 sm:p-4"
          onClick={() =>
            setModalOpen(false)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recurring-modal-title"
            className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="recurring-modal-title"
                  className="truncate text-lg font-semibold text-slate-800"
                >
                  {editingId
                    ? "Editar modelo recorrente"
                    : "Novo modelo recorrente"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  O modelo será usado nas gerações futuras.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
              <div className="grid gap-4">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <span className="block text-sm font-medium text-slate-700">
                      Modelo ativo
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Modelos inativos não serão incluídos nas gerações.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      updateForm(
                        "active",
                        event.target
                          .checked
                      )
                    }
                    className="h-5 w-5 shrink-0 accent-blue-600"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Tipo
                    </span>

                    <select
                      value={form.type}
                      onChange={(event) =>
                        updateForm(
                          "type",
                          event.target
                            .value as TransactionType
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="SAÍDA">
                        Saída
                      </option>

                      <option value="ENTRADA">
                        Entrada
                      </option>
                    </select>
                  </label>

                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Status inicial
                    </span>

                    <div className="flex min-h-[42px] items-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700">
                      Previsto
                    </div>
                  </div>
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Descrição
                  </span>

                  <select
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Selecione a descrição
                    </option>

                    {descriptionOptions.map(
                      (description) => (
                        <option
                          key={
                            description
                          }
                          value={
                            description
                          }
                        >
                          {
                            description
                          }
                        </option>
                      )
                    )}
                  </select>

                  {descriptionOptions.length ===
                    0 && (
                    <span className="block text-xs text-amber-600">
                      Cadastre uma descrição em Configurações antes de criar o modelo.
                    </span>
                  )}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Valor
                  </span>

                  <input
                    inputMode="numeric"
                    value={form.value}
                    onChange={(event) =>
                      updateForm(
                        "value",
                        maskCurrencyInput(
                          event.target
                            .value
                        )
                      )
                    }
                    placeholder="R$ 0,00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <span className="block text-xs text-slate-500">
                    O valor poderá ser alterado posteriormente no lançamento gerado.
                  </span>
                </label>

                <div
                  className={`grid gap-4 ${
                    showCard
                      ? "sm:grid-cols-2"
                      : ""
                  }`}
                >
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Forma de pagamento
                    </span>

                    <select
                      value={
                        form.payment
                      }
                      onChange={(
                        event
                      ) => {
                        const newPayment =
                          event.target
                            .value

                        updateForm(
                          "payment",
                          newPayment
                        )

                        if (
                          !paymentRequiresCard(
                            newPayment
                          )
                        ) {
                          updateForm(
                            "card",
                            ""
                          )
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        Selecione a forma de pagamento
                      </option>

                      {paymentOptions.map(
                        (payment) => (
                          <option
                            key={payment}
                            value={
                              payment
                            }
                          >
                            {payment}
                          </option>
                        )
                      )}
                    </select>

                    {paymentOptions.length ===
                      0 && (
                      <span className="block text-xs text-amber-600">
                        Cadastre uma forma de pagamento em Configurações.
                      </span>
                    )}
                  </label>

                  {showCard && (
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">
                        Cartão
                      </span>

                      <select
                        value={
                          form.card
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "card",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">
                          Selecione o cartão
                        </option>

                        {cardOptions.map(
                          (card) => (
                            <option
                              key={card}
                              value={card}
                            >
                              {card}
                            </option>
                          )
                        )}
                      </select>

                      {cardOptions.length ===
                        0 && (
                        <span className="block text-xs text-amber-600">
                          Cadastre um cartão em Configurações.
                        </span>
                      )}
                    </label>
                  )}
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Regra da data
                  </span>

                  <select
                    value={
                      form.dateRule
                    }
                    onChange={(event) =>
                      updateForm(
                        "dateRule",
                        event.target
                          .value as DateRule
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="FIXED_DAY">
                      Dia fixo do mês
                    </option>

                    <option value="SALARY_DAY">
                      No dia do salário
                    </option>

                    <option value="DAYS_AFTER_SALARY">
                      X dias depois do salário
                    </option>

                    <option value="BUSINESS_DAY_OF_PERIOD">
                      N-ésimo dia útil do período
                    </option>

                    <option value="LAST_DAY_OF_PERIOD">
                      Último dia do período financeiro
                    </option>
                  </select>
                </label>

                {form.dateRule ===
                  "FIXED_DAY" && (
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Dia do mês
                    </span>

                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={
                        form.fixedDay
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "fixedDay",
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <span className="block text-xs text-slate-500">
                      O sistema localizará esse dia dentro do período financeiro.
                    </span>
                  </label>
                )}

                {form.dateRule ===
                  "DAYS_AFTER_SALARY" && (
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Dias depois do salário
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={366}
                      value={
                        form.daysAfterSalary
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "daysAfterSalary",
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <span className="block text-xs text-slate-500">
                      A contagem será feita em dias corridos.
                    </span>
                  </label>
                )}

                {form.dateRule ===
                  "BUSINESS_DAY_OF_PERIOD" && (
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Número do dia útil
                    </span>

                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={
                        form.businessDayNumber
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "businessDayNumber",
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <span className="block text-xs text-slate-500">
                      Finais de semana e feriados serão ignorados.
                    </span>
                  </label>
                )}

                {form.dateRule ===
                  "SALARY_DAY" && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    O lançamento será criado na data inicial do período financeiro.
                  </div>
                )}

                {form.dateRule ===
                  "LAST_DAY_OF_PERIOD" && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    O lançamento será criado na data final do período financeiro.
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveModel}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={17} />
                )}

                {editingId
                  ? "Salvar alterações"
                  : "Criar modelo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}