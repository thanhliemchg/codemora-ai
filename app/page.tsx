export default function Home(){

return(

<div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">

 <div className="flex-1 flex flex-col items-center justify-center text-center px-4">

    <h1 className="text-4xl font-bold text-white mb-3">
      🚀 CodeMora AI
    </h1>

<p className="mb-8 text-white opacity-90">
Hệ thống hỗ trợ dạy và học lập trình bằng AI
</p>

<div className="flex gap-4">

<a href="/login">
<button className="bg-white text-black px-5 py-2 rounded-lg shadow">
Đăng nhập
</button>
</a>

<a href="/register">
<button className="bg-white/20 text-white px-5 py-2 rounded-lg border border-white/30">
Đăng ký
</button>
</a>
</div>
</div>

</div>

)

}


