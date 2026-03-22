import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request){

  const { searchParams } = new URL(req.url)
  const student_id = searchParams.get("student_id")

  if(!student_id){
    return NextResponse.json([])
  }

  // 🔥 lấy submissions của học sinh
  const { data: subs, error } = await supabase
    .from("submissions")
    .select("exercise_id, status")
    .eq("student_id", student_id)
    .eq("type","teacher")

  if(error){
    return NextResponse.json({ error:error.message })
  }

  if(!subs || subs.length === 0){
    return NextResponse.json([])
  }

  // 🔥 lấy id bài
  const ids = subs.map(s => s.exercise_id)

  // 🔥 lấy bài tương ứng
  const { data: exercises, error: exError } = await supabase
    .from("generated_exercises")
    .select("*")
    .in("id", ids)

  if(exError){
    return NextResponse.json({ error:exError.message })
  }

  // 🔥 merge + chống lặp
  const map = new Map()

  exercises?.forEach((ex:any)=>{
    const sub = subs.find(s => s.exercise_id === ex.id)

    if(!map.has(ex.id)){
      map.set(ex.id,{
        ...ex,
        status: sub?.status || "pending",
        submitted: ["submitted","graded"].includes(sub?.status)
      })
    }
  })

  let result = Array.from(map.values())

  // 🔥 sort: mới nhất lên trên
  result.sort((a:any,b:any)=>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // 🔥 đánh số (số lớn = mới)
  result.forEach((item:any,i:number)=>{
    item.order = result.length - i
  })

  // 🔥 mark bài mới
  if(result.length > 0){
    result[0].is_new = true
  }

  return NextResponse.json(result)
}