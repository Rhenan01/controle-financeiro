"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useFinanceStore } from "@/store/financeStore"

type Card = {
  id: string
  name: string
  closing_day: number
  due_day: number
  limit_value: number
  color: string
}

type Props = {
  financialRange: {
    start: string
    end: string
    label: string
  }
}

type CardStatus =
  | "PAGO"
  | "ABERTA"
  | "ATRASADA"


export default function CreditCardsStatus({
  financialRange
}: Props) {

  const transactions = useFinanceStore(
    (s) => s.transactions
  )

  const [cards, setCards] = useState<Card[]>([])

  const [paidMap, setPaidMap] = useState<
    Record<string, boolean>
  >({})


  /*
   * Retorna o ID do usuário atualmente autenticado.
   */
  async function getCurrentUserId() {

    try {

      const {
        data,
        error
      } = await supabase.auth.getSession()

      if (error) {
        return null
      }

      return data.session?.user?.id ?? null

    } catch {

      return null

    }

  }


  /*
   * Carrega os cartões cadastrados.
   */
  useEffect(() => {

    async function loadCards() {

      const {
        data,
        error
      } = await supabase
        .from("cards")
        .select("*")
        .order("name")


      if (!error && data) {

        setCards(data)

      }

    }


    loadCards()

  }, [])


  /*
   * Carrega o status manual de pagamento
   * das faturas do período selecionado.
   */
  useEffect(() => {

    async function loadInvoices() {

      const userId =
        await getCurrentUserId()


      if (!userId) {
        return
      }


      const {
        data,
        error
      } = await supabase
        .from("card_invoices")
        .select("*")
        .eq(
          "month_label",
          financialRange.label
        )
        .eq(
          "user_id",
          userId
        )


      if (error) {
        return
      }


      const map: Record<string, boolean> = {}


      data?.forEach((invoice) => {

        map[invoice.card_id] =
          invoice.paid

      })


      setPaidMap(map)

    }


    loadInvoices()

  }, [financialRange.label])


  /*
   * Alterna manualmente o estado pago/não pago
   * de uma fatura.
   */
  async function togglePaid(
    cardId: string
  ) {

    const userId =
      await getCurrentUserId()


    if (!userId) {
      return
    }


    const current =
      paidMap[cardId] ?? false

    const next =
      !current


    /*
     * Atualização otimista:
     * altera primeiro a interface e depois salva.
     */
    setPaidMap((prev) => ({
      ...prev,
      [cardId]: next
    }))


    const {
      data: existing,
      error: existingError
    } = await supabase
      .from("card_invoices")
      .select("id")
      .eq(
        "card_id",
        cardId
      )
      .eq(
        "month_label",
        financialRange.label
      )
      .eq(
        "user_id",
        userId
      )
      .maybeSingle()


    if (existingError) {

      setPaidMap((prev) => ({
        ...prev,
        [cardId]: current
      }))

      return

    }


    let saveError = null


    if (existing) {

      const {
        error
      } = await supabase
        .from("card_invoices")
        .update({
          paid: next
        })
        .eq(
          "id",
          existing.id
        )


      saveError = error

    } else {

      const {
        error
      } = await supabase
        .from("card_invoices")
        .insert({
          user_id: userId,
          card_id: cardId,
          month_label:
            financialRange.label,
          start_date:
            financialRange.start,
          end_date:
            financialRange.end,
          paid: next
        })


      saveError = error

    }


    /*
     * Se não conseguir salvar no banco,
     * retorna visualmente ao estado anterior.
     */
    if (saveError) {

      setPaidMap((prev) => ({
        ...prev,
        [cardId]: current
      }))

    }

  }


  /*
   * Calcula a data de vencimento do cartão
   * dentro do período financeiro selecionado.
   *
   * Exemplo:
   * período 30/07 até 27/08
   * cartão vence dia 5
   * vencimento = 05/08
   */
  function getCardDueDateInRange(
    rangeEnd: string,
    dueDay: number
  ) {

    const [
      year,
      month
    ] = rangeEnd
      .split("-")
      .map(Number)


    const lastDayOfMonth =
      new Date(
        year,
        month,
        0
      ).getDate()


    /*
     * Evita datas inválidas.
     * Exemplo: vencimento 31 em fevereiro.
     */
    const safeDueDay =
      Math.min(
        dueDay,
        lastDayOfMonth
      )


    return `${year}-${String(month).padStart(2, "0")}-${String(safeDueDay).padStart(2, "0")}`

  }


  /*
   * Formatação monetária.
   */
  function money(
    value: number
  ) {

    return value.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )

  }


  /*
   * Ajusta discretamente a fonte apenas
   * para valores excepcionalmente grandes.
   */
  function getInvoiceTextClass(
    value: number
  ) {

    const absolute =
      Math.abs(value)


    if (absolute >= 100000) {
      return "text-[14px]"
    }


    if (absolute >= 10000) {
      return "text-[15px]"
    }


    return "text-[17px]"

  }


  /*
   * Aparência de cada status.
   */
  function getStatusStyle(
    status: CardStatus
  ) {

    switch (status) {

      case "PAGO":

        return {
          label: "Pago",
          className:
            "bg-emerald-100 text-emerald-700 border-emerald-200"
        }


      case "ABERTA":

        return {
          label: "Em aberto",
          className:
            "bg-amber-100 text-amber-700 border-amber-200"
        }


      case "ATRASADA":

        return {
          label: "Em atraso",
          className:
            "bg-rose-100 text-rose-700 border-rose-200"
        }

    }

  }


  /*
   * Calcula a fatura e o status de cada cartão.
   */
  const cardsWithInvoice =
    useMemo(() => {

      const today =
        new Date()
          .toISOString()
          .slice(0, 10)


      const list =
        cards.map((card) => {

          /*
           * Data real de vencimento da fatura
           * dentro do período selecionado.
           */
          const cardDueDate =
            getCardDueDateInRange(
              financialRange.end,
              card.due_day
            )


          /*
           * Soma somente lançamentos:
           *
           * - do cartão atual;
           * - realizados no crédito;
           * - pertencentes ao período da fatura.
           */
          const invoice =
            transactions

              .filter(
                (transaction) => {

                  const sameCard =
                    transaction.card
                      ?.toLowerCase()
                      .trim() ===
                    card.name
                      .toLowerCase()
                      .trim()


                  const credit =
                    transaction.payment
                      ?.toLowerCase()
                      .includes("cr")


                  const inRange =
                    transaction.date >=
                      financialRange.start &&
                    transaction.date <=
                      cardDueDate


                  return (
                    sameCard &&
                    credit &&
                    inRange
                  )

                }
              )

              .reduce(
                (
                  sum,
                  transaction
                ) =>
                  sum +
                  transaction.value,
                0
              )


          const paid =
            paidMap[card.id] ?? false


          let status: CardStatus =
            "ABERTA"


          /*
           * Ordem de prioridade:
           *
           * 1. Se foi marcado manualmente como pago:
           *    Pago.
           *
           * 2. Se não foi pago e o vencimento passou:
           *    Em atraso.
           *
           * 3. Caso contrário:
           *    Em aberto.
           *
           * A regra vale mesmo quando a fatura é R$ 0,00.
           */
          if (paid) {

            status =
              "PAGO"

          } else if (
            today > cardDueDate
          ) {

            status =
              "ATRASADA"

          } else {

            status =
              "ABERTA"

          }


          return {
            ...card,
            invoice,
            status
          }

        })


      /*
       * Ordenação:
       *
       * 1. Em atraso
       * 2. Em aberto
       * 3. Pago
       *
       * Dentro do mesmo status,
       * maior fatura aparece primeiro.
       */
      return list.sort(
        (a, b) => {

          const order:
            Record<
              CardStatus,
              number
            > = {

            ATRASADA: 0,
            ABERTA: 1,
            PAGO: 2

          }


          if (
            order[a.status] !==
            order[b.status]
          ) {

            return (
              order[a.status] -
              order[b.status]
            )

          }


          return (
            b.invoice -
            a.invoice
          )

        }
      )

    }, [
      cards,
      transactions,
      financialRange,
      paidMap
    ])


  /*
   * Estado vazio.
   */
  if (cards.length === 0) {

    return (

      <div
        className="
          h-full
          min-h-[410px]
          rounded-2xl
          border
          border-slate-200
          bg-white/90
          p-6
          shadow-sm
          backdrop-blur-sm

          flex
          flex-col
          items-center
          justify-center
          text-center
        "
      >

        <div
          className="
            mb-3
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-slate-100
            text-xl
          "
        >
          💳
        </div>


        <h3
          className="
            font-semibold
            text-slate-800
          "
        >
          Nenhum cartão cadastrado
        </h3>


        <p
          className="
            mt-1
            max-w-xs
            text-sm
            text-slate-500
          "
        >
          Cadastre um cartão para acompanhar suas faturas.
        </p>

      </div>

    )

  }


  return (

    <div
      className="
        h-full
        min-w-0
        rounded-2xl
        border
        border-slate-200
        bg-white/90
        p-4
        shadow-sm
        backdrop-blur-sm
      "
    >

      {/* Cabeçalho */}
      <div
        className="
          mb-3
          flex
          items-center
          justify-between
          gap-3
        "
      >

        <h2
          className="
            text-lg
            font-semibold
            text-slate-800
          "
        >
          Status das Faturas
        </h2>


        <span
          className="
            flex-shrink-0
            rounded-full
            bg-slate-100
            px-2.5
            py-1
            text-[11px]
            font-medium
            text-slate-500
          "
        >
          {cards.length} cartões
        </span>

      </div>


      {/* Grid dos cartões */}
      <div
        className="
          grid
          grid-cols-2
          gap-2

          sm:grid-cols-3
          xl:grid-cols-3
        "
      >

        {cardsWithInvoice.map(
          (card) => {

            const paid =
              paidMap[card.id] ?? false


            const status =
              getStatusStyle(
                card.status
              )


            const cardColor =
              card.color ||
              "#2563eb"


            return (

              <div
                key={card.id}
                className="
                  group
                  relative
                  min-w-0
                  min-h-[108px]
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-2.5

                  transition-all
                  duration-200

                  hover:-translate-y-[1px]
                  hover:border-slate-300
                  hover:shadow-md
                "
              >

                {/* Faixa superior com a cor do cartão */}
                <div
                  className="
                    absolute
                    left-0
                    right-0
                    top-0
                    h-[3px]
                  "
                  style={{
                    backgroundColor:
                      cardColor
                  }}
                />


                <div
                  className="
                    flex
                    h-full
                    flex-col
                  "
                >

                  {/* Nome + botão de pagamento */}
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-2
                    "
                  >

                    <div
                      className="
                        min-w-0
                        pr-1
                      "
                    >

                      <h3
                        title={card.name}
                        className="
                          truncate
                          text-[12px]
                          font-semibold
                          leading-tight
                          text-slate-800
                        "
                      >
                        {card.name}
                      </h3>


                      <p
                        className="
                          mt-0.5
                          text-[10px]
                          leading-tight
                          text-slate-400
                        "
                      >
                        Vence dia {card.due_day}
                      </p>

                    </div>


                    {/* Toggle pago */}
                    <button
                      type="button"
                      aria-pressed={paid}
                      aria-label={
                        paid
                          ? `Marcar fatura ${card.name} como não paga`
                          : `Marcar fatura ${card.name} como paga`
                      }
                      title={
                        paid
                          ? "Marcar como não paga"
                          : "Marcar como paga"
                      }
                      onClick={() =>
                        togglePaid(
                          card.id
                        )
                      }
                      className={`
                        relative
                        mt-0.5
                        h-[18px]
                        w-8
                        flex-shrink-0
                        rounded-full
                        transition-colors
                        duration-200

                        ${
                          paid
                            ? "bg-emerald-500"
                            : "bg-slate-200"
                        }
                      `}
                    >

                      <span
                        className={`
                          absolute
                          top-[2px]
                          h-[14px]
                          w-[14px]
                          rounded-full
                          bg-white
                          shadow-sm

                          transition-all
                          duration-200

                          ${
                            paid
                              ? "left-[16px]"
                              : "left-[2px]"
                          }
                        `}
                      />

                    </button>

                  </div>


                  {/* Valor da fatura */}
                  <div
                    className="
                      mt-2
                      min-w-0
                    "
                  >

                    <p
                      className="
                        text-[9px]
                        leading-none
                        text-slate-400
                      "
                    >
                      Fatura
                    </p>


                    <p
                      title={
                        money(
                          card.invoice
                        )
                      }
                      className={`
                        mt-1
                        whitespace-nowrap
                        font-bold
                        leading-none
                        tracking-[-0.025em]
                        text-slate-800
                        tabular-nums

                        ${getInvoiceTextClass(
                          card.invoice
                        )}
                      `}
                    >
                      {money(
                        card.invoice
                      )}
                    </p>

                  </div>


                  {/* Limite + status */}
                  <div
                    className="
                      mt-auto
                      pt-2
                    "
                  >

                    <div
                      className="
                        flex
                        items-end
                        justify-between
                        gap-2
                      "
                    >

                      {/* Limite */}
                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >

                        <p
                          className="
                            text-[8px]
                            leading-none
                            text-slate-400
                          "
                        >
                          Limite
                        </p>


                        <p
                          title={
                            money(
                              card.limit_value
                            )
                          }
                          className="
                            mt-1
                            truncate
                            whitespace-nowrap
                            text-[10px]
                            font-medium
                            leading-none
                            text-slate-600
                            tabular-nums
                          "
                        >
                          {money(
                            card.limit_value
                          )}
                        </p>

                      </div>


                      {/* Status */}
                      <span
                        className={`
                          flex-shrink-0
                          whitespace-nowrap
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-[9px]
                          font-semibold
                          leading-none
                          shadow-sm

                          ${status.className}
                        `}
                      >
                        {status.label}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            )

          }
        )}

      </div>

    </div>

  )

}