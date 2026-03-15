import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

const body = await req.json()

const {submission_id, code, language} = body

if(!submission_id || !code){
return NextResponse.json({
error:"Thiếu dữ liệu"
})
}

// cập nhật bài nộp

const {error} = await supabase
.from("submissions")
.update({
code:code,
language:language,
status:"submitted",
submitted_at:new Date()
})
.eq("id",submission_id)

if(error){
return NextResponse.json({
error:error.message
})
}

return NextResponse.json({
success:true
})

}