import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

const { searchParams } = new URL(req.url)

const class_id = searchParams.get("class_id")

/* học sinh */

const { data:students } = await supabase
.from("users")
.select("id,name")
.eq("class_id",class_id)
.eq("role","student")

/* bài nộp */

const { data:submissions } = await supabase
.from("submissions")
.select("student_id,teacher_score")
.eq("class_id",class_id)

let progress:any=[]

for(const s of students || []){

const studentSubs =
submissions?.filter((x:any)=>x.student_id===s.id) || []

const avg =
studentSubs.length
? studentSubs.reduce(
(a:any,b:any)=>a+(b.teacher_score||0),0
)/studentSubs.length
:0

progress.push({

student:s.name,
submissions:studentSubs.length,
average:Math.round(avg*10)/10

})

}

return Response.json({

students:students?.length || 0,
submissions:submissions?.length || 0,
progress

})

}