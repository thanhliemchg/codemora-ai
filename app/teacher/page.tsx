"use client"

import { useState,useEffect } from "react"
import * as XLSX from "xlsx"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import mammoth from "mammoth"
import TurndownService from "turndown"

export default function Teacher(){
const router = useRouter()
const searchParams = useSearchParams()
const classId = searchParams.get("class")
const tab = searchParams.get("tab") || "classes"

const detailRef = useRef<any>(null)

const [classes,setClasses] = useState([])
const [className,setClassName] = useState("")

const [students,setStudents] = useState({
pending:[],
active:[]
})
const [submissions,setSubmissions] = useState<any[]>([])
const [copyCases,setCopyCases] = useState([])

const [exercises,setExercises] = useState([])
const [exercise,setExercise] = useState("")

const [file,setFile] = useState<any>(null)

const [fileName,setFileName] = useState("Chưa có tệp được chọn")

const [selectedClass,setSelectedClass] = useState(classId || null)
const [selectedClassName,setSelectedClassName] = useState("")

const [user,setUser] = useState<any>(null)
const [teacherId,setTeacherId] = useState("")
const [aiPrompt,setAiPrompt] = useState("")
const [exerciseMode,setExerciseMode]=useState("manual")
const [preview,setPreview] = useState(false)
const [scores,setScores] = useState<any>({})
const [selectedSubmission,setSelectedSubmission] = useState(null)
const [teacherScore,setTeacherScore] = useState("")
const [teacherFeedback,setTeacherFeedback] = useState("")

const [filter,setFilter] = useState("submitted")
const [statusFilter,setStatusFilter] = useState("all")

const totalAll = submissions.length

const totalSubmitted = submissions.filter(s=>s.status==="submitted").length

const totalGraded = submissions.filter(s=>s.status==="graded").length

const totalPending = submissions.filter(s=>s.status==="pending").length

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
detectCopy()
}

}

},[classId,tab])

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

function chooseClass(id,name){

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

function importExcel(e:any){

const file = e.target.files[0]

const reader = new FileReader()

reader.onload = (evt)=>{

const data = new Uint8Array(evt.target?.result as ArrayBuffer)

const workbook = XLSX.read(data,{type:"array"})

const sheet = workbook.Sheets[workbook.SheetNames[0]]

const students = XLSX.utils.sheet_to_json(sheet)

uploadStudents(students)

}

reader.readAsArrayBuffer(file)

}

async function uploadStudents(students:any){

await fetch("/api/import-students",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
students,
class_id:selectedClass
})
})

loadStudents(selectedClass,selectedClassName)

}
function exportStudents(){

const data = [
...students.pending,
...students.active
]

const worksheet = XLSX.utils.json_to_sheet(data)

const workbook = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(workbook,worksheet,"students")

XLSX.writeFile(workbook,"students.xlsx")

}

function exportMarkExcel(){

const rows = submissions.map((s,i)=>({

STT:i+1,

Hoc_sinh:s.student_name,

Loai_bai:s.type==="teacher" ? "GV giao" : "Tự sinh",

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
async function saveScore(id:any,score:any){

await fetch("/api/teacher-score",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
submission_id:id,
teacher_score:score,
teacher_feedback:teacherFeedback
})
})

await loadSubmissions(selectedClass,selectedClassName)

}

async function detectCopy(){

const res = await fetch(`/api/detect-copy?class_id=${selectedClass}`)
const data = await res.json()

setCopyCases(data)
changeTab("copy")

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
const totalStudents = students.pending.length + students.active.length
const totalSubmissions = submissions.length

return(

<div className="min-h-screen bg-gray-900 text-white">

<div className="flex justify-between px-8 py-4 bg-gray-800">

<h1 className="font-bold text-xl">
CodeMora AI - Teacher
</h1>

<div>

<span className="mr-4">
👤 {user?.name}
</span>

<button
onClick={()=>{
localStorage.removeItem("user")
window.location.href="/login"
}}
className="bg-red-500 px-3 py-1 rounded"
>
Đăng xuất
</button>

</div>

</div>

<div className="flex">

<div className="w-[220px] bg-blue-950 p-6 min-h-screen">

<h2 className="font-bold mb-6">Menu</h2>

<ul className="space-y-2 text-sm">

<li
onClick={()=>changeTab("classes")}
className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition
${tab==="classes"
? "bg-blue-600 text-white border-l-4 border-yellow-400"
: "hover:bg-gray-700 text-gray-200"}
`}
>
<span>📚</span>
<span>Lớp học</span>
</li>


<li
onClick={()=>{
changeTab("students")
requireClass(()=>loadStudents(selectedClass,selectedClassName))
}}
className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition
${tab==="students"
? "bg-blue-600 text-white border-l-4 border-yellow-400"
: "hover:bg-gray-700 text-gray-200"}
`}
>
<span>👨‍🎓</span>
<span>Học sinh</span>
</li>


<li
onClick={()=>{
changeTab("exercise")
requireClass(()=>loadExercises(selectedClass,selectedClassName))
}}
className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition
${tab==="exercise"
? "bg-blue-600 text-white border-l-4 border-yellow-400"
: "hover:bg-gray-700 text-gray-200"}
`}
>
<span>📝</span>
<span>Giao bài tập</span>
</li>


<li
onClick={()=>{
changeTab("submissions")
requireClass(()=>loadSubmissions(selectedClass,selectedClassName))
}}
className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition
${tab==="submissions"
? "bg-blue-600 text-white border-l-4 border-yellow-400"
: "hover:bg-gray-700 text-gray-200"}
`}
>
<span>📥</span>
<span>Bài nộp</span>
</li>


<li
onClick={()=>{
changeTab("copy")
requireClass(detectCopy)
}}
className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition
${tab==="copy"
? "bg-blue-600 text-white border-l-4 border-yellow-400"
: "hover:bg-gray-700 text-gray-200"}
`}
>
<span>🕵️</span>
<span>Phát hiện copy</span>
</li>


<li
onClick={()=>changeTab("stats")}
className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition
${tab==="stats"
? "bg-blue-600 text-white border-l-4 border-yellow-400"
: "hover:bg-gray-700 text-gray-200"}
`}
>
<span>📊</span>
<span>Thống kê</span>
</li>

</ul>

</div>

<div className="flex-1 p-8">

{selectedClassName && (

<div className="mb-6 text-yellow-400 font-bold mb-6">
📚 LỚP: {selectedClassName}
</div>

)}

{tab==="classes" && (

<div>

<h1 className="text-2xl mb-6">Quản lý lớp</h1>

<input
placeholder="Tên lớp"
className="text-black p-2 mr-2"
value={className}
onChange={(e)=>setClassName(e.target.value)}
/>

<button
onClick={createClass}
className="bg-blue-600 px-3 py-2 rounded"
>
Tạo lớp
</button>

<table className="w-full mt-6 bg-gray-800">

<tbody>

{classes.map((c:any)=>(
<tr
key={c.id}
className={`border-b border-gray-700 cursor-pointer hover:bg-gray-700 
${selectedClass===c.id ? "bg-gray-700" : ""}`}
>

<td
className="py-2 font-semibold text-yellow-300"
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
className="bg-blue-500 px-2 py-1 rounded mr-2"
>
Học sinh
</button>

<button
onClick={()=>{
changeTab("submissions")
chooseClass(c.id,c.name)
}}
className="bg-green-500 px-2 py-1 rounded mr-2"
>
Bài nộp
</button>

<button
onClick={()=>editClass(c.id,c.name)}
className="bg-yellow-500 px-2 py-1 rounded mr-2"
>
Sửa tên lớp
</button>

<button
onClick={()=>deleteClass(c.id)}
className="bg-red-500 px-2 py-1 rounded"
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

<div>

<h1 className="ttext-lg font-bold text-white-400 mb-2">
Quản lý học sinh
</h1>

<input
type="file"
onChange={importExcel}
className="mb-4"
/>
<a
href="/sample_students.xlsx"
download
className="ml-4 text-blue-400 underline">
Tải file Excel mẫu
</a>
<button
onClick={exportStudents}
className="bg-green-600 px-3 py-1 rounded ml-4"
>
Xuất Excel
</button>
{/* ===== HỌC SINH CHỜ KÍCH HOẠT ===== */}

<h2 className="text-lg font-bold text-yellow-400 mb-2">
Học sinh chờ kích hoạt
</h2>

<table className="w-full bg-gray-800 mb-6">

<thead className="bg-gray-700 text-left">
<tr>
<th className="p-2">Tên học sinh</th>
<th>Email</th>
<th>Trạng thái</th>
<th>Hành động</th>
</tr>
</thead>

<tbody>

{students?.pending?.map((s:any)=>(

<tr key={s.id} className="border-b border-gray-700">

<td className="py-2">{s.name}</td>

<td>{s.email}</td>

<td className="text-yellow-400 font-semibold">
Chưa kích hoạt
</td>

<td>

<button
onClick={()=>activateStudent(s.id)}
className="bg-green-600 px-2 py-1 rounded"
>
Kích hoạt
</button>

</td>

</tr>

))}

</tbody>

</table>

<div className="text-gray-300 mb-8">
Tổng học sinh chờ kích hoạt: {students.pending.length}
</div>

{/* ===== HỌC SINH ĐÃ KÍCH HOẠT ===== */}

<h2 className="text-lg font-bold text-green-400 mb-2">
Học sinh đã kích hoạt
</h2>

<table className="w-full bg-gray-800">

<thead className="bg-gray-700 text-left">
<tr>
<th className="p-2">Tên học sinh</th>
<th>Email</th>
<th>Trạng thái</th>
</tr>
</thead>

<tbody>

{students?.active?.map((s:any)=>(

<tr key={s.id} className="border-b border-gray-700">

<td className="py-2">{s.name}</td>

<td>{s.email}</td>

<td className="text-green-400 font-semibold">
Đã kích hoạt
</td>

</tr>

))}

</tbody>

</table>

<div className="text-gray-300 mt-4">
Tổng học sinh trong lớp: {students.active.length}
</div>

</div>

)}

{tab==="exercise" && (

<div>

<h1 className="text-1xl mb-6">Giao bài tập</h1>

<textarea
placeholder="Nhập đề bài..."
className="w-full h-[180px] p-4 text-black mb-4 rounded"
value={exercise}
onChange={(e)=>setExercise(e.target.value)}
/>

{/* PREVIEW ĐỀ BÀI */}

<div className="bg-gray-800 p-4 rounded mt-4">

<div className="text-yellow-400 mb-2">
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
className="w-full h-[120px] p-4 text-black mb-4 rounded"
value={aiPrompt}
onChange={(e)=>setAiPrompt(e.target.value)}
/>

<button
onClick={generateAI}
className="bg-purple-600 px-4 py-2 rounded mr-4"
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
className="bg-blue-600 px-4 py-2 rounded"
>
Gửi bài
</button>

<table className="w-full mt-6 bg-gray-800 rounded-lg overflow-hidden">

<thead className="bg-gray-700 text-white">
<tr>

<th className="p-3 text-left">Đề bài</th>

<th className="p-3 text-left">Học sinh</th>

<th className="p-3 text-left">Số HS</th>

<th className="p-3 text-left">Ngày giao</th>

</tr>
</thead>

<tbody>

{exercises?.map((e:any)=>(
<tr key={e.id} className="border-b border-gray-700 hover:bg-gray-700/40">

<td className="p-3 max-w-xl text-sm">

<details>

<summary 
className="cursor-pointer text-blue-400"
onClick={()=>setPreview(!preview)}
>
Xem đề
</summary>

<div className="mt-2 whitespace-pre-wrap text-gray-200">
{preview && (
<ReactMarkdown remarkPlugins={[remarkGfm]}>
{e.exercise}
</ReactMarkdown>
)}
</div>

</details>

</td>


<td className="p-3 text-sm">

{e.student_name || "-"}

</td>


<td className="p-3 text-sm">

{e.total_students || "-"}

</td>


<td className="p-3 text-sm">
{new Date(e.created_at).toLocaleString("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour12: false
})}
</td>

</tr>
))}

</tbody>

</table>
</div>

)}

{tab==="copy" && (

<div>

<h1 className="ttext-lg font-bold text-red-400 mb-2">
Phát hiện copy
</h1>

<table className="w-full bg-gray-800">

<tbody>

{copyCases.map((c:any,i)=>(
<tr key={i} className="border-b border-gray-700">

<td>{c.s1.student_name}</td>

<td>{c.s2.student_name}</td>

<td className="text-red-400">
{Math.round(c.score*100)}%
</td>

</tr>
))}

</tbody>

</table>

</div>

)}

{tab==="submissions" && (

<div className="mt-4">

<div className="flex justify-between items-center mb-3">


<button
onClick={exportMarkExcel}
className="bg-green-600 px-3 py-1 rounded text-white"
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

<div className="bg-gray-800 p-4 rounded text-center">
<div className="text-gray-400 text-sm">Tổng bài</div>
<div className="text-2xl font-bold">{totalAll}</div>
</div>

<div className="bg-yellow-600 p-4 rounded text-center">
<div className="text-sm">Đã nộp</div>
<div className="text-2xl font-bold">{totalSubmitted}</div>
</div>

<div className="bg-green-600 p-4 rounded text-center">
<div className="text-sm">Đã chấm</div>
<div className="text-2xl font-bold">{totalGraded}</div>
</div>

<div className="bg-red-600 p-4 rounded text-center">
<div className="text-sm">Chưa nộp</div>
<div className="text-2xl font-bold">{totalPending}</div>
</div>

</div>

<div className="flex gap-3 mb-4">

<button
onClick={()=>setStatusFilter("all")}
className={`px-3 py-1 rounded
${statusFilter==="all"
? "bg-blue-600 text-white"
: "bg-gray-700 text-gray-200"}
`}
>
Tất cả
</button>

<button
onClick={()=>setStatusFilter("submitted")}
className={`px-3 py-1 rounded
${statusFilter==="submitted"
? "bg-yellow-500 text-black"
: "bg-gray-700 text-gray-200"}
`}
>
Đã nộp
</button>

<button
onClick={()=>setStatusFilter("graded")}
className={`px-3 py-1 rounded
${statusFilter==="graded"
? "bg-green-600 text-white"
: "bg-gray-700 text-gray-200"}
`}
>
Đã chấm
</button>

<button
onClick={()=>setStatusFilter("pending")}
className={`px-3 py-1 rounded
${statusFilter==="pending"
? "bg-red-500 text-white"
: "bg-gray-700 text-gray-200"}
`}
>
Chưa nộp
</button>

</div>
<table className="w-full border-collapse text-fixed">
<thead className="bg-gray-700 text-white">
<tr>
<th className="border border-gray-600 px-4 py-2 text-center">STT</th>

<th className="border border-gray-600 px-4 py-2 text-center">Họ và tên</th>

<th className="border border-gray-600 px-4 py-2 text-center">Loại bài</th>

<th className="border border-gray-600 px-4 py-2 text-center">Điểm AI chấm</th>

<th className="border border-gray-600 px-4 py-2 text-center">Điểm GV chấm</th>

<th className="border border-gray-600 px-4 py-2 text-center">Trạng thái</th>

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
className={`cursor-pointer hover:bg-gray-700
${selectedSubmission?.id === s.id 
? "bg-blue-900 border-l-4 border-blue-400"
: ""}
`}
>
<td className="w-12 border border-gray-600 px-2 py-2 text-center">
  {index+1}
</td>
<td className="border border-gray-600 px-4 py-2">
{s.student_name}
</td>

<td className="border border-gray-600 px-4 py-2 text-center">
{s.type==="teacher" ? "GV giao" : "Tự sinh"}
</td>

<td className="border border-gray-600 px-4 py-2 text-center">

{s.ai_score !== null ? (

<span className="bg-yellow-500 text-black px-2 py-1 rounded text-fixed">
{s.ai_score}
</span>

) : "-"}

</td>

<td className="border border-gray-600 px-4 py-2 text-center">

{s.teacher_score !== null ? (

<span className="bg-green-500 text-white px-2 py-1 rounded text-fixed">
{s.teacher_score}
</span>

) : "-"}

</td>

<td className="border border-gray-600 px-4 py-2 text-center">

{s.status==="pending" && (
<span className="text-gray-400">Chưa nộp</span>
)}

{s.status==="submitted" && (
<span className="text-yellow-400">Đã nộp</span>
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
className="mt-6 bg-gray-800 p-4 rounded">

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

<div className="mt-4 text-yellow-300">
AI nhận xét:
</div>

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{selectedSubmission.ai_feedback}
</ReactMarkdown>

{/* ===== GV FEEDBACK ===== */}

<div className="mt-4 text-green-300">
Giáo viên nhận xét:
</div>

<div className="bg-gray-900 p-3 mt-2 rounded">
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
disabled={selectedSubmission.status!=="submitted"}
onClick={()=>saveScore(selectedSubmission.id,teacherScore)}
className={`px-3 py-1 rounded
${selectedSubmission.status==="submitted"
? "bg-blue-600"
: "bg-gray-600 cursor-not-allowed"}
`}
>
Duyệt điểm và nhận xét
</button>

</div>

</div>

)}

</>

)}

</div>

)}

{tab==="stats" && (

<div>

<h1 className="text-2xl mb-6">Thống kê</h1>

<div className="grid grid-cols-2 gap-6">

<div className="bg-gray-800 p-6 rounded">

<h2>Tổng học sinh</h2>

<p className="text-3xl">
{totalStudents}
</p>

</div>

<div className="bg-gray-800 p-6 rounded">

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

)

}
