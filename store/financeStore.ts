import { create } from "zustand"
import { supabase } from "@/lib/supabase"

export type Transaction = {
  id: string
  user_id?: string
  date: string
  type: "ENTRADA" | "SAÍDA"
  description: string
  value: number
  status: "PAGO" | "PREVISTO"
  payment: string
  card?: string | null
  installment?: string | null
  created_at?: string | null

  related_transaction_id?: string | null

  related_transaction_role?:
    | "PRINCIPAL"
    | "ESTORNO_REEMBOLSO"
    | null

  recurring_transaction_id?: string | null
  financial_period_start?: string | null
  financial_period_end?: string | null
}

type FinanceState = {
  sessionUserId: string | null
  sessionVersion: number
  setSessionUser: (userId: string | null) => void

  transactions: Transaction[]

  selectedCategory: string | null

  setSelectedCategory: (
    category: string | null
  ) => void

  selectedFinancialYear: number

  setSelectedFinancialYear: (
    year: number
  ) => void

  loadTransactions: (
    userId: string
  ) => Promise<void>

  addTransaction: (
    transaction: Transaction,
    userId: string
  ) => Promise<void>

  updateTransaction: (
    id: string,
    transaction: Transaction
  ) => Promise<void>

  deleteTransaction: (
    id: string
  ) => Promise<void>
}

/*
  Remove itens repetidos pelo ID e mantém
  os lançamentos em ordem decrescente de data.

  A data de criação e o ID são usados como
  critérios de desempate para deixar a
  ordenação estável durante a paginação.
*/
function normalizeTransactions(
  transactions: Transaction[]
) {
  const transactionsById =
    new Map<string, Transaction>()

  for (const transaction of transactions) {
    if (!transaction?.id) {
      continue
    }

    /*
      Caso o mesmo ID apareça novamente,
      a versão mais recente substitui a anterior.
    */
    transactionsById.set(
      transaction.id,
      transaction
    )
  }

  return Array.from(
    transactionsById.values()
  ).sort((first, second) => {
    const dateComparison =
      second.date.localeCompare(
        first.date
      )

    if (dateComparison !== 0) {
      return dateComparison
    }

    const firstCreatedAt =
      first.created_at ?? ""

    const secondCreatedAt =
      second.created_at ?? ""

    const createdAtComparison =
      secondCreatedAt.localeCompare(
        firstCreatedAt
      )

    if (createdAtComparison !== 0) {
      return createdAtComparison
    }

    return second.id.localeCompare(
      first.id
    )
  })
}

export const useFinanceStore =
  create<FinanceState>((set, get) => ({
    sessionUserId: null,
    sessionVersion: 0,

    setSessionUser: (userId) => {
      if (userId !== null && get().sessionUserId === userId) return

      set((state) => ({
        sessionUserId: userId,
        sessionVersion: state.sessionVersion + 1,
        transactions: [],
        selectedCategory: null,
        selectedFinancialYear: new Date().getFullYear()
      }))
    },

    transactions: [],

    selectedCategory: null,

    setSelectedCategory: (
      category
    ) =>
      set({
        selectedCategory: category
      }),

    selectedFinancialYear:
      new Date().getFullYear(),

    setSelectedFinancialYear: (
      year
    ) =>
      set({
        selectedFinancialYear: year
      }),

    loadTransactions: async (
      userId
    ) => {
      if (get().sessionUserId !== userId) return
      const version = get().sessionVersion
      const pageSize = 1000

      let from = 0

      let allTransactions:
        Transaction[] = []

      while (true) {
        const { data, error } =
          await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)

            /*
              A ordenação precisa ter critérios
              de desempate, pois muitos registros
              podem possuir a mesma data.
            */
            .order("date", {
              ascending: false
            })
            .order("created_at", {
              ascending: false,
              nullsFirst: false
            })
            .order("id", {
              ascending: false
            })
            .range(
              from,
              from + pageSize - 1
            )

        // Uma resposta da sessão anterior nunca deve repopular o estado.
        if (get().sessionVersion !== version) return

        if (error) {
          console.error(
            "Erro ao carregar os lançamentos:",
            error
          )

          return
        }

        if (
          !data ||
          data.length === 0
        ) {
          break
        }

        /*
          Deduplica a cada página para impedir
          que um ID repetido entre no estado.
        */
        allTransactions =
          normalizeTransactions([
            ...allTransactions,
            ...(data as Transaction[])
          ])

        if (
          data.length < pageSize
        ) {
          break
        }

        from += pageSize
      }

      set({
        transactions:
          normalizeTransactions(
            allTransactions
          )
      })
    },

    addTransaction: async (
      transaction,
      userId
    ) => {
      if (get().sessionUserId !== userId) return
      const version = get().sessionVersion
      const { data, error } =
        await supabase
          .from("transactions")
          .insert([
            {
              ...transaction,
              user_id: userId
            }
          ])
          .select()

      if (get().sessionVersion !== version) return

      if (error) {
        console.error(
          "Erro ao adicionar o lançamento:",
          error
        )

        return
      }

      const insertedTransactions =
        (data ??
          []) as Transaction[]

      /*
        Não adiciona cegamente ao fim.
        O Map impede que o mesmo ID fique
        duas vezes no estado do Zustand.
      */
      set((state) => ({
        transactions:
          normalizeTransactions([
            ...state.transactions,
            ...insertedTransactions
          ])
      }))
    },

    updateTransaction: async (
      id,
      updatedTransaction
    ) => {
      const { sessionUserId, sessionVersion } = get()
      if (!sessionUserId) return
      const { error } =
        await supabase
          .from("transactions")
          .update(
            updatedTransaction
          )
          .eq("id", id)
          .eq("user_id", sessionUserId)

      if (get().sessionVersion !== sessionVersion) return

      if (error) {
        console.error(
          "Erro ao atualizar o lançamento:",
          error
        )

        return
      }

      set((state) => ({
        transactions:
          normalizeTransactions(
            state.transactions.map(
              (transaction) =>
                transaction.id === id
                  ? {
                      ...transaction,
                      ...updatedTransaction,
                      id
                    }
                  : transaction
            )
          )
      }))
    },

    deleteTransaction: async (
      id
    ) => {
      const { sessionUserId, sessionVersion } = get()
      if (!sessionUserId) return
      const { error } =
        await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", sessionUserId)

      if (get().sessionVersion !== sessionVersion) return

      if (error) {
        console.error(
          "Erro ao excluir o lançamento:",
          error
        )

        return
      }

      set((state) => ({
        transactions:
          state.transactions.filter(
            (transaction) =>
              transaction.id !== id
          )
      }))
    }
  }))
