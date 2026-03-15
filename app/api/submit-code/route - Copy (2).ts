import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request){

const body = await req.json()

const {
student_id,
exercise_id,
code,
language,
type,
exercise_text
} = body

if(!student_id || !code){
return NextResponse.json({error:"Thiếu dữ liệu"})
}

// lấy class_id từ bảng users
const { data:userData } = await supabase
.from("users")
.select("class_id")
.eq("id",student_id)
.single()

const class_id = userData?.class_id

// tránh lỗi uuid undefined
const realExerciseId =
exercise_id && exercise_id !== "undefined"
? exercise_id
: null


// ===============================
// BÀI GIÁO VIÊN GIAO
// ===============================

if(type==="teacher"){

if(!realExerciseId){
return NextResponse.json({
error:"Không xác định được bài giáo viên giao"
})
}

// kiểm tra đã nộp chưa
const { data:exist } = await supabase
.from("submissions")
.select("id")
.eq("student_id",student_id)
.eq("exercise_id",realExerciseId)
.limit(1)

if(exist && exist.length>0){
return NextResponse.json({
message:"Bạn đã nộp bài này rồi"
})
}

// update bài nộp
const { error } = await supabase
.from("submissions")
.update({
code,
language,
status:"submitted"
})
.eq("student_id",student_id)
.eq("exercise_id",realExerciseId)

if(error){
return NextResponse.json({error:error.message})
}

return NextResponse.json({
message:"Nộp bài thành công"
})

}


// ===============================
// BÀI TỰ SINH
// ===============================

const { error } = await supabase
.from("submissions")
.insert({
student_id,
class_id,
exercise_id:null,
code,
language,
type,
exercise_text:exercise_text || null,
status:"submitted"
})

if(error){
return NextResponse.json({error:error.message})
}

return NextResponse.json({
message:"Nộp bài thành công"
})

}