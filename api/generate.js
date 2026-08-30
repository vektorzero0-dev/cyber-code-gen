// api/generate.js

export default async function handler(req, res) {
  // 1. Konfigurasi CORS Header
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handling HTTP Method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Validasi API Key
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum terpasang di Environment Variable Vercel.' });
  }

  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt payload tidak boleh kosong!' });
  }

  // 3. System Instruction
  const systemInstruction = `Anda adalah mesin AI generator kode profesional bernama SYNTAX_FORGE.
Aturan Respon:
1. Berikan penjelasan ringkas dan poin utama di luar blok kode jika diperlukan.
2. Tempatkan seluruh kode program di dalam blok kode Markdown bertanda backtick (misalnya \`\`\`javascript atau \`\`\`html).
3. Pastikan kode di dalam blok murni, rapi, lengkap, dan siap digunakan.`;

  // 4. Daftar Model dengan gemini-3.5-flash sebagai Prioritas Utama
  const models = [
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  let lastError = null;

  // 5. Perulangan Panggilan API dengan Fallback Otomatis
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemInstruction}\n\nPermintaan Pengguna:\n${prompt}` }]
            }]
          })
        }
      );

      const data = await response.json();

      // Jika response OK, kirim hasil ke frontend dan hentikan loop
      if (response.ok && data.candidates) {
        return res.status(200).json(data);
      }

      // Simpan pesan error jika model sedang sibuk atau tidak ditemukan
      lastError = data.error?.message || JSON.stringify(data.error) || `Gagal mengakses model ${model}`;

      console.warn(`[FORGE_WARNING] Model ${model} gagal: ${lastError}. Mencoba model berikutnya...`);

    } catch (err) {
      lastError = err.message;
      console.error(`[FORGE_ERROR] Gagal menghubungi ${model}:`, err);
    }
  }

  // Jika seluruh rantai fallback gagal
  return res.status(539).json({ 
    error: `Semua server Gemini mengalami gangguan atau High Demand. Detail: ${lastError}` 
  });
}
