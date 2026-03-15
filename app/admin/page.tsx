"use client"

import { useState,useEffect } from "react"

export default function Admin(){

const [teachers,setTeachers] = useState([])

async function loadTeachers(){

const res = await fetch("/api/pending-teachers")

const data = await res.json()

setTeachers(data)

}

async function activate(id: string){

await fetch("/api/activate-user",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({id})

})

loadTeachers()

}

useEffect(()=>{
loadTeachers()
const u = localStorage.getItem("user")

if(!u){
window.location.href="/login"
return
}

const user = JSON.parse(u)

if(user.role !== "admin"){
window.location.href="/"
return
}

//setUser(user)

},[])


return(

<div className="p-8">

<h1 className="text-2xl font-bold mb-6">
Admin Dashboard
</h1>

<table className="w-full bg-white text-black">

<thead>

<tr>

<th>Tên</th>
<th>Email</th>
<th>Kích hoạt</th>

</tr>

</thead>

<tbody>

{teachers.map((t:any)=>(

<tr key={t.id}>

<td>{t.name}</td>

<td>{t.email}</td>

<td>

<button
onClick={()=>activate(t.id)}
className="bg-green-600 text-white px-3 py-1 rounded"
>
Kích hoạt
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

)

}