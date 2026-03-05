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
}

type FinanceState = {
  transactions: Transaction[]

  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void

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

  loadTransactions: async (userId) => {

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    set({ transactions: data as Transaction[] })

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