export default function Home(){

return(

<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">

<h1 className="text-4xl font-bold mb-6">
CodeMora AI
</h1>

<p className="mb-8 opacity-90">
Hệ thống hỗ trợ học lập trình bằng AI
</p>

<div className="flex gap-4">

<a href="/login">
<button className="bg-white text-indigo-600 px-6 py-3 rounded">
Đăng nhập
</button>
</a>

<a href="/register">
<button className="bg-purple-700 px-6 py-3 rounded">
Đăng ký
</button>
</a>

</div>

</div>

)

}