import { supabase } from "@/lib/supabase"

export async function GET(){

const {data, error} = await supabase
.from("users")
.select("*")
.eq("role","teacher")
.eq("status","pending")

if (error){
    console.error(error)
    return Response.json([])
}
return Response.json(data || [])

}