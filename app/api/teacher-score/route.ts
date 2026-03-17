import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request){

  const { submission_id, teacher_score, teacher_feedback } = await req.json()

  // ❌ bắt buộc nhập điểm
  if(teacher_score === "" || teacher_score === null){
    return NextResponse.json({
      success:false,
      error:"Chưa nhập điểm"
    })
  }

  const score = Number(teacher_score)

  if(isNaN(score) || score < 0 || score > 10){
    return NextResponse.json({
      success:false,
      error:"Điểm không hợp lệ"
    })
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      teacher_score: score,
      teacher_feedback: teacher_feedback || "",
      status: "graded"
    })
    .eq("id", submission_id)

  if(error){
    return NextResponse.json({
      success:false,
      error:error.message
    })
  }

  return NextResponse.json({
    success:true
  })
}