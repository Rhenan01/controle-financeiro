"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Pencil, Trash2 } from "lucide-react"


export default function PaymentMethodsTable() {

  const [methods,setMethods] = useState<any[]>([])
  const [modalOpen,setModalOpen] = useState(false)
  const [editingId,setEditingId] = useState<string | null>(null)
  const [input,setInput] = useState("")



  async function loadMethods(){

    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .order("name")

    if(data){
      setMethods(data)
    }

  }



  useEffect(()=>{
    loadMethods()
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



  function openNew(){

    setInput("")
    setEditingId(null)
    setModalOpen(true)

  }



  function openEdit(method:any){

    setInput(method.name)
    setEditingId(method.id)
    setModalOpen(true)

  }



  async function save(){

    if(!input) return

    const { data:userData } = await supabase.auth.getUser()
    const user = userData.user

    if(!user) return


    if(editingId){

      await supabase
        .from("payment_methods")
        .update({ name:input })
        .eq("id",editingId)

    }else{

      await supabase
        .from("payment_methods")
        .insert({
          user_id:user.id,
          name:input
        })

    }

    await loadMethods()

    setModalOpen(false)

  }



  async function remove(id:string){

    await supabase
      .from("payment_methods")
      .delete()
      .eq("id",id)

    await loadMethods()

  }



  return (

    <div className="bg-white border border-gray-200 rounded-xl shadow">

      <div className="flex justify-between p-4 border-b">

        <span className="font-medium text-slate-700">
          Formas de pagamento
        </span>

        <button
          onClick={openNew}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
        >
          + Novo
        </button>

      </div>


      <div className="p-4 space-y-2">

        {methods.map((m)=>(

          <div
            key={m.id}
            className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
          >

            <span className="text-slate-700">
              {m.name}
            </span>


            <div className="flex gap-2">

              <button
                onClick={() => openEdit(m)}
                className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition"
                title="Editar"
              >
                <Pencil size={16} />
              </button>

              <button
                onClick={() => remove(m.id)}
                className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition"
                title="Excluir"
              >
                <Trash2 size={16} />
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

              {editingId ? "Editar pagamento" : "Novo pagamento"}

            </h3>

            <input
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              placeholder="Ex: PIX"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm
              text-slate-900 placeholder:text-slate-400
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