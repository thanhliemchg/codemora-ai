import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request){

  const { searchParams } = new URL(req.url)

  const class_id = searchParams.get("class_id")
  const mode = searchParams.get("mode") // class | all

  let query = supabase.from("submissions").select("*")

  if(mode==="class"){
    query = query.eq("class_id", class_id)
  }

  const { data: subs } = await query

  // 1. lấy danh sách học sinh trong lớp
const { data: classStudents } = await supabase
  .from("class_students")
  .select("student_id")
  .eq("class_id", class_id)

const studentIds = classStudents?.map(s => s.student_id) || []

// 2. lấy thông tin user (chỉ HS)
const { data: users } = await supabase
  .from("users")
  .select("id,name,role")
  .in("id", studentIds)
  .eq("role","student")   

  const map:any = {}

  users?.forEach(u=>{
    map[u.id] = {
      name: u.name,
      total: 0,
      submitted: 0,
      scoreSum: 0,
      count: 0
    }
  })

  subs?.forEach(s=>{
    if(!map[s.student_id]) return

    map[s.student_id].total++

    if(s.status==="submitted"){
      map[s.student_id].submitted++
    }

    if(s.score !== null){
      map[s.student_id].scoreSum += s.score
      map[s.student_id].count++
    }
  })

  const students = Object.entries(map).map(([id,v]:any)=>{

    const avg = v.count ? v.scoreSum / v.count : 0

    let level = "Yếu"
    if(avg >= 8) level = "Giỏi"
    else if(avg >= 5) level = "Trung bình"

    return {
      id,
      name: v.name,
      total: v.total,
      submitted: v.submitted,
      avg: Number(avg.toFixed(1)),
      level
    }
  })

  // 🔥 theo bài
  const exerciseMap:any = {}

  subs?.forEach(s=>{
    if(!s.exercise_id) return

    if(!exerciseMap[s.exercise_id]){
      exerciseMap[s.exercise_id] = { total:0, submitted:0 }
    }

    exerciseMap[s.exercise_id].total++

    if(s.status==="submitted"){
      exerciseMap[s.exercise_id].submitted++
    }
  })

  const exercises = Object.entries(exerciseMap).map(([id,v]:any)=>({
    id,
    total: v.total,
    submitted: v.submitted,
    rate: Math.round((v.submitted / v.total) * 100)
  }))

  return NextResponse.json({
    total: subs.length,
    submitted: subs.filter(s=>s.status==="submitted").length,
    graded: subs.filter(s=>s.score !== null).length,
    students,
    exercises
  })
}