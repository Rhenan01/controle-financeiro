"use client"

import {
  useEffect,
  useRef,
  useState
} from "react"

import {
  CalendarClock,
  Check,
  CircleAlert,
  Eye,
  Loader2,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

type DateRule =
  | "FIXED_DAY"
  | "SALARY_DAY"
  | "DAYS_AFTER_SALARY"
  | "BUSINESS_DAY_OF_PERIOD"
  | "LAST_DAY_OF_PERIOD"

type TransactionType =
  | "ENTRADA"
  | "SAÍDA"

type RecurringTransaction = {
  id: string
  user_id: string
  active: boolean
  type: TransactionType
  description: string
  value: number | string
  status: string | null
  payment: string | null
  card: string | null
  installment: string | null
  date_rule: DateRule
  fixed_day: number | null
  days_after_salary: number | null
  business_day_number: number | null
  created_at: string
}

type SalaryDay = {
  id: string
  payment_date: string
}

type FinancialPeriod = {
  start: string
  end: string
  label: string
}

type PreviewItem = {
  model: RecurringTransaction
  calculatedDate: string | null
  alreadyGenerated: boolean
  error: string | null
}

type HolidayRouteResponse = {
  holidays?: {
    date: string
    name?: string
    type?: string
  }[]
  error?: string
}

function parseISODate(date: string) {
  const [year, month, day] =
    date.split("-").map(Number)

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  )
}

function toISODate(date: Date) {
  return date
    .toISOString()
    .slice(0, 10)
}

function formatDate(date: string) {
  const [year, month, day] =
    date.split("-")

  return `${day}/${month}/${year}`
}

function formatCurrency(
  value: number | string
) {
  const numericValue = Number(value)

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  ).format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  )
}

function addDays(
  dateString: string,
  quantity: number
) {
  const date =
    parseISODate(dateString)

  date.setUTCDate(
    date.getUTCDate() + quantity
  )

  return toISODate(date)
}

function getTodayISO() {
  const today = new Date()

  const year =
    today.getFullYear()

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0")

  const day = String(
    today.getDate()
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getPeriodMonthLabel(
  periodStart: string,
  periodEnd: string
) {
  const start = parseISODate(periodStart)
  const end = parseISODate(periodEnd)

  // Usa o ponto central do período para identificar
  // a qual mês financeiro ele pertence.
  //
  // Exemplo:
  // Casa: 01/07 até 02/08 -> Julho
  // Rhenan: 30/07 até 29/08 -> Agosto

  const middleTimestamp =
    start.getTime() +
    (end.getTime() - start.getTime()) / 2

  const referenceDate =
    new Date(middleTimestamp)

  const formatted =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }
    ).format(referenceDate)

  return (
    formatted.charAt(0).toUpperCase() +
    formatted.slice(1)
  )
}

function buildFinancialPeriods(
  salaryDays: SalaryDay[]
) {
  const dates = salaryDays
    .map(
      (item) => item.payment_date
    )
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b)
    )

  const uniqueDates =
    Array.from(new Set(dates))

  const periods: FinancialPeriod[] =
    []

  for (
    let index = 0;
    index < uniqueDates.length - 1;
    index++
  ) {
    const start =
      uniqueDates[index]

    const nextStart =
      uniqueDates[index + 1]

    const end = addDays(
      nextStart,
      -1
    )

    periods.push({
      start,
      end,
      label:
        getPeriodMonthLabel(start, end)
    })
  }

  return periods
}

function findDefaultPeriod(
  periods: FinancialPeriod[]
) {
  const today = getTodayISO()

  const current =
    periods.find(
      (period) =>
        today >= period.start &&
        today <= period.end
    )

  if (current) {
    return current
  }

  const next =
    periods.find(
      (period) =>
        period.start > today
    )

  if (next) {
    return next
  }

  return (
    periods[
      periods.length - 1
    ] ?? null
  )
}

function isWeekend(date: Date) {
  const weekday =
    date.getUTCDay()

  return (
    weekday === 0 ||
    weekday === 6
  )
}

function getYearsFromPeriod(
  period: FinancialPeriod
) {
  const startYear =
    parseISODate(
      period.start
    ).getUTCFullYear()

  const endYear =
    parseISODate(
      period.end
    ).getUTCFullYear()

  const years: number[] = []

  for (
    let year = startYear;
    year <= endYear;
    year++
  ) {
    years.push(year)
  }

  return years
}

function findFixedDayInPeriod(
  period: FinancialPeriod,
  fixedDay: number
) {
  const current =
    parseISODate(period.start)

  const end =
    parseISODate(period.end)

  while (current <= end) {
    if (
      current.getUTCDate() ===
      fixedDay
    ) {
      return toISODate(
        current
      )
    }

    current.setUTCDate(
      current.getUTCDate() + 1
    )
  }

  return null
}

function findBusinessDayInPeriod(
  period: FinancialPeriod,
  businessDayNumber: number,
  holidayDates: Set<string>
) {
  const current =
    parseISODate(period.start)

  const end =
    parseISODate(period.end)

  let counter = 0

  while (current <= end) {
    const currentISO =
      toISODate(current)

    const isHoliday =
      holidayDates.has(
        currentISO
      )

    if (
      !isWeekend(current) &&
      !isHoliday
    ) {
      counter++

      if (
        counter ===
        businessDayNumber
      ) {
        return currentISO
      }
    }

    current.setUTCDate(
      current.getUTCDate() + 1
    )
  }

  return null
}

function calculateModelDate(
  model: RecurringTransaction,
  period: FinancialPeriod,
  holidayDates: Set<string>
) {
  if (
    model.date_rule ===
    "SALARY_DAY"
  ) {
    return {
      date: period.start,
      error: null
    }
  }

  if (
    model.date_rule ===
    "LAST_DAY_OF_PERIOD"
  ) {
    return {
      date: period.end,
      error: null
    }
  }

  if (
    model.date_rule ===
    "DAYS_AFTER_SALARY"
  ) {
    const quantity =
      model.days_after_salary ?? 0

    const calculatedDate =
      addDays(
        period.start,
        quantity
      )

    if (
      calculatedDate >
      period.end
    ) {
      return {
        date: null,
        error:
          "A data calculada ficou fora do período financeiro."
      }
    }

    return {
      date: calculatedDate,
      error: null
    }
  }

  if (
    model.date_rule ===
    "FIXED_DAY"
  ) {
    const fixedDay =
      model.fixed_day ?? 1

    const calculatedDate =
      findFixedDayInPeriod(
        period,
        fixedDay
      )

    if (!calculatedDate) {
      return {
        date: null,
        error:
          `O dia ${fixedDay} não existe dentro deste período.`
      }
    }

    return {
      date: calculatedDate,
      error: null
    }
  }

  const businessDayNumber =
    model.business_day_number ?? 1

  const calculatedDate =
    findBusinessDayInPeriod(
      period,
      businessDayNumber,
      holidayDates
    )

  if (!calculatedDate) {
    return {
      date: null,
      error:
        `O período não possui ${businessDayNumber} dias úteis.`
    }
  }

  return {
    date: calculatedDate,
    error: null
  }
}

function sortPreviewItems(
  first: PreviewItem,
  second: PreviewItem
) {
  if (
    !first.calculatedDate &&
    second.calculatedDate
  ) {
    return 1
  }

  if (
    first.calculatedDate &&
    !second.calculatedDate
  ) {
    return -1
  }

  if (
    first.calculatedDate &&
    second.calculatedDate &&
    first.calculatedDate !==
      second.calculatedDate
  ) {
    return first.calculatedDate
      .localeCompare(
        second.calculatedDate
      )
  }

  return (
    new Date(
      first.model.created_at
    ).getTime() -
    new Date(
      second.model.created_at
    ).getTime()
  )
}

export default function RecurringPeriodGenerator() {
  const [userId, setUserId] =
    useState("")

  const [periods, setPeriods] =
    useState<FinancialPeriod[]>([])

  const [
    selectedPeriodStart,
    setSelectedPeriodStart
  ] = useState("")

  const [
    customHolidayDates,
    setCustomHolidayDates
  ] = useState<string[]>([])

  const [
    previewItems,
    setPreviewItems
  ] = useState<PreviewItem[]>([])

  const [
    selectedModelIds,
    setSelectedModelIds
  ] = useState<string[]>([])

  const [loading, setLoading] =
    useState(true)

  const [
    previewLoading,
    setPreviewLoading
  ] = useState(false)

  const [
    generating,
    setGenerating
  ] = useState(false)

  const [
    previewVisible,
    setPreviewVisible
  ] = useState(false)

  const [message, setMessage] =
    useState("")

  const [
    errorMessage,
    setErrorMessage
  ] = useState("")

  const holidayCache = useRef<
    Map<number, Set<string>>
  >(new Map())

  const selectedPeriod =
    periods.find(
      (period) =>
        period.start ===
        selectedPeriodStart
    ) ?? null

  async function loadInitialData() {
    setLoading(true)
    setErrorMessage("")

    const { data: authData } =
      await supabase.auth.getUser()

    const user = authData.user

    if (!user) {
      setErrorMessage(
        "Não foi possível identificar o usuário."
      )

      setLoading(false)
      return
    }

    setUserId(user.id)

    const [
      salaryDaysResponse,
      customHolidaysResponse
    ] = await Promise.all([
      supabase
        .from("salary_days")
        .select(
          "id, payment_date"
        )
        .eq("user_id", user.id)
        .order("payment_date"),

      supabase
        .from(
          "custom_holidays"
        )
        .select("holiday_date")
        .eq("user_id", user.id)
        .order("holiday_date")
    ])

    if (
      salaryDaysResponse.error
    ) {
      setErrorMessage(
        `Erro ao carregar os períodos: ${salaryDaysResponse.error.message}`
      )

      setLoading(false)
      return
    }

    const generatedPeriods =
      buildFinancialPeriods(
        (salaryDaysResponse.data ??
          []) as SalaryDay[]
      )

    setPeriods(generatedPeriods)

    const defaultPeriod =
      findDefaultPeriod(
        generatedPeriods
      )

    setSelectedPeriodStart(
      defaultPeriod?.start ?? ""
    )

    if (
      customHolidaysResponse.data
    ) {
      setCustomHolidayDates(
        customHolidaysResponse.data
          .map(
            (item) =>
              item.holiday_date
          )
          .filter(Boolean)
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function getApiHolidays(
    year: number
  ) {
    const cached =
      holidayCache.current.get(
        year
      )

    if (cached) {
      return cached
    }

    const response = await fetch(
      `/api/feriados/${year}`
    )

    const payload =
      (await response
        .json()
        .catch(() => null)) as HolidayRouteResponse | null

    if (!response.ok) {
      throw new Error(
        payload?.error ||
          `Não foi possível consultar os feriados de ${year}.`
      )
    }

    const dates = new Set(
      (payload?.holidays ?? [])
        .map(
          (holiday) =>
            holiday.date
        )
        .filter(Boolean)
    )

    holidayCache.current.set(
      year,
      dates
    )

    return dates
  }

  async function getHolidayDates(
    period: FinancialPeriod
  ) {
    const holidayDates =
      new Set(
        customHolidayDates
      )

    const years =
      getYearsFromPeriod(period)

    for (const year of years) {
      const apiDates =
        await getApiHolidays(
          year
        )

      apiDates.forEach(
        (date) =>
          holidayDates.add(date)
      )
    }

    return holidayDates
  }

  async function buildPreview(
    period: FinancialPeriod,
    clearFeedback = true
  ) {
    if (!userId) return

    setPreviewLoading(true)
    setPreviewVisible(true)

    if (clearFeedback) {
      setMessage("")
      setErrorMessage("")
    }

    try {
      const [
        modelsResponse,
        generatedResponse,
        holidayDates
      ] = await Promise.all([
        supabase
          .from(
            "recurring_transactions"
          )
          .select("*")
          .eq("user_id", userId)
          .eq("active", true),

        supabase
          .from("transactions")
          .select(
            "recurring_transaction_id"
          )
          .eq("user_id", userId)
          .eq(
            "financial_period_start",
            period.start
          )
          .not(
            "recurring_transaction_id",
            "is",
            null
          ),

        getHolidayDates(period)
      ])

      if (modelsResponse.error) {
        throw modelsResponse.error
      }

      if (
        generatedResponse.error
      ) {
        throw generatedResponse.error
      }

      const models =
        (modelsResponse.data ??
          []) as RecurringTransaction[]

      const generatedIds =
        new Set(
          (
            generatedResponse.data ??
            []
          )
            .map(
              (item) =>
                item.recurring_transaction_id
            )
            .filter(Boolean)
        )

      const items =
        models
          .map((model) => {
            const calculation =
              calculateModelDate(
                model,
                period,
                holidayDates
              )

            return {
              model,
              calculatedDate:
                calculation.date,
              error:
                calculation.error,
              alreadyGenerated:
                generatedIds.has(
                  model.id
                )
            }
          })
          .sort(
            sortPreviewItems
          )

      setPreviewItems(items)

      setSelectedModelIds(
        items
          .filter(
            (item) =>
              Boolean(
                item.calculatedDate
              ) &&
              !item.error &&
              !item.alreadyGenerated
          )
          .map(
            (item) =>
              item.model.id
          )
      )
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : "Erro desconhecido."

      setPreviewItems([])
      setSelectedModelIds([])

      setErrorMessage(
        `Não foi possível montar a prévia: ${text}`
      )
    } finally {
      setPreviewLoading(false)
    }
  }

  function handlePeriodChange(
    start: string
  ) {
    setSelectedPeriodStart(start)
    setPreviewVisible(false)
    setPreviewItems([])
    setSelectedModelIds([])
    setMessage("")
    setErrorMessage("")
  }

  function toggleModel(
    modelId: string
  ) {
    setSelectedModelIds(
      (current) => {
        if (
          current.includes(
            modelId
          )
        ) {
          return current.filter(
            (id) =>
              id !== modelId
          )
        }

        return [
          ...current,
          modelId
        ]
      }
    )
  }

  const selectableItems =
    previewItems.filter(
      (item) =>
        Boolean(
          item.calculatedDate
        ) &&
        !item.error &&
        !item.alreadyGenerated
    )

  const allSelectableSelected =
    selectableItems.length > 0 &&
    selectableItems.every(
      (item) =>
        selectedModelIds.includes(
          item.model.id
        )
    )

  function toggleAll() {
    if (
      allSelectableSelected
    ) {
      setSelectedModelIds([])
      return
    }

    setSelectedModelIds(
      selectableItems.map(
        (item) =>
          item.model.id
      )
    )
  }

  const selectedItems =
    previewItems.filter(
      (item) =>
        selectedModelIds.includes(
          item.model.id
        ) &&
        item.calculatedDate &&
        !item.error &&
        !item.alreadyGenerated
    )

  const selectedIncome =
    selectedItems
      .filter(
        (item) =>
          item.model.type ===
          "ENTRADA"
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.model.value
          ),
        0
      )

  const selectedExpenses =
    selectedItems
      .filter(
        (item) =>
          item.model.type ===
          "SAÍDA"
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.model.value
          ),
        0
      )

  async function generateTransactions() {
    if (
      !selectedPeriod ||
      !userId
    ) {
      return
    }

    if (
      selectedItems.length === 0
    ) {
      setErrorMessage(
        "Selecione pelo menos um lançamento válido."
      )

      return
    }

    setGenerating(true)
    setMessage("")
    setErrorMessage("")

    const rows =
      selectedItems.map(
        (item) => ({
          user_id: userId,
          date:
            item.calculatedDate,
          type:
            item.model.type,
          description:
            item.model.description,
          value:
            Number(
              item.model.value
            ),
          status: "PREVISTO",
          payment:
            item.model.payment,
          card:
            item.model.card,
          installment: null,
          related_transaction_id:
            null,
          related_transaction_role:
            null,
          recurring_transaction_id:
            item.model.id,
          financial_period_start:
            selectedPeriod.start,
          financial_period_end:
            selectedPeriod.end
        })
      )

    const { error } =
      await supabase
        .from("transactions")
        .insert(rows)

    setGenerating(false)

    if (error) {
      if (
        error.code === "23505"
      ) {
        setErrorMessage(
          "Um ou mais modelos já foram gerados para este período."
        )
      } else {
        setErrorMessage(
          `Não foi possível gerar os lançamentos: ${error.message}`
        )
      }

      return
    }

    setMessage(
      `${rows.length} lançamento(s) gerado(s) com sucesso.`
    )

    await buildPreview(
      selectedPeriod,
      false
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CalendarClock
            size={20}
          />
        </div>

        <div className="min-w-0">
          <h2 className="font-semibold text-slate-800">
            Gerar período financeiro
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Confira as datas e os valores antes de gerar os lançamentos.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2
              size={20}
              className="animate-spin text-blue-600"
            />

            Carregando períodos...
          </div>
        ) : periods.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Cadastre pelo menos duas datas de salário em Configurações para formar um período financeiro.
          </div>
        ) : (
          <>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Período financeiro
              </span>

              <select
                value={
                  selectedPeriodStart
                }
                onChange={(event) =>
                  handlePeriodChange(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {periods.map((period) => (
                    <option
                      key={
                        period.start
                      }
                      value={
                        period.start
                      }
                    >
                      {period.label} —{" "}
                      {formatDate(
                        period.start
                      )} a{" "}
                      {formatDate(
                        period.end
                      )}
                    </option>
                  ))}
              </select>
            </label>

            <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                if (selectedPeriod) {
                  void buildPreview(
                    selectedPeriod
                  )
                }
              }}
              disabled={
                !selectedPeriod ||
                previewLoading
              }
              className="
                inline-flex w-full
                items-center justify-center
                gap-2 rounded-lg
                bg-slate-800 px-4 py-3
                text-sm font-medium text-white
                transition
                hover:bg-slate-900
                disabled:cursor-not-allowed
                disabled:bg-slate-300
              "
            >
              {previewLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Eye size={17} />
              )}

              {previewLoading
                ? "Calculando prévia..."
                : "Visualizar prévia"}
            </button>
          </div>
          </>
        )}

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

        {previewVisible &&
          !previewLoading && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Prévia dos lançamentos
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Desmarque o que não deve ser gerado neste período.
                  </p>
                </div>

                {selectableItems.length >
                  0 && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={
                        allSelectableSelected
                      }
                      onChange={
                        toggleAll
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    Selecionar todos
                  </label>
                )}
              </div>

              {previewItems.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Nenhum modelo ativo foi encontrado.
                </div>
              ) : (
                <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                  {previewItems.map(
                    (item) => {
                      const disabled =
                        Boolean(
                          item.error
                        ) ||
                        item.alreadyGenerated ||
                        !item.calculatedDate

                      return (
                        <label
                          key={
                            item.model.id
                          }
                          className={`flex gap-3 rounded-xl border p-3 transition ${
                            item.alreadyGenerated
                              ? "cursor-not-allowed border-emerald-100 bg-emerald-50"
                              : item.error
                                ? "cursor-not-allowed border-red-100 bg-red-50"
                                : "cursor-pointer border-slate-200 bg-white hover:border-blue-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedModelIds.includes(
                                item.model.id
                              )
                            }
                            disabled={
                              disabled
                            }
                            onChange={() =>
                              toggleModel(
                                item.model.id
                              )
                            }
                            className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="block break-words text-sm font-semibold text-slate-800">
                                  {
                                    item
                                      .model
                                      .description
                                  }
                                </span>

                                <span className="mt-0.5 block text-xs text-slate-500">
                                  {item.calculatedDate
                                    ? formatDate(
                                        item.calculatedDate
                                      )
                                    : "Data não calculada"}
                                </span>
                              </div>

                              <span
                                className={`shrink-0 text-sm font-semibold ${
                                  item.model
                                    .type ===
                                  "ENTRADA"
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(
                                  item
                                    .model
                                    .value
                                )}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                              <span
                                className={`rounded-full px-2 py-1 font-medium ${
                                  item.model
                                    .type ===
                                  "ENTRADA"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {
                                  item
                                    .model
                                    .type
                                }
                              </span>

                              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                                {item.model
                                  .payment ||
                                  "Sem pagamento"}
                              </span>

                              {item.model
                                .card && (
                                <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                                  {
                                    item
                                      .model
                                      .card
                                  }
                                </span>
                              )}

                              {item.alreadyGenerated && (
                                <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700">
                                  Já gerado
                                </span>
                              )}
                            </div>

                            {item.error && (
                              <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                                <CircleAlert
                                  size={14}
                                  className="mt-0.5 shrink-0"
                                />

                                <span>
                                  {
                                    item.error
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                      )
                    }
                  )}
                </div>
              )}

              {previewItems.length >
                0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 px-3 py-3">
                    <span className="block text-xs text-emerald-600">
                      Entradas selecionadas
                    </span>

                    <span className="mt-1 block font-semibold text-emerald-700">
                      {formatCurrency(
                        selectedIncome
                      )}
                    </span>
                  </div>

                  <div className="rounded-xl bg-red-50 px-3 py-3">
                    <span className="block text-xs text-red-600">
                      Saídas selecionadas
                    </span>

                    <span className="mt-1 block font-semibold text-red-700">
                      {formatCurrency(
                        selectedExpenses
                      )}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  void generateTransactions()
                }
                disabled={
                  generating ||
                  selectedItems.length === 0
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {generating ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={17}
                  />
                )}

                {generating
                  ? "Gerando..."
                  : `Gerar ${selectedItems.length} lançamento(s)`}
              </button>
            </div>
          )}
      </div>
    </section>
  )
}