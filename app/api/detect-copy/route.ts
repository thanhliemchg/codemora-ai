import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ================= DETECT LANGUAGE ================= */
function detectLanguage(code: string) {
  if (!code) return "unknown"

  // C++
  if (
    /#include/.test(code) ||
    /int\s+main\s*\(/.test(code) ||
    /\bcin\s*>>/.test(code) ||
    /\bcout\s*<</.test(code)
  ) {
    return "cpp"
  }

  // Python
  if (
    /\bdef\s+\w+\(/.test(code) ||
    /\bprint\s*\(/.test(code) ||
    /\binput\s*\(/.test(code)
  ) {
    return "python"
  }

  return "unknown"
}

/* ================= NORMALIZE ================= */
function normalize(code: string) {
  return code
    .replace(/#include\s*[<"].*[>"]/g, "")
    .replace(/using namespace std;/g, "")
    .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")
    .replace(/\b(int|long|double|float|string|bool|char)\b/g, "TYPE")
    .replace(/\b\d+\b/g, "NUM")
    .replace(/[{}();,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/* ================= TOKENIZE ================= */
function tokenize(code: string) {
  return normalize(code).split(" ").filter(Boolean)
}

/* ================= SHINGLES ================= */
function shingles(tokens: string[], k = 5) {
  const result: string[] = []
  for (let i = 0; i <= tokens.length - k; i++) {
    result.push(tokens.slice(i, i + k).join(" "))
  }
  return result
}

/* ================= SIMILARITY ================= */
function similarity(a: string, b: string) {
  const t1 = shingles(tokenize(a))
  const t2 = shingles(tokenize(b))

  const set1 = new Set(t1)
  const set2 = new Set(t2)

  const intersection = [...set1].filter(x => set2.has(x)).length
  const union = new Set([...set1, ...set2]).size

  return union === 0 ? 0 : intersection / union
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
      .select("student_id, code")
      .eq("class_id", class_id)
      .eq("exercise_id", exercise_id)
      .eq("status", "submitted")

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

        const codeA = subs[i].code
        const codeB = subs[j].code

        if (!codeA || !codeB) continue

        const langA = detectLanguage(codeA)
        const langB = detectLanguage(codeB)

        // ❌ KHÁC NGÔN NGỮ => BỎ
        if (langA !== langB) continue

        const score = similarity(codeA, codeB)

        if (score > 0.75) {
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

          const codeA = subs[i].code
          const codeB = subs[j].code

          if (!codeA || !codeB) continue

          const langA = detectLanguage(codeA)
          const langB = detectLanguage(codeB)

          // ❌ KHÁC NGÔN NGỮ => KHÔNG TÍNH
          if (langA !== langB) continue

          if (
            group.student_ids.includes(subs[i].student_id) &&
            group.student_ids.includes(subs[j].student_id)
          ) {

            const s = similarity(codeA, codeB)

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