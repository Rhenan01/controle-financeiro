"use client"
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { supabase } from "@/lib/supabase"
import {
  CalendarPlus,
  Loader2,
  Pencil,
  Save,
  Trash2
} from "lucide-react"
type AdjustmentRule =
  | "PREVIOUS_BUSINESS_DAY"
  | "NEXT_BUSINESS_DAY"
  | "NO_ADJUSTMENT"
type SalaryDay = {
  id: string
  payment_date: string
}
type CustomHoliday = {
  id: string
  holiday_date: string
  name: string
}
type NationalHoliday = {
  date: string
  name: string
  type?: string
  banking?: boolean
}
type HolidayRouteResponse = {
  holidays?: NationalHoliday[]
  error?: string
}
function formatDate(date: string) {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}
function formatHolidayType(type?: string) {
  if (!type) return "Oficial"
  const normalized = type
    .replaceAll("_", " ")
    .toLocaleLowerCase("pt-BR")
  return normalized.replace(
    /(^|\s)\S/g,
    (letter) => letter.toUpperCase()
  )
}
function holidayTypeClass(type?: string) {
  const normalized =
    type?.toLocaleLowerCase("pt-BR") ?? ""
  if (normalized.includes("municipal")) {
    return "bg-purple-100 text-purple-700"
  }
  if (normalized.includes("estadual")) {
    return "bg-orange-100 text-orange-700"
  }
  if (normalized.includes("nacional")) {
    return "bg-blue-100 text-blue-700"
  }
  return "bg-slate-100 text-slate-700"
}
function parseISODate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number)
  return new Date(
    Date.UTC(year, month - 1, day)
  )
}
function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}
function getDaysInMonth(
  year: number,
  monthIndex: number
) {
  return new Date(
    Date.UTC(year, monthIndex + 1, 0)
  ).getUTCDate()
}
function addMonths(
  year: number,
  monthIndex: number,
  quantity: number
) {
  const date = new Date(
    Date.UTC(year, monthIndex + quantity, 1)
  )
  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth()
  }
}
function isWeekend(date: Date) {
  const weekday = date.getUTCDay()
  return weekday === 0 || weekday === 6
}
export default function SalaryDaysTable() {
  const [userId, setUserId] = useState("")
  const [days, setDays] = useState<SalaryDay[]>([])
  const [customHolidays, setCustomHolidays] =
    useState<CustomHoliday[]>([])
  const currentYear = new Date().getFullYear()
  const [holidayYear, setHolidayYear] =
    useState(currentYear)
  const [apiHolidays, setApiHolidays] =
    useState<NationalHoliday[]>([])
  const [loadingApiHolidays, setLoadingApiHolidays] =
    useState(false)
  const [apiHolidayError, setApiHolidayError] =
    useState("")
  const [baseDay, setBaseDay] = useState(30)
  const [adjustmentRule, setAdjustmentRule] =
    useState<AdjustmentRule>(
      "PREVIOUS_BUSINESS_DAY"
    )
  const [modalOpen, setModalOpen] =
    useState(false)
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [input, setInput] = useState("")
  const [holidayDate, setHolidayDate] =
    useState("")
  const [holidayName, setHolidayName] =
    useState("")
  const [loading, setLoading] = useState(true)
  const [savingRule, setSavingRule] =
    useState(false)
  const [generating, setGenerating] =
    useState(false)
  const [message, setMessage] = useState("")
  /*
    Evita consultar várias vezes os feriados
    nacionais do mesmo ano.
  */
  const nationalHolidayCache = useRef<
    Map<number, Set<string>>
  >(new Map())
  async function loadData() {
    setLoading(true)
    setMessage("")
    const { data: authData } =
      await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)
    const [
      salaryDaysResponse,
      settingsResponse,
      customHolidaysResponse
    ] = await Promise.all([
      supabase
        .from("salary_days")
        .select("id, payment_date")
        .order("payment_date"),
      supabase
        .from("salary_settings")
        .select(
          "base_day, adjustment_rule"
        )
        .eq("user_id", user.id)
        .limit(1),
      supabase
        .from("custom_holidays")
        .select("id, holiday_date, name")
        .eq("user_id", user.id)
        .order("holiday_date")
    ])
    if (salaryDaysResponse.data) {
      setDays(
        salaryDaysResponse.data as SalaryDay[]
      )
    }
    const settings =
      settingsResponse.data?.[0]
    if (settings) {
      setBaseDay(settings.base_day ?? 30)
      setAdjustmentRule(
        settings.adjustment_rule ??
          "PREVIOUS_BUSINESS_DAY"
      )
    }
    if (customHolidaysResponse.data) {
      setCustomHolidays(
        customHolidaysResponse.data as CustomHoliday[]
      )
    }
    setLoading(false)
  }
  async function loadDays() {
    const { data } = await supabase
      .from("salary_days")
      .select("id, payment_date")
      .order("payment_date")
    if (data) {
      setDays(data as SalaryDay[])
    }
  }
  async function loadCustomHolidays() {
    if (!userId) return
    const { data } = await supabase
      .from("custom_holidays")
      .select("id, holiday_date, name")
      .eq("user_id", userId)
      .order("holiday_date")
    if (data) {
      setCustomHolidays(
        data as CustomHoliday[]
      )
    }
  }
  async function loadApiHolidays(year: number) {
    setLoadingApiHolidays(true)
    setApiHolidayError("")
    try {
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
      const uniqueHolidays = Array.from(
        new Map(
          (payload?.holidays ?? [])
            .filter((holiday) => Boolean(holiday.date))
            .map((holiday) => {
              const uniqueKey = [
                holiday.date,
                holiday.name,
                holiday.type ?? "OFICIAL",
                holiday.banking ? "BANKING" : "NOT_BANKING"
              ].join("|")
              return [uniqueKey, holiday] as const
            })
        ).values()
      ).sort((a, b) =>
        a.date.localeCompare(b.date)
      )
      setApiHolidays(uniqueHolidays)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido."
      setApiHolidays([])
      setApiHolidayError(errorMessage)
    } finally {
      setLoadingApiHolidays(false)
    }
  }
  useEffect(() => {
    loadData()
  }, [])
  useEffect(() => {
    loadApiHolidays(holidayYear)
  }, [holidayYear])
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalOpen(false)
      }
    }
    window.addEventListener(
      "keydown",
      handleEsc
    )
    return () => {
      window.removeEventListener(
        "keydown",
        handleEsc
      )
    }
  }, [])
  const customHolidayDates = useMemo(() => {
    return new Set(
      customHolidays.map(
        (holiday) => holiday.holiday_date
      )
    )
  }, [customHolidays])
  async function getNationalHolidays(
    year: number
  ) {
    const cached =
      nationalHolidayCache.current.get(year)
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
    const holidayDates = new Set(
      (payload?.holidays ?? []).map(
        (holiday) => holiday.date
      )
    )
    nationalHolidayCache.current.set(
      year,
      holidayDates
    )
    return holidayDates
  }
  async function isBusinessDay(date: Date) {
    if (isWeekend(date)) {
      return false
    }
    const isoDate = toISODate(date)
    if (customHolidayDates.has(isoDate)) {
      return false
    }
    const nationalHolidays =
      await getNationalHolidays(
        date.getUTCFullYear()
      )
    return !nationalHolidays.has(isoDate)
  }
  async function calculatePaymentDate(
    year: number,
    monthIndex: number
  ) {
    const day = Math.min(
      baseDay,
      getDaysInMonth(year, monthIndex)
    )
    const date = new Date(
      Date.UTC(year, monthIndex, day)
    )
    if (
      adjustmentRule === "NO_ADJUSTMENT"
    ) {
      return toISODate(date)
    }
    const direction =
      adjustmentRule ===
      "PREVIOUS_BUSINESS_DAY"
        ? -1
        : 1
    /*
      Limite de segurança para impedir um loop
      infinito em caso de erro inesperado.
    */
    for (
      let attempts = 0;
      attempts < 40;
      attempts++
    ) {
      if (await isBusinessDay(date)) {
        return toISODate(date)
      }
      date.setUTCDate(
        date.getUTCDate() + direction
      )
    }
    throw new Error(
      "Não foi possível encontrar um dia útil."
    )
  }
  function getFirstMonthToGenerate() {
    if (days.length > 0) {
      const lastDate = parseISODate(
        days[days.length - 1].payment_date
      )
      return addMonths(
        lastDate.getUTCFullYear(),
        lastDate.getUTCMonth(),
        1
      )
    }
    const today = new Date()
    const currentYear =
      today.getFullYear()
    const currentMonth =
      today.getMonth()
    /*
      Quando ainda não existe nenhuma data,
      usa o mês atual se o dia-base ainda não
      passou. Caso contrário, começa no próximo.
    */
    if (today.getDate() <= baseDay) {
      return {
        year: currentYear,
        monthIndex: currentMonth
      }
    }
    return addMonths(
      currentYear,
      currentMonth,
      1
    )
  }
  async function saveRule() {
    if (!userId) return
    if (baseDay < 1 || baseDay > 31) {
      setMessage(
        "O dia-base precisa estar entre 1 e 31."
      )
      return
    }
    setSavingRule(true)
    setMessage("")
    const { error } = await supabase
      .from("salary_settings")
      .upsert(
        {
          user_id: userId,
          base_day: baseDay,
          adjustment_rule:
            adjustmentRule,
          /*
            Esses campos ficam preparados para
            uma futura importação de feriados
            estaduais e municipais.
          */
          state_code: "RJ",
          city_name: "Rio de Janeiro",
          updated_at:
            new Date().toISOString()
        },
        {
          onConflict: "user_id"
        }
      )
    setSavingRule(false)
    if (error) {
      setMessage(
        `Erro ao salvar a regra: ${error.message}`
      )
      return
    }
    setMessage(
      "Regra de pagamento salva com sucesso."
    )
  }
  async function generatePayments(
    quantity: number
  ) {
    if (!userId) return
    if (baseDay < 1 || baseDay > 31) {
      setMessage(
        "O dia-base precisa estar entre 1 e 31."
      )
      return
    }
    setGenerating(true)
    setMessage("")
    try {
      /*
        Salva a regra antes da geração para que
        a configuração usada fique registrada.
      */
      const { error: settingsError } =
        await supabase
          .from("salary_settings")
          .upsert(
            {
              user_id: userId,
              base_day: baseDay,
              adjustment_rule:
                adjustmentRule,
              state_code: "RJ",
              city_name: "Rio de Janeiro",
              updated_at:
                new Date().toISOString()
            },
            {
              onConflict: "user_id"
            }
          )
      if (settingsError) {
        throw settingsError
      }
      const firstMonth =
        getFirstMonthToGenerate()
      const generatedDates: string[] = []
      for (
        let index = 0;
        index < quantity;
        index++
      ) {
        const targetMonth = addMonths(
          firstMonth.year,
          firstMonth.monthIndex,
          index
        )
        const calculatedDate =
          await calculatePaymentDate(
            targetMonth.year,
            targetMonth.monthIndex
          )
        generatedDates.push(calculatedDate)
      }
      const existingDates = new Set(
        days.map((day) => day.payment_date)
      )
      const newDates = generatedDates.filter(
        (date) => !existingDates.has(date)
      )
      if (newDates.length === 0) {
        setMessage(
          "Todas as datas calculadas já estavam cadastradas."
        )
        setGenerating(false)
        return
      }
      /*
        O índice único criado no Supabase impede
        datas duplicadas. O upsert ignora uma
        eventual duplicidade causada por dois
        cliques muito próximos.
      */
      const { error } = await supabase
        .from("salary_days")
        .upsert(
          newDates.map((paymentDate) => ({
            user_id: userId,
            payment_date: paymentDate
          })),
          {
            onConflict:
              "user_id,payment_date",
            ignoreDuplicates: true
          }
        )
      if (error) {
        throw error
      }
      await loadDays()
      if (newDates.length === 1) {
        setMessage(
          `Pagamento gerado para ${formatDate(
            newDates[0]
          )}.`
        )
      } else {
        setMessage(
          `${newDates.length} pagamentos foram gerados com sucesso.`
        )
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido."
      setMessage(
        `Não foi possível gerar as datas: ${errorMessage}`
      )
    } finally {
      setGenerating(false)
    }
  }
  function openNew() {
    setInput("")
    setEditingId(null)
    setModalOpen(true)
  }
  function openEdit(day: SalaryDay) {
    setInput(day.payment_date)
    setEditingId(day.id)
    setModalOpen(true)
  }
  async function saveManualDate() {
    if (!input || !userId) return
    setMessage("")
    if (editingId) {
      const { error } = await supabase
        .from("salary_days")
        .update({
          payment_date: input
        })
        .eq("id", editingId)
      if (error) {
        setMessage(
          error.code === "23505"
            ? "Essa data de pagamento já está cadastrada."
            : `Erro ao editar: ${error.message}`
        )
        return
      }
    } else {
      const { error } = await supabase
        .from("salary_days")
        .insert({
          user_id: userId,
          payment_date: input
        })
      if (error) {
        setMessage(
          error.code === "23505"
            ? "Essa data de pagamento já está cadastrada."
            : `Erro ao adicionar: ${error.message}`
        )
        return
      }
    }
    await loadDays()
    setModalOpen(false)
  }
  async function remove(id: string) {
    const confirmed = window.confirm(
      "Deseja realmente excluir esta data de pagamento?"
    )
    if (!confirmed) return
    await supabase
      .from("salary_days")
      .delete()
      .eq("id", id)
    await loadDays()
  }
  async function addCustomHoliday() {
    if (
      !userId ||
      !holidayDate ||
      !holidayName.trim()
    ) {
      setMessage(
        "Informe a data e o nome do feriado."
      )
      return
    }
    setMessage("")
    const { error } = await supabase
      .from("custom_holidays")
      .insert({
        user_id: userId,
        holiday_date: holidayDate,
        name: holidayName.trim()
      })
    if (error) {
      setMessage(
        error.code === "23505"
          ? "Já existe um feriado adicional nessa data."
          : `Erro ao cadastrar feriado: ${error.message}`
      )
      return
    }
    setHolidayDate("")
    setHolidayName("")
    await loadCustomHolidays()
    setMessage(
      "Feriado adicional cadastrado."
    )
  }
  async function removeCustomHoliday(
    id: string
  ) {
    const confirmed = window.confirm(
      "Deseja excluir este feriado adicional?"
    )
    if (!confirmed) return
    await supabase
      .from("custom_holidays")
      .delete()
      .eq("id", id)
    await loadCustomHolidays()
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-8 shadow">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }
  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {/* REGRA AUTOMÁTICA */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
        <div className="border-b p-3 sm:p-4">
          <h3 className="font-medium text-slate-700">
            Regra automática do salário
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Define o dia-base e o ajuste quando o
            pagamento cair em um dia não útil.
          </p>
        </div>
        <div className="space-y-4 p-3 sm:p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Dia-base do pagamento
              </span>
              <input
                type="number"
                min={1}
                max={31}
                value={baseDay}
                onChange={(event) =>
                  setBaseDay(
                    Number(event.target.value)
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Quando não for dia útil
              </span>
              <select
                value={adjustmentRule}
                onChange={(event) =>
                  setAdjustmentRule(
                    event.target
                      .value as AdjustmentRule
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="PREVIOUS_BUSINESS_DAY">
                  Antecipar para o dia útil anterior
                </option>
                <option value="NEXT_BUSINESS_DAY">
                  Adiar para o próximo dia útil
                </option>
                <option value="NO_ADJUSTMENT">
                  Não ajustar
                </option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={saveRule}
              disabled={
                savingRule || generating
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {savingRule ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}
              Salvar regra
            </button>
            <button
              type="button"
              onClick={() =>
                generatePayments(1)
              }
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {generating ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <CalendarPlus size={16} />
              )}
              Gerar próximo pagamento
            </button>
            <button
              type="button"
              onClick={() =>
                generatePayments(12)
              }
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {generating ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <CalendarPlus size={16} />
              )}
              Gerar próximos 12
            </button>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Sábados, domingos e feriados oficiais
            nacionais, estaduais e municipais da
            cidade do Rio de Janeiro são considerados
            automaticamente. Use a seção abaixo apenas
            para exceções ou datas específicas.
          </p>
          {message && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              {message}
            </div>
          )}
        </div>
      </div>
      {/* DATAS GERADAS E MANUAIS */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            <span className="font-medium text-slate-700">
              Datas de pagamento
            </span>
            <p className="mt-1 text-xs text-slate-500">
              Datas efetivamente utilizadas para
              formar os meses financeiros.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto sm:py-1.5"
          >
            + Adicionar data manual
          </button>
        </div>
        <div className="max-h-[500px] space-y-2 overflow-y-auto p-3 sm:p-4">
          {days.length > 0 ? (
            days.map((day) => (
              <div
                key={day.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2"
              >
                <span className="font-medium text-blue-700">
                  {formatDate(
                    day.payment_date
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openEdit(day)
                    }
                    className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-100"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      remove(day.id)
                    }
                    className="rounded-md p-1.5 text-red-600 transition hover:bg-red-100"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">
              Nenhuma data de pagamento
              cadastrada.
            </p>
          )}
        </div>
      </div>
{/* FERIADOS AUTOMÁTICOS DA API */}
<div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
  <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
    <div>
      <h3 className="font-medium text-slate-700">
        Feriados automáticos
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Feriados oficiais nacionais, estaduais e
        municipais considerados para a cidade do
        Rio de Janeiro/RJ.
      </p>
    </div>
    <label className="flex shrink-0 items-center gap-2">
      <span className="text-sm font-medium text-slate-600">
        Ano
      </span>
      <select
        value={holidayYear}
        onChange={(event) =>
          setHolidayYear(
            Number(event.target.value)
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {Array.from(
          {
            length: 7
          },
          (_, index) =>
            currentYear - 1 + index
        ).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  </div>
  <div className="p-3 sm:p-4">
    {loadingApiHolidays ? (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
        <Loader2
          size={18}
          className="animate-spin text-blue-600"
        />
        Consultando feriados...
      </div>
    ) : apiHolidayError ? (
      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-700">
        {apiHolidayError}
      </div>
    ) : apiHolidays.length > 0 ? (
      <>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">
            {apiHolidays.length} feriado(s)
            encontrado(s) em {holidayYear}.
          </span>
          <button
            type="button"
            onClick={() =>
              loadApiHolidays(holidayYear)
            }
            disabled={loadingApiHolidays}
            className="text-sm font-medium text-blue-600 transition hover:text-blue-800 disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {apiHolidays.map((holiday) => (
            <div
              key={[
                holiday.date,
                holiday.name,
                holiday.type ?? "OFICIAL",
                holiday.banking ? "BANKING" : "NOT_BANKING"
              ].join("|")}
              className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-slate-700">
                  {formatDate(holiday.date)}
                </span>
                <span className="mt-0.5 block break-words text-sm text-slate-600">
                  {holiday.name}
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${holidayTypeClass(
                    holiday.type
                  )}`}
                >
                  {formatHolidayType(
                    holiday.type
                  )}
                </span>
                {holiday.banking && (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Bancário
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
        Nenhum feriado foi retornado para o ano
        selecionado.
      </div>
    )}
    <p className="mt-3 text-xs leading-relaxed text-slate-500">
      Pontos facultativos não são considerados
      automaticamente. A lista é utilizada no
      cálculo das datas de pagamento.
    </p>
  </div>
</div>
      {/* FERIADOS LOCAIS */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
        <div className="border-b p-3 sm:p-4">
          <h3 className="font-medium text-slate-700">
            Exceções e feriados adicionais
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Use esta área somente quando uma data
            não estiver na lista automática ou quando
            houver uma exceção específica para o seu
            pagamento.
          </p>
        </div>
        <div className="space-y-4 p-3 sm:p-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
            <input
              type="date"
              value={holidayDate}
              onChange={(event) =>
                setHolidayDate(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
            />
            <input
              value={holidayName}
              onChange={(event) =>
                setHolidayName(
                  event.target.value
                )
              }
              placeholder="Nome do feriado"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={addCustomHoliday}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 md:w-auto"
            >
              Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {customHolidays.length > 0 ? (
              customHolidays.map(
                (holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-slate-700">
                        {formatDate(
                          holiday.holiday_date
                        )}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {holiday.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        removeCustomHoliday(
                          holiday.id
                        )
                      }
                      className="shrink-0 rounded-md p-1.5 text-red-600 transition hover:bg-red-100"
                      title="Excluir feriado"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              )
            ) : (
              <p className="text-sm text-slate-500">
                Nenhum feriado adicional
                cadastrado.
              </p>
            )}
          </div>
        </div>
      </div>
      {/* MODAL DE DATA MANUAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3"
          onClick={() =>
            setModalOpen(false)
          }
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void saveManualDate()
            }}
            className="max-h-[calc(100dvh-24px)] w-full max-w-[350px] space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3 className="text-lg font-semibold text-slate-800">
              {editingId
                ? "Editar data"
                : "Nova data manual"}
            </h3>
            <input
              type="date"
              value={input}
              autoFocus
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()

                  event.currentTarget.form?.requestSubmit()
                }
              }}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
