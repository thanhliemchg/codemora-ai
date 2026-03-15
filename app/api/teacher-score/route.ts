import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

const body = await req.json()

const { submission_id, teacher_score, teacher_feedback } = body

if(!submission_id){
return NextResponse.json({error:"Thiếu submission_id"})
}

const { data:submission } = await supabase
.from("submissions")
.select("status")
.eq("id",submission_id)
.single()

if(submission.status!=="submitted"){
return NextResponse.json({
error:"Bài chưa nộp, không thể chấm điểm"
})
}

const { error } = await supabase
.from("submissions")
.update({
teacher_score,
teacher_feedback,
status:"graded"
})
.eq("id",submission_id)

if(error){
return NextResponse.json({error:error.message})
}

return NextResponse.json({success:true})

}