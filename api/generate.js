export default async function handler(req, res) {
  // Config Header CORS
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
    return res.status(500).json({ error: 'GEMINI_API_KEY belum terpasang di Vercel Environment Variables.' });
  }

  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt tidak boleh kosong!' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Tindak sebagai pakar pemrograman. Berikan kode lengkap beserta penjelasan ringkas dalam Bahasa Indonesia:\n\n${prompt}` }]
        }]
      })
    });

    const data = await response.json();

    // Menampilkan detail pesan error dari Google jika API Key salah atau kuota habis
    if (!response.ok) {
      const errorMsg = data.error?.message || JSON.stringify(data.error) || 'Gagal menghubungi Gemini API';
      return res.status(response.status).json({ error: errorMsg });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || ' Terjadi kesalahan pada server.' });
  }
}
