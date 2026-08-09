"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { createPortal } from "react-dom"
import { supabase } from "@/lib/supabase"
import {
  Pencil,
  Search,
  Trash2,
  X
} from "lucide-react"

type FilterType = "desc" | "cat" | null

type FilterPosition = {
  top: number
  left: number
  width: number
} | null

export default function DescriptionCategoryTable() {
  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("")

  const [descFilter, setDescFilter] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState<string[]>([])

  const [descSearch, setDescSearch] = useState("")
  const [catSearch, setCatSearch] = useState("")

  const [openFilter, setOpenFilter] = useState<FilterType>(null)
  const [filterPosition, setFilterPosition] =
    useState<FilterPosition>(null)

  const descButtonRef = useRef<HTMLButtonElement | null>(null)
  const catButtonRef = useRef<HTMLButtonElement | null>(null)
  const filterMenuRef = useRef<HTMLDivElement | null>(null)

  async function loadData() {
    const { data: rows } = await supabase
      .from("description_categories")
      .select("*")
      .order("description")

    if (rows) {
      setData(rows)
      setFiltered(rows)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let temp = [...data]

    if (descFilter.length > 0) {
      temp = temp.filter((item) =>
        descFilter.includes(item.description)
      )
    }

    if (catFilter.length > 0) {
      temp = temp.filter((item) =>
        catFilter.includes(item.category)
      )
    }

    setFiltered(temp)
  }, [descFilter, catFilter, data])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return

      if (modalOpen) {
        setModalOpen(false)
        return
      }

      setOpenFilter(null)
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [modalOpen])

  /*
    Calcula a posição do filtro em relação ao botão,
    mas renderiza o menu fora da tabela.
  */
  useEffect(() => {
    if (!openFilter) {
      setFilterPosition(null)
      return
    }

    function updateFilterPosition() {
      const button =
        openFilter === "desc"
          ? descButtonRef.current
          : catButtonRef.current

      if (!button) return

      const rect = button.getBoundingClientRect()

      const pageMargin = 12
      const preferredWidth = 320
      const availableWidth = window.innerWidth - pageMargin * 2

      const width = Math.min(preferredWidth, availableWidth)

      const left = Math.min(
        Math.max(pageMargin, rect.left),
        window.innerWidth - width - pageMargin
      )

      const maximumMenuHeight = Math.min(
        360,
        window.innerHeight - pageMargin * 2
      )

      const spaceBelow =
        window.innerHeight - rect.bottom - pageMargin

      const shouldOpenUpward =
        spaceBelow < maximumMenuHeight &&
        rect.top > maximumMenuHeight

      const top = shouldOpenUpward
        ? Math.max(
            pageMargin,
            rect.top - maximumMenuHeight - 8
          )
        : rect.bottom + 8

      setFilterPosition({
        top,
        left,
        width
      })
    }

    updateFilterPosition()

    window.addEventListener("resize", updateFilterPosition)
    window.addEventListener(
      "scroll",
      updateFilterPosition,
      true
    )

    return () => {
      window.removeEventListener(
        "resize",
        updateFilterPosition
      )

      window.removeEventListener(
        "scroll",
        updateFilterPosition,
        true
      )
    }
  }, [openFilter])

  /*
    Fecha o filtro ao clicar fora do menu ou
    dos botões que abrem os filtros.
  */
  useEffect(() => {
    if (!openFilter) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      if (filterMenuRef.current?.contains(target)) {
        return
      }

      if (descButtonRef.current?.contains(target)) {
        return
      }

      if (catButtonRef.current?.contains(target)) {
        return
      }

      setOpenFilter(null)
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )
    }
  }, [openFilter])

  function toggleSelect(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }

      return [...current, id]
    })
  }

  const filteredIds = filtered.map((item) => item.id)

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((item) =>
      selected.includes(item.id)
    )

  function selectAll() {
    setSelected((current) => {
      if (allFilteredSelected) {
        return current.filter(
          (id) => !filteredIds.includes(id)
        )
      }

      return Array.from(
        new Set([...current, ...filteredIds])
      )
    })
  }

  async function deleteSelected() {
    for (const id of selected) {
      await supabase
        .from("description_categories")
        .delete()
        .eq("id", id)
    }

    setSelected([])
    await loadData()
  }

  function openNew() {
    setDescricao("")
    setCategoria("")
    setEditingId(null)
    setOpenFilter(null)
    setModalOpen(true)
  }

  function openEdit(item: any) {
    setDescricao(item.description ?? "")
    setCategoria(item.category ?? "")
    setEditingId(item.id)
    setOpenFilter(null)
    setModalOpen(true)
  }

  async function save() {
    if (!descricao || !categoria) return

    const user = (await supabase.auth.getUser())
      .data.user

    if (!user) return

    let error

    if (editingId) {
      const response = await supabase
        .from("description_categories")
        .update({
          description: descricao
            .toUpperCase()
            .trim(),
          category: categoria.trim()
        })
        .eq("id", editingId)

      error = response.error
    } else {
      const response = await supabase
        .from("description_categories")
        .insert({
          user_id: user.id,
          description: descricao
            .toUpperCase()
            .trim(),
          category: categoria.trim()
        })

      error = response.error
    }

    if (error) {
      alert("Essa descrição já existe.")
      return
    }

    setModalOpen(false)
    await loadData()
  }

  const descriptions = useMemo(() => {
    return [
      ...new Set(
        data
          .map((item) => item.description)
          .filter(Boolean)
      )
    ].sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR")
    )
  }, [data])

  const categories = useMemo(() => {
    return [
      ...new Set(
        data
          .map((item) => item.category)
          .filter(Boolean)
      )
    ].sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR")
    )
  }, [data])

  function toggleDesc(value: string) {
    setDescFilter((current) => {
      if (current.includes(value)) {
        return current.filter(
          (item) => item !== value
        )
      }

      return [...current, value]
    })
  }

  function toggleCat(value: string) {
    setCatFilter((current) => {
      if (current.includes(value)) {
        return current.filter(
          (item) => item !== value
        )
      }

      return [...current, value]
    })
  }

  function toggleFilter(type: FilterType) {
    setOpenFilter((current) =>
      current === type ? null : type
    )
  }

  const activeOptions =
    openFilter === "desc"
      ? descriptions
      : categories

  const activeSearch =
    openFilter === "desc"
      ? descSearch
      : catSearch

  const activeFilter =
    openFilter === "desc"
      ? descFilter
      : catFilter

  const visibleOptions = activeOptions.filter(
    (option) =>
      String(option)
        .toLocaleLowerCase("pt-BR")
        .includes(
          activeSearch
            .trim()
            .toLocaleLowerCase("pt-BR")
        )
  )

  const allVisibleSelected =
    visibleOptions.length > 0 &&
    visibleOptions.every((option) =>
      activeFilter.includes(String(option))
    )

  function setActiveSearch(value: string) {
    if (openFilter === "desc") {
      setDescSearch(value)
    } else {
      setCatSearch(value)
    }
  }

  function toggleActiveValue(value: string) {
    if (openFilter === "desc") {
      toggleDesc(value)
    } else {
      toggleCat(value)
    }
  }

  function toggleAllVisible() {
    if (!openFilter) return

    const currentFilter =
      openFilter === "desc"
        ? descFilter
        : catFilter

    const setFilter =
      openFilter === "desc"
        ? setDescFilter
        : setCatFilter

    if (allVisibleSelected) {
      setFilter(
        currentFilter.filter(
          (item) =>
            !visibleOptions.includes(item)
        )
      )

      return
    }

    setFilter(
      Array.from(
        new Set([
          ...currentFilter,
          ...visibleOptions
        ])
      )
    )
  }

  function clearActiveFilter() {
    if (openFilter === "desc") {
      setDescFilter([])
      setDescSearch("")
    } else {
      setCatFilter([])
      setCatSearch("")
    }
  }

  const filterTitle =
    openFilter === "desc"
      ? "Filtrar descrições"
      : "Filtrar categorias"

  const filterPlaceholder =
    openFilter === "desc"
      ? "Pesquisar descrição..."
      : "Pesquisar categoria..."

  const filterPortal =
    openFilter &&
    filterPosition &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={filterMenuRef}
            style={{
              top: filterPosition.top,
              left: filterPosition.left,
              width: filterPosition.width
            }}
            className="
              fixed z-[200]
              flex max-h-[min(360px,calc(100dvh-24px))]
              flex-col overflow-hidden
              rounded-xl border border-slate-200
              bg-white shadow-2xl
            "
          >
            <div className="border-b border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800">
                  {filterTitle}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenFilter(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                  aria-label="Fechar filtro"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
                <Search
                  size={16}
                  className="shrink-0 text-slate-400"
                />

                <input
                  autoFocus
                  value={activeSearch}
                  onChange={(event) =>
                    setActiveSearch(
                      event.target.value
                    )
                  }
                  placeholder={filterPlaceholder}
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
              <label className="flex min-w-0 cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={
                    visibleOptions.length === 0
                  }
                  onChange={toggleAllVisible}
                  className="h-4 w-4 shrink-0 accent-blue-600"
                />

                <span className="truncate">
                  Marcar resultados visíveis
                </span>
              </label>

              <button
                type="button"
                onClick={clearActiveFilter}
                className="shrink-0 text-xs font-medium text-blue-600 transition hover:text-blue-800"
              >
                Limpar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {visibleOptions.length > 0 ? (
                visibleOptions.map((option) => {
                  const value = String(option)

                  return (
                    <label
                      key={value}
                      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm transition hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={activeFilter.includes(
                          value
                        )}
                        onChange={() =>
                          toggleActiveValue(value)
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      />

                      <span className="break-words text-slate-700">
                        {value}
                      </span>
                    </label>
                  )
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  Nenhum resultado encontrado.
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {activeFilter.length} item(ns) selecionado(s)
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <span className="text-sm font-medium text-slate-700 sm:text-base">
          Regras de categorização automática
        </span>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
          {selected.length > 0 && (
            <span className="text-sm text-slate-600">
              {selected.length} selecionado(s)
            </span>
          )}

          {selected.length > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 sm:py-1.5 sm:text-sm"
            >
              Excluir selecionados
            </button>
          )}

          <button
            type="button"
            onClick={openNew}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 sm:py-1.5 sm:text-sm"
          >
            + Novo
          </button>
        </div>
      </div>

      <div className="max-h-[450px] overflow-auto">
        <table className="w-full min-w-[340px] table-fixed text-[11px] sm:min-w-[560px] sm:text-sm">
          <colgroup>
            <col className="w-[36px] sm:w-[44px]" />
            <col className="w-[42%]" />
            <col className="w-[35%]" />
            <col className="w-[64px] sm:w-[86px]" />
          </colgroup>

          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="px-2 py-2.5 text-center sm:px-4 sm:py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={selectAll}
                />
              </th>

              <th className="px-2 py-2.5 text-left font-medium text-slate-700 sm:px-4 sm:py-3">
                <div className="flex items-center gap-2">
                  <span>Descrição</span>

                  <button
                    ref={descButtonRef}
                    type="button"
                    onClick={() =>
                      toggleFilter("desc")
                    }
                    aria-expanded={
                      openFilter === "desc"
                    }
                    className={`inline-flex items-center gap-1 transition ${
                      descFilter.length > 0
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>
                      {openFilter === "desc"
                        ? "▲"
                        : "▼"}
                    </span>

                    {descFilter.length > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] text-white">
                        {descFilter.length}
                      </span>
                    )}
                  </button>
                </div>
              </th>

              <th className="px-2 py-2.5 text-left font-medium text-slate-700 sm:px-4 sm:py-3">
                <div className="flex items-center gap-2">
                  <span>Categoria</span>

                  <button
                    ref={catButtonRef}
                    type="button"
                    onClick={() =>
                      toggleFilter("cat")
                    }
                    aria-expanded={
                      openFilter === "cat"
                    }
                    className={`inline-flex items-center gap-1 transition ${
                      catFilter.length > 0
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>
                      {openFilter === "cat"
                        ? "▲"
                        : "▼"}
                    </span>

                    {catFilter.length > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] text-white">
                        {catFilter.length}
                      </span>
                    )}
                  </button>
                </div>
              </th>

              <th className="px-2 py-2.5 text-right font-medium text-slate-700 sm:px-4 sm:py-3">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="px-2 py-2.5 text-center sm:px-4 sm:py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(
                      item.id
                    )}
                    onChange={() =>
                      toggleSelect(item.id)
                    }
                  />
                </td>

                <td className="break-words px-2 py-2.5 font-medium leading-snug text-slate-800 sm:px-4 sm:py-3">
                  {item.description}
                </td>

                <td className="break-words px-2 py-2.5 leading-snug text-slate-700 sm:px-4 sm:py-3">
                  {item.category}
                </td>

                <td className="px-2 py-2.5 text-right sm:px-4 sm:py-3">
                  <div className="flex justify-end gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(item)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-md text-blue-600 transition hover:bg-blue-100"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        supabase
                          .from(
                            "description_categories"
                          )
                          .delete()
                          .eq("id", item.id)
                          .then(loadData)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-100"
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

      {filterPortal}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[calc(100dvh-24px)] w-full max-w-[400px] space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId
                ? "Editar regra"
                : "Nova regra"}
            </h3>

            <input
              value={descricao}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
              placeholder="Descrição"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 placeholder:text-slate-400"
            />

            <input
              value={categoria}
              onChange={(event) =>
                setCategoria(event.target.value)
              }
              placeholder="Categoria"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 placeholder:text-slate-400"
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
                type="button"
                onClick={save}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}