import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function genPass(){
return Math.random().toString(36).slice(-8)
}

export async function POST(req:Request){

const {id} = await req.json()

const newPass = genPass()

const hash = await bcrypt.hash(newPass,10)

const {error} = await supabase
.from("users")
.update({
password:hash,
must_change_password:true
})
.eq("id",id)

if(error){
return Response.json({success:false,error:error.message})
}

return Response.json({
success:true,
password:newPass
})
}