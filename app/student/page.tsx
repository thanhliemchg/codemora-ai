"use client"

import { useState,useEffect } from "react"
import CodeEditor from "../components/CodeEditor"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ChangePassword from "../components/ChangePassword"

export default function Student(){

const [teacherExercise,setTeacherExercise] = useState("")
const [teacherExerciseId,setTeacherExerciseId] = useState<string | null>(null)

const [code,setCode] = useState("")
const [language,setLanguage] = useState("python")

const [result,setResult] = useState("")
const [exercise,setExercise] = useState("")

const [loadingAnalyze,setLoadingAnalyze] = useState(false)
const [loadingExercise,setLoadingExercise] = useState(false)

const [tab,setTab] = useState("dashboard")

const [user,setUser] = useState<any>(null)

const [submitType,setSubmitType] = useState("teacher")

const [submitting,setSubmitting] = useState(false)
const [submitted,setSubmitted] = useState(false)

const [history,setHistory] = useState<any[]>([])
const [selectedHistory,setSelectedHistory] = useState<any>(null)
const [showPassword,setShowPassword] = useState(false)


/* ======================
PHÂN TÍCH CODE
====================== */

async function analyze(){

/* ======================
KIỂM TRA CODE HỢP LỆ
====================== */

if(!code || code.trim()===""){
alert("Bạn chưa nhập code")
return
}

/* ======================
KEYWORD PYTHON
====================== */

const pythonKeywords = [
"print","for","while","if","elif","else",
"def","return","input","range","import",
"class","lambda"
]


/* ======================
KEYWORD C++
====================== */

const cppKeywords = [
"#include",
"iostream",
"bits/stdc++.h",
"using namespace",
"std::",
"cout",
"cin",
"int main",
"return"
]

const hasPython = pythonKeywords.some(k => code.includes(k))
const hasCpp = cppKeywords.some(k => code.includes(k))

if(!hasPython && !hasCpp){
alert("Bạn hãy nhập đúng code của Python hoặc C++ để AI phân tích.")
return
}

/* ======================
PHÂN TÍCH
====================== */

setLoadingAnalyze(true)

const res = await fetch("/api/analyze",{
method:"POST",
headers:{ "Content-Type":"application/json"},
body:JSON.stringify({
code,
language,
student_id:user?.id,
class_id:user?.class_id
})
})

const data = await res.json()

setResult(data.result)

setLoadingAnalyze(false)

loadHistory()

}


/* ======================
SINH BÀI TẬP
====================== */

async function generateExercise(){

if(!code && !teacherExercise){

alert("Lỗi sinh bài tập! Bạn cần nhập code hoặc có bài giáo viên giao")

return

}

setLoadingExercise(true)

const res = await fetch("/api/generate-similar-exercise",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
code,
teacherExercise,
student_id:user.id,
class_id:user.class_id
})

})

const data = await res.json()

setLoadingExercise(false)

if(data.error){

alert(data.error)

return

}

setExercise(data.exercise)

}



/* ======================
LOAD HISTORY
====================== */

async function loadHistory(){

const u = localStorage.getItem("user")
if(!u) return

const user = JSON.parse(u)

const res = await fetch(`/api/student-history?student_id=${user.id}`)

const data = await res.json()

setHistory(data)

}



/* ======================
LOAD BAI TAP GV GIAO
====================== */

async function loadTeacherExercise(){

const u = localStorage.getItem("user")
if(!u) return

const user = JSON.parse(u)

const res = await fetch(`/api/get-teacher-exercise?student_id=${user.id}`)
const data = await res.json()

const ex =
data.exercise ||
data.generated_exercises?.exercise

const id =
data.generated_exercises?.id ||
data.exercise_id ||
data.id

if(ex){

setTeacherExercise(ex)
setTeacherExerciseId(id)
setSubmitType("teacher")

}

}



/* ======================
UPLOAD FILE CODE
====================== */

function handleFile(e:any){

const file = e.target.files[0]

if(!file) return

const reader = new FileReader()

reader.onload = (event)=>{

setCode(event.target?.result as string)

}

reader.readAsText(file)

}



/* ======================
NOP BAI
====================== */

async function submitCode(){

if(!code || code.trim()===""){
alert("Bạn chưa nhập code")
return
}

if(submitType==="teacher" && !teacherExerciseId){
alert("Không có bài giáo viên giao")
return
}

if(submitType==="practice" && (!exercise || exercise.trim()==="")){
alert("Bạn chưa sinh bài tập")
return
}

setSubmitting(true)

const res = await fetch("/api/submit-code",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
student_id:user.id,
class_id:user.class_id,
exercise_id: teacherExerciseId || null,
code: code,
language: language,
type: teacherExerciseId ? "teacher" : "practice",
exercise_text: teacherExerciseId ? null : exercise
})
})

const data = await res.json()

setSubmitting(false)

if(data.error){
alert(data.error)
return
}

if(data.message==="Nộp bài thành công"){

setSubmitted(true)

await fetch("/api/history",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
student_id:user.id,
class_id:user.class_id,
exercise: submitType==="teacher" ? teacherExercise : exercise,
code:code,
language:language,
type:submitType
})
})

if(submitType==="teacher"){

setTeacherExercise("")
setTeacherExerciseId(null)

alert("Đã nộp bài giáo viên giao")

}else{

setExercise("")
alert("Đã nộp bài tự sinh")

}

loadHistory()

}

}



/* ======================
LOGOUT
====================== */

function logout(){

localStorage.removeItem("user")

window.location.href="/login"

}



/* ======================
USE EFFECT
====================== */

useEffect(()=>{

const u = localStorage.getItem("user")

if(!u){
window.location.href="/login"
return
}

const user = JSON.parse(u)

if(user.role !== "student"){
window.location.href="/teacher"
return
}

setUser(user)

loadTeacherExercise()
loadHistory()

},[])



/* ======================
UI
====================== */

return(

<div className="flex min-h-screen bg-gray-100">

{/* SIDEBAR */}

<div className="w-[250px] bg-gradient-to-b from-indigo-500 to-purple-600 text-white p-6 flex flex-col shadow-x1">

<h2 className="text-2xl font-bold mb-10">
CodeMora AI
</h2>

<ul className="space-y-2">

<li
onClick={()=>setTab("dashboard")}
className={`p-3 rounded-lg cursor-pointer transition whitespace-nowrap ${
tab==="dashboard"
? "bg-white/20 text-white font-semibold"
: "hover:bg-white/20"
}`}
>
🏠 Trang chủ
</li>

<li
onClick={()=>setTab("history")}
className={`p-3 rounded-lg cursor-pointer transition whitespace-nowrap ${
tab==="history"
? "bg-white/20 text-white font-semibold"
: "hover:bg-white/20"
}`}
>
📄 Lịch sử
</li>

<li
onClick={()=>setTab("exercise")}
className={`p-3 rounded-lg cursor-pointer transition whitespace-nowrap ${
tab==="exercise"
? "bg-white/20 text-white font-semibold"
: "hover:bg-white/20"
}`}
>
💬 Bài tập AI
</li>

</ul>

<div className="mt-auto pt-10 text-sm opacity-80">
Hệ thống chấm bài AI
</div>

</div>



{/* MAIN */}

<div className="min-h-screen bg-gray-100 text-gray-800 w-full max-w-7x1 ">

<div className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-x1">

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


{/* ================= DASHBOARD ================= */}

{tab==="dashboard" && (

<div className="grid grid-cols-2 gap-6">

<div className="bg-white p-6 rounded-xl shadow">

<label className="bg-red-600 text-white px-4 py-2 rounded ml-3">
Ngôn ngữ:
</label>

<select
className="border p-2 mb-4 text-black"
value={language}
onChange={(e)=>setLanguage(e.target.value)}
>

<option value="python">Python</option>
<option value="cpp">C++</option>

</select>

<label className="bg-blue-600 text-white px-4 py-2 rounded ml-3">
Loại bài nộp:
</label>

<select
className="border p-2 mb-4 text-black"
value={submitType}
onChange={(e)=>{
setSubmitType(e.target.value)
setSubmitted(false)
}}
>
<option value="teacher">Bài giáo viên giao</option>
<option value="practice">Bài tự sinh</option>
</select>

<input type="file" accept=".py,.cpp,.txt" onChange={handleFile} className="mb-4 text-black"/>

<CodeEditor code={code} setCode={setCode} language={language}/>

<div className="flex gap-3 mt-4">

<button onClick={analyze} className="bg-indigo-600 text-white px-4 py-2 rounded">
{loadingAnalyze ? "Đang phân tích..." : "Phân tích AI"}
</button>

<button onClick={generateExercise} className="bg-purple-600 text-white px-4 py-2 rounded">
{loadingExercise ? "Đang sinh..." : "Sinh bài tập"}
</button>

<button disabled={submitted || submitting}
className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
onClick={submitCode}
>
{submitting ? "Đang nộp..." : submitted ? "Đã nộp" : "Nộp bài"}
</button>

</div>

</div>



<div className="space-y-6 text-black">

<div className="bg-white p-6 rounded-xl shadow">

<div className="bg-yellow-100 border border-yellow-400 p-3 rounded mb-3">

<div className="font-semibold text-black mb-1">
📌 Bài giáo viên giao
</div>

{teacherExercise ? (

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{teacherExercise}
</ReactMarkdown>

) : "Chưa có bài giáo viên giao"}

</div>

</div>

<div className="bg-white p-6 rounded-xl shadow">

<h2 className="font-bold mb-3 text-black">
Bài tập tự sinh
</h2>

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{exercise}
</ReactMarkdown>

</div>

<div className="bg-white p-6 rounded-xl shadow">

<h2 className="font-bold mb-3 text-black">
AI Feedback
</h2>

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{result}
</ReactMarkdown>

</div>

</div>

</div>

)}



{/* ================= HISTORY ================= */}

{tab==="history" && (

<div className="mt-8 bg-white rounded shadow p-4 text-black">

<h2 className="font-bold text-lg mb-4">
📄 Lịch sử làm bài
</h2>

<div className=" flex gap-6 mb-4">

<div className="bg-blue-100 px-3 py-2 rounded">
Tổng bài: {history.length}
</div>

<div className="bg-green-100 px-3 py-2 rounded">
Đã chấm: {history.filter(h=>h.status==="graded").length}
</div>

<div className="bg-yellow-100 px-3 py-2 rounded">
Chờ chấm: {history.filter(h=>h.status!=="graded").length}
</div>

</div>

<table className="w-full border text-sm text-black">

<thead className="bg-gray-100">
<tr className="border-t hover:bg-gray-50">
<th className="border p-2">#</th>
<th className="border p-2">Loại</th>
<th className="border p-2">AI</th>
<th className="border p-2">GV</th>
<th className="border p-2">Trạng thái</th>
<th className="border p-2">Thời gian</th>
</tr>
</thead>

<tbody>

{history.map((h:any,i)=>(
<tr key={h.id}
className={`cursor-pointer hover:bg-blue-50 ${selectedHistory?.id===h.id?"bg-blue-100":""}`}
onClick={()=>setSelectedHistory(h)}
>

<td className="border p-2 text-center">{i+1}</td>

<td className="border p-2 text-center">
{h.type==="teacher"?"GV giao":"Tự sinh"}
</td>

<td className="border p-2 text-center">
{h.ai_score ?? "-"}
</td>

<td className="border p-2 text-center text-green-600 font-bold">
{h.teacher_score ?? "-"}
</td>

<td className="border p-2 text-center">
{h.status==="graded"?"Đã chấm":"Đã nộp"}
</td>

<td className="border p-2 text-center">
{new Date(h.created_at).toLocaleString()}
</td>

</tr>
))}

</tbody>

</table>


{selectedHistory && (

<div className="mt-6 bg-white rounded-xl shadow-lg border p-6 space-y-6 text-black">

<h3 className="text-xl font-bold flex items-center gap-2">
📄 Chi tiết bài làm
</h3>


{/* ===== ĐỀ BÀI ===== */}

<div>

<div className="font-semibold mb-2 text-gray-700">
Đề bài
</div>

<div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{selectedHistory.exercise || "Không có đề bài"}
</ReactMarkdown>

</div>

</div>



{/* ===== CODE ===== */}

<div>

<div className="font-semibold mb-2 text-gray-700">
Code học sinh
</div>

<pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[350px] text-sm font-mono border">
{selectedHistory.code}
</pre>

</div>



{/* ===== THÔNG TIN ===== */}

<div className="grid grid-cols-3 gap-4">

<div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">

<div className="text-sm text-gray-600">
Loại bài
</div>

<div className="font-semibold">
{selectedHistory.type==="teacher"?"GV giao":"Tự sinh"}
</div>

</div>


<div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center">

<div className="text-sm text-gray-600">
Thời gian nộp
</div>

<div className="font-semibold">
{new Date(selectedHistory.created_at).toLocaleString()}
</div>

</div>


<div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">

<div className="text-sm text-gray-600">
Trạng thái
</div>

<div className="font-semibold">
{selectedHistory.status}
</div>

</div>

</div>



{/* ===== ĐIỂM ===== */}

<div className="grid grid-cols-2 gap-4">

<div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg text-center">

<div className="text-sm text-gray-600">
Điểm AI
</div>

<div className="text-3xl font-bold text-indigo-700">
{selectedHistory.ai_score ?? "-"}
</div>

</div>


<div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">

<div className="text-sm text-gray-600">
Điểm giáo viên
</div>

<div className="text-3xl font-bold text-green-700">
{selectedHistory.teacher_score ?? "-"}
</div>

</div>

</div>



{/* ===== AI FEEDBACK ===== */}

<div>

<div className="font-semibold mb-2 text-gray-700">
🤖 AI nhận xét
</div>

<div className="bg-gray-50 border p-4 rounded-lg">

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{selectedHistory.ai_feedback || "Chưa có"}
</ReactMarkdown>

</div>

</div>



{/* ===== GV FEEDBACK ===== */}

<div>

<div className="font-semibold mb-2 text-gray-700">
👨‍🏫 Giáo viên nhận xét
</div>

<div className="bg-gray-50 border p-4 rounded-lg">

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{selectedHistory.teacher_feedback || "Chưa có"}
</ReactMarkdown>

</div>

</div>

</div>

)}


</div>

)}



{/* ================= EXERCISE ================= */}

{tab==="exercise" && (

<div className="bg-white p-6 rounded-xl shadow text-black">

<h2 className="font-bold mb-3">
Bài tập tự sinh bằng AI
</h2>

<ReactMarkdown remarkPlugins={[remarkGfm]}>
{exercise}
</ReactMarkdown>

</div>

)}

</div>

</div>

)

}
