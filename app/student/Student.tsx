"use client"

import { useState,useEffect} from "react"
import CodeEditor from "../components/CodeEditor"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { setTooltipSettingsState } from "recharts/types/state/tooltipSlice"
import { s, sub } from "framer-motion/client"
import { useSearchParams, useRouter } from "next/navigation"
import Header from "../components/header"
export default function Student(){

const [teacherExercise,setTeacherExercise] = useState("")
const [teacherExerciseId,setTeacherExerciseId] = useState<string | null>(null)
const [teacherExercises,setTeacherExercises] = useState<any[]>([])
const [selectedExercise,setselectedExercise] = useState<any>(null)



const [submissionId, setSubmissionId] = useState<string | null>(null)

const [code,setCode] = useState("")
const [language,setLanguage] = useState("python")

const [result,setResult] = useState("")
const [exercise,setExercise] = useState("")

const [loadingAnalyze,setLoadingAnalyze] = useState(false)
const [loadingExercise,setLoadingExercise] = useState(false)

const searchParams = useSearchParams()
const router = useRouter()
const tab = searchParams.get("tab") || "dashboard"


const [user,setUser] = useState<any>(null)
const [tests, setTests] = useState<any[]>([])

const [submitType,setSubmitType] = useState("teacher")

const [submitting,setSubmitting] = useState(false)
const [submitted,setSubmitted] = useState(false)

const [history,setHistory] = useState<any[]>([])
const [selectedHistory,setSelectedHistory] = useState<any>(null)
const [showPassword,setShowPassword] = useState(false)

const [testResult, setTestResult] = useState([])
const total = testResult.length

const passed = testResult.filter(t => t.passed).length

const percent = total > 0 
  ? Math.round((passed / total) * 100)
  : 0
const current = Array.isArray(teacherExercises)
  ? teacherExercises.find(e => e.id === teacherExerciseId)
  : null
const currentTeacherExercise = teacherExercises.find(
  e => e.id === teacherExerciseId
)

const isSubmittedCurrent = currentTeacherExercise?.submitted === true


const changeTab = (t:string)=>{
  router.push(`/student?tab=${t}`)
}
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

/* ======================
BẮT BUỘC CHỌN BÀI GV
====================== */
if(!teacherExerciseId){

  alert("❌ Hãy chọn bài bên phải")

  // 🔥 scroll tới danh sách bài
  document.getElementById("teacher-list")?.scrollIntoView({
    behavior:"smooth"
  })

  return
}


/* ======================
PHẢI CÓ CODE HOẶC BÀI GV
====================== */

if(!code && !teacherExercise){
  alert("Bạn cần nhập code hoặc chọn bài giáo viên giao")
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
    exercise_id: teacherExerciseId,
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
setTests(data.test_cases || data.tests || [])
setSubmissionId(data.submission_id)
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
if (Array.isArray(data)) {
  setTeacherExercises(data)
} else {
  setTeacherExercises([])
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
LOAD BÀI TẬP TỰ SINH
====================== */
async function loadPractice(){

  if(!user?.id) return

  const res = await fetch(
    `/api/get-current-practice?student_id=${user.id}`
  )

  const data = await res.json()

  console.log("LOAD PRACTICE:", data)

  if(data.submission&& data.submission.id){
    setExercise(data.submission.exercise_text || "")
    setTests(data.submission.test_cases || [])
    setSubmissionId(data.submission.id)
  }else{
    setExercise("")
    setTests([])
    setSubmissionId(null)
  }
}
/* ======================
NOP BAI
====================== */

async function submitCode(){

  if (submitting) return
  if(!code || code.trim()===""){
    alert("Bạn chưa nhập code")
    return
  }

  if(submitType==="teacher" && !teacherExerciseId){
    alert("Bạn phải chọn bài giáo viên giao ở bên phải")
    return
  }

  if(submitType==="practice" && (!exercise || exercise.trim()==="")){
    alert("Bạn chưa sinh bài tập")
    return
  }
  if(submitType==="practice" && !submissionId){
  alert("❌ Không tìm thấy bài tự sinh (submission_id)")
  return
  }
  setSubmitting(true)

  console.log("Submit:",{
    student_id:user.id,
    exercise_id: teacherExerciseId,
    type: submitType,
    submissionId
  })

  try{

    const res = await fetch("/api/submit-code",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        student_id:user.id,
        submission_id: submitType === "practice" ? submissionId : null,
        class_id:user.class_id,
        exercise_id: submitType==="teacher" ? teacherExerciseId : null,
        code,
        language,
        type: submitType==="teacher" ? "teacher" : "practice",
        exercise_text: submitType==="teacher" ? null : exercise
      })
    })

    const data = await res.json()
    setTestResult(data.detail || [])

    console.log("SUBMIT RESULT:", data)

    setSubmitting(false)

    if(!res.ok ||data.error){
      alert("❌ " + data.error || "Server lỗi")
      return
    }

    setSubmitted(true)

    if(submitType==="teacher"){

      setTeacherExercises(prev =>
        prev.map(ex =>
          ex.id === teacherExerciseId
            ? { ...ex, submitted: true }
            : ex
        )
      )
      alert(`✅ Nộp bài OK\nĐiểm: ${data.ai_score}`)

    }else{

      setExercise("")
      alert(`✅ Nộp bài tự sinh OK\nĐiểm: ${data.ai_score}`)
    }

    await loadTeacherExercise()
    loadHistory()

  }catch(err){

    console.log(err)
    setSubmitting(false)
    alert("❌ Lỗi kết nối server")

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

  const parsed = JSON.parse(u)

  if(parsed.role !== "student"){
    window.location.href="/teacher"
    return
  }

  setUser(parsed)

},[])


useEffect(()=>{
  if(!user?.id) return

  loadTeacherExercise()
  loadHistory()
  loadPractice()

},[user?.id]) 

/* ======================
UI
====================== */

return(


<div className="flex min-h-screen bg-gray-100">
{/* SIDEBAR */}

<div className="hidden lg:block w-[240px] bg-gradient-to-b from-indigo-500 to-purple-600 text-white p-6 flex flex-col shadow-x1">

<div className="flex items-center gap-3 px-2">
  <img 
    src="/logo.png" 
    alt="logo" 
    className="w-5 h-5 rounded-xl shadow-md"
  />
  <span className="font-bold py-3 text-white">
    CodeMora AI
  </span>
</div>

<ul className="space-y-2">

<li
onClick={()=>changeTab("dashboard")}
className={`p-3 rounded-lg cursor-pointer transition whitespace-nowrap ${
tab==="dashboard"
? "bg-white/20 text-white font-semibold"
: "hover:bg-white/20"
}`}
>
🏠 Trang chủ
</li>

<li
onClick={()=>changeTab("history")}
className={`p-3 rounded-lg cursor-pointer transition whitespace-nowrap ${
tab==="history"
? "bg-white/20 text-white font-semibold"
: "hover:bg-white/20"
}`}
>
📄 Lịch sử
</li>
</ul>



</div>



{/* MAIN */}


<div className="min-h-screen bg-gray-100 text-gray-800 w-full pb-24">
  <Header user={user} />

{/* ================= DASHBOARD ================= */}



{tab==="dashboard" && (

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3">
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
  const type = e.target.value

  setSubmitType(type)


  setSubmitted(false)

  if(type==="practice"){
    setTeacherExerciseId(null)  
    setTeacherExercise("")    
  }
}}
>
<option value="teacher">Bài giáo viên giao</option>
<option value="practice">Bài tự sinh</option>
</select>

<input type="file" accept=".py,.cpp,.txt" onChange={handleFile} className="mb-4 text-black"/>

<div className="w-full overflow-hidden rounded-xl border">
  <CodeEditor code={code} setCode={setCode} language={language}/>
</div>

<div className="flex gap-3 mt-4">

<button onClick={analyze} className={`
px-4 py-2 rounded text-white font-semibold transition
${loadingAnalyze 
  ? "bg-gray-400 cursor-not-allowed"
  : "bg-yellow-600 hover:bg-green-700"}
`}
>
{loadingAnalyze ? "Đang phân tích..." : "Phân tích AI"}
</button>

<button
  type="button"
  onClick={generateExercise}
  className={`
px-4 py-2 rounded text-white font-semibold transition
${loadingExercise 
  ? "bg-gray-400 cursor-not-allowed"
  : "bg-blue-600 hover:bg-blue-700"}
`}
>
{loadingExercise ? "⏳ Đang sinh..." : "💬 Sinh bài tập"}
</button>


<button
onClick={submitCode}
disabled={submitting || (submitType==="teacher" && isSubmittedCurrent)}
className={`
px-4 py-2 rounded text-white font-semibold transition
${submitting || (submitType==="teacher" && isSubmittedCurrent)
  ? "bg-gray-400 cursor-not-allowed"
  : "bg-green-600 hover:bg-green-700"}
`}
>
{submitting 
  ? "⏳ Đang nộp..." 
  : (submitType==="teacher" && isSubmittedCurrent)
    ? "✅ Đã nộp"
    : "📤 Nộp bài"}
</button>

</div>

</div>
{/* ===== CỘT PHẢI (DÁN ĐOẠN CỦA BẠN VÀO ĐÂY) ===== */}
<div className="space-y-6 text-black">

  {/* ===== BÀI GV ===== */}
  <div className="bg-white p-6 rounded-xl shadow">

    <div id="teacher-list" className="bg-yellow-100 border border-yellow-300 p-4 rounded-xl">

      <h2 className="font-bold text-lg mb-3">
        📌 Bài giáo viên giao
      </h2>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">

        {teacherExercises.map((ex:any)=>{

          const shortTitle = ex.exercise
            ?.replace(/[#*]/g,"")
            ?.split("\n")[0]
            ?.slice(0,60)

          return(

            <div
              key={ex.id}
              onClick={()=>{
                setTeacherExercise(ex.exercise)
                setTeacherExerciseId(ex.id)
                setSubmitType("teacher")
                setSubmitted(false)
              }}
              className={`
                p-4 rounded-xl border cursor-pointer transition active:scale-[0.98]
                ${teacherExerciseId===ex.id
                  ? "bg-blue-50 border-blue-400"
                  : "bg-white"}
                `}
            >

              <div className="flex justify-between items-center mb-1">

                <div className="font-semibold">
                  📘 Bài {ex.order}
                  {ex.is_new && (
                    <span className="ml-2 text-xs bg-yellow-300 px-2 py-1 rounded">
                     🔥Mới
                    </span>
                  )}
                </div>

                <div className={`text-xs px-2 py-1 rounded ${
                  ex.submitted
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}>
                  {ex.submitted ? "📤 Đã nộp" : "⏳Chưa làm"}
                </div>

              </div>

              <div className="text-sm text-gray-600 line-clamp-2">
                {shortTitle || "Bài tập lập trình"}
              </div>

            </div>

          )
        })}

      </div>

      {/* PREVIEW */}
      <div className="mt-4 bg-white p-4 rounded-xl border">

        <div className="font-semibold mb-2">
          📘 Nội dung bài
        </div>

        {teacherExercise ? (
         <div className="prose prose-sm max-w-none break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {teacherExercise}
          </ReactMarkdown>
        </div>
        ) : (
          <div className="text-gray-400 text-sm">
            Chọn bài để xem nội dung
          </div>
        )}

      </div>

    </div>

  </div>

  {/* ===== BÀI TỰ SINH ===== */}
  <div className="bg-white p-6 rounded-xl shadow">

    <h2 className="font-bold mb-3 text-black">
      Bài tập tự sinh
    </h2>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {exercise}
    </ReactMarkdown>

  </div>

  {/* ===== AI FEEDBACK ===== */}
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
  ✅ Đã chấm: {history.filter(h => h.status === "graded").length}
</div>

<div className="bg-yellow-100 px-3 py-2 rounded">
  📤 Đã nộp (chờ chấm): {history.filter(h => h.status === "submitted").length}
</div>

<div className="bg-red-100 px-3 py-2 rounded">
  ⏳ Chưa làm: {history.filter(h => h.status === "pending").length}
</div>

</div>
{/* DESKTOP VIEW */}
<table className="hidden lg:table w-full border text-sm text-black">

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
{h.exercise_id!=null ? "📘 GV giao":"🧠Tự sinh"}
</td>

<td className="border p-2 text-center">
{h.ai_score ?? "-"}
</td>

<td className="border p-2 text-center text-green-600 font-bold">
{h.teacher_score ?? "-"}
</td>

<td className="border p-2 text-center">
  {{
    pending: "⏳ Chưa làm",
    submitted: "📤 Đã nộp",
    graded: "✅ Đã chấm"
  }[h.status || "pending"]}
</td>

<td className="border p-2 text-center">
{new Date(h.created_at).toLocaleString()}
</td>

</tr>
))}

</tbody>

</table>
{/* MOBILE VIEW */}
<div className="lg:hidden space-y-3 mt-4">

{history.map((h:any,i)=>(
  <div
    key={h.id}
    onClick={()=>setSelectedHistory(h)}
    className="bg-white p-4 rounded-xl shadow border active:scale-[0.98]"
  >

    <div className="flex justify-between items-center">
      <div className="font-semibold text-sm">
        #{i+1} {h.exercise_id ? "📘 GV" : "🧠 AI"}
      </div>

      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
        {h.status}
      </div>
    </div>

    <div className="mt-2 text-sm text-gray-600">
      AI: <b>{h.ai_score ?? "-"}</b> | GV: <b>{h.teacher_score ?? "-"}</b>
    </div>

  </div>
))}

</div>
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

<pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[300px] text-xs sm:text-sm">
{selectedHistory.code}
</pre>

</div>



{/* ===== THÔNG TIN ===== */}

<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">

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

{(() => {
  let parsed: any = null

  try {
    parsed = JSON.parse(selectedHistory?.ai_feedback || "{}")
  } catch {}

  const feedback = parsed?.feedback || selectedHistory?.ai_feedback || ""
  const tests = parsed?.detail || []

  const total = tests.length
  const passed = tests.filter((t:any) => t.passed).length
  const percent = total ? Math.round((passed / total) * 100) : 0

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-3">

      {/* 🔥 AI FEEDBACK (MARKDOWN) */}
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

<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50 shadow-lg">

  <button 
    onClick={()=>changeTab("dashboard")}
    className={`flex flex-col items-center text-xs ${
      tab==="dashboard" ? "text-blue-600" : "text-gray-500"
    }`}
  >
    🏠
    <span>Home</span>
  </button>

  <button 
    onClick={()=>changeTab("history")}
    className={`flex flex-col items-center text-xs ${
      tab==="history" ? "text-blue-600" : "text-gray-500"
    }`}
  >
    📄
    <span>Lịch sử</span>
  </button>

</div>
</div>


)}
