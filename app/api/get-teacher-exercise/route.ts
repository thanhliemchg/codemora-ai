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

/* LẤY CLASS */

const { data:user } = await supabase
.from("users")
.select("class_id")
.eq("id",student_id)
.maybeSingle()

if(!user){
return NextResponse.json([])
}

const class_id = user.class_id


/* 🔥 LẤY TẤT CẢ BÀI GV GIAO */

const { data:exercises } = await supabase
.from("generated_exercises")
.select("*")
.eq("class_id",class_id)
.order("created_at",{ascending:false})

if(!exercises){
return NextResponse.json([])
}


/* 🔥 LẤY DANH SÁCH ĐÃ NỘP */

const { data:submitted } = await supabase
.from("submissions")
.select("exercise_id")
.eq("student_id",student_id)
.eq("type","teacher")
.in("status",["submitted", "graded"])

const submittedIds = submitted?.map(s=>s.exercise_id) || []


/* 🔥 GẮN TRẠNG THÁI */

const result = exercises.map(ex => ({
...ex,
submitted: submittedIds.includes(ex.id)
}))


return NextResponse.json(result)

}