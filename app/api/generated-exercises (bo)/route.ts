import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

const { data,error } = await supabase
.from("ai_exercises")
.select(`
id,
exercise,
users(name)
`)
.eq("class_id",class_id)
.order("created_at",{ascending:false})

if(error){
return Response.json({error})
}

const result = data.map((r:any)=>({

id:r.id,
exercise:r.exercise,
student_name:r.users?.name

}))

return Response.json(result)

}