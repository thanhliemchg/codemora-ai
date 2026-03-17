"use client"

import { useState,useEffect } from "react"
import ChangePassword from "../components/ChangePassword"
export default function Admin(){

const [teachers,setTeachers] = useState<any[]>([])
const [user,setUser] = useState<any>(null)
const [showPassword,setShowPassword] = useState(false)
async function loadTeachers(){

const res = await fetch("/api/pending-teachers")

const data = await res.json()

setTeachers(data || [])

}

async function activate(id: string){

await fetch("/api/activate-user",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({id})

})

loadTeachers()

}

useEffect(()=>{

loadTeachers()

const u = localStorage.getItem("user")

if(!u){
window.location.href="/login"
return
}

const userData = JSON.parse(u)

if(userData.role !== "admin"){
window.location.href="/"
return
}

setUser(userData)

},[])

return(

<div className="min-h-screen bg-gray-100 text-gray-800">

{/* ===== HEADER ===== */}

<div className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow">

<h1 className="font-bold text-xl text-white">
🚀 CodeMora AI
</h1>

<div className="flex items-center">

<span
onClick={()=>setShowPassword(true)}
className="mr-4 bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold cursor-pointer"
>
👤 {user?.name}
</span>

<button
onClick={()=>{
localStorage.removeItem("user")
window.location.href="/login"
}}
className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow"
>
Đăng xuất
</button>

</div>

</div>
{showPassword && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center">

<div className="bg-white p-6 rounded-xl">

<ChangePassword/>

<button
onClick={()=>setShowPassword(false)}
className="mt-3 bg-gray-300 px-3 py-1 rounded"
>
Đóng
</button>

</div>

</div>
)}

{/* ===== CONTENT ===== */}

<div className="p-8">

<h1 className="text-2xl font-bold mb-6">
Admin Dashboard
</h1>
<div className="grid grid-cols-3 gap-6 mb-8">

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Giáo viên chờ kích hoạt</div>
<div className="text-3xl font-bold text-indigo-600">
{teachers.length}
</div>
</div>

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Tổng giáo viên</div>
<div className="text-3xl font-bold text-green-600">
{teachers.length}
</div>
</div>

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Trạng thái hệ thống</div>
<div className="text-3xl font-bold text-blue-600">
Online
</div>
</div>

</div>
<div className="bg-white rounded-xl shadow-lg border overflow-hidden">

<table className="w-full">

<thead className="bg-indigo-50">

<tr>

<th className="p-3 text-left">Tên</th>
<th className="p-3 text-left">Email</th>
<th className="p-3 text-left">Kích hoạt</th>

</tr>

</thead>

<tbody>

{teachers.map((t:any)=>(

<tr key={t.id} className="border-t hover:bg-gray-50 transition">

<td className="p-3">{t.name}</td>

<td className="p-3">{t.email}</td>

<td className="p-3">

<button
onClick={()=>activate(t.id)}
className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
>
Kích hoạt
</button>

</td>

</tr>

))}

{teachers.length===0 &&(

<tr>

<td colSpan={3} className="p-4 text-center text-gray-500">
Không có giáo viên chờ kích hoạt
</td>

</tr>

)}

</tbody>

</table>

</div>

</div>

</div>

)

}