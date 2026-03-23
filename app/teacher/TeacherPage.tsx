"use client"

import { useState,useEffect, use } from "react"
import * as XLSX from "xlsx"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import mammoth from "mammoth"
import TurndownService from "turndown"
import Header from "../components/header"
import ChangePassword from "../components/ChangePassword"
import TestEditor from "../components/TestEditor"
import { b, tr } from "framer-motion/client"
import Student from "../student/16h00 20.3.2026"

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from "chart.js"

import { Pie, Line } from "react-chartjs-2"

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
)

ChartJS.register(ArcElement, Tooltip, Legend)
export default function Teacher(){


const router = useRouter()
const searchParams = useSearchParams()
const classId = searchParams.get("class")
const tab = searchParams.get("tab") || "classes"
const [action, setAction] = useState("");
const [selectedStudents,setSelectedStudents] = useState<string[]>([])
const [view,setView] = useState("all")
const [selectedStudent,setSelectedStudent] = useState<string | null>(null)
const [selectedSubmission,setSelectedSubmission] = useState<any>(null)
const [teacherScore,setTeacherScore] = useState("")
const [teacherFeedback,setTeacherFeedback] = useState("")
const detailRef = useRef<any>(null)
const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)

const [classes,setClasses] = useState([])
const [className,setClassName] = useState("")

const [practiceSubmissions,setPracticeSubmissions] = useState<any[]>([])
const [teacherExercises,setTeacherExercises] = useState<any[]>([])
const [selectedExercise,setSelectedExercise] = useState<any>(null)

const [copyGroups,setCopyGroups] = useState([])

const [students,setStudents] = useState({
pending:[],
active:[]
})

const [submissions,setSubmissions] = useState<any[]>([])
const [copyCases,setCopyCases] = useState([])


const [exercises,setExercises] = useState([])
const [exercise,setExercise] = useState("")

const [showModal, setShowModal] = useState(false)

const [file,setFile] = useState<any>(null)

const [fileName,setFileName] = useState("Chưa có tệp được chọn")

const [selectedClass,setSelectedClass] = useState(classId || null)
const [selectedClassName,setSelectedClassName] = useState("")
const [loading,setLoading] = useState(false)
const [loadingtest,setLoadingtest] = useState(false)

const [user,setUser] = useState<any>(null)
const [teacherId,setTeacherId] = useState("")
const [aiPrompt,setAiPrompt] = useState("")
const [exerciseMode,setExerciseMode]=useState("manual")
const [preview,setPreview] = useState(false)
const [scores,setScores] = useState<any>({})

const [collapse, setCollapse] = useState(false)

const [viewMode,setViewMode] = useState<"teacher" | "practice">("teacher")

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

const [tests,setTests] = useState<any[]>([])
const [editContent, setEditContent] = useState("")

const [sendAll,setSendAll] = useState(false)
const [search,setSearch] = useState("")

const [stats,setStats] = useState<any>(null)
const [statMode,setStatMode] = useState("class")

useEffect(()=>{
  if(tab==="stats"){
    loadStats()
  }
},[tab,statMode,selectedClass])

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

if(tab==="students" ){
loadStudents(classId,"")
}

if(tab==="submissions"){
loadSubmissions(classId,"")
loadTeacherExercises(classId)
}

if(tab==="exercise"){

loadStudents(classId,"")
loadExercises(classId,"")
}

if(tab==="copy"){
loadCopy()
}

}

},[classId,tab])

useEffect(()=>{
  setSelectedStudent(null)
},[view])

useEffect(()=>{
  if(selectedClass){
    loadExercises(selectedClass)
  }
},[selectedClass])

useEffect(()=>{
  setShowModal(false)
},[tab])

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

async function loadStats(){

  try{

    let url = ""

    if(statMode==="class"){
      if(!selectedClass){
        console.log("❌ chưa có class")
        return
      }
      url = `/api/statistics?class_id=${selectedClass}&mode=class`
    }else{
      url = `/api/statistics?mode=all`
    }

    console.log("CALL:", url)

    const res = await fetch(url)

    const data = await res.json()

    console.log("DATA:", data)

    setStats(data)

  }catch(err){
    console.error("Lỗi:", err)
  }
}

async function loadPairCode(p: any) {

  const res = await fetch("/api/get-pair-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      a_id: p.a_id,
      b_id: p.b_id,
      exercise_id: selectedExercise?.id
    })
  })

  const data = await res.json()

  if (!data || data.length < 2) return

  const a = data.find((x: any) => x.id === p.a_id)
  const b = data.find((x: any) => x.id === p.b_id)

  if (!a || !b) return

  const newGroups = [...copyGroups]

  // 🔥 FIX crash 100%
  if (!newGroups || newGroups.length === 0) return
  if (selectedGroup === undefined || selectedGroup === null) return
  if (!newGroups[selectedGroup]) return
  if (!newGroups[selectedGroup].pairs) return

  const pair = newGroups[selectedGroup].pairs.find(
    (x: any) => x.a_id === p.a_id && x.b_id === p.b_id
  )

  if (!pair) return

  pair.codeA = a.code || ""
  pair.codeB = b.code || ""

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
pending: pending.data || pending || [],
active: active.data || active || []
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

async function loadSubmissions(class_id:any,name:any, exercise_id?:string){

  if(!class_id) return

  let url = `/api/class-submissions?class_id=${class_id}`

  if(exercise_id){
    url += `&exercise_id=${exercise_id}`
  }

  const res = await fetch(url)
  const data = await res.json()

  console.log("TYPE:", data.map((s:any)=>s.type)) // check
  setSubmissions(data || [])
}

async function loadTeacherExercises(class_id:any){

  const res = await fetch(`/api/class-generated-exercises?class_id=${class_id}`)
  const data = await res.json()

  setTeacherExercises(data || [])
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

  if(!selectedExercise?.id){
    alert("👉 Vui lòng chọn bài trước khi quét")
    return
  }

  const res = await fetch(
    `/api/detect-copy?class_id=${selectedClass}&exercise_id=${selectedExercise.id}`
  )

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
if (data.length > 0) {
  setSelectedExercise(data[0])
}

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
form.append("tests", JSON.stringify(tests)) 
form.append("send_all", "0")
form.append("student_ids", JSON.stringify(selectedStudents))
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

await loadExercises(selectedClass,selectedClassName)
changeTab("exercise")

}else{

alert("Lỗi giao bài")
}

}
async function generateAI() {
  try {
    setLoading(true); // 👈 BẮT ĐẦU

    const res = await fetch("/api/generate-exercise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: aiPrompt
      })
    });

    if (!res.ok) {
      alert("AI sinh bài lỗi");
      return;
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (data.exercise) {
      setExercise(data.exercise);
    }

  } catch (err) {
    console.error(err);
    alert("Lỗi gọi API");
  } finally {
    setLoading(false); // 👈 KẾT THÚC
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

const allStudents = (() => {
  const map = new Map()

  ;[...(students.active||[])]
  .forEach(s => map.set(s.id, s))

  return Array.from(map.values())
})()

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
  onClick={(e)=>{
    e.stopPropagation()
    loadStudents(c.id, c.name)
  }}
  className="bg-blue-600 px-3 py-1 text-white rounded"
>
  Học sinh
</button>

<button
  onClick={(e)=>{
    e.stopPropagation()

    // set class
    setSelectedClass(c.id)
    setSelectedClassName(c.name)

    // 👉 chuyển tab
    changeTab("submissions")

    // 👉 load luôn
    loadSubmissions(c.id)
  }}
  className="bg-green-600 px-3 py-1 text-white rounded"
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


{practiceSubmissions.length > 0 && (

<div className="bg-white p-4 rounded-xl shadow mt-6">

  <h3 className="font-bold mb-3">🧠 Bài tự sinh</h3>

  <table className="w-full">
    <thead className="bg-purple-600 text-white">
      <tr>
        <th>STT</th>
        <th>Học sinh</th>
        <th>AI</th>
        <th>GV</th>
        <th>Trạng thái</th>
      </tr>
    </thead>

    <tbody>
    {practiceSubmissions.map((s,i)=>(
      <tr
        key={s.id}
        onClick={()=>setSelectedSubmission(s)}
        className="cursor-pointer hover:bg-purple-50"
      >
        <td>{i+1}</td>
        <td className="flex items-center gap-2">
          {s.student_name}

          <span className="bg-purple-200 text-purple-700 px-2 rounded text-xs">
            Practice
          </span>
        </td>
        <td>{s.ai_score ?? "-"}</td>
        <td>{s.teacher_score ?? "-"}</td>
        <td>{s.status}</td>
      </tr>
    ))}
    </tbody>
  </table>

</div>

)}


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
{loading ? "⏳Đang tạo tài khoản..." : "Tải lên"}
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

<h1 className="text-2xl text-red-600 font-semibold mb-4">
GIAO BÀI TẬP
</h1>

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">
  <h2 className="text-1xl text-blue-600 font-semibold mb-4">
Nội dung đề bài:
</h2>
<textarea
placeholder="Nhập đề bài..."
className="w-full h-[180px] border border-blue-600 p-4 text-black mb-4 rounded"
value={exercise}
onChange={(e)=>setExercise(e.target.value)}
/>
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
{/* PREVIEW ĐỀ BÀI */}
<div className="text-gray-300 mb-2">
Xem trước đề bài
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
 <div>
    <textarea
      placeholder="Nhập mô tả để sinh bài..."
      className="w-full h-[120px] border border-blue-600 p-4 text-black mb-4 rounded"
      value={aiPrompt}
      onChange={(e) => setAiPrompt(e.target.value)}
    />
  </div>
</div>

<div className="bg-white p rounded mt-2">


<div className="space-y-4">

  {/* AI INPUT */}
 
<div className="flex gap-4 items-start">

  {/* LEFT: TEST EDITOR */}
  <div className="flex-1">
    <TestEditor
      tests={tests}
      setTests={setTests}
      exercise={exercise}
      action={action}
      setLoadingtest={setLoadingtest}
    />
  </div>

  {/* RIGHT: BUTTON */}
  <div className="flex flex-col gap-2 w-44">

    <button
      onClick={generateAI}
      className="bg-red-600 text-white px-4 py-2 rounded-lg"
    >
      {loading ? "⏳ Đang sinh đề..." : "🤖 Sinh đề AI"}
    </button>

    <button
      onClick={() => setAction({ type: "add", time: Date.now() })}
      className="bg-green-500 text-white px-4 py-2 rounded-lg"
    >
      + Thêm test
    </button>

    <button
      onClick={() => setAction({ type: "generate", time: Date.now() })}
      disabled={loadingtest}
      className="bg-purple-500 text-white px-4 py-2 rounded-lg"
    >
      {loadingtest ? "⏳ Đang sinh test..." : "⚙️ Sinh test"}
    </button>

  </div>

</div>

</div>

<div className="bg-white p-1 rounded-xl shadow space-y-3">

  <div className="font-semibold text-gray-700">
    👥 Gửi bài cho
  </div>
  <div className="border rounded-xl shadow-sm mt-3">

  {/* HEADER */}
  <div className="flex justify-between items-center p-1 border-b bg-gray-50">

    <div className="font-semibold text-gray-700">
      👨‍🎓 Chọn học sinh ({allStudents.filter(s => s.status === "active").length})
    </div>

    <div className="flex gap-2">

      <button
        onClick={()=>setSelectedStudents(allStudents.filter(s => s.status === "active").map(s=>s.id))}
        className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded"
      >
        Chọn tất cả
      </button>

      <button
        onClick={()=>setSelectedStudents([])}
        className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
      >
        Bỏ chọn
      </button>

    </div>

  </div>

  {/* SEARCH */}
  <div className="p-3 border-b">
    <input
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      placeholder="🔍 Tìm tên hoặc email..."
      className="w-full border rounded px-1 py-2 text-sm"
    />
  </div>

  {/* TABLE */}
  <div className="max-h-40 overflow-auto">

    <table className="w-full text-sm">

      <thead className="bg-gray-100 sticky top-0">
        <tr>
          <th className="p-2 w-10"></th>
          <th className="p-2 text-left">Tên</th>
          <th className="p-2 text-left">Email</th>
        </tr>
      </thead>

      <tbody>
        {allStudents
          .filter((s:any)=>
            (s.name||"").toLowerCase().includes(search.toLowerCase()) ||
            (s.email||"").toLowerCase().includes(search.toLowerCase())
          )
          .map((s:any)=>{

            const checked = selectedStudents.includes(s.id)

            return(
              <tr 
                key={s.id}
                className={`border-t hover:bg-gray-50 ${
                  checked ? "bg-blue-50" : ""
                }`}
              >

                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e)=>{
                      if(e.target.checked){
                        setSelectedStudents([...selectedStudents, s.id])
                      }else{
                        setSelectedStudents(
                          selectedStudents.filter(id=>id!==s.id)
                        )
                      }
                    }}
                  />
                </td>

                <td className="p-2 font-medium">
                  {s.name || "Chưa có tên"}
                </td>

                <td className="p-2 text-gray-500">
                  {s.email}
                </td>

              </tr>
            )
        })}
      </tbody>

    </table>

  </div>

</div>

</div>
<div className="gap-2 flex-wrap space-x-2 flex items-center">

<button
onClick={createExercise}
className="bg-blue-600 text-white px-3 py-2 rounded"
>
Giao bài cho học sinh
</button>
</div>
</div>


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

  <span
    className="text-red-500 cursor-pointer"
    onClick={()=>{
    setSelectedExercise(e)
    setTests(Array.isArray(e.test_cases) ? e.test_cases : [])
    setEditContent(e.exercise)
    setShowModal(true)
    }}
  >
    ▶ Xem đề
  </span>

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
{showModal && selectedExercise && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">

    {/* overlay */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={()=>{
        setSelectedExercise(null)
        setTests([])
        setShowModal(false)
      }}
    />

    {/* modal box */}
    <div className="relative bg-white w-[900px] max-h-[90vh] overflow-auto rounded-xl shadow-lg p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">

        <h2 className="text-lg font-bold text-blue-600">
          ✏️ Sửa đề và test
        </h2>

        <div className="flex gap-2">

          <button
            onClick={async ()=>{
              await fetch("/api/update-exercise",{
                method:"POST",
                headers:{ "Content-Type":"application/json" },
                body: JSON.stringify({
                  id: selectedExercise.id,
                  exercise: editContent,
                  test_cases: tests
                })
              })

              alert("✅ Đã lưu")

              setSelectedExercise(null)
              setTests([])
            }}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            💾 Lưu
          </button>

          <button
            onClick={()=>{
              setSelectedExercise(null)
              setTests([])
            }}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            ❌ Đóng
          </button>

        </div>
      </div>

      {/* EDIT */}
      <textarea
        value={editContent}
        onChange={(e)=>setEditContent(e.target.value)}
        className="w-full border p-3 rounded mb-4"
        rows={6}
      />

      {/* PREVIEW */}
      <div className="bg-gray-50 p-3 rounded mb-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {editContent}
        </ReactMarkdown>
      </div>

      {/* TEST EDITOR */}
      <TestEditor
        tests={tests}
        setTests={setTests}
        exercise={editContent}
      />

    </div>
  </div>
)}
</div>

)}

{tab==="copy" && (

<div className="bg-white p-6 rounded-xl shadow-sm mb-6">

  {/* ================= CHỌN BÀI ================= */}
  <div className="bg-white p-4 rounded-xl shadow mb-4">

<h2 className="font-bold mb-3 text-lg">📘 Chọn bài</h2>

<div className="space-y-2 max-h-[300px] overflow-y-auto">

{exercises
.sort((a,b)=>new Date(a.created_at).getTime() - new Date(b.created_at))
.map((ex:any,index:number)=>{

  const title = ex.exercise
    ?.replace(/[#*]/g,"")
    ?.split("\n")[0]
    ?.slice(0,60)

  return(
    <div
      key={ex.id}
      onClick={()=>setSelectedExercise(ex)}
      className={`
        p-3 rounded-lg border cursor-pointer transition
        ${selectedExercise?.id===ex.id
          ? "bg-blue-50 border-blue-400"
          : "bg-white hover:bg-gray-50"}
      `}
    >

      <div className="flex justify-between">

        <div className="font-semibold">
          📘 Bài {index+1}
        </div>

        <div className="text-xs text-gray-400">
          {new Date(ex.created_at).toLocaleDateString()}
        </div>

      </div>

      <div className="text-sm text-gray-600 mt-1">
        {title || "Bài tập"}
      </div>

    </div>
  )
})}

</div>
</div>

  {/* ================= HEADER ================= */}
  <h1 className="text-xl font-semibold mb-2">
    🚨 Phát hiện copy code
  </h1>

  {/* 🔥 hiển thị bài đang chọn */}
  {selectedExercise && (
    <div className="mb-3 text-blue-600 font-medium">
      👉 Đang chọn: {
  selectedExercise?.exercise
    ?.replace(/[#*]/g,"")
    ?.slice(0,40)
}
    </div>
  )}

  {/* ================= BUTTON ================= */}
  <button
    onClick={detectCopy}
    className="bg-red-600 text-white px-3 py-1 rounded mb-4"
  >
    🔍 Quét copy bài này
  </button>

  {/* ================= KẾT QUẢ ================= */}
  {copyGroups.length === 0 && (
    <div className="text-gray-400">
      👉 Chưa có dữ liệu, hãy chọn bài và bấm quét
    </div>
  )}

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

      <div className="text-sm text-red-600 mt-1">
        🔥 Độ giống: {g.similarity}%
      </div>

      <div className="mt-2 text-gray-800">
        {g.student_names.join(" , ")}
      </div>

      {/* 🔍 từng cặp */}
      <div className="mt-2 text-xs text-gray-600">
        {g.pairs && g.pairs.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {g.pairs.map((p:any)=>(
              <div
                key={p.a_id + "_" + p.b_id}
                onClick={(e)=>{
                  e.stopPropagation()
                  loadPairCode(p)
                }}
                className="cursor-pointer hover:bg-gray-100 p-2 rounded"
              >
                🔍 {p.a} - {p.b}: {p.score}%
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  ))}

  {/* ================= SO SÁNH ================= */}
  {selectedGroup !== null && copyGroups[selectedGroup]?.pairs?.length > 0 && (

    <div className="mt-6">

      <h2 className="text-xl font-bold mb-4">
        📄 So sánh code
      </h2>

      {copyGroups[selectedGroup].pairs.map((p:any,idx:number)=>(

        <div 
          key={idx}
          onClick={()=>loadPairCode(p,idx)}
          className="cursor-pointer mb-4"
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


{tab === "submissions" && (

<div className="space-y-6">

{/* ================= KPI ================= */}
<div className="grid grid-cols-4 gap-4">

  <div className="bg-purple-600 text-white p-4 rounded text-center">
    <div>Tổng bài</div>
    <div className="text-2xl font-bold">{totalAll}</div>
  </div>

  <div className="bg-yellow-500 text-white p-4 rounded text-center">
    <div>Đã nộp</div>
    <div className="text-2xl font-bold">{totalSubmitted}</div>
  </div>

  <div className="bg-green-600 text-white p-4 rounded text-center">
    <div>Đã chấm</div>
    <div className="text-2xl font-bold">{totalGraded}</div>
  </div>

  <div className="bg-red-500 text-white p-4 rounded text-center">
    <div>Chưa nộp</div>
    <div className="text-2xl font-bold">{totalPending}</div>
  </div>

</div>


{/* ================= TỔNG HỢP ================= */}
<div className="bg-white p-4 rounded-xl shadow">

<div className="font-bold mb-3">📊 Tổng hợp lớp</div>

<table className="w-full text-sm">
<thead className="bg-blue-600 text-white">
<tr>
  <th>STT</th>
  <th>Học sinh</th>
  <th>📘 Số bài GV giao</th>
  <th>🧠 Số bài HS tự sinh</th>
  <th>Điểm TB AI</th>
  <th>Điểm TB GV</th>
</tr>
</thead>

<tbody>

{Object.values(
  submissions.reduce((acc:any, s:any)=>{

    if(!acc[s.student_name]){
      acc[s.student_name] = {
        name: s.student_name,
        gv: 0,
        practice: 0,
        ai: [],
        gvScore: []
      }
    }

    if(s.type === "teacher") acc[s.student_name].gv++
    else acc[s.student_name].practice++

    if(s.ai_score != null) acc[s.student_name].ai.push(s.ai_score)
    if(s.teacher_score != null) acc[s.student_name].gvScore.push(s.teacher_score)

    return acc

  }, {})
).map((s:any, i:number)=>{

  const avg = (arr:any[]) =>
    arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : "-"

  return (
    <tr
      key={i}
      className="border text-center cursor-pointer hover:bg-gray-100"
      onClick={()=>{
        setSelectedStudent(s.name)
        setSelectedSubmission(null)
      }}
    >
      <td>{i+1}</td>
      <td>{s.name}</td>
      <td>{s.gv}</td>
      <td>{s.practice}</td>
      <td>{avg(s.ai)}</td>
      <td>{avg(s.gvScore)}</td>
    </tr>
  )

})}

</tbody>
</table>

</div>


{/* ================= MAIN ================= */}
<div className="grid grid-cols-2 gap-2">

{/* ===== NỘI DUNG ===== */}
<div className="col-span-3 space-y-4">

{/* TAB */}
<div className="flex gap-2">

<button
onClick={()=>{
  setView("teacher")
  setSelectedSubmission(null)
}}

className={`px-3 py-1 rounded ${view==="teacher" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
>
📘 GV giao
</button>

<button
onClick={()=> {
  setView("practice")
  setSelectedSubmission(null)
}}
className={`px-3 py-1 rounded ${view==="practice" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
>
🧠 HS tự sinh
</button>

<button
onClick={()=>{
  setView("all")
  setSelectedSubmission(null)
}}
className={`px-3 py-1 rounded ${view==="all" ? "bg-green-600 text-white" : "bg-gray-200"}`}
>
📋 Tất cả
</button>

</div>


{/* TABLE */}
<div className="bg-white p-4 rounded-xl shadow">
<table className="w-full table-auto text-sm">
<thead className="bg-blue-600 text-white text-center">
<tr>
      <th className="p w-[60px] text-center">STT</th>
      <th className="p text-center w-[35%]">Học sinh</th>
      <th className="p w-[100px] text-center">Loại bài</th>
      <th className="p w-[90px] text-center">Điểm AI</th>
      <th className="p w-[90px] text-center">Điểm GV</th>
      <th className="p w-[140px] text-center">Trạng thái</th>
    </tr>
</thead>

<tbody>
{submissions
.filter((s:any)=>{

  if(selectedStudent !==null && selectedStudent !==""){
    if(s.student_name !== selectedStudent) return false
  }

  if(view === "teacher") return s.type === "teacher"
  if(view === "practice") return s.type === "practice"

  return true
})

.map((s:any,i:number)=>(
<tr
key={s.id}
onClick={()=>{

  setSelectedSubmission(s)

  setTimeout(()=>{
    detailRef.current?.scrollIntoView({behavior:"smooth"})
  },100)

}}
className={`cursor-pointer border text-center hover:bg-blue-50
${selectedSubmission?.id === s.id ? "bg-blue-100" : ""}`}
>

<td>{i+1}</td>
<td>{s.student_name}</td>

<td>
{s.type==="teacher"
  ? <span className="bg-blue-100 px-2 rounded">📘 GV giao</span>
  : <span className="bg-purple-200 px-2 rounded">🧠 Tự sinh</span>
}
</td>

<td>{s.ai_score ?? "-"}</td>
<td>{s.teacher_score ?? "-"}</td>

<td>
{s.status==="graded" && "✅ Đã chấm"}
{s.status==="submitted" && "📥 Đã nộp"}
{s.status==="pending" && "❌ Chưa nộp"}
</td>

</tr>
))}

</tbody>
</table>

</div>


{/* ===== CHI TIẾT ===== */}
<div ref={detailRef}>

{selectedSubmission && (

<div className="bg-white p-4 rounded shadow">

<div className="flex justify-between mb-3">
<div className="font-bold">📄 CHI TIẾT BÀI LÀM</div>
<button onClick={()=>setSelectedSubmission(null)}>❌</button>
</div>

{/* ĐỀ */}
<ReactMarkdown remarkPlugins={[remarkGfm]}>
{selectedSubmission.exercise || "Không có đề"}
</ReactMarkdown>

{/* CODE */}
<pre className="bg-black text-green-400 p-3 rounded mt-3">
{selectedSubmission.code || "Không có code"}
</pre>

{/* ===== AI FEEDBACK ===== */}

<div>

<div className="font-semibold mb-2 text-gray-700">
🤖 AI nhận xét
</div>

<div className="bg-gray-50 border p-4 rounded-lg">

{(() => {

  let parsed: any = null

  try {
    parsed = JSON.parse(selectedSubmission?.ai_feedback || "{}")
  } catch {}

  const feedback = parsed?.feedback || selectedSubmission?.ai_feedback || ""
  const tests = parsed?.detail || []

  const total = tests.length
  const passed = tests.filter((t:any) => t.passed).length
  const percent = total ? Math.round((passed / total) * 100) : 0

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-3">

      {/* 🔥 AI FEEDBACK */}
      <h3 className="font-bold mb-2">🤖 AI nhận xét</h3>

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {feedback}
        </ReactMarkdown>
      </div>

      {/* 🔥 TEST RESULT */}
      {tests.length > 0 && (
        <div className="mt-4">

          <p className="font-semibold mb-2">
            📊 {passed}/{total} test ({percent}%)
          </p>

          {tests.map((t:any, i:number) => (
            <div
              key={i}
              className={`p-2 mb-2 rounded ${
                t.passed ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <p>
                Test {i + 1}: {t.passed ? "✅ PASS" : "❌ FAIL"}
              </p>

              {!t.passed && (
                <div className="text-sm mt-1">
                  <p><b>Input:</b> {t.input}</p>
                  <p><b>Expected:</b> {t.expected}</p>
                  <p><b>Output:</b> {t.output}</p>
                </div>
              )}
            </div>
          ))}

        </div>
      )}

    </div>
  )

})()}

</div>
</div>

{/* ===== GV FEEDBACK ===== */}

<div className="mt-3 font-semibold">
Giáo viên nhận xét:
</div>

<div className="bg-white p-3 mt-2 rounded">
{selectedSubmission.teacher_feedback || "Chưa có"}
</div>

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

</div>

</div>

</div>

</div>

)}

{tab==="stats" && stats && (

<div className="space-y-6">

{/* ===== HEADER ===== */}
<div className="flex justify-between items-center">

<div className="flex gap-2">
<button 
onClick={()=>setStatMode("class")}
className={`px-3 py-1 rounded ${statMode==="class"?"bg-blue-600 text-white":"bg-gray-200"}`}
>
📘 Theo lớp
</button>

<button 
onClick={()=>setStatMode("all")}
className={`px-3 py-1 rounded ${statMode==="all"?"bg-purple-600 text-white":"bg-gray-200"}`}
>
🌍 Toàn hệ thống
</button>
</div>

</div>

{/* ===== KPI ===== */}
<div className="grid grid-cols-4 gap-4">

<div className="bg-indigo-500 text-white p-4 rounded-xl text-center">
<div>Tổng bài</div>
<div className="text-2xl font-bold">{stats.total}</div>
</div>

<div className="bg-yellow-500 text-white p-4 rounded-xl text-center">
<div>Đã nộp</div>
<div className="text-2xl font-bold">{stats.submitted}</div>
</div>

<div className="bg-green-500 text-white p-4 rounded-xl text-center">
<div>Đã chấm</div>
<div className="text-2xl font-bold">{stats.graded}</div>
</div>

<div className="bg-red-500 text-white p-4 rounded-xl text-center">
<div>HS yếu</div>
<div className="text-2xl font-bold">
{stats.students.filter(s=>s.level==="Yếu").length}
</div>
</div>

</div>

{/* ===== CHART ===== */}
<div className="grid grid-cols-2 gap-6">

{/* PIE */}
<div className="bg-white p-4 rounded-xl shadow">
<h3 className="font-bold mb-3">📊 Phân loại học sinh</h3>

<Pie
data={{
labels:["Giỏi","Trung bình","Yếu","Chưa học"],
datasets:[{
data:[
stats.students.filter(s=>s.level==="Giỏi").length,
stats.students.filter(s=>s.level==="Trung bình").length,
stats.students.filter(s=>s.level==="Yếu").length,
stats.students.filter(s=>s.level==="Chưa học").length
]
}]
}}
/>

</div>

{/* LINE */}
<div className="bg-white p-4 rounded-xl shadow">
<h3 className="font-bold mb-3">📈 Tiến độ nộp bài</h3>

<Line
data={{
labels: stats.exercises.map((_,i)=>`Bài ${i+1}`),
datasets:[{
label:"Tỷ lệ nộp (%)",
data: stats.exercises.map(e=>e.rate)
}]
}}
/>

</div>

</div>

{/* ===== ALERT ===== */}
<div className="bg-red-50 p-4 rounded-xl">

<h3 className="font-bold text-red-600 mb-2">
🚨 Học sinh yếu
</h3>

{stats.students
.filter(s=>s.level==="Yếu")
.map((s:any)=>(
<div key={s.id} className="flex justify-between border-b p-2">
{s.name}
<span className="text-red-500">{s.avg ?? "—"}</span>
</div>
))}

</div>

{/* ===== CHƯA HỌC ===== */}
<div className="bg-gray-100 p-4 rounded-xl">

<h3 className="font-bold mb-2">
📌 Chưa học / chưa nộp
</h3>

{stats.students
.filter(s=>s.level==="Chưa học")
.map((s:any)=>(
<div key={s.id} className="border-b p-2">
{s.name}
</div>
))}

</div>

{/* ===== RANKING ===== */}
<div className="grid grid-cols-2 gap-6">

{/* TOP */}
<div className="bg-white p-4 rounded-xl shadow">

<h3 className="font-bold mb-2">🏆 Top học sinh</h3>

{[...stats.students]
.filter(s=>s.avg !== null)
.sort((a,b)=>b.avg-a.avg)
.slice(0,5)
.map((s:any,i)=>(
<div key={i} className="flex justify-between border-b p-2">
#{i+1} {s.name}
<span className="text-green-600">{s.avg}</span>
</div>
))}

</div>

{/* BOTTOM */}
<div className="bg-white p-4 rounded-xl shadow">

<h3 className="font-bold mb-2">⚠️ Cần cải thiện</h3>

{[...stats.students]
.filter(s=>s.avg !== null)
.sort((a,b)=>a.avg-b.avg)
.slice(0,5)
.map((s:any,i)=>(
<div key={i} className="flex justify-between border-b p-2">
{s.name}
<span className="text-red-500">{s.avg}</span>
</div>
))}

</div>

</div>

{/* ===== THEO BÀI ===== */}
<div className="bg-white p-4 rounded-xl shadow">

<h3 className="font-bold mb-2">📚 Thống kê theo bài</h3>

{stats.exercises.map((e:any)=>(
<div key={e.id} className="flex justify-between border-b p-2">

  <div className="max-w-[60%]">
    <div className="font-medium">
      📘 {e.title}
    </div>
  </div>

  <div className="flex gap-3 text-sm">

    <span className="text-gray-500">
      {e.total} HS
    </span>

    <span className="text-blue-600 font-semibold">
      {e.rate}% nộp
    </span>

  </div>

</div>
))}

{stats.exercises.length===0 && (
<div className="text-gray-400">Chưa có dữ liệu</div>
)}

</div>

</div>
)}



</div>
</div>
</div>
)}