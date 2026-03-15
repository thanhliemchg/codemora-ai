const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCPDo7I8-0uYYwJWEYVIGhxuXW6i_Vmdfc");

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent("Xin chào");
  const response = await result.response;

  console.log(response.text());
}

run();