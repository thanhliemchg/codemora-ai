import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { source } from "framer-motion/client"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

const form = await req.formData()

const exercise = form.get("exercise")
const class_id = form.get("class_id")
const teacher_id = form.get("teacher_id")

let tests:any[] = []

try{
  const raw = form.get("tests") as string

  if(raw){
    tests = JSON.parse(raw)
  }
}catch(e){
  tests = []
}

if(!exercise || !class_id || !teacher_id){
return NextResponse.json({
error:"Thiếu dữ liệu"
})
}

// 1️⃣ tạo bài tập

const {data:ex,error:exError} = await supabase
.from("generated_exercises")
.insert({
exercise,
class_id,
teacher_id,
source:"teacher",
test_cases:tests
})
.select()
.single()

if(exError){
return NextResponse.json({
error:exError.message
})
}

// 2️⃣ lấy danh sách học sinh

const {data:students,error:studentError} = await supabase
.from("users")
.select("id")
.eq("class_id",class_id)
.eq("role","student")
.eq("status","active")

if(studentError){
return NextResponse.json({
error:studentError.message
})
}

if(!students || students.length === 0){
return NextResponse.json({
error:"Lớp chưa có học sinh"
})
}

// 3️⃣ tạo trạng thái bài tập cho từng học sinh

const rows = students.map((s:any)=>({

student_id:s.id,
class_id:class_id,
exercise_id:ex.id,
type:"teacher",
status:"pending"

}))

const {error:subError} = await supabase
.from("submissions")
.insert(rows)

if(subError){
return NextResponse.json({
error:subError.message
})
}

return NextResponse.json({
success:true,
exercise_id:ex.id,
students:students.length
})

}