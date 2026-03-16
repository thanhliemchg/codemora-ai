"use client"

import { useEffect,useState } from "react"

export default function Header(){

const [user,setUser] = useState<any>(null)

useEffect(()=>{

const u = localStorage.getItem("user")

if(u){
setUser(JSON.parse(u))
}

},[])

function logout(){

localStorage.removeItem("user")

window.location.href="/login"

}

return(

<div className="w-full flex justify-between items-center bg-gray-900 text-white px-6 py-3 shadow">

<h1 className="font-bold text-lg">

🚀 CodeMora AI

</h1>

{user && (

<div className="flex items-center gap-4">

<div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full">

<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">

{user.name?.charAt(0)}

</div>

<span>{user.name}</span>

<span className="text-gray-300 text-sm">

({user.role})

</span>

</div>

<button
onClick={logout}
className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
>

Đăng xuất

</button>

</div>

)}

</div>

)

}