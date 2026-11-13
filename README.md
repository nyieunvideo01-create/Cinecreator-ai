# Wilhen Cinecreator AI (siap hosting gratis)

Aplikasi statis: tidak butuh backend. Tiap pengguna memasukkan API key Gemini mereka sendiri (disimpan di browser mereka).

## 1. Isi kodenya
Buka `src/App.jsx`, hapus isinya, lalu tempel seluruh kode dari Gemini Canvas.
Saat build, `scripts/patch.mjs` otomatis menerapkan perbaikan: localStorage aman, nama model jadi konstanta, pesan error kuota/key yang jelas, alasan gagal gambar tampil, catatan kuota & privasi.

## 2. Deploy tanpa install apa pun (paling mudah)
1. Buat repo di GitHub, upload semua isi folder ini (termasuk `src/App.jsx` yang sudah diisi).
2. Netlify / Vercel / Cloudflare Pages: pilih "Import from GitHub" dan pilih repo itu.
3. Pengaturan build (biasanya terdeteksi otomatis):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Klik Deploy. Link publik langsung jadi.

## 3. Jalankan di komputer sendiri (opsional)
Butuh Node.js 18+.
```
npm install
npm run dev
```

## 4. Ganti model tanpa edit kode
Kalau Google mengganti atau memensiunkan model, set environment variable di hosting:
- `VITE_TEXT_MODEL` (default `gemini-2.5-flash`)
- `VITE_IMAGE_MODEL` (default `gemini-2.5-flash-image`)
Lalu deploy ulang.

## Catatan
- Batas pemakaian free tier ditentukan Google dan bisa berubah. Cek di akun Google AI Studio masing-masing.
- Situs statis tidak bisa mengunci akses berbayar. Untuk dijual, kirim link/kode akses setelah pembayaran lewat platform penjualan.
