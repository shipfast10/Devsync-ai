// services/aiService.js
const axios = require('axios');
require('dotenv').config();

// ---------------- GEMINI API Call ----------------
let geminiTestCount = 0;
const GEMINI_LIMIT = 10;

async function callGemini(prompt) {
  if (geminiTestCount >= GEMINI_LIMIT) {
    throw new Error("Gemini test limit reached. Wait or reset counter.");
  }
  geminiTestCount++;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini.";
    console.log(`✅ Gemini call #${geminiTestCount}:`, text);
    return text;
  } catch (error) {
    console.error("❌ Gemini API Error:", error.response?.data || error.message);
    throw new Error("Gemini API call failed");
  }
}

// ---------------- Generate Repo Summary ----------------
async function generateRepoSummary(repos) {
  const repoData = repos
    .map((r) => {
      const commitsSummary = (r.commits || [])
        .map((c) => `- ${c.message} (${c.date})`)
        .join('\n');
      return `Repo: ${r.name}\nLanguage: ${r.language}\nOpen Issues: ${r.openIssues}\nCommits:\n${commitsSummary}`;
    })
    .join('\n\n');

  const prompt = `
You are DevSync AI. Summarize these GitHub repositories:
${repoData}

Give a 3-bullet summary:
1. Recent activity trends
2. Potential issues / improvements
3. Learning recommendations
`;

  try {
    return await callGemini(prompt);
  } catch (errGemini) {
    console.error('❌ Gemini API call failed:', errGemini.message);
    return 'AI not available (Gemini API failed). Summary skipped.';
  }
}

module.exports = { generateRepoSummary, callGemini };