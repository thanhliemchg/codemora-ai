"use client";
import { useState } from "react";

export default function StudentPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");

  const analyze = async () => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setResult(data.result);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">AI Code Mentor</h1>
      <textarea
        className="border w-full h-40 mt-4"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        onClick={analyze}
        className="bg-blue-500 text-white px-4 py-2 mt-4"
      >
        Phân tích
      </button>
      <pre className="mt-4 bg-gray-100 p-4">{result}</pre>
    </div>
  );
}