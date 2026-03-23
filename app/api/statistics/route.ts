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

  /* ================= SUBMISSIONS ================= */

  let query = supabase
    .from("submissions")
    .select("*")

  if(mode==="class"){
    query = query.eq("class_id", class_id)
  }

  const { data: subs } = await query

  /* ================= USERS (CHỈ HS) ================= */

  let usersQuery = supabase
    .from("users")
    .select("id,name,role")
    .eq("role","student")

  if(mode==="class"){
    const { data: classStudents } = await supabase
      .from("class_students")
      .select("student_id")
      .eq("class_id", class_id)

    const ids = classStudents?.map(s=>s.student_id) || []

    usersQuery = usersQuery.in("id", ids)
  }

  const { data: users } = await usersQuery

  /* ================= MAP HS ================= */

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

  /* ================= STUDENTS ================= */

  const students = Object.entries(map).map(([id,v]:any)=>{

    const avg = v.count ? v.scoreSum / v.count : null

    let level = "Chưa học"

    if(avg !== null){
      if(avg >= 8) level = "Giỏi"
      else if(avg >= 5) level = "Trung bình"
      else level = "Yếu"
    }

    return {
      id,
      name: v.name,
      total: v.total,
      submitted: v.submitted,
      avg: avg ? Number(avg.toFixed(1)) : null,
      level
    }
  })

  /* ================= EXERCISES ================= */

  const { data: exerciseList } = await supabase
    .from("generated_exercises")
    .select("id, exercise")

  const exerciseNameMap:any = {}

  exerciseList?.forEach(e=>{
    exerciseNameMap[e.id] = e.exercise
  })

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

  const exercises = Object.entries(exerciseMap).map(([id,v]:any)=>{

    const raw = exerciseNameMap[id] || ""

    const title = raw
      ?.replace(/[#*]/g,"")
      ?.split("\n")[0]
      ?.slice(0,60)

    return {
      id,
      title: title || "Bài tập",
      total: v.total,
      submitted: v.submitted,
      rate: v.total ? Math.round((v.submitted / v.total) * 100) : 0
    }
  })

  /* ================= RETURN ================= */

  return NextResponse.json({
    total: subs?.length || 0,
    submitted: subs?.filter(s=>s.status==="submitted").length || 0,
    graded: subs?.filter(s=>s.score !== null).length || 0,
    students,
    exercises
  })
}