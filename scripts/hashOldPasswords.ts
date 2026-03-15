import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log("Supabase URL:", supabaseUrl)

if(!supabaseUrl || !supabaseKey){
throw new Error("Thiếu biến môi trường Supabase")
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run(){

const { data, error } = await supabase
.from("users")
.select("id,password")

if(error){
console.log(error)
return
}

for(const user of data || []){

if(!user.password) continue

// nếu đã hash rồi thì bỏ qua
if(user.password.startsWith("$2")) continue

const hashed = await bcrypt.hash(user.password,10)

await supabase
.from("users")
.update({ password: hashed })
.eq("id",user.id)

console.log("✔ Đã hash:", user.id)

}

}

run()