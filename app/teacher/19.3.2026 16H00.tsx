"use client"

import { useState,useEffect } from "react"
import * as XLSX from "xlsx"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import mammoth from "mammoth"
import TurndownService from "turndown"
import Header from "../components/header"
import ChangePassword from "../components/ChangePassword"

export default function Teacher(){
const router = useRouter()
const searchParams = useSearchParams()
const classId = searchParams.get("class")
const tab = searchParams.get("tab") || "classes"

const detailRef = useRef<any>(null)

const [classes,setClasses] = useState([])
const [className,setClassName] = useState("")

const [copyGroups,setCopyGroups] = useState([])

const [students,setStudents] = useState({
pending:[],
active:[]
})
const [submissions,setSubmissions] = useState<any[]>([])
const [copyCases,setCopyCases] = useState([])

const [exercises,setExercises] = useState([])
const [exercise,setExercise] = useState("")

const [selectedStudents,setSelectedStudents] = useState<string[]>([])

const [file,setFile] = useState<any>(null)

const [fileName,setFileName] = useState("Chưa có tệp được chọn")

const [selectedClass,setSelectedClass] = useState(classId || null)
const [selectedClassName,setSelectedClassName] = useState("")
const [loading,setLoading] = useState(false)

const [user,setUser] = useState<any>(null)
const [teacherId,setTeacherId] = useState("")
const [aiPrompt,setAiPrompt] = useState("")
const [exerciseMode,setExerciseMode]=useState("manual")
const [preview,setPreview] = useState(false)
const [scores,setScores] = useState<any>({})

const [selectedSubmission,setSelectedSubmission] = useState<any>(null)

const [teacherScore,setTeacherScore] = useState("")
const [teacherFeedback,setTeacherFeedback] = useState("")

const [filter,setFilter] = useState("submitted")
const [statusFilter,setStatusFilter] = useState("all")
const [showPassword,setShowPassword] = useState(false)

const [selectedGroup,setSelectedGroup] = useState(null)
const [groupCodes,setGroupCodes] = useState([])

const [loadingScore,setLoadingScore] = useState(false)

const [selectedPair,setSelectedPair] = useState(null)
const [pairCodes,setPairCodes] = useState([])

const totalAll = submissions.length

const totalSubmitted = submissions.filter(s=>s.status==="submitted").length

const totalGraded = submissions.filter(s=>s.status==="graded").length

const totalPending = submissions.filter(s=>s.status==="pending").length

const [editingStudent,setEditingStudent] = useState<any>(null)

useEffect(()=>{

const user = JSON.parse(localStorage.getItem("user") || "{}")

setTeacherId(user.id)

const u = localStorage.getItem("user")
if(!u){
window.location.href="/login"
return
}

const userData = JSON.parse(u)

if(userData.role!=="teacher" && userData.role!=="admin"){
alert("Không có quyền")
window.location.href="/student"
return
}

setUser(userData)

loadClasses()

if(classId){

setSelectedClass(classId)

if(tab==="students"){
loadStudents(classId,"")
}

if(tab==="submissions"){
loadSubmissions(classId,"")
}

if(tab==="exercise"){
loadExercises(classId,"")
}

if(tab==="copy"){
loadCopy()
}

}

},[classId,tab])



function similarity(a:string,b:string){

  const clean = (s:string)=>
    s.replace(/\s/g,"").toLowerCase()

  const s1 = clean(a)
  const s2 = clean(b)

  let dp = Array(s1.length+1).fill(0).map(()=>Array(s2.length+1).fill(0))

  for(let i=1;i<=s1.length;i++){
    for(let j=1;j<=s2.length;j++){
      if(s1[i-1]===s2[j-1]){
        dp[i][j] = dp[i-1][j-1] + 1
      }else{
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1])
      }
    }
  }

  const lcs = dp[s1.length][s2.length]

  return lcs / Math.max(s1.length, s2.length)
}

function parseExercise(text:any){

const sections:any = {
problem:"",
input:"",
output:"",
example:"",
constraint:""
}

const lines = text.split("\n")

let current = "problem"

for(let line of lines){

const l = line.toLowerCase()

if(l.includes("input")){
current="input"
continue
}

if(l.includes("output")){
current="output"
continue
}

if(l.includes("ví dụ") || l.includes("example")){
current="example"
continue
}

if(l.includes("ràng buộc") || l.includes("constraint")){
current="constraint"
continue
}

sections[current] += line+"\n"

}

return sections
}

function changeTab(t:string){
if(selectedClass){
router.push(`/teacher?tab=${t}&class=${selectedClass}`)
}else{
router.push(`/teacher?tab=${t}`)
}
}

function chooseClass(id:string,name:string){

setSelectedClass(id)
setSelectedClassName(name)

router.push(`/teacher?tab=${tab}&class=${id}`)

if(tab==="students"){
loadStudents(id,name)
}

if(tab==="submissions"){
loadSubmissions(id,name)
}

if(tab==="exercise"){
loadExercises(id,name)
}

if(tab==="copy"){
detectCopy()
}

}

function highlightDiff(a:string,b:string){

  const maxLen = Math.max(a.length,b.length)

  let resA = ""
  let resB = ""

  for(let i=0;i<maxLen;i++){

    if(a[i] === b[i]){
      resA += `<span style="background:#22c55e33">${a[i] || ""}</span>`
      resB += `<span style="background:#22c55e33">${b[i] || ""}</span>`
    }else{
      resA += a[i] || ""
      resB += b[i] || ""
    }
  }

  return {resA,resB}
}
async function loadPairCode(p:any, idx:number){

  const res = await fetch("/api/get-pair-code",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      a_id: p.a_id,
      b_id: p.b_id
    })
  })

  const data = await res.json()

  // 🔥 gán code vào đúng pair
  const newGroups = [...copyGroups]

  newGroups[selectedGroup].pairs[idx].codeA = data[0].code
  newGroups[selectedGroup].pairs[idx].codeB = data[1].code

  setCopyGroups(newGroups)
}

async function loadClasses(){

const res = await fetch("/api/classes")

let data = []

try{
data = await res.json()
}catch(e){
console.log("JSON lỗi")
}

setClasses(data)

if(classId){
const c = data.find((cl:any)=>cl.id===classId)
if(c){
setSelectedClassName(c.name)
}
}

}

async function createClass(){

if(!className || className.trim()===""){
alert("Vui lòng nhập tên lớp")
return
}

const res = await fetch("/api/create-class",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name:className.trim(),
teacher_id:user?.id
})
})

const data = await res.json()

if(data.success){

alert("Đã tạo lớp")

setClassName("")

loadClasses()

}else{

alert("Không thể tạo lớp")

}

}



async function editClass(id:any,name:any){

const newName = prompt("Tên lớp",name)

if(!newName) return

await fetch("/api/update-class",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
class_id:id,
name:newName
})
})

loadClasses()

}

async function deleteClass(id:any){

if(!confirm("Xoá lớp?")) return

await fetch("/api/delete-class",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
class_id:id
})
})

loadClasses()

}

async function loadStudents(class_id:any,name:any){

if(!class_id){
console.log("class_id rỗng")
return
}

setSelectedClass(class_id)
setSelectedClassName(name)

changeTab("students")

const pendingRes = await fetch(`/api/pending-students?class_id=${class_id}`)
const pending = await pendingRes.json()

const activeRes = await fetch(`/api/class-students?class_id=${class_id}`)
const active = await activeRes.json()

setStudents({
pending,
active
})

}

async function activateStudent(id:any){

await fetch("/api/activate-user",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
id
})
})

loadStudents(selectedClass,selectedClassName)

}

async function uploadStudents(students:any){

const res = await fetch("/api/import-students",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
students,
class_id:selectedClass
})
})

const data = await res.json()

// ❌ nếu không có dòng này là sai
if(!data.success){
alert("Import lỗi")
return
}

// ✅ CHỈ export sau khi API OK
const ws = XLSX.utils.json_to_sheet(data.accounts)
const wb = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb, ws, "Accounts")

XLSX.writeFile(wb, `tai_khoan_${selectedClassName}.xlsx`)

// reload
loadStudents(selectedClass,selectedClassName)

}

async function handleUpload(){

if(!file){
alert("Chọn file trước")
return
}

setLoading(true) // 🔥 BẮT ĐẦU loading

const reader = new FileReader()

reader.onload = async (evt:any)=>{

const data = new Uint8Array(evt.target.result)

const workbook = XLSX.read(data,{type:"array"})

const sheet = workbook.Sheets[workbook.SheetNames[0]]

const json = XLSX.utils.sheet_to_json(sheet)

const res = await fetch("/api/import-students",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
students: json,
class_id:selectedClass
})
})

const result = await res.json()
if(!result.success){
alert("Lỗi server ❌")
return
}

// 🔥 HIỂN THỊ KẾT QUẢ
alert(
`✅ Tạo thành công: ${result.created}
❌ Lỗi: ${result.failed}`
)

if(result.errors.length > 0){
let msg = "Các dòng lỗi:\n"

result.errors.forEach((e:any)=>{
msg += `Dòng ${e.row}: ${e.error}\n`
})

alert(msg)
}


if(!result.success){
console.error(result.error)
alert("Lỗi insert DB ❌")
setLoading(false)
return
}

// 👉 chỉ chạy khi OK
setLoading(false)

// export excel
const ws = XLSX.utils.json_to_sheet(result.accounts)
const wb = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb, ws, "Accounts")

XLSX.writeFile(wb, `tai_khoan_${selectedClassName}.xlsx`)

loadStudents(selectedClass,selectedClassName)

}

reader.readAsArrayBuffer(file)

}

async function exportAccounts(){

  if(!selectedClass){
    alert("Chưa chọn lớp")
    return
  }

  const res = await fetch("/api/export-accounts",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({ class_id: selectedClass })
  })

  const result = await res.json()

  console.log("EXPORT RESULT:", result)

  if(!result.success){
    alert(result.error)
    return
  }

  if(!result.data || result.data.length === 0){
    alert("Không có dữ liệu")
    return
  }

  const ws = XLSX.utils.json_to_sheet(result.data)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, "Accounts")

  XLSX.writeFile(wb, `tai_khoan_${selectedClassName}.xlsx`)
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
body:JSON.stringify({
ids:selectedStudents
})
})

const result = await res.json()

if(!result.success){
alert("Lỗi reset ❌")
return
}

// 👉 xuất excel mật khẩu mới
const ws = XLSX.utils.json_to_sheet(result.accounts)
const wb = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb, ws, "Passwords")

XLSX.writeFile(wb, "reset_password.xlsx")

alert(`Đã reset ${result.count} tài khoản`)

setSelectedStudents([])

loadStudents(selectedClass,selectedClassName)
}

async function saveStudent(){

const res = await fetch("/api/update-student",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
id:editingStudent.id,
name:editingStudent.name,
email:editingStudent.email
})
})

const result = await res.json()

if(!result.success){
alert("Lỗi ❌")
return
}

alert("Đã cập nhật")

setEditingStudent(null)

loadStudents(selectedClass,selectedClassName)
}

async function deleteStudent(id:string){

if(!confirm("Xoá học sinh này?")) return

const res = await fetch("/api/delete-student",{
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

loadStudents(selectedClass,selectedClassName)
}

function exportMarkExcel(){

const rows = submissions.map((s,i)=>({

STT:i+1,

Hoc_sinh:s.student_name,

Loai_bai:s?.type==="teacher" ? "GV giao" : "Tự sinh",

AI:s.ai_score ?? "",

GV:s.teacher_score ?? "",

Trang_thai:s.status,

Code:s.code

}))

const worksheet = XLSX.utils.json_to_sheet(rows)

const workbook = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(workbook,worksheet,"Bai_nop")

XLSX.writeFile(workbook,"bai_nop_lop.xlsx")

}
async function loadSubmissions(class_id:any,name:any){

// nếu class_id lỗi thì dừng
if(!class_id){
console.log("class_id undefined")
return
}

setSelectedClass(class_id)
setSelectedClassName(name)
router.push(`/teacher?tab=submissions&class=${class_id}`)

try{

const res = await fetch(`/api/class-submissions?class_id=${class_id}`)

const data = await res.json()

console.log("SUBMISSIONS:",data)

// đảm bảo luôn là array
if(Array.isArray(data)){
setSubmissions(data)
}else if(data?.data){
setSubmissions(data.data)
}else{
setSubmissions([])
}

}catch(e){

console.log("load submissions error",e)

setSubmissions([])

}

}
async function loadTeacherSubmissions(){

const user = JSON.parse(localStorage.getItem("user")||"{}")

const res = await fetch(`/api/teacher-submissions?class_id=${user.class_id}`)

const data = await res.json()

setSubmissions(data.data || [])

}
async function saveScore(id:any, score:any){

  if(score === "" || score === null){
    alert("❌ Vui lòng nhập điểm")
    return
  }

  const num = Number(score)

  if(isNaN(num) || num < 0 || num > 10){
    alert("❌ Điểm phải từ 0 → 10")
    return
  }

  setLoadingScore(true)

  try{

    const res = await fetch("/api/teacher-score",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        submission_id:id,
        teacher_score:num,
        teacher_feedback:teacherFeedback || ""
      })
    })

    const data = await res.json()

    if(!data.success){
      alert(data.error || "Lỗi chấm điểm ❌")
      setLoadingScore(false)
      return
    }

    alert("✅ Đã chấm điểm thành công")

    setTeacherScore("")
    setTeacherFeedback("")

    await loadSubmissions(selectedClass,selectedClassName)

  }catch(e){

    alert("❌ Lỗi kết nối server")

  }

  setLoadingScore(false)
}

async function detectCopy(){

  const res = await fetch(`/api/detect-copy?class_id=${selectedClass}`)
  const data = await res.json()

  setCopyGroups(data)
}

async function loadCopy(){

  const res = await fetch(`/api/get-copy?class_id=${selectedClass}`)
  const data = await res.json()

  setCopyGroups(data)
}

async function loadGroupCode(student_ids:any){

  const res = await fetch("/api/get-group-code",{
    method:"POST",
    body: JSON.stringify({student_ids})
  })

  const data = await res.json()
  console.log("CODES:",data)
  setGroupCodes(data)
}

async function loadExercises(class_id:any,name:any){

setSelectedClass(class_id)
setSelectedClassName(name)

changeTab("exercise")

const res = await fetch(`/api/class-generated-exercises?class_id=${class_id}`)
const data = await res.json()

setExercises(data)

}

async function createExercise(){

if(!selectedClass){
alert("Vui lòng chọn lớp trước")
return
}

const form = new FormData()

form.append("exercise",exercise)
form.append("class_id",selectedClass)
form.append("teacher_id",user.id)

if(file){
form.append("file",file)
}

const res = await fetch("/api/create-exercise",{
method:"POST",
body:form
})

const data = await res.json()

if(data.success){

alert("Đã giao bài cho học sinh")

setExercise("")
setFile(null)

/* reload danh sách bài */
await loadExercises(selectedClass,selectedClassName)

/* vẫn ở tab bài tập */
changeTab("exercise")

}else{

alert("Lỗi giao bài")

}

}
async function generateAI(){

const res = await fetch("/api/generate-exercise",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
prompt:aiPrompt
})
})

if(!res.ok){
alert("AI sinh bài lỗi")
return
}

const text = await res.text()

const data = text ? JSON.parse(text) : {}

if(data.exercise){
setExercise(data.exercise)
}

}
function requireClass(action:any){

if(!selectedClass){
alert("Vui lòng chọn lớp trước")
return
}

action()

}

async function activateAll(){

if(students.pending.length === 0){
alert("Không có học sinh chờ kích hoạt")
return
}

if(!confirm("Xác nhận kích hoạt tất cả?")) return

const res = await fetch("/api/activate-all-students",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
class_id:selectedClass
})
})

const result = await res.json()

if(!result.success){
alert("Lỗi ❌")
return
}

alert(`Đã kích hoạt ${result.count} học sinh`)

loadStudents(selectedClass,selectedClassName)
}

const totalStudents = students.pending.length + students.active.length
const totalSubmissions = submissions.length

return(
<div className="bg-gray-100 min-h-screen text-gray-800">

<div className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow">

<h1 className="font-bold text-2xl text-white">
🚀 CodeMora AI
</h1>

<div className="flex items-center">

<span
onClick={()=>setShowPassword(true)}
className="mr-4 bg-gray/20 text-blue px-3 py-1 rounded-full text-sm font-semibold cursor-pointer"
>
👤 {user?.name}
</span>

<button
onClick={()=>{
localStorage.removeItem("user")
window.location.href="/login"
}}
className="bg-red-600 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow"
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
className="mt-3 bg-green-600 px-3 py-1 rounded w-full"
>
Đóng
</button>

</div>

</div>
)}

{editingStudent && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white p-6 rounded-xl w-80">

<h2 className="font-bold mb-3">Sửa học sinh</h2>

<input
className="border p-2 w-full mb-2 text-black"
value={editingStudent.name}
onChange={(e)=>setEditingStudent({...editingStudent,name:e.target.value})}
/>

<input
className="border p-2 w-full mb-2 text-black"
value={editingStudent.email}
onChange={(e)=>setEditingStudent({...editingStudent,email:e.target.value})}
/>

<div className="flex justify-end gap-2">

<button
onClick={()=>setEditingStudent(null)}
className="bg-gray-300 px-3 py-1 rounded"
>
Huỷ
</button>

<button
onClick={saveStudent}
className="bg-blue-600 text-white px-3 py-1 rounded"
>
Lưu
</button>

</div>

</div>

</div>

)}

<div className="flex">

<div className="w-[240px] bg-white border-r shadow-sm p-5 min-h-screen">

  <h2 className="font-bold mb-6 text-blue-600 text-lg">
    🚀 CodeMora AI
  </h2>

  <ul className="space-y-2 text-sm">

    {/* ===== LỚP ===== */}
    <li
      onClick={()=>changeTab("classes")}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
      ${tab==="classes"
        ? "bg-blue-100 text-blue-700 font-medium"
        : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      <span>📚</span>
      <span>Lớp học</span>
    </li>


    {/* ===== HỌC SINH ===== */}
    <li
      onClick={()=>{
        changeTab("students")
        requireClass(()=>loadStudents(selectedClass,selectedClassName))
      }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
      ${tab==="students"
        ? "bg-blue-100 text-blue-700 font-medium"
        : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      <span>👨‍🎓</span>
      <span>Học sinh</span>
    </li>


    {/* ===== GIAO BÀI ===== */}
    <li
      onClick={()=>{
        changeTab("exercise")
        requireClass(()=>loadExercises(selectedClass,selectedClassName))
      }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
      ${tab==="exercise"
        ? "bg-blue-100 text-blue-700 font-medium"
        : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      <span>📝</span>
      <span>Giao bài tập</span>
    </li>


    {/* ===== BÀI NỘP ===== */}
    <li
      onClick={()=>{
        changeTab("submissions")
        requireClass(()=>loadSubmissions(selectedClass,selectedClassName))
      }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
      ${tab==="submissions"
        ? "bg-blue-100 text-blue-700 font-medium"
        : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      <span>📥</span>
      <span>Bài nộp</span>
    </li>


    {/* ===== COPY ===== */}
    <li
      onClick={()=>{
        changeTab("copy")
        requireClass(detectCopy)
      }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
      ${tab==="copy"
        ? "bg-blue-100 text-blue-700 font-medium"
        : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      <span>🕵️</span>
      <span>Phát hiện copy</span>
    </li>


    {/* ===== STATS ===== */}
    <li
      onClick={()=>changeTab("stats")}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
      ${tab==="stats"
        ? "bg-blue-100 text-blue-700 font-medium"
        : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      <span>📊</span>
      <span>Thống kê</span>
    </li>

  </ul>

</div>

<div className="flex-1 p-8">

{selectedClassName && (

<div className="mb-6 text-red-600 font-bold mb-6">
📚 LỚP: {selectedClassName}
</div>

)}

{tab==="classes" && (

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">

<h1 className="text-xl text-purple-600 font-semibold mb-4">Quản lý lớp</h1>

<div className="flex gap-3 mb-4">
  <input
    placeholder="Tên lớp"
    className="border px-3 py-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={className}
    onChange={(e)=>setClassName(e.target.value)}
  />

  <button
    onClick={createClass}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
  >
    + Tạo lớp
  </button>
</div>

<table className="w-full bg-white">

<tbody>

{classes.map((c:any)=>(
<tr
key={c.id}
className={`cursor-pointer hover:bg-blue-200 
${selectedClass===c.id ? "bg-blue-200" : ""}`}
>

<td
className="py-2 font-semibold text-blue-700"
onClick={()=>{
setSelectedClass(c.id)
setSelectedClassName(c.name)
}}
>
{c.name}
</td>

<td>

<button
onClick={()=>loadStudents(c.id,c.name)}
className="bg-blue-600 px-3 py-1 text-white rounded"
>
Học sinh
</button>

<button
onClick={()=>loadSubmissions(c.id,c.name)}
className="bg-green-600 px-3 py-1 text-whiterounded"
>
Bài nộp
</button>

<button
onClick={()=>editClass(c.id,c.name)}
className="bg-yellow-600 px-3 py-1 text-white rounded"
>
Sửa tên lớp
</button>

<button
onClick={()=>deleteClass(c.id)}
className="bg-red-600 px-3 py-1 text-white rounded"
>
Xoá lớp
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

)}

{tab==="students" && (

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">

<h1 className="text-xl font-semibold mb-4">
Quản lý học sinh
</h1>

<input
type="file"
onChange={(e:any)=>setFile(e.target.files[0])}
/>

<button
onClick={handleUpload}
disabled={loading}
className="bg-blue-600 text-white px-3 py-1 rounded ml-2 disabled:opacity-50"
>
{loading ? "Đang tạo tài khoản..." : "Tải lên"}
</button>

<a
href="/sample_students.xlsx"
download
className="ml-4 text-blue-400 underline">
Tải file Excel mẫu
</a>
<button onClick={exportAccounts} className="bg-green-600 text-white px-3 py-1 rounded ml-2">
Xuất lại tài khoản
</button>

<button
onClick={resetSelected}
className="bg-red-600 text-white px-3 py-1 rounded ml-2"
>
Reset mật khẩu đã chọn
</button>
<button
onClick={activateAll}
className="bg-green-600 text-white px-3 py-1 rounded ml-2"
>
Kích hoạt tất cả ({students.pending.length})
</button>
{/* ===== HỌC SINH CHỜ KÍCH HOẠT ===== */}

<h2 className="text-lg font-bold text-gray-700 mb-2">
Học sinh chờ kích hoạt
</h2>

<table className="w-full bg-blue-100 rounded-lg overflow-hidden">
<thead className="bg-blue-600 text-left text-white">

<tr className="border-b hover:bg-blue-600">
<th className="p-2">Tên học sinh</th>
<th>Email</th>
<th>Trạng thái</th>
<th>Hành động</th>
</tr>
</thead>

<tbody>

{students?.pending?.map((s:any)=>(

<tr key={s.id} className="border-b border-blue-700">

<td className="py-2">{s.name}</td>

<td>{s.email}</td>

<td className="text-gray-700 font-semibold">
Chưa kích hoạt
</td>

<td>

<button
onClick={()=>activateStudent(s.id)}
className="bg-green-600 px-3 py-1 text-white rounded"
>
Kích hoạt
</button>

</td>

</tr>

))}

</tbody>

</table>

<div className="text-red-600 mb-8">
Tổng học sinh chờ kích hoạt: {students.pending.length}
</div>
  
{/* ===== HỌC SINH ĐÃ KÍCH HOẠT ===== */}

<h2 className="text-lg font-bold text-green-400 mb-2">
Học sinh đã kích hoạt
</h2>

<table className="w-full bg-blue-100 rounded-lg overflow-hidden">
<thead className="bg-blue-600 text-left text-white">
<tr>
<th className="p-2">Tên học sinh</th>
<th>Email</th>
<th>Trạng thái</th>
<td className="space-x-2">

</td>
<th>
  <input
type="checkbox"
onChange={(e)=>{
if(e.target.checked){
setSelectedStudents(students.active.map((s:any)=>s.id))
}else{
setSelectedStudents([])
}
}}
/>
</th>
</tr>
</thead>

<tbody>

{students?.active?.map((s:any)=>(

<tr key={s.id} className="border-b border-blue-700">
<td>{s.name}</td>
<td>{s.email}</td>

<td className="text-green-400 font-semibold">
Đã kích hoạt
</td>

<td className="space-x-2">   {/* 👈 BẮT BUỘC */}

<button
onClick={()=>setEditingStudent(s)}
className="bg-yellow-600 text-white px-3 py-1 rounded"
>
Sửa
</button>

<button
onClick={()=>deleteStudent(s.id)}
className="bg-red-600 text-white px-3 py-1 rounded"
>
Xoá
</button>

</td>

<td>
<input
type="checkbox"
checked={selectedStudents.includes(s.id)}
onChange={(e)=>{
if(e.target.checked){
setSelectedStudents([...selectedStudents,s.id])
}else{
setSelectedStudents(selectedStudents.filter(id=>id!==s.id))
}
}}
/>
</td>
</tr>

))}

</tbody>

</table>

<div className="text-red-600 mt-4">
Tổng học sinh trong lớp: {students.active.length}
</div>

</div>

)}

{tab==="exercise" && (

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">

<h1 className="text-xl font-semibold mb-4">
Giao bài tập
</h1>

<textarea
placeholder="Nhập đề bài..."
className="w-full h-[180px] border border-blue-600 p-4 text-black mb-4 rounded"
value={exercise}
onChange={(e)=>setExercise(e.target.value)}
/>

{/* PREVIEW ĐỀ BÀI */}

<div className="bg-white p-4 rounded mt-4">

<div className="text-gray-700 mb-2">
Preview đề bài
</div>

{exercise.includes("<") ? (

<div
className="prose prose-invert max-w-none"
dangerouslySetInnerHTML={{ __html: exercise }}
/>

) : (

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{exercise}
</ReactMarkdown>

)}

</div>


<textarea
placeholder="Mô tả để AI sinh bài..."
className="w-full h-[120px] border border-blue-600 p-4 text-black mb-4 rounded"
value={aiPrompt}
onChange={(e)=>setAiPrompt(e.target.value)}
/>

<button
onClick={generateAI}
className="bg-purple-600 text-white px-3 py-1 rounded"
>
Sinh bằng AI
</button>

<input
type="file"
accept=".docx,.txt,.md"
onChange={async (e)=>{

const file = e.target.files?.[0]
if(!file) return

const ext = file.name.split(".").pop()?.toLowerCase()

let content=""

if(ext==="docx"){

const arrayBuffer = await file.arrayBuffer()

const result = await mammoth.convertToHtml({arrayBuffer})

content = result.value   // giữ nguyên HTML

}

else if(ext==="txt" || ext==="md"){

content = await file.text()

}

setExercise(content)

}}
/>

<button
onClick={createExercise}
className="bg-blue-600 text-white px-3 py-1 rounded"
>
Gửi bài
</button>

<table className="w-full mt-6 bg-white rounded-lg overflow-hidden">

<thead className="bg-blue-300 text-gray-800">
<tr>

<th className="p-3 text-center">Đề bài</th>

<th className="p-3 text-center">Số HS</th>

<th className="p-3 text-center">Ngày giao</th>

<th className="p-3 text-center">Số học sinh đã nộp</th>

</tr>
</thead>

<tbody>

{exercises?.map((e:any)=>(
<tr key={e.id} className="border-b hover:bg-gray-50">

<td className="px-3 py-2 text-gray-700">

<details>

<summary 
className="cursor-pointer text-red-400"
onClick={()=>setPreview(!preview)}
>
Xem đề
</summary>

<div> 
{preview && (
<ReactMarkdown remarkPlugins={[remarkGfm]}>
{e.exercise}
</ReactMarkdown>
)}
</div>

</details>

</td>


<td className="p-3 text-sm text-center">

{totalStudents || "-"}

</td>

<td className="p-3 text-sm text-center">
{new Date(e.created_at).toLocaleString("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour12: false
})}
</td>

<td className="p-3 text-sm text-center">

{totalSubmissions || "-"}

</td>

</tr>
))}

</tbody>

</table>
</div>

)}

{tab==="copy" && (

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">

<h1 className="text-xl font-semibold mb-4">
🚨 Các nhóm HS có code giống nhau:
</h1>

<button
onClick={detectCopy}
className="bg-red-600 text-white px-3 py-1 rounded"
>
🔥 Quét lại
</button>

{copyGroups.map((g:any,i)=>(

<div 
  key={i}
  onClick={()=>{
    setSelectedGroup(i)
    loadGroupCode(g.student_ids)
  }}
  className="bg-red-100 border border-red-300 p-4 rounded mb-4 cursor-pointer hover:bg-red-200"
>

<div className="font-bold text-red-700">
🚨 Nhóm {i+1} ({g.size} học sinh)
</div>

{/* 🔥 % giống */}
<div className="text-sm text-red-600 mt-1">
🔥 Độ giống: {g.similarity}%
</div>

{/* 👥 danh sách */}
<div className="mt-2 text-gray-800">
{g.student_names.join(" , ")}
</div>

{/* 🔍 chi tiết từng cặp */}
<div className="mt-2 text-xs text-gray-600">
{g.pairs?.map((p:any,idx:number)=>(
  <div 
  key={idx}
  onClick={(e)=>{
    e.stopPropagation() // tránh click nhóm
    setSelectedPair(p)
    loadPairCode(p)
  }}
  className="cursor-pointer hover:text-red-600 transition"
>
  🔍 {p.a} - {p.b}: {p.score}%
</div>
))}
</div>

</div>
))}
{copyGroups.length===0 &&(
<div className="text-gray-400">
Không phát hiện code giống nhau
</div>
)}

{selectedGroup !== null && copyGroups[selectedGroup]?.pairs?.length > 0 && (

  <div className="mt-6">

    <h2 className="text-xl font-bold mb-4">
      📄 So sánh code
    </h2>

    {copyGroups[selectedGroup].pairs.map((p:any,idx:number)=>(

  <div 
    key={idx}
    onClick={()=>loadPairCode(p,idx)}   // 🔥 THÊM DÒNG NÀY
    className="cursor-pointer"
  >

    <div className="flex justify-between mb-3 text-sm">

      <div className="text-blue-400">
        👤 {p.a}
      </div>

      <div className="text-red-400">
        🔥 {p.score}%
      </div>

      <div className="text-blue-400">
        👤 {p.b}
      </div>

    </div>

    {/* 🔥 2 code */}
    <div className="grid grid-cols-2 gap-4">

      <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto max-h-60">
        {p.codeA || "👉 Click để load"}
      </pre>

      <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto max-h-60">
        {p.codeB || "👉 Click để load"}
      </pre>

    </div>

  </div>
))}
</div>
)}
</div>
)}

{tab==="submissions" && (

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">

<div className="flex justify-between items-center mb-3">
<button
onClick={exportMarkExcel}
className="bg-green-600 px-3 py-1 text-white rounded"
>
Xuất Excel
</button>

</div>

{submissions.length===0 ? (

<div className="text-gray-500">
Chưa có bài nộp
</div>

) : (

<>
<div className="grid grid-cols-4 gap-4 mb-6">

<div className="bg-purple-600 p-4 rounded text-center">
<div className="text-sm text-white">Tổng bài</div>
<div className="text-2xl font-bold text-white">{totalAll}</div>
</div>

<div className="bg-yellow-600 p-4 rounded text-center">
<div className="text-sm text-white">Đã nộp</div>
<div className="text-2xl font-bold text-white">{totalSubmitted}</div>
</div>

<div className="bg-green-600 p-4 rounded text-center">
<div className="text-sm text-white">Đã chấm</div>
<div className="text-2xl font-bold text-white">{totalGraded}</div>
</div>

<div className="bg-red-600 p-4 rounded text-center">
<div className="text-sm text-white">Chưa nộp</div>
<div className="text-2xl font-bold text-white">{totalPending}</div>
</div>

</div>

<div className="flex gap-3 mb-4">

<button
onClick={()=>setStatusFilter("all")}
className={`px-3 py-1 rounded
${statusFilter==="all"
? "bg-blue-600 text-white"
: "bg-gray-200 text-gray-700"}
`}
>
Tất cả
</button>

<button
onClick={()=>setStatusFilter("submitted")}
className={`px-3 py-1 rounded
${statusFilter==="submitted"
? "bg-yellow-600 text-white"
: "bg-gray-200 text-gray-700"}
`}
>
Đã nộp
</button>

<button
onClick={()=>setStatusFilter("graded")}
className={`px-3 py-1 rounded
${statusFilter==="graded"
? "bg-green-600 text-white"
: "bg-gray-200 text-gray-700"}
`}
>
Đã chấm
</button>

<button
onClick={()=>setStatusFilter("pending")}
className={`px-3 py-1 rounded
${statusFilter==="pending"
? "bg-red-600 text-white"
: "bg-gray-200 text-gray-700"}
`}
>
Chưa nộp
</button>

</div>
<table className="w-full border-collapse text-fixed">
<thead className="bg-blue-600 text-white">
<tr>
<th className="border border-blue-600 px-4 py-2 text-center">STT</th>

<th className="border border-blue-600 px-4 py-2 text-center">Họ và tên</th>

<th className="border border-blue-600 px-4 py-2 text-center">Loại bài</th>

<th className="border border-blue-600 px-4 py-2 text-center">Điểm AI chấm</th>

<th className="border border-blue-600 px-4 py-2 text-center">Điểm GV chấm</th>

<th className="border border-blue-600 px-4 py-2 text-center">Trạng thái</th>

</tr>

</thead>


<tbody>

{submissions
.filter(s=>{

if(statusFilter==="all") return true

return s.status===statusFilter

})
.map((s,index)=>(
<tr
key={s.id}
onClick={()=>{
setSelectedSubmission(s)

setTimeout(()=>{
detailRef.current?.scrollIntoView({
behavior:"smooth"
})
},100)

}}
className={`cursor-pointer hover:bg-blue-200
${selectedSubmission?.id === s.id 
? "bg-blue-900 border-l-4 border-blue-200"
: ""}
`}
>
<td className="w-12 border border-blue-600 px-2 py-2 text-center">
  {index+1}
</td>
<td className="border border-blue-600 px-4 py-2">
{s.student_name}
</td>

<td className="border border-blue-600 px-4 py-2 text-center">
<span className={`px-2 py-1 rounded text-sm font-semibold
  ${s?.type === "teacher"
    ? "bg-blue-100 text-blue-700"
    : "bg-purple-100 text-purple-700"}
`}>
  {s?.type === "teacher" ? "📘 GV giao" : "🧠 Tự sinh"}
</span>
</td>

<td className="border border-blue-600 px-4 py-2 text-center">

{s.ai_score !== null ? (

<span className="bg-yellow-500 text-black px-2 py-1 rounded text-fixed">
{s.ai_score}
</span>

) : "-"}

</td>

<td className="border border-blue-600 px-4 py-2 text-center">

{s.teacher_score !== null ? (

<span className="bg-green-500 text-white px-2 py-1 rounded text-fixed">
{s.teacher_score}
</span>

) : "-"}

</td>

<td className="border border-blue-600 px-4 py-2 text-center">

{s.status==="pending" && (
<span className="text-gray-400">Chưa nộp</span>
)}

{s.status==="submitted" && (
<span className="text-gray-700">Đã nộp</span>
)}

{s.status==="graded" && (
<span className="text-green-400">Đã chấm</span>
)}

</td>

</tr>

))}

</tbody>

</table>


{selectedSubmission && (

<div 
ref={detailRef}
className="mt-6 bg-white p-4 rounded">

{/* ===== ĐỀ BÀI ===== */}

<div className="bg-yellow-100 text-black p-3 rounded mb-4">

<div className="font-semibold mb-2">
📄 Đề bài
</div>

<div className="prose max-w-none text-black">

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{
selectedSubmission.exercise || 
selectedSubmission.exercise_text ||
"Không có đề bài" 
}
</ReactMarkdown>

</div>

</div>


{/* ===== CODE HỌC SINH ===== */}
<h2 className="font-bold mb-3">
Code của {selectedSubmission.student_name}
</h2>
<pre className="bg-black text-green-400 p-4 rounded overflow-auto max-h-[300px] font-mono">
{selectedSubmission.code || "không có code"}
</pre>


{/* ===== AI FEEDBACK ===== */}

<div className="mt-4 text-gray-700">
AI nhận xét:
</div>

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{selectedSubmission.ai_feedback}
</ReactMarkdown>

{/* ===== GV FEEDBACK ===== */}

<div className="mt-4 text-green-300">
Giáo viên nhận xét:
</div>

<div className="bg-white p-3 mt-2 rounded">
{selectedSubmission.teacher_feedback || "Chưa có"}
</div>

{/* ===== CHẤM ĐIỂM ===== */}
<textarea
placeholder="Nhập nhận xét của giáo viên..."
className="bg-white text-black w-full px-3 py-2 rounded border mt-3"
value={teacherFeedback}
onChange={(e)=>setTeacherFeedback(e.target.value)}
/>
<div className="mt-4 flex gap-3">
<input
type="number"
placeholder="Nhập điểm"
min="0"
max="10"
className="bg-white text-black w-40 px-3 py-2 rounded border"
value={teacherScore}
onChange={(e)=>setTeacherScore(e.target.value)}
/>
<button
type="button"
disabled={loadingScore || selectedSubmission.status !== "submitted"}
onClick={()=>saveScore(selectedSubmission.id, teacherScore)}
className={`
px-3 py-1 rounded text-white font-semibold transition
${loadingScore
  ? "bg-gray-400 cursor-not-allowed"
  : selectedSubmission.status === "submitted"
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-gray-500 cursor-not-allowed"
}
`}
>
{loadingScore ? "⏳ Đang duyệt..." : "✅ Duyệt điểm"}
</button>


</div>

</div>

)}

</>

)}

</div>

)}

{tab==="stats" && (

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">

<h1 className="text-xl font-semibold mb-4">Thống kê</h1>

<div className="grid grid-cols-2 gap-6">

<div className="bg-white p-6 rounded">

<h2>Tổng học sinh</h2>

<p className="text-3xl">
{totalStudents}
</p>

</div>

<div className="bg-white p-6 rounded">

<h2>Bài nộp</h2>

<p className="text-3xl">
{totalSubmissions}
</p>

</div>

</div>

</div>

)}
</div>
</div>
</div>
)}