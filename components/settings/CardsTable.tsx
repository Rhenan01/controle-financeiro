"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Pencil, Trash2 } from "lucide-react"
export default function CardsTable(){

  const [cards,setCards] = useState<any[]>([])
  const [modalOpen,setModalOpen] = useState(false)
  const [editingId,setEditingId] = useState<string | null>(null)

  const [nome,setNome] = useState("")
  const [fecha,setFecha] = useState("")
  const [vence,setVence] = useState("")
  const [limite,setLimite] = useState("")
  const [color,setColor] = useState("#334155")

  async function loadCards(){

    const { data } = await supabase
      .from("cards")
      .select("*")
      .order("name")

    if(data){
      setCards(data)
    }

  }

  useEffect(()=>{

    loadCards()

  },[])

  useEffect(()=>{

    function handleEsc(e:KeyboardEvent){

      if(e.key === "Escape"){
        setModalOpen(false)
      }

    }

    window.addEventListener("keydown",handleEsc)

    return ()=>{
      window.removeEventListener("keydown",handleEsc)
    }

  },[])

  function openNew(){

    setNome("")
    setFecha("")
    setVence("")
    setLimite("")
    setColor("#334155")
    setEditingId(null)
    setModalOpen(true)

  }

  function openEdit(card:any){

    setNome(card.name)
    setFecha(String(card.closing_day))
    setVence(String(card.due_day))
    setLimite(String(card.limit_value))
    setColor(card.color ?? "#334155")

    setEditingId(card.id)
    setModalOpen(true)

  }

  async function save(){

    if(!nome) return

    const { data:userData } = await supabase.auth.getUser()
    const user = userData.user

    if(!user) return

    if(editingId){

      await supabase
        .from("cards")
        .update({
          name:nome,
          closing_day:Number(fecha),
          due_day:Number(vence),
          limit_value:Number(limite),
          color:color
        })
        .eq("id",editingId)

    }else{

      await supabase
        .from("cards")
        .insert({
          user_id:user.id,
          name:nome,
          closing_day:Number(fecha),
          due_day:Number(vence),
          limit_value:Number(limite),
          color:color
        })

    }

    await loadCards()

    setModalOpen(false)

  }

  async function remove(id:string){

    await supabase
      .from("cards")
      .delete()
      .eq("id",id)

    await loadCards()

  }

  return(

    <div className="bg-white border border-gray-200 rounded-xl shadow">

      <div className="flex justify-between p-4 border-b">

        <span className="font-medium text-slate-700">
          Cartões cadastrados
        </span>

        <button
          onClick={openNew}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
        >
          + Novo
        </button>

      </div>

      <table className="w-full text-sm">

        <thead className="bg-gray-50 text-gray-700">

          <tr>

            <th className="text-left px-4 py-3">Cor</th>
            <th className="text-left px-4 py-3">Nome</th>
            <th className="text-left px-4 py-3">Fecha dia</th>
            <th className="text-left px-4 py-3">Vence dia</th>
            <th className="text-left px-4 py-3">Limite</th>
            <th className="text-right px-4 py-3">Ações</th>

          </tr>

        </thead>

        <tbody>

          {cards.map((c)=>(

            <tr key={c.id} className="border-t hover:bg-gray-50">

              <td className="px-4 py-3">

                <div
                  className="w-4 h-4 rounded-full"
                  style={{backgroundColor:c.color ?? "#334155"}}
                />

              </td>

              <td
                className="px-4 py-3 font-medium"
                style={{color:c.color ?? "#334155"}}
              >
                {c.name}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {c.closing_day}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {c.due_day}
              </td>

              <td className="px-4 py-3 text-slate-700">
                R$ {Number(c.limit_value).toLocaleString("pt-BR")}
              </td>

              <td className="px-4 py-3 text-right">

                <div className="flex justify-end gap-2">

                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => remove(c.id)}
                    className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition"
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

      {modalOpen && (

        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          onClick={()=>setModalOpen(false)}
        >

          <div
            className="bg-white p-6 rounded-xl w-[420px] space-y-4 shadow-xl"
            onClick={(e)=>e.stopPropagation()}
          >

            <h3 className="text-lg font-semibold text-slate-900">

              {editingId
                ? "Editar cartão"
                : "Novo cartão"
              }

            </h3>

            <input
              value={nome}
              onChange={(e)=>setNome(e.target.value)}
              placeholder="Nome do cartão"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-slate-900"
            />

            <input
              value={fecha}
              onChange={(e)=>setFecha(e.target.value)}
              placeholder="Fecha dia"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-slate-900"
            />

            <input
              value={vence}
              onChange={(e)=>setVence(e.target.value)}
              placeholder="Vence dia"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-slate-900"
            />

            <input
              value={limite}
              onChange={(e)=>setLimite(e.target.value)}
              placeholder="Limite"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-slate-900"
            />

            <div>

              <label className="text-sm text-gray-600">
                Cor do cartão
              </label>

              <input
                type="color"
                value={color}
                onChange={(e)=>setColor(e.target.value)}
                className="w-full h-10 border rounded-lg"
              />

            </div>

            <div className="flex justify-end gap-3 pt-2">

              <button
                onClick={()=>setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                cancelar
              </button>

              <button
                onClick={save}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700"
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