import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ================= SIMILARITY ================= */

function similarity(a:string,b:string){

  const clean = (s:string)=>
    s.replace(/\s/g,"").toLowerCase()

  const s1 = clean(a)
  const s2 = clean(b)

  let same = 0

  for(let i=0;i<Math.min(s1.length,s2.length);i++){
    if(s1[i]===s2[i]) same++
  }

  return same / Math.max(s1.length,s2.length)
}

/* ================= DSU ================= */

class DSU{
  parent:any

  constructor(n:number){
    this.parent = Array.from({length:n},(_,i)=>i)
  }

  find(x:number){
    if(this.parent[x]!==x){
      this.parent[x] = this.find(this.parent[x])
    }
    return this.parent[x]
  }

  union(a:number,b:number){
    const pa = this.find(a)
    const pb = this.find(b)
    if(pa!==pb){
      this.parent[pb] = pa
    }
  }
}

/* ================= API ================= */

export async function GET(req:Request){

  const { searchParams } = new URL(req.url)
  const class_id = searchParams.get("class_id")

  if(!class_id){
    return NextResponse.json([])
  }

  /* ===== submissions ===== */

  const { data:subs } = await supabase
    .from("submissions")
    .select("student_id,code")
    .eq("class_id",class_id)

  if(!subs || subs.length===0){
    return NextResponse.json([])
  }

  /* ===== users ===== */

  const { data:users } = await supabase
    .from("users")
    .select("id,name")

  const map:any = {}
  users?.forEach(u=>map[u.id]=u.name)

  /* ===== DSU ===== */

  const dsu = new DSU(subs.length)

  for(let i=0;i<subs.length;i++){
    for(let j=i+1;j<subs.length;j++){

      if(!subs[i].code || !subs[j].code) continue

      const score = similarity(subs[i].code, subs[j].code)

      if(score > 0.7){
        dsu.union(i,j)
      }
    }
  }

  /* ===== GROUP ===== */

  const groups:any = {}

  for(let i=0;i<subs.length;i++){

    const root = dsu.find(i)

    if(!groups[root]){
      groups[root] = []
    }

    groups[root].push({
      id: subs[i].student_id,
      name: map[subs[i].student_id]
    })
  }

  /* ===== FORMAT ===== */

  const result:any[] = []

  Object.values(groups).forEach((g:any)=>{

    if(g.length > 1){

      result.push({
        student_ids: g.map((s:any)=>s.id),
        student_names: g.map((s:any)=>s.name),
        size: g.length,
        similarity: 0.9 // bạn có thể nâng cấp sau
      })

    }

  })

  /* ===== SAVE DB ===== */

  await supabase
    .from("copy_groups")
    .delete()
    .eq("class_id",class_id)

  if(result.length > 0){

    const rows = result.map(r=>({
      class_id,
      student_ids: r.student_ids,
      student_names: r.student_names,
      size: r.size,
      similarity: r.similarity
    }))

    await supabase.from("copy_groups").insert(rows)
  }

  return NextResponse.json(result)
}