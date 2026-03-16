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

<div className="w-full flex justify-between items-center bg-gray-900 text-white p-4 shadow">

<h1 className="font-bold">
CodeMora AI
</h1>

<div className="flex gap-4 items-center">

<span>
👤 {user?.name} ({user?.role})
</span>

<button
onClick={logout}
className="bg-red-500 px-3 py-1 rounded"
>
Đăng xuất
</button>

</div>

</div>

)

}


