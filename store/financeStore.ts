import { create } from "zustand"
import { supabase } from "@/lib/supabase"

export type Transaction = {
  id: string
  date: string
  type: "ENTRADA" | "SAÍDA"
  description: string
  value: number
  status: "PAGO" | "PREVISTO"
  payment: string
  card?: string
  installment?: string
  related_transaction_id?: string | null
  related_transaction_role?: "PRINCIPAL" | "ESTORNO_REEMBOLSO" | null
}

type FinanceState = {
  transactions: Transaction[]

  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
selectedFinancialYear: number
setSelectedFinancialYear: (year: number) => void
  
  loadTransactions: (userId: string) => Promise<void>
  addTransaction: (t: Transaction, userId: string) => Promise<void>
  updateTransaction: (id: string, t: Transaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

export const useFinanceStore = create<FinanceState>((set) => ({

  transactions: [],

  selectedCategory: null,

  setSelectedCategory: (category) =>
    set({ selectedCategory: category }),
  selectedFinancialYear: new Date().getFullYear(),

  setSelectedFinancialYear: (year) =>
    set({ selectedFinancialYear: year }),
  loadTransactions: async (userId) => {
    const pageSize = 1000
    let from = 0
    let allTransactions: Transaction[] = []

    while (true) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .range(from, from + pageSize - 1)

      if (error) {
        console.error(error)
        return
      }

      if (!data || data.length === 0) {
        break
      }

      allTransactions = [...allTransactions, ...(data as Transaction[])]

      if (data.length < pageSize) {
        break
      }

      from += pageSize
    }

    set({ transactions: allTransactions })
  },

  addTransaction: async (transaction, userId) => {

    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...transaction, user_id: userId }])
      .select()

    if (error) {
      console.error(error)
      return
    }

    set((state) => ({
      transactions: [...state.transactions, ...(data as Transaction[])]
    }))

  },

  updateTransaction: async (id, updated) => {

    const { error } = await supabase
      .from("transactions")
      .update(updated)
      .eq("id", id)

    if (error) {
      console.error(error)
      return
    }

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...updated, id } : t
      )
    }))

  },

  deleteTransaction: async (id) => {

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)
      return
    }

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id)
    }))

  }

}))