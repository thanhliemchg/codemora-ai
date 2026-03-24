"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function Sidebar(){

const params = useSearchParams()

const tab = params.get("tab") || "classes"

function item(name:string,icon:string,key:string){

const active = tab===key

return(

<Link
href={`/teacher?tab=${key}`}
className={`flex items-center gap-3 px-3 py-2 rounded transition
${active ? "bg-blue-600" : "hover:bg-blue-700"}
`}
>

<span>{icon}</span>
<span>{name}</span>

</Link>

)

}

return(

<div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white min-h-screen p-4">

<h2 className="font-bold mb-6 text-lg">

Menu

</h2>

<div className="flex flex-col gap-2">

{item("Lớp học","📚","classes")}

{item("Học sinh","👨‍🎓","students")}

{item("Giao bài tập","📝","exercise")}

{item("Bài nộp","📥","submissions")}

{item("Phát hiện copy","🕵️","copy")}

{item("Thống kê","📊","stats")}

</div>

</div>

)

}