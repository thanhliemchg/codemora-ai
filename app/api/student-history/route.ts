import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const student_id = searchParams.get("student_id")

if(!student_id){
return NextResponse.json([])
}

/* ======================
LẤY SUBMISSIONS
====================== */

const { data:subs } = await supabase
.from("submissions")
.select("*")
.eq("student_id",student_id)
.order("created_at",{ascending:false})

if(!subs){
return NextResponse.json([])
}

/* ======================
LẤY DANH SÁCH exercise_id
====================== */

const exerciseIds = subs
.filter(s=>s.exercise_id)
.map(s=>s.exercise_id)

/* ======================
LẤY ĐỀ BÀI GV
====================== */

let exercises:any[] = []

if(exerciseIds.length>0){

const { data } = await supabase
.from("generated_exercises")
.select("id,exercise")
.in("id",exerciseIds)

exercises = data || []

}

/* ======================
MAP KẾT QUẢ
====================== */

const result = subs.map(s=>{

const ex = exercises.find(e=>e.id===s.exercise_id)

return{

...s,

exercise:
ex?.exercise ||
s.exercise_text ||
null

}

})

return NextResponse.json(result)

}