// api/generate.js

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum terpasang di environment Vercel.' });
  }

  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt tidak boleh kosong!' });
  }

  // System Prompt untuk hasil dengan penjelasan ringkas + blok kode terpisah
  const systemInstruction = `Anda adalah mesin AI generator kode profesional bernama SYNTAX_FORGE.
Aturan Respon:
1. Berikan penjelasan ringkas dan poin utama di luar blok kode jika diperlukan.
2. Tempatkan seluruh kode program di dalam blok kode Markdown bertanda backtick (misalnya \`\`\`javascript atau \`\`\`html).
3. Pastikan kode di dalam blok murni, rapi, lengkap, dan siap digunakan.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nPermintaan Pengguna:\n${prompt}` }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || JSON.stringify(data.error) || 'Gagal menghubungi API Gemini';
      return res.status(response.status).json({ error: errorMsg });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada internal server.' });
  }
}
