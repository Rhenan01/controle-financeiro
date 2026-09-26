"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CreditCard, Pencil, Trash2, X } from "lucide-react"
export default function CardsTable() {
  const [cards, setCards] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const [fecha, setFecha] = useState("")
  const [vence, setVence] = useState("")
  const [limite, setLimite] = useState("")
  const [color, setColor] = useState("#334155")
  async function loadCards() {
    const { data } = await supabase
      .from("cards")
      .select("*")
      .order("name")
    if (data) {
      setCards(data)
    }
  }
  useEffect(() => {
    loadCards()
  }, [])
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalOpen(false)
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
  }, [])
  function openNew() {
    setNome("")
    setFecha("")
    setVence("")
    setLimite("")
    setColor("#334155")
    setEditingId(null)
    setModalOpen(true)
  }
  function openEdit(card: any) {
    setNome(card.name)
    setFecha(String(card.closing_day))
    setVence(String(card.due_day))
    setLimite(String(card.limit_value))
    setColor(card.color ?? "#334155")
    setEditingId(card.id)
    setModalOpen(true)
  }
  async function save() {
    if (!nome) return
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return
    if (editingId) {
      await supabase
        .from("cards")
        .update({
          name: nome,
          closing_day: Number(fecha),
          due_day: Number(vence),
          limit_value: Number(limite),
          color
        })
        .eq("id", editingId)
    } else {
      await supabase
        .from("cards")
        .insert({
          user_id: user.id,
          name: nome,
          closing_day: Number(fecha),
          due_day: Number(vence),
          limit_value: Number(limite),
          color
        })
    }
    await loadCards()
    setModalOpen(false)
  }
  async function remove(id: string) {
    await supabase
      .from("cards")
      .delete()
      .eq("id", id)
    await loadCards()
  }
  function money(value: number) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
      <div className="flex items-center justify-between gap-3 border-b p-3 sm:p-4">
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-700 sm:text-base">
            Cartões cadastrados
          </span>
          <span className="mt-0.5 block text-xs text-slate-400">
            {cards.length} {cards.length === 1 ? "cartão" : "cartões"}
          </span>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 sm:text-sm"
        >
          + Novo
        </button>
      </div>
      {/* Celular */}
      <div className="space-y-2 p-3 md:hidden">
        {cards.map((c) => (
          <div
            key={c.id}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-3"
          >
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ backgroundColor: c.color ?? "#334155" }}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color ?? "#334155" }}
                  />
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: c.color ?? "#334155" }}
                  >
                    {c.name}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <span className="block text-slate-400">Fecha dia</span>
                    <span className="mt-0.5 block font-medium text-slate-700">
                      {c.closing_day}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Vence dia</span>
                    <span className="mt-0.5 block font-medium text-slate-700">
                      {c.due_day}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-400">Limite</span>
                    <span className="mt-0.5 block font-semibold text-slate-800">
                      {money(c.limit_value)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100"
                  title="Editar"
                  aria-label={`Editar ${c.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-100"
                  title="Excluir"
                  aria-label={`Excluir ${c.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">
            Nenhum cartão cadastrado.
          </div>
        )}
      </div>
      {/* Tablet/Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="w-[70px] px-4 py-3 text-left">Cor</th>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Fecha dia</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Vence dia</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Limite</th>
              <th className="w-[100px] px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id} className="border-t transition hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: c.color ?? "#334155" }}
                  />
                </td>
                <td
                  className="px-4 py-3 font-medium"
                  style={{ color: c.color ?? "#334155" }}
                >
                  {c.name}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {c.closing_day}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {c.due_day}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {money(c.limit_value)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-100"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="rounded-md p-1.5 text-red-600 transition hover:bg-red-100"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
            className="max-h-[calc(100dvh-24px)] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CreditCard size={20} className="shrink-0 text-blue-600" />
                <h3 className="truncate text-lg font-semibold text-slate-900">
                  {editingId ? "Editar cartão" : "Novo cartão"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Nome do cartão</span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Nubank"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block min-w-0 space-y-1">
                  <span className="text-xs font-medium text-slate-600">Fecha dia</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    placeholder="15"
                    className="w-full min-w-0 rounded-lg border border-gray-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block min-w-0 space-y-1">
                  <span className="text-xs font-medium text-slate-600">Vence dia</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={vence}
                    onChange={(e) => setVence(e.target.value)}
                    placeholder="20"
                    className="w-full min-w-0 rounded-lg border border-gray-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Limite</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Cor do cartão</span>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="truncate text-sm font-medium text-slate-600">
                    {color.toUpperCase()}
                  </span>
                </div>
              </label>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
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
