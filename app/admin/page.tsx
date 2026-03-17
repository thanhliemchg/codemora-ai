"use client"

import { useState, useEffect } from "react"
import ChangePassword from "../components/ChangePassword"

export default function Admin(){

const [teachers,setTeachers] = useState({
  pending: [],
  active: []
})
const [editingTeacher,setEditingTeacher] = useState<any>(null)
const [user,setUser] = useState<any>(null)
const [showPassword,setShowPassword] = useState(false)


// ================= LOAD DATA =================
async function loadTeachers(){

const res = await fetch("/api/get-teachers")
const data = await res.json()

setTeachers({
  pending: data.filter((t:any)=>t.status==="pending"),
  active: data.filter((t:any)=>t.status==="active")
})

}


// ================= ACTIVATE =================
async function activate(id:string){

const res = await fetch("/api/activate-user",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({id})
})

const result = await res.json()

if(!result.success){
alert("Lỗi ❌")
return
}

alert("Đã kích hoạt")

loadTeachers()
}
// ================= SỬA =================
async function saveTeacher(){

const res = await fetch("/api/update-teacher",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(editingTeacher)
})

const data = await res.json()

if(data.success){
alert("Cập nhật thành công")
setEditingTeacher(null)
loadTeachers()
}else{
alert("Lỗi cập nhật")
}

}

// ================= XÓA =================
async function deleteTeacher(id:string){

if(!confirm("Xoá giáo viên này?")) return

const res = await fetch("/api/delete-teacher",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({id})
})

const result = await res.json()

if(!result.success){
alert("Lỗi ❌")
return
}

alert("Đã xoá")

loadTeachers()

}

// ================= RESET MK =================
async function resetPassword(id:string){

if(!confirm("Reset mật khẩu?")) return

const res = await fetch("/api/reset-teacher-password",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({id})
})

const result = await res.json()

if(!result.success){
alert("Lỗi ❌")
return
}

alert("Mật khẩu mới: " + result.password)

}

// ================= INIT =================
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


// ================= UI =================
return(

<div className="min-h-screen bg-gray-100 text-gray-800">


{/* ===== HEADER ===== */}
<div className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow">

<h1 className="font-bold text-xl">
🚀 CodeMora AI
</h1>

<div className="flex items-center">

<span
onClick={()=>setShowPassword(true)}
className="mr-4 bg-white/20 px-3 py-1 rounded-full text-sm cursor-pointer"
>
👤 {user?.name}
</span>

<button
onClick={()=>{
localStorage.removeItem("user")
window.location.href="/login"
}}
className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg"
>
Đăng xuất
</button>

</div>

</div>


{/* ===== MODAL ĐỔI MẬT KHẨU ===== */}
{showPassword && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white p-6 rounded-xl w-80">

<ChangePassword/>

<button
onClick={()=>setShowPassword(false)}
className="mt-3 bg-gray-200 px-3 py-1 rounded w-full"
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


{/* ===== STATS ===== */}
<div className="grid grid-cols-3 gap-6 mb-8">

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Chờ kích hoạt</div>
<div className="text-3xl font-bold text-yellow-600">
{teachers.pending.length}
</div>
</div>

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Đã kích hoạt</div>
<div className="text-3xl font-bold text-green-600">
{teachers.active.length}
</div>
</div>

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Tổng</div>
<div className="text-3xl font-bold text-indigo-600">
{teachers.pending.length + teachers.active.length}
</div>
</div>

</div>


{/* ===== CHƯA KÍCH HOẠT ===== */}
<div className="bg-white rounded-xl shadow border p-4 mb-6">

<h2 className="text-yellow-600 font-bold mb-3">
Giáo viên chờ kích hoạt
</h2>

<table className="w-full">

<thead className="bg-yellow-50">
<tr>
<th className="p-3 text-left">Tên</th>
<th className="p-3 text-left">Email</th>
<th className="p-3 text-left">Hành động</th>
</tr>
</thead>

<tbody>

{teachers.pending.map((t:any)=>(
<tr key={t.id} className="border-t hover:bg-gray-50">

<td className="p-3">{t.name}</td>
<td className="p-3">{t.email}</td>

<td className="p-3">
<button
type="button"
onClick={()=>activate(t.id)}
className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
>
Kích hoạt
</button>
</td>

</tr>
))}

{teachers.pending.length===0 &&(
<tr>
<td colSpan={3} className="p-4 text-center text-gray-400">
Không có giáo viên chờ kích hoạt
</td>
</tr>
)}

</tbody>

</table>

</div>


{/* ===== ĐÃ KÍCH HOẠT ===== */}
<div className="bg-white rounded-xl shadow border p-4">

<h2 className="text-green-600 font-bold mb-3">
Giáo viên đã kích hoạt
</h2>

<table className="w-full">

<thead className="bg-green-50">
<tr>
<th className="p-3 text-left">Tên</th>
<th className="p-3 text-left">Email</th>
<th className="p-3 text-left">Trạng thái</th>
</tr>
</thead>

<tbody>

{teachers.active.map((t:any)=>(
<tr key={t.id} className="border-t hover:bg-gray-50">

<td className="p-3">{t.name}</td>
<td className="p-3">{t.email}</td>

<td className="p-3">
<span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
Đã kích hoạt
</span>
</td>

<td className="p-3 space-x-2">

<button
type="button"
onClick={()=>{
  console.log("CLICK", t)   
  setEditingTeacher(t)
}}
className="bg-yellow-500 text-white px-2 py-1 rounded"
>
Sửa
</button>

<button
type="button"
onClick={()=>deleteTeacher(t.id)}
className="bg-red-500 text-white px-2 py-1 rounded"
>
Xoá
</button>

<button
type="button"
onClick={()=>resetPassword(t.id)}
className="bg-blue-500 text-white px-2 py-1 rounded"
>
Reset MK
</button>

</td>

</tr>
))}

{teachers.active.length===0 &&(
<tr>
<td colSpan={3} className="p-4 text-center text-gray-400">
Chưa có giáo viên nào
</td>
</tr>
)}

</tbody>

</table>

</div>


</div>
{editingTeacher && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">

<div className="bg-white p-6 rounded-xl w-80">

<h2 className="font-bold mb-3">Sửa giáo viên</h2>

<input
className="border p-2 w-full mb-2 text-black"
value={editingTeacher.name || ""}
onChange={(e)=>setEditingTeacher({
...editingTeacher,
name:e.target.value
})}
/>

<input
className="border p-2 w-full mb-2 text-black"
value={editingTeacher.email || ""}
onChange={(e)=>setEditingTeacher({
...editingTeacher,
email:e.target.value
})}
/>

<div className="flex gap-2">

<button
onClick={()=>setEditingTeacher(null)}
className="bg-gray-300 px-3 py-1 rounded"
>
Huỷ
</button>

<button
onClick={saveTeacher}
className="bg-blue-500 text-white px-3 py-1 rounded"
>
Lưu
</button>

</div>

</div>

</div>

)}
</div>

)
}