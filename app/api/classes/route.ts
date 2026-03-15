import { supabase } from "@/lib/supabase"

export async function GET(){

const {data} = await supabase
.from("classes")
.select("*")
.order("created_at",{ascending:false})

return Response.json(data)

}