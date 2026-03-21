import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

const { student_id } = await req.json()

const { data, error } = await supabase
.from("submissions")
.select("*")
.eq("student_id",student_id)
.order("created_at",{ ascending:false })

return Response.json(data)

}