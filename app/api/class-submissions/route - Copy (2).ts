import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

if(!class_id){
return NextResponse.json({
error:"Thiếu class_id"
})
}

const {data,error} = await supabase
.from("submissions")
.select(`
id,
status,
teacher_score,
ai_feedback,
created_at,
users(
name
),
generated_exercises(
exercise,
created_at
)
`)
.eq("class_id",class_id)
.order("created_at",{ascending:false})

if(error){
return NextResponse.json({
error:error.message
})
}

return NextResponse.json(data)

}