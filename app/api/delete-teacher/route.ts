import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

const {id} = await req.json()

const {error} = await supabase
.from("users")
.delete()
.eq("id",id)

if(error){
return Response.json({success:false,error:error.message})
}

return Response.json({success:true})
}