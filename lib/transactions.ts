import { supabase } from "./supabase"

export async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createTransaction(transaction: any) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([transaction])
    .select()

  if (error) {
    console.error(error)
    throw error
  }

  return data
}