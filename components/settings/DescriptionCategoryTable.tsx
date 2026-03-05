"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function DescriptionCategoryTable(){

const [data,setData] = useState<any[]>([])
const [filtered,setFiltered] = useState<any[]>([])
const [selected,setSelected] = useState<string[]>([])

const [modalOpen,setModalOpen] = useState(false)
const [editingId,setEditingId] = useState<string|null>(null)

const [descricao,setDescricao] = useState("")
const [categoria,setCategoria] = useState("")

const [descFilter,setDescFilter] = useState<string[]>([])
const [catFilter,setCatFilter] = useState<string[]>([])

const [openFilter,setOpenFilter] = useState<string|null>(null)



async function loadData(){

const {data}=await supabase
.from("description_categories")
.select("*")
.order("description")

if(data){
setData(data)
setFiltered(data)
}

}



useEffect(()=>{loadData()},[])



useEffect(()=>{

let temp=[...data]

if(descFilter.length>0){
temp=temp.filter(i=>descFilter.includes(i.description))
}

if(catFilter.length>0){
temp=temp.filter(i=>catFilter.includes(i.category))
}

setFiltered(temp)

},[descFilter,catFilter,data])



useEffect(()=>{

function esc(e:KeyboardEvent){
if(e.key==="Escape"){
setModalOpen(false)
}
}

window.addEventListener("keydown",esc)

return ()=>window.removeEventListener("keydown",esc)

},[])



function toggleSelect(id:string){

if(selected.includes(id)){
setSelected(selected.filter(i=>i!==id))
}else{
setSelected([...selected,id])
}

}



function selectAll(){

if(selected.length===filtered.length){
setSelected([])
}else{
setSelected(filtered.map(i=>i.id))
}

}



async function deleteSelected(){

for(const id of selected){

await supabase
.from("description_categories")
.delete()
.eq("id",id)

}

setSelected([])
loadData()

}



function openNew(){

setDescricao("")
setCategoria("")
setEditingId(null)
setModalOpen(true)

}



function openEdit(item:any){

setDescricao(item.description ?? "")
setCategoria(item.category ?? "")
setEditingId(item.id)
setModalOpen(true)

}



async function save(){

if(!descricao || !categoria) return

const user=(await supabase.auth.getUser()).data.user

if(!user) return

let error

if(editingId){

const res=await supabase
.from("description_categories")
.update({
description:descricao.toUpperCase().trim(),
category:categoria
})
.eq("id",editingId)

error=res.error

}else{

const res=await supabase
.from("description_categories")
.insert({
user_id:user.id,
description:descricao.toUpperCase().trim(),
category:categoria
})

error=res.error

}

if(error){

alert("Essa descrição já existe.")

return

}

setModalOpen(false)
loadData()

}



const descriptions=[...new Set(data.map(i=>i.description))]
const categories=[...new Set(data.map(i=>i.category))]



function toggleDesc(value:string){

if(descFilter.includes(value)){
setDescFilter(descFilter.filter(i=>i!==value))
}else{
setDescFilter([...descFilter,value])
}

}



function toggleCat(value:string){

if(catFilter.includes(value)){
setCatFilter(catFilter.filter(i=>i!==value))
}else{
setCatFilter([...catFilter,value])
}

}



return(

<div className="bg-white border border-gray-200 rounded-xl shadow">

<div className="flex justify-between items-center p-4 border-b">

<span className="font-medium text-slate-700">
Regras de categorização automática
</span>

<div className="flex items-center gap-3">

{selected.length>0 &&(

<span className="text-sm text-slate-600">
{selected.length} selecionado(s)
</span>

)}

{selected.length>0 &&(

<button
onClick={deleteSelected}
className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
>
Excluir selecionados
</button>

)}

<button
onClick={openNew}
className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
>
+ Novo
</button>

</div>

</div>



<div className="max-h-[450px] overflow-y-auto">

<table className="w-full text-sm">

<thead className="bg-gray-50 sticky top-0">

<tr>

<th className="px-4 py-3 w-[40px] text-center">

<input
type="checkbox"
checked={selected.length===filtered.length && filtered.length>0}
onChange={selectAll}
/>

</th>

<th className="text-left px-4 py-3 text-slate-700 font-medium relative">

<div className="flex items-center gap-2">

Descrição

<button
onClick={()=>setOpenFilter(openFilter==="desc"?null:"desc")}
className="text-gray-500 hover:text-gray-700"
>
▼
</button>

</div>

{openFilter==="desc" && (

<div className="absolute bg-white border rounded-lg shadow p-2 mt-2 max-h-48 overflow-y-auto z-20">

<label className="flex items-center gap-2 pb-2 border-b">

<input
type="checkbox"
checked={descFilter.length===descriptions.length}
onChange={()=>{

if(descFilter.length===descriptions.length){
setDescFilter([])
}else{
setDescFilter(descriptions)
}

}}
/>

Marcar todos

</label>

{descriptions.map(d=>(

<label key={d} className="flex items-center gap-2 py-1">

<input
type="checkbox"
checked={descFilter.includes(d)}
onChange={()=>toggleDesc(d)}
/>

<span className="text-slate-700">{d}</span>

</label>

))}

</div>

)}

</th>



<th className="text-left px-4 py-3 text-slate-700 font-medium relative">

<div className="flex items-center gap-2">

Categoria

<button
onClick={()=>setOpenFilter(openFilter==="cat"?null:"cat")}
className="text-gray-500 hover:text-gray-700"
>
▼
</button>

</div>

{openFilter==="cat" && (

<div className="absolute bg-white border rounded-lg shadow p-2 mt-2 max-h-48 overflow-y-auto z-20">

<label className="flex items-center gap-2 pb-2 border-b">

<input
type="checkbox"
checked={catFilter.length===categories.length}
onChange={()=>{

if(catFilter.length===categories.length){
setCatFilter([])
}else{
setCatFilter(categories)
}

}}
/>

Marcar todos

</label>

{categories.map(c=>(

<label key={c} className="flex items-center gap-2 py-1">

<input
type="checkbox"
checked={catFilter.includes(c)}
onChange={()=>toggleCat(c)}
/>

<span className="text-slate-700">{c}</span>

</label>

))}

</div>

)}

</th>



<th className="text-right px-4 py-3 text-slate-700 font-medium">
Ações
</th>

</tr>

</thead>



<tbody>

{filtered.map(item=>(

<tr key={item.id} className="border-t hover:bg-gray-50">

<td className="px-4 py-3 text-center">

<input
type="checkbox"
checked={selected.includes(item.id)}
onChange={()=>toggleSelect(item.id)}
/>

</td>

<td className="px-4 py-3 text-slate-800 font-medium">
{item.description}
</td>

<td className="px-4 py-3 text-slate-700">
{item.category}
</td>

<td className="px-4 py-3 text-right space-x-3">

<button
onClick={()=>openEdit(item)}
className="text-blue-600 hover:underline text-sm"
>
editar
</button>

<button
onClick={()=>supabase
.from("description_categories")
.delete()
.eq("id",item.id)
.then(loadData)}
className="text-red-500 hover:underline text-sm"
>
excluir
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>



{modalOpen &&(

<div
className="fixed inset-0 bg-black/40 flex items-center justify-center"
onClick={()=>setModalOpen(false)}
>

<div
className="bg-white p-6 rounded-xl w-[400px] space-y-4"
onClick={(e)=>e.stopPropagation()}
>

<h3 className="text-lg font-semibold text-slate-900">

{editingId?"Editar regra":"Nova regra"}

</h3>

<input
value={descricao || ""}
onChange={(e)=>setDescricao(e.target.value)}
placeholder="Descrição"
className="w-full border border-gray-300 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400"
/>

<input
value={categoria || ""}
onChange={(e)=>setCategoria(e.target.value)}
placeholder="Categoria"
className="w-full border border-gray-300 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400"
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