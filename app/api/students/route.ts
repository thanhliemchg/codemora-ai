import { supabase } from "@/lib/supabase"

export async function GET(){

const { data } = await supabase
.from("users")
.select("*")
.eq("role","student")

return Response.json(data)

}