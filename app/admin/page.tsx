"use client"

import { useState, useEffect } from "react"
import ChangePassword from "../components/ChangePassword"
import * as XLSX from "xlsx"
import Header from "../components/header"
export default function Admin(){

const [teachers,setTeachers] = useState({
  pending: [],
  active: []
})
const [students,setStudents] = useState({
  pending: [],
  active: []
})

const [selectedStudents,setSelectedStudents] = useState<string[]>([])
const [loadingStudents,setLoadingStudents] = useState(false)

const [editingTeacher,setEditingTeacher] = useState<any>(null)
const [user,setUser] = useState<any>(null)
const [showPassword,setShowPassword] = useState(false)

const [editingStudent,setEditingStudent] = useState<any>(null)
const [classes,setClasses] = useState<any[]>([])
const [selectedClass,setSelectedClass] = useState("")

const filteredStudents = students.active.filter((s:any)=>
  !selectedClass || s.class_id === selectedClass
)
const filteredActive = students.active.filter((s:any)=>{
  if(!selectedClass) return true
  return String(s.class_id) === String(selectedClass)
})

const filteredPending = students.pending.filter((s:any)=>{
  if(!selectedClass) return true
  return String(s.class_id) === String(selectedClass)
})

// ================= LOAD DATA =================
async function loadClasses(){
  const res = await fetch("/api/get-classes")
  const data = await res.json()
  setClasses(data || [])
}

async function loadTeachers(){

const res = await fetch("/api/get-teachers")
const data = await res.json()

setTeachers({
  pending: data.filter((t:any)=>t.status==="pending"),
  active: data.filter((t:any)=>t.status==="active")
})

}

console.log("selectedClass:", selectedClass)
console.log("filtered:", filteredActive.length)

async function loadStudents(){
  try{
    setLoadingStudents(true)

    const res = await fetch("/api/get-students")

    console.log("STATUS:", res.status)

    const text = await res.text()
    console.log("RAW:", text)

    const data = JSON.parse(text)
    console.log("PARSED:", data)

    setStudents({
      pending: data.filter((s:any)=>s.status==="pending"),
      active: data.filter((s:any)=>s.status==="active")
    })

  }catch(err){
    console.error("LỖI:", err)
    alert("Lỗi tải học sinh ❌")
  }finally{
    setLoadingStudents(false)
  }
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

async function activateStudent(id:string){

  await fetch("/api/activate-user",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({id})
  })

  loadStudents()
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


async function deleteStudent(id:string){

  if(!confirm("Xoá học sinh?")) return

  await fetch("/api/delete-student",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({id})
  })

  loadStudents()
}


// ================= RESET MK =================
async function resetStudent(id:string){

  if(!confirm("Reset mật khẩu?")) return

  const res = await fetch("/api/reset-password",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      ids: [id] // ✅ QUAN TRỌNG
    })
  })

  const result = await res.json()

  console.log("RESET:", result)

  if(!result.success){
    alert("Lỗi reset ❌")
    return
  }

  alert("Mật khẩu mới: " + result.accounts[0].password)
}
async function resetSelected(){

  if(selectedStudents.length === 0){
    alert("Chọn học sinh trước")
    return
  }

  const res = await fetch("/api/reset-password",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      ids: selectedStudents
    })
  })

  const result = await res.json()

  console.log("RESULT:", result)

  if(!result.success){
    alert("Lỗi reset ❌")
    return
  }

  if(!result.accounts || result.accounts.length === 0){
    alert("Không có dữ liệu để xuất")
    return
  }

  // ===== EXPORT EXCEL =====
  const data = result.accounts.map((a:any, i:number)=>({
    STT: i + 1,
    "Tên": a.name,
    "Email": a.email,
    "Mật khẩu": a.password
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, "Passwords")

  XLSX.writeFile(wb, "reset_password.xlsx")

  alert(`Đã reset ${result.count} tài khoản`)

  setSelectedStudents([])
}

async function saveStudent(){

  const res = await fetch("/api/update-student-admin",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify(editingStudent)
  })

  const data = await res.json()

  if(data.success){
    alert("Cập nhật thành công")
    setEditingStudent(null)
    loadStudents()
  }else{
    alert("Lỗi ❌")
  }

}
// ================= INIT =================
useEffect(()=>{

loadTeachers()
loadStudents()
loadClasses()
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
<Header user={user} />
{/* ===== CONTENT ===== */}
<div className="p-8">


<h1 className="text-1xl font-bold mb-6">
Trang Admin
</h1>


{/* ===== STATS ===== */}
<div className="grid grid-cols-3 gap-6 mb-8">

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Chờ kích hoạt</div>
<div className="text-3xl font-bold text-yellow-600">
{teachers.pending.length + students.pending.length}
</div>
</div>

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Đã kích hoạt</div>
<div className="text-3xl font-bold text-green-600">
{teachers.active.length + students.active.length}
</div>
</div>

<div className="bg-white p-6 rounded-xl shadow border">
<div className="text-gray-500 text-sm">Tổng</div>
<div className="text-3xl font-bold text-indigo-600">
{teachers.pending.length + teachers.active.length+students.active.length+ students.pending.length}
</div>
</div>

</div>

{/* ===== CHƯA KÍCH HOẠT ===== */}
<div className="bg-white rounded-xl shadow border p-4 mb-6">
<h2 className="text-xl font-bold mb-4">
👨 Quản lý giáo viên
</h2>

<h2 className="text-yellow-600 font-bold mb-3">
Giáo viên chờ kích hoạt ({teachers.pending.length})
</h2>

<div className="hidden md:block overflow-x-auto">
  {/* TABLE DESKTOP TEACHERS */}
<table className="w-full">

<thead className="bg-yellow-50">
<tr>
<th className="p-3 text-left">Họ và tên</th>
<th className="p-3 text-left">Email</th>
<th className="p-3 text-left">Hành động</th>
</tr>
</thead>

<tbody>

{teachers.pending.map((t:any)=>(
<tr key={t.id} className="border-t hover:bg-gray-50">

<td className="p-3 font-semibold">{t.name}</td>
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
<div className="md:hidden space-y-3">

{teachers.pending.map((t:any)=>(
  <div key={t.id} className="bg-yellow-50 rounded-xl p-4 shadow border">

    <div className="font-semibold">
      {t.name}
    </div>

    <div className="text-sm text-gray-600">
      {t.email}
    </div>

    <button
      onClick={()=>activate(t.id)}
      className="mt-3 bg-green-500 text-white px-3 py-1 rounded text-sm"
    >
      Kích hoạt
    </button>

  </div>
))}

</div>
{/* ===== ĐÃ KÍCH HOẠT ===== */}


<h2 className="text-green-600 font-bold mb-4">
Giáo viên đã kích hoạt ({teachers.active.length})
</h2>
<div className="hidden md:block overflow-x-auto">
  {/* TABLE DESKTOP TEACHERS */}
<table className="w-full">

<thead className="bg-green-50">
<tr>
<th className="p-3 text-left">Họ và tên</th>
<th className="p-3 text-left">Email</th>
<th className="p-3 text-left">Trạng thái</th>
</tr>
</thead>

<tbody>

{teachers.active.map((t:any)=>(
<tr key={t.id} className="border-t hover:bg-gray-50">

<td className="p-3 font-semibold">{t.name}</td>
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
<div className="md:hidden space-y-3">

{teachers.active.map((t:any)=>(
  <div key={t.id} className="bg-white rounded-xl p-4 shadow border">

    <div className="font-semibold text-base">
      {t.name}
    </div>

    <div className="text-sm text-gray-600">
      {t.email}
    </div>

    <div className="mt-1 text-green-600 text-sm">
      Đã kích hoạt
    </div>

    <div className="flex gap-2 mt-3 flex-wrap">

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

    </div>

  </div>
))}

</div>

{/* ================= STUDENTS ================= */}

<div className="bg-white rounded-xl shadow border p-4 mb-6">

<h2 className="text-xl font-bold mb-4">
👨‍🎓 Quản lý học sinh
</h2>
<div>
<h2 className=" text-blue px-3 py-1">Lọc theo lớp: </h2>
<select
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
className="border px-3 py-2 rounded"
>
<option value="">Tất cả</option>

{classes.map((c:any)=>(
  <option key={c.id} value={c.id}>
    {c.name}
  </option>
  
))}
</select>
<span className="text-gray-500 text-sm">
{selectedClass ? "Đang lọc theo lớp" : ""}
</span>

</div>
{/* LOADING */}
{loadingStudents && (
  <div className="text-gray-400 mb-4">Đang tải dữ liệu...</div>
)}

{/* ===== CHỜ KÍCH HOẠT ===== */}
<h3 className="text-yellow-600 font-semibold mb-2">
Học sinh chờ kích hoạt ({filteredPending.length})
</h3>
<div className="hidden md:block overflow-x-auto">
  {/* TABLE DESKTOP STUDENTS */}
<table className="w-full mb-6 rounded overflow-hidden">

<thead className="bg-yellow-100">
<tr>
<th className="p-2 text-left">Họ và tên</th>
<th className="p-2 text-left">Email</th>
<th className="p-2 text-left">Lớp</th>
<th className="p-2 text-left">Hành động</th>
</tr>
</thead>

<tbody>

{filteredPending.length === 0 ? (
<tr>
<td colSpan={3} className="text-center p-4 text-gray-400">
Không có học sinh chờ kích hoạt
</td>
</tr>
) : (
filteredPending.map((s:any)=>(
<tr key={s.id} className="border-t hover:bg-yellow-50">

<td className="p-2 font-semibold">{s.name}</td>
<td className="p-2">{s.email}</td>
<td className="p-2">{s.class_name} </td>
<td>
<button
onClick={()=>activateStudent(s.id)}
className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
>
Kích hoạt
</button>
</td>

</tr>
))
)}

</tbody>
</table>

</div>
<div className="md:hidden space-y-3">

{filteredPending.map((s:any)=>(
  <div key={s.id} className="bg-yellow-50 rounded-xl p-4 shadow border">

    <div className="font-semibold">
      {s.name}
    </div>

    <div className="text-sm text-gray-600">
      {s.email}
    </div>

    <div className="text-sm mt-1">
      <span className="font-medium">Lớp:</span>{" "}
      {s.class_name || "Chưa có"}
    </div>

    <div className="mt-3">
      <button
        onClick={()=>activateStudent(s.id)}
        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
      >
        Kích hoạt
      </button>
    </div>

  </div>
))}

{filteredPending.length === 0 && (
  <div className="text-center text-gray-400 text-sm">
    Không có học sinh chờ kích hoạt
  </div>
)}

</div>
{/* ===== ĐÃ KÍCH HOẠT ===== */}

<h3 className="text-green-600 font-semibold mb-2">
Học sinh đã kích hoạt ({filteredActive.length})
</h3>

<div className="mb-3 flex gap-2">

<button
onClick={()=>setSelectedStudents(filteredActive.map((s:any)=>s.id))}
className="bg-gray-200 px-3 py-1 rounded"
>
Chọn tất cả
</button>

<button
onClick={()=>setSelectedStudents([])}
className="bg-gray-200 px-3 py-1 rounded"
>
Bỏ chọn
</button>

<button
onClick={()=>{
  selectedStudents.forEach(id=>resetSelected(id))
}}
className="bg-red-600 text-white px-3 py-1 rounded"
>
🔑 Reset MK đã chọn
</button>



</div>
<div className="hidden md:block overflow-x-auto">
  {/* TABLE DESKTOP STUDENTS */}
<table className="w-full rounded overflow-hidden">

<thead className="bg-green-100">
<tr>
<th className="p-3 "></th>
<th className="p-2 text-left">Họ và tên</th>
<th className="p-2 text-left">Email</th>
<th className="p-2 text-left">Lớp</th>
<th className="p-2 text-left">Trạng thái</th>
<th className="p-2 text-left">Hành động</th>
</tr>
</thead>

<tbody>

{filteredActive.length === 0 ? (
<tr>
<td colSpan={5} className="text-center p-4 text-gray-400">
Chưa có học sinh
</td>
</tr>
) : (
filteredActive.map((s:any)=>{

const checked = selectedStudents.includes(s.id)

return(
<tr key={s.id} className={`border-t hover:bg-green-50 ${checked ? "bg-blue-50" : ""}`}>

<td className="p-2">
<input
type="checkbox"
checked={checked}
onChange={(e)=>{
  if(e.target.checked){
    setSelectedStudents([...selectedStudents,s.id])
  }else{
    setSelectedStudents(selectedStudents.filter(id=>id!==s.id))
  }
}}
/>
</td>

<td className="p-2 font-semibold text-left">{s.name}</td>
<td className="p-2 text-left">{s.email}</td>
<td className="p-2 text-left"> {s.class_name} </td>
<td>
<span className="text-green-600 font-semibold">
Đã kích hoạt
</span>
</td>

<td className="space-x-2">


<button
onClick={()=>setEditingStudent(s)}
className="bg-yellow-500 text-white px-2 py-1 rounded"
>
Sửa
</button>

<button
onClick={()=>deleteStudent(s.id)}
className="bg-red-500 text-white px-2 py-1 rounded"
>
Xoá
</button>
<button
onClick={()=>resetStudent(s.id)}
className="bg-blue-500 text-white px-2 py-1 rounded"
>
Reset MK
</button>
</td>

</tr>
)
})
)}

</tbody>

</table>
</div>
</div>
</div>
<div className="md:hidden space-y-3 pb-24">

{filteredActive.map((s:any)=>(
  <div key={s.id} className="bg-white rounded-xl p-4 shadow border">

    {/* CHECKBOX + NAME */}
    <div className="flex items-center gap-2">

      <input
        type="checkbox"
        checked={selectedStudents.includes(s.id)}
        onChange={(e)=>{
          if(e.target.checked){
            setSelectedStudents([...selectedStudents, s.id])
          }else{
            setSelectedStudents(selectedStudents.filter(id=>id!==s.id))
          }
        }}
      />

      <div className="font-semibold">
        {s.name}
      </div>

    </div>

    <div className="text-sm text-gray-600 mt-1">
      {s.email}
    </div>

    <div className="text-sm mt-1">
      <span className="font-medium">Lớp:</span>{" "}
      {s.class_name || "Chưa có"}
    </div>

    <div className="text-green-600 text-sm mt-1">
      Đã kích hoạt
    </div>

    {/* ACTION */}
    <div className="flex gap-2 mt-3 flex-wrap">

      <button
      onClick={()=>setEditingStudent(s)}
      className="bg-yellow-500 text-white px-2 py-1 rounded"
      >
      Sửa
      </button>

      <button
      onClick={()=>deleteStudent(s.id)}
      className="bg-red-500 text-white px-2 py-1 rounded"
      >
      Xoá
      </button>
      <button
      onClick={()=>resetStudent(s.id)}
      className="bg-blue-500 text-white px-2 py-1 rounded"
      >
      Reset MK
      </button>

    </div>

  </div>
))}

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
{editingStudent && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">

<div className="bg-white p-6 rounded-xl w-80">

<h2 className="font-bold mb-3">Sửa học sinh</h2>

<input
className="border p-2 w-full mb-2"
value={editingStudent.name || ""}
onChange={(e)=>setEditingStudent({
  ...editingStudent,
  name:e.target.value
})}
/>

<input
className="border p-2 w-full mb-2"
value={editingStudent.email || ""}
onChange={(e)=>setEditingStudent({
  ...editingStudent,
  email:e.target.value
})}
/>

{/* 🔥 CHỌN LỚP */}
<select
className="border p-2 w-full mb-3"
value={editingStudent.class_id || ""}
onChange={(e)=>setEditingStudent({
  ...editingStudent,
  class_id:e.target.value
})}
>
<option value="">-- Chọn lớp --</option>

{classes.map((c:any)=>(
  <option key={c.id} value={c.id}>
    {c.name}
  </option>
))}

</select>

<div className="flex gap-2">

<button
onClick={()=>setEditingStudent(null)}
className="bg-gray-300 px-3 py-1 rounded"
>
Huỷ
</button>

<button
onClick={saveStudent}
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