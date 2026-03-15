import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

const { data } = await supabase
.from("code_history")
.select(`
id,
code,
language,
ai_feedback,
created_at,
users(name)
`)
.eq("class_id",class_id)
.order("created_at",{ascending:false})

const result = data?.map((h:any)=>({

id:h.id,
code:h.code,
language:h.language,
ai_feedback:h.ai_feedback,
created_at:h.created_at,
student_name:h.users?.name

}))

return Response.json(result)

}