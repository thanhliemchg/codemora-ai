"use client";
import { useState } from "react";

export default function StudentPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      setResult(data.result);
    } catch (error) {
      setResult("Có lỗi xảy ra.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">AI Code Mentor</h1>

      <textarea
        className="border w-full h-40 mt-4 p-2"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={analyze}
        className="bg-blue-500 text-white px-4 py-2 mt-4"
      >
        {loading ? "Đang phân tích..." : "Phân tích"}
      </button>

      <pre className="mt-4 bg-gray-100 p-4 whitespace-pre-wrap">
        {result}
      </pre>
    </div>
  );
}