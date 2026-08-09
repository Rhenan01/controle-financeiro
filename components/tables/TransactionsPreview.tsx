"use client"

import { useFinanceStore } from "@/store/financeStore"
import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"

type Props = {
  financialRange: {
    start: string
    end: string
    label: string
  }
}

export default function TransactionsPreview({ financialRange }: Props) {

  const transactions = useFinanceStore((s) => s.transactions)

  const selectedCategory = useFinanceStore(
    (s) => s.selectedCategory
  )

  const setSelectedCategory = useFinanceStore(
    (s) => s.setSelectedCategory
  )

  const [
    descriptionCategories,
    setDescriptionCategories
  ] = useState<any[]>([])


  // Carrega a relação entre descrição e categoria
  useEffect(() => {

    async function load() {

      const { data } = await supabase
        .from("description_categories")
        .select("*")

      if (data) {
        setDescriptionCategories(data)
      }

    }

    load()

  }, [])


  // Mapa:
  // descrição -> categoria
  const categoryMap = useMemo(() => {

    const map: any = {}

    descriptionCategories.forEach((c) => {

      map[c.description] = c.category

    })

    return map

  }, [descriptionCategories])


  const filtered = useMemo(() => {

    /*
     * O componente exibe somente SAÍDAS
     * pertencentes ao período financeiro selecionado.
     */
    let list = transactions.filter((t) =>

      t.type === "SAÍDA" &&

      t.date >= financialRange.start &&

      t.date <= financialRange.end

    )


    if (selectedCategory) {

      /*
       * Quando uma categoria é selecionada
       * no gráfico de categorias, mostra apenas
       * as saídas daquela categoria.
       */
      list = list.filter((t) => {

        const category =
          categoryMap[t.description] ?? "Outros"

        return category === selectedCategory

      })


      /*
       * Mostra os maiores gastos primeiro.
       */
      return [...list]
        .sort(
          (a, b) =>
            Math.abs(b.value) -
            Math.abs(a.value)
        )
        .slice(0, 10)

    }


    /*
     * Sem categoria selecionada,
     * mostra somente saídas já pagas.
     */
    list = list.filter(
      (t) => t.status === "PAGO"
    )


    /*
     * Mostra as saídas mais recentes primeiro.
     */
    return [...list]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date)
      )
      .slice(0, 10)

  }, [
    transactions,
    financialRange,
    selectedCategory,
    categoryMap
  ])


  function formatDate(date: string) {

    const [
      y,
      m,
      d
    ] = date.split("-")

    return `${d}/${m}`

  }


  return (

    <div
      className="
        min-w-0
        rounded-xl
        border
        border-gray-200
        bg-white
        p-4
        shadow
        sm:p-5
      "
    >

      {/* Cabeçalho */}
      <div
        className="
          mb-4
          flex
          items-center
          justify-between
        "
      >

        <h2
          className="
            text-lg
            font-semibold
            text-slate-800
          "
        >

          {selectedCategory
            ? `Gastos - ${selectedCategory}`
            : "Últimas saídas"
          }

        </h2>


        {selectedCategory && (

          <button
            onClick={() =>
              setSelectedCategory(null)
            }
            className="
              text-sm
              text-blue-600
              hover:underline
            "
          >
            voltar
          </button>

        )}

      </div>


      {/* Tabela */}
      <table
        className="
          w-full
          table-fixed
          text-sm
        "
      >

        <thead
          className="
            border-b
            text-gray-500
          "
        >

          <tr>

            <th
              className="
                w-[18%]
                py-2
                pr-2
                text-left
              "
            >
              Data
            </th>

            <th
              className="
                w-[48%]
                px-2
                text-left
                sm:w-auto
              "
            >
              Descrição
            </th>

            <th
              className="
                hidden
                px-2
                text-left
                sm:table-cell
              "
            >
              Categoria
            </th>

            <th
              className="
                w-[34%]
                pl-2
                text-right
                sm:w-auto
              "
            >
              Valor
            </th>

          </tr>

        </thead>


        <tbody>

          {filtered.map((t) => {

            const category =
              categoryMap[t.description] ??
              "Outros"


            return (

              <tr
                key={t.id}
                className="
                  border-b
                  last:border-none
                "
              >

                {/* Data */}
                <td
                  className="
                    py-3
                    pr-2
                    align-top
                    text-xs
                    font-medium
                    text-slate-700
                    sm:text-sm
                  "
                >
                  {formatDate(t.date)}
                </td>


                {/* Descrição */}
                <td
                  className="
                    break-words
                    px-2
                    py-3
                    align-top
                    text-xs
                    font-medium
                    leading-tight
                    text-slate-800
                    sm:text-sm
                  "
                >

                  {t.description}


                  {/* Categoria no celular */}
                  <span
                    className="
                      mt-1
                      block
                      truncate
                      text-[11px]
                      font-normal
                      text-gray-500
                      sm:hidden
                    "
                  >
                    {category}
                  </span>

                </td>


                {/* Categoria */}
                <td
                  className="
                    hidden
                    px-2
                    py-3
                    align-top
                    text-gray-500
                    sm:table-cell
                  "
                >
                  {category}
                </td>


                {/* Valor */}
                <td
                  className="
                    whitespace-nowrap
                    py-3
                    pl-2
                    text-right
                    align-top
                    text-xs
                    font-semibold
                    text-rose-500
                    sm:text-sm
                  "
                >

                  -R${" "}

                  {Math.abs(t.value).toLocaleString(
                    "pt-BR",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }
                  )}

                </td>

              </tr>

            )

          })}


          {/* Estado vazio */}
          {filtered.length === 0 && (

            <tr>

              <td
                colSpan={4}
                className="
                  py-8
                  text-center
                  text-sm
                  text-slate-400
                "
              >

                {selectedCategory
                  ? "Nenhum gasto encontrado nesta categoria."
                  : "Nenhuma saída encontrada neste período."
                }

              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

  )

}