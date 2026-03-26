import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

  const { userId, oldPassword, newPassword } = await req.json()

  if(!userId){
    return Response.json({ success:false })
  }

  const { data } = await supabase
    .from("users")
    .select("password")
    .eq("id",userId)
    .single()

  const isMatch = await bcrypt.compare(oldPassword, data.password)

  if(!isMatch){
    return Response.json({ success:false, message:"Sai mật khẩu cũ" })
  }

  const hash = await bcrypt.hash(newPassword,10)

  await supabase
    .from("users")
    .update({ password:hash })
    .eq("id",userId)

  return Response.json({ success:true })
}