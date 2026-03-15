import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

const { data,error } = await supabase
.from("submissions")
.select(`
id,
code,
language,
ai_feedback,
teacher_score,
users(name)
`)
.eq("class_id",class_id)
.order("created_at",{ascending:false})

if(error){
return Response.json({error})
}

const result = data.map((r:any)=>({

id:r.id,
code:r.code,
language:r.language,
ai_feedback:r.ai_feedback,
teacher_score:r.teacher_score,
student_name:r.users?.name

}))

return Response.json(result)

}