import { supabase } from "@/lib/supabase"

export async function POST(req:Request){

const { student_id, class_id } = await req.json()

const { data } = await supabase
.from("submissions")
.select("id")
.eq("student_id",student_id)
.eq("class_id",class_id)

return Response.json({
submitted: (data ?? []).length > 0
})

}