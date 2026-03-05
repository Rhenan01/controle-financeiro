"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"



export default function SalaryDaysTable() {

  const [days,setDays] = useState<any[]>([])
  const [modalOpen,setModalOpen] = useState(false)
  const [editingId,setEditingId] = useState<string | null>(null)
  const [input,setInput] = useState("")



  async function loadDays(){

    const { data } = await supabase
      .from("salary_days")
      .select("*")
      .order("payment_date")

    if(data){
      setDays(data)
    }

  }



  useEffect(()=>{
    loadDays()
  },[])



  // fechar modal com ESC

  useEffect(()=>{

    function handleEsc(e:KeyboardEvent){
      if(e.key==="Escape"){
        setModalOpen(false)
      }
    }

    window.addEventListener("keydown",handleEsc)

    return ()=>window.removeEventListener("keydown",handleEsc)

  },[])



  function formatDate(date:string){

    const [year,month,day] = date.split("-")

    return `${day}/${month}/${year}`

  }



  function openNew(){

    setInput("")
    setEditingId(null)
    setModalOpen(true)

  }



  function openEdit(day:any){

    setInput(day.payment_date) // já vem no formato YYYY-MM-DD
    setEditingId(day.id)
    setModalOpen(true)

  }



  async function save(){

    if(!input) return

    const { data:userData } = await supabase.auth.getUser()
    const user = userData.user

    if(!user) return


    if(editingId){

      await supabase
        .from("salary_days")
        .update({
          payment_date:input
        })
        .eq("id",editingId)

    }else{

      await supabase
        .from("salary_days")
        .insert({
          user_id:user.id,
          payment_date:input
        })

    }

    await loadDays()

    setModalOpen(false)

  }



  async function remove(id:string){

    await supabase
      .from("salary_days")
      .delete()
      .eq("id",id)

    await loadDays()

  }



  return (

    <div className="bg-white border border-gray-200 rounded-xl shadow">

      <div className="flex justify-between p-4 border-b">

        <span className="font-medium text-slate-700">
          Datas de pagamento
        </span>

        <button
          onClick={openNew}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
        >
          + Novo
        </button>

      </div>


      <div className="p-4 space-y-2">

        {days.map((d)=>(

          <div
            key={d.id}
            className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-lg"
          >

            <span className="text-blue-700 font-medium">
              {formatDate(d.payment_date)}
            </span>

            <div className="flex gap-3 text-sm">

              <button
                onClick={()=>openEdit(d)}
                className="text-blue-600 hover:underline"
              >
                editar
              </button>

              <button
                onClick={()=>remove(d.id)}
                className="text-red-500 hover:underline"
              >
                excluir
              </button>

            </div>

          </div>

        ))}

      </div>



      {modalOpen && (

        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          onClick={()=>setModalOpen(false)}
        >

          <div
            className="bg-white p-6 rounded-xl w-[350px] space-y-4 shadow-xl"
            onClick={(e)=>e.stopPropagation()}
          >

            <h3 className="text-lg font-semibold text-slate-800">

              {editingId ? "Editar data" : "Nova data"}

            </h3>

            <input
              type="date"
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm
              text-slate-900
              focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="flex justify-end gap-3">

              <button
                onClick={()=>setModalOpen(false)}
                className="text-gray-500"
              >
                cancelar
              </button>

              <button
                onClick={save}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg"
              >
                salvar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}