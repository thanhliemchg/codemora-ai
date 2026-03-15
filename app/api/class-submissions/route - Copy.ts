import { supabase } from "@/lib/supabase"

export async function GET(req: Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

if(!class_id){
return Response.json([])
}

const { data,error } = await supabase
.from("submissions")
.select(`
id,
code,
ai_feedback,
teacher_score,
student_id,
users(name)
`)
.eq("class_id",class_id)
.order("created_at",{ascending:false})

if(error){
console.log(error)
return Response.json([])
}

const result = data.map((s:any)=>({

id:s.id,
code:s.code,
ai_feedback:s.ai_feedback,
teacher_score:s.teacher_score,
student_name:s.users?.name || "Unknown"

}))

return Response.json(result)

}