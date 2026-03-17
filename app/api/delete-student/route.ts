import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

const {id} = await req.json()

// xoá cả users + accounts cho sạch
await supabase.from("users").delete().eq("id",id)
await supabase.from("student_accounts").delete().eq("user_id",id)

return Response.json({success:true})
}