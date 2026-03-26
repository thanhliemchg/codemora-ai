export default function Home(){

return(

<div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">

 <div className="flex-1 flex flex-col items-center justify-center text-center px-4">

    <div className="flex items-center gap-3 px-2">
      <img 
        src="/logo.png" 
        alt="logo" 
        className="w-20 h-20 rounded-xl shadow-md"
      />
      <span className="text-4xl font-bold mb-6 text-white">
        CodeMora AI
      </span>
    </div>


<p className="mb-8 text-white opacity-90">
Hệ thống hỗ trợ dạy và học lập trình bằng trí tuệ nhân tạo
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


