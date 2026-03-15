import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req){

const { searchParams } = new URL(req.url)
const class_id = searchParams.get("class_id")

if(!class_id){
return NextResponse.json([])
}

/* =========================
Lấy bài nộp
========================= */

const { data:subs, error } = await supabase
.from("submissions")
.select("*")
.eq("class_id",class_id)
.order("created_at",{ascending:true})

if(error || !subs){
console.log(error)
return NextResponse.json([])
}


/* =========================
Lấy danh sách student_id
========================= */

const studentIds = subs.map(s=>s.student_id)


/* =========================
Lấy tên học sinh
========================= */

const { data:users } = await supabase
.from("users")
.select("id,name")
.in("id",studentIds)


/* =========================
Lấy danh sách exercise_id
========================= */

const exerciseIds = subs
.filter(s=>s.exercise_id)
.map(s=>s.exercise_id)


/* =========================
Lấy đề bài giáo viên giao
========================= */

let exercises = []

if(exerciseIds.length>0){

const { data } = await supabase
.from("generated_exercises")
.select("id,exercise")
.in("id",exerciseIds)

exercises = data || []

}


/* =========================
Map dữ liệu
========================= */

const result = subs.map(s=>{

const user = users?.find(u=>u.id===s.student_id)

const ex = exercises?.find(e=>e.id===s.exercise_id)

return {

...s,

student_name:user?.name || "HS",

/* đề bài */
exercise: ex?.exercise || s.exercise_text || null

}

})


return NextResponse.json(result)

}