"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useFinanceStore } from "@/store/financeStore"

type Card = {
  id:string
  name:string
  closing_day:number
  due_day:number
  limit_value:number
  color:string
}

type Props = {
  financialRange:{
    start:string
    end:string
    label:string
  }
}



export default function CreditCardsStatus({financialRange}:Props){

  const transactions = useFinanceStore(s=>s.transactions)

  const [cards,setCards] = useState<Card[]>([])
  const [paidMap,setPaidMap] = useState<Record<string,boolean>>({})

  useEffect(()=>{

    async function loadCards(){

      const {data} = await supabase
        .from("cards")
        .select("*")
        .order("name")

      if(data) setCards(data)

    }

    loadCards()

  },[])

  // carregar estado pago

  useEffect(()=>{

    async function loadInvoices(){

      const {data:userData} = await supabase.auth.getUser()
      const user = userData.user

      if(!user) return

      const {data} = await supabase
        .from("card_invoices")
        .select("*")
        .eq("month_label",financialRange.label)
        .eq("user_id",user.id)

      const map:Record<string,boolean> = {}

      data?.forEach(i=>{
        map[i.card_id] = i.paid
      })

      setPaidMap(map)

    }

    loadInvoices()

  },[financialRange])

  async function togglePaid(cardId:string){

    const {data:userData} = await supabase.auth.getUser()
    const user = userData.user

    if(!user) return

    const current = paidMap[cardId] ?? false
    const next = !current

    setPaidMap(prev=>({...prev,[cardId]:next}))

    const {data:existing} = await supabase
      .from("card_invoices")
      .select("id")
      .eq("card_id",cardId)
      .eq("month_label",financialRange.label)
      .single()

    if(existing){

      await supabase
        .from("card_invoices")
        .update({paid:next})
        .eq("id",existing.id)

    }else{

      await supabase
        .from("card_invoices")
        .insert({
          user_id:user.id,
          card_id:cardId,
          month_label:financialRange.label,
          start_date:financialRange.start,
          end_date:financialRange.end,
          paid:next
        })

    }

  }

  const cardsWithInvoice = useMemo(()=>{

    const today = new Date().toISOString().slice(0,10)

    const isFuture = financialRange.start > today
    const isPast = financialRange.end < today

    const list = cards.map(card=>{

      const invoice = transactions
        .filter(t=>{

          const sameCard =
            t.card?.toLowerCase().trim() === card.name.toLowerCase().trim()

          const credit =
            t.payment?.toLowerCase().includes("cr")

          const inRange =
            t.date >= financialRange.start &&
            t.date <= financialRange.end

          return sameCard && credit && inRange

        })
        .reduce((sum,t)=>sum+t.value,0)

      const paid = paidMap[card.id] ?? false

      let status:"PAGO"|"ATRASADA"|"ABERTA" = "ABERTA"

      if(paid){

        status = "PAGO"

      }else{

        if(isPast){

          status = "ATRASADA"

        }else if(!isFuture){

          const month = today.slice(0,7)

          const dueDate =
            `${month}-${String(card.due_day).padStart(2,"0")}`

          if(today > dueDate){
            status = "ATRASADA"
          }

        }

      }

      return{
        ...card,
        invoice,
        status
      }

    })

    return list.sort((a,b)=>{

      const order = {
        "ATRASADA":0,
        "ABERTA":1,
        "PAGO":2
      }

      if(order[a.status] !== order[b.status]){
        return order[a.status] - order[b.status]
      }

      return b.invoice - a.invoice

    })

  },[cards,transactions,financialRange,paidMap])

  function money(v:number){

    return v.toLocaleString("pt-BR",{
      style:"currency",
      currency:"BRL"
    })

  }

  return(

    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200">

      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Status das Faturas
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">

        {cardsWithInvoice.map(card=>{

          const paid = paidMap[card.id] ?? false

          return(

            <div
              key={card.id}
              className="p-4 min-h-[130px] rounded-lg border border-gray-200 bg-white hover:shadow-md transition flex flex-col justify-between"
            >

              <div className="flex items-center justify-between">

                <h3
                  className="text-sm font-semibold truncate pr-2"
                  style={{color: card.color}}
                >
                  {card.name}
                </h3>

                <input
                  type="checkbox"
                  checked={paid}
                  onChange={()=>togglePaid(card.id)}
                  className="w-4 h-4 flex-shrink-0 accent-emerald-600 cursor-pointer"
                />

              </div>

              <div className="text-xs text-gray-500">
                vence dia {card.due_day}
              </div>

              <div className="text-lg font-semibold text-slate-800">
                {money(card.invoice)}
              </div>

              <div className="text-xs text-gray-400">
                limite {money(card.limit_value)}
              </div>

              <div className="mt-2">

                {card.status === "PAGO" && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">
                    Pago
                  </span>
                )}

                {card.status === "ABERTA" && (
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
                    Em aberto
                  </span>
                )}

                {card.status === "ATRASADA" && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    Atrasada
                  </span>
                )}

              </div>

            </div>

          )

        })}

      </div>

    </div>

  )

}