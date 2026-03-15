import { supabase } from "@/lib/supabase"

export async function POST(req: Request){
try{
const { student_id } = await req.json()

const { data, error } = await supabase
.from("code_history")
.select("*")
.eq("student_id",student_id)
.order("created_at",{ ascending:false })

if(error){
return Response.json({error})
}

return Response.json(data)
}
catch(err){
return Response.json([])
}
}