import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

const { data,error } = await supabase
.from("code_history")
.select(`
id,
code,
language,
ai_feedback,
users(name)
`)
.eq("class_id",class_id)
.order("created_at",{ascending:false})

if(error){
return Response.json({error})
}

const result = data.map((r:any)=>{

  let parsed:any = null

  try{
    parsed = r.ai_feedback ? JSON.parse(r.ai_feedback) : null
  }catch{
    parsed = null
  }

  return {
    id: r.id,
    code: r.code,
    language: r.language,
    feedback: parsed?.feedback || r.ai_feedback || "",
    detail: parsed?.detail || [],

    student_name: r.users?.name
  }
})

return Response.json(result)

}