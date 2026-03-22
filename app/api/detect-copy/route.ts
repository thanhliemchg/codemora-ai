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

  let dp = Array(s1.length+1).fill(0).map(()=>Array(s2.length+1).fill(0))

  for(let i=1;i<=s1.length;i++){
    for(let j=1;j<=s2.length;j++){
      if(s1[i-1]===s2[j-1]){
        dp[i][j] = dp[i-1][j-1] + 1
      }else{
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1])
      }
    }
  }

  const lcs = dp[s1.length][s2.length]

  return lcs / Math.max(s1.length, s2.length)
}
/* ================= DSU ================= */

class DSU {
  parent: number[]

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i)
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x])
    }
    return this.parent[x]
  }

  union(a: number, b: number) {
    const pa = this.find(a)
    const pb = this.find(b)
    if (pa !== pb) {
      this.parent[pb] = pa
    }
  }
}

/* ================= API ================= */

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url)
    const class_id = searchParams.get("class_id")
    const exercise_id = searchParams.get("exercise_id")
    if (!class_id || !exercise_id) {
      return NextResponse.json([])
    }

    /* ===== submissions ===== */

    const { data: subs } = await supabase
      .from("submissions")
      .select("student_id, code, exercise_id")
      .eq("class_id", class_id)
      .eq("exercise_id", exercise_id)
      .eq("status","submitted")

    if (!subs || subs.length === 0) {
      return NextResponse.json([])
    }

    /* ===== users ===== */

    const { data: users } = await supabase
      .from("users")
      .select("id, name")

    const map: any = {}
    users?.forEach(u => {
      map[u.id] = u.name || "Unknown"
    })

    /* ===== DSU ===== */

    const dsu = new DSU(subs.length)

    for (let i = 0; i < subs.length; i++) {
      for (let j = i + 1; j < subs.length; j++) {

        if (!subs[i].code || !subs[j].code) continue

        const score = similarity(subs[i].code, subs[j].code)

        if (score > 0.85) {
          dsu.union(i, j)
        }
      }
    }

    /* ===== GROUP ===== */

    const groups: any = {}

    for (let i = 0; i < subs.length; i++) {

      const root = dsu.find(i)

      if (!groups[root]) {
        groups[root] = []
      }

      groups[root].push({
        id: subs[i].student_id,
        name: map[subs[i].student_id] || "Unknown"
      })
    }

    /* ===== FORMAT ===== */

    const result: any[] = []

    Object.values(groups).forEach((g: any) => {

      if (g.length > 1) {

        result.push({
          student_ids: g.map((s: any) => s.id),
          student_names: g.map((s: any) => s.name),
          size: g.length,
          similarity: 0,
          pairs: []
        })

      }

    })

    /* ===== TÍNH SIMILARITY + PAIRS ===== */

    for (let group of result) {

      let total = 0
      let count = 0
      let pairs: any[] = []
      for (let i = 0; i < subs.length; i++) {
        for (let j = i + 1; j < subs.length; j++) {

          if (!subs[i].code || !subs[j].code) continue

          if (
            group.student_ids.includes(subs[i].student_id) &&
            group.student_ids.includes(subs[j].student_id)
          ) {

            const s = similarity(subs[i].code, subs[j].code)

            total += s
            count++

            pairs.push({
              a: map[subs[i].student_id] || "Unknown",
              b: map[subs[j].student_id] || "Unknown",
              a_id: subs[i].student_id,
              b_id: subs[j].student_id,
              score: Math.round(s * 100)
            })
          }
        }
      }

      const avg = count > 0 ? total / count : 0

      group.similarity = Math.round(avg * 100)
      group.pairs = pairs
    }

    /* ===== SAVE DB ===== */

    await supabase
      .from("copy_groups")
      .delete()
      .eq("class_id", class_id)

    if (result.length > 0) {

      const rows = result.map(r => ({
        class_id,
        student_ids: r.student_ids,
        student_names: r.student_names,
        size: r.size,
        similarity: r.similarity
      }))

      await supabase.from("copy_groups").insert(rows)
    }

    return NextResponse.json(result)

  } catch (err: any) {

    console.error("❌ DETECT COPY ERROR:", err)

    return NextResponse.json({
      error: err.message
    })
  }
}