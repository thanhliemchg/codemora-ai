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
return NextResponse.json({})
}

/* LẤY CLASS HS */

const { data:user } = await supabase
.from("users")
.select("class_id")
.eq("id",student_id)
.maybeSingle()

if(!user){
return NextResponse.json({})
}

const class_id = user.class_id


/* LẤY BÀI GV GIAO MỚI NHẤT */

const { data:exercise } = await supabase
.from("generated_exercises")
.select("*")
.eq("class_id",class_id)
.order("created_at",{ascending:false})
.limit(1)
.maybeSingle()

if(!exercise){
return NextResponse.json({})
}


/* KIỂM TRA HS ĐÃ NỘP CHƯA */

const { data:submission } = await supabase
.from("submissions")
.select("id")
.eq("student_id",student_id)
.eq("exercise_id",exercise.id)
.eq("type","teacher")
.maybeSingle()


if(submission){
return NextResponse.json({})
}

return NextResponse.json(exercise)

}