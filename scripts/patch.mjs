// Menerapkan perbaikan otomatis ke src/App.jsx (kode dari Canvas).
// Aman dijalankan berkali-kali: setelah berhasil, file diberi penanda dan dilewati.
import fs from 'node:fs';

const file = new URL('../src/App.jsx', import.meta.url);
let src = fs.readFileSync(file, 'utf8');
const MARK = '/* cinecreator-patched */';

if (src.includes(MARK)) { console.log('[patch] sudah diterapkan, dilewati.'); process.exit(0); }
if (!/from\s*['"]lucide-react['"]/.test(src)) {
  console.log('[patch] src/App.jsx masih placeholder, dilewati. Tempel kode dari Canvas dulu.');
  process.exit(0);
}

const log = [];
const replaceAll = (name, from, to) => {
  if (!src.includes(from)) { log.push('TIDAK DITEMUKAN: ' + name); return; }
  src = src.split(from).join(to);
  log.push('ok: ' + name);
};

// 1. localStorage aman (tidak crash di mode private / iframe)
replaceAll('localStorage.getItem', 'localStorage.getItem(', 'safeStore.get(');
replaceAll('localStorage.setItem', 'localStorage.setItem(', 'safeStore.set(');
replaceAll('localStorage.removeItem', 'localStorage.removeItem(', 'safeStore.remove(');

// 2. Nama model jadi konstanta (urutan: yang panjang dulu)
replaceAll('model image (string)', '"gemini-2.5-flash-image"', 'IMAGE_MODEL');
replaceAll('model image (url)', 'models/gemini-2.5-flash-image:', 'models/${IMAGE_MODEL}:');
replaceAll('model teks (string)', '"gemini-2.5-flash"', 'TEXT_MODEL');
replaceAll('model teks (url)', 'models/gemini-2.5-flash:', 'models/${TEXT_MODEL}:');

// 3. Teks footer
replaceAll('footer', 'Powered by Gemini & Imagen (with Demo Mode)', 'Powered by Gemini (with Demo Mode)');

// 4. Pesan error yang jelas (kuota habis / key salah)
replaceAll(
  'pesan error API',
  'if (!res.ok || data.error) throw new Error(data.error?.message || `API Error ${res.status}`);',
  'if (!res.ok || data.error) {\n' +
  '        const msg = data.error?.message || `API Error ${res.status}`;\n' +
  '        if (res.status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) {\n' +
  '            throw new Error("Kuota API gratis habis atau terlalu banyak permintaan. Tunggu 1 menit lalu coba lagi, atau cek sisa kuota di Google AI Studio.");\n' +
  '        }\n' +
  '        if ((res.status === 400 && /API key/i.test(msg)) || res.status === 403) {\n' +
  '            throw new Error("API key tidak valid atau tidak punya akses. Periksa kembali key Anda.");\n' +
  '        }\n' +
  '        throw new Error(msg);\n' +
  '    }'
);

// 5. Alasan gagal gambar ditampilkan ke user
replaceAll(
  'error gambar scene',
  'console.error(`Image gen failed for scene ${index}`, err);',
  'console.error(`Image gen failed for scene ${index}`, err);\n' +
  '            setErrorMsg(`Scene ${index + 1}: ${err.message || "gagal membuat gambar."}`);'
);

// 6. Catatan kuota & privasi di panel kiri
replaceAll(
  'catatan kuota & privasi',
  '{/* Referensi Visual (Multi: karakter, lokasi, objek) */}',
  '<div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5 text-[10px] text-amber-200 leading-relaxed">\n' +
  '    Kuota &amp; privasi: API key dipakai langsung dari browser Anda dan tidak dikirim ke server kami. Batas pemakaian free tier ditentukan Google dan bisa berubah. Di free tier, prompt dan foto yang dikirim dapat dipakai Google untuk meningkatkan produknya, jadi hindari mengunggah foto yang sensitif.\n' +
  '</div>\n' +
  '{/* Referensi Visual (Multi: karakter, lokasi, objek) */}'
);

// 7. Konstanta + helper storage, disisipkan setelah import lucide-react
const header =
  '\n' + MARK + '\n' +
  'const TEXT_MODEL = import.meta.env.VITE_TEXT_MODEL || "gemini-2.5-flash";\n' +
  'const IMAGE_MODEL = import.meta.env.VITE_IMAGE_MODEL || "gemini-2.5-flash-image";\n' +
  'const safeStore = {\n' +
  '    get: (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } },\n' +
  '    set: (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* storage diblokir */ } },\n' +
  '    remove: (k) => { try { window.localStorage.removeItem(k); } catch (e) { /* storage diblokir */ } }\n' +
  '};\n';
src = src.replace(/(from\s*['"]lucide-react['"];?)/, (m) => m + header);

fs.writeFileSync(file, src);
log.forEach((l) => console.log('[patch] ' + l));
if (log.some((l) => l.startsWith('TIDAK DITEMUKAN'))) {
  console.log('[patch] Sebagian perbaikan dilewati karena teks di kode berbeda. Build tetap lanjut.');
}
