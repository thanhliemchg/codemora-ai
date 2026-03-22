import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request){

  const form = await req.formData()

  const exercise = form.get("exercise")
  const class_id = form.get("class_id")
  const teacher_id = form.get("teacher_id")

  // gửi toàn bộ lớp hay không
  const send_all = form.get("send_all") === "1"

  // danh sách học sinh FE gửi
  let student_ids:any[] = []
  try{
    const raw = form.get("student_ids") as string
    if(raw){
      student_ids = JSON.parse(raw)
    }
  }catch{
    student_ids = []
  }
console.log("===== DEBUG CREATE EXERCISE =====")
console.log("send_all:", send_all)
console.log("student_ids:", student_ids)
  // test cases
  let tests:any[] = []
  try{
    const raw = form.get("tests") as string
    if(raw){
      tests = JSON.parse(raw)
    }
  }catch{
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

  // 2️⃣ xác định học sinh

  let students:any[] = []

if(send_all){

  const {data,error} = await supabase
    .from("users")
    .select("id")
    .eq("class_id", class_id)
    .eq("role","student")
    .eq("status","active")

  if(error){
    return NextResponse.json({ error:error.message })
  }

  students = data || []

}else{

  if(student_ids.length === 0){
    return NextResponse.json({ error:"Chưa chọn học sinh" })
  }

  // 🔥 BẮT BUỘC QUERY LẠI DB
  const {data,error} = await supabase
    .from("users")
    .select("id")
    .in("id", student_ids)
    .eq("class_id", class_id)

  if(error){
    return NextResponse.json({ error:error.message })
  }

  students = data || []
}

  // 3️⃣ tạo submissions
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