import { supabase } from "@/lib/supabase"

export async function POST(req:Request){

const { id } = await req.json()

await supabase
.from("submissions")
.update({
status:"approved"
})
.eq("id",id)

return Response.json({
success:true
})

}