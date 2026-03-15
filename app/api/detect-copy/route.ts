import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalize(code:string){

return code
.replace(/\/\/.*$/gm,"") // remove comment //
.replace(/#.*$/gm,"") // remove python comment
.replace(/\s+/g,"") // remove space
.toLowerCase()

}

// tính similarity
function similarity(a:string,b:string){

const len = Math.max(a.length,b.length)

if(len===0) return 1

let same = 0

for(let i=0;i<Math.min(a.length,b.length);i++){

if(a[i]===b[i]) same++

}

return same/len

}

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

const { data } = await supabase
.from("submissions")
.select(`
id,
code,
student_id,
users(name)
`)
.eq("class_id",class_id)
.eq("status","submitted")

if(!data) return NextResponse.json([])

const results:any[] = []

for(let i=0;i<data.length;i++){

for(let j=i+1;j<data.length;j++){

const code1 = normalize(data[i].code || "")
const code2 = normalize(data[j].code || "")

const score = similarity(code1,code2)

if(score>0.8){

results.push({

s1:{
student_name:data[i].users?.name
},

s2:{
student_name:data[j].users?.name
},

score

})

}

}

}

return NextResponse.json(results)

}