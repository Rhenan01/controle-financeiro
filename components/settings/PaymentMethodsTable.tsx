"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Pencil, Trash2, X } from "lucide-react"

export default function PaymentMethodsTable() {
  const [methods, setMethods] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [input, setInput] = useState("")

  async function loadMethods() {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .order("name")

    if (data) {
      setMethods(data)
    }
  }

  useEffect(() => {
    loadMethods()
  }, [])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalOpen(false)
      }
    }

    window.addEventListener("keydown", handleEsc)

    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  function openNew() {
    setInput("")
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(method: any) {
    setInput(method.name)
    setEditingId(method.id)
    setModalOpen(true)
  }

  async function save() {
    if (!input.trim()) return

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) return

    if (editingId) {
      await supabase
        .from("payment_methods")
        .update({ name: input.trim() })
        .eq("id", editingId)
    } else {
      await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          name: input.trim()
        })
    }

    await loadMethods()
    setModalOpen(false)
  }

  async function remove(id: string) {
    await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id)

    await loadMethods()
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
      <div className="flex items-center justify-between gap-3 border-b p-3 sm:p-4">
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-700 sm:text-base">
            Formas de pagamento
          </span>

          <span className="mt-0.5 block text-xs text-slate-400">
            {methods.length} {methods.length === 1 ? "forma cadastrada" : "formas cadastradas"}
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

      <div className="space-y-2 p-3 sm:p-4">
        {methods.map((m) => (
          <div
            key={m.id}
            className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-transparent bg-gray-50 px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <span className="min-w-0 break-words text-sm font-medium text-slate-700">
              {m.name}
            </span>

            <div className="flex shrink-0 gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => openEdit(m)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-blue-600 transition hover:bg-blue-100"
                title="Editar"
                aria-label={`Editar ${m.name}`}
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() => remove(m.id)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 transition hover:bg-red-100"
                title="Excluir"
                aria-label={`Excluir ${m.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {methods.length === 0 && (
          <div className="py-7 text-center text-sm text-slate-500">
            Nenhuma forma de pagamento cadastrada.
          </div>
        )}
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
            className="w-full max-w-[360px] rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="min-w-0 truncate text-lg font-semibold text-slate-800">
                {editingId ? "Editar pagamento" : "Novo pagamento"}
              </h3>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X size={17} />
              </button>
            </div>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: PIX"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
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
