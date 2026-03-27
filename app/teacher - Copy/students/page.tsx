"use client"

import { useEffect,useState } from "react"

export default function Students(){

const [students,setStudents] = useState([])

useEffect(()=>{

fetch("/api/students")
.then(res=>res.json())
.then(data=>setStudents(data))

},[])

return(

<div className="p-8">

<h1 className="text-2xl font-bold mb-6">
Quản lý học sinh
</h1>

<table className="w-full border">

<thead className="bg-gray-200">

<tr>
<th className="p-2">Tên</th>
<th>Email</th>
<th>Lớp</th>
<th>Trạng thái</th>
</tr>

</thead>

<tbody>

{students.map((s:any)=>(
<tr key={s.id} className="border">

<td className="p-2">{s.name}</td>

<td>{s.email}</td>

<td>{s.class_id}</td>

<td>{s.status}</td>

</tr>
))}

</tbody>

</table>

</div>

)

}