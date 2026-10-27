KONTEKS PROYEK
Saya membangun website roadmap karier IT interaktif dengan tema jaringan (network graph),
alternatif dari roadmap.sh yang linear. Node "IT" besar di tengah, lalu cabang menjalar:
Bidang (Web Dev, Data, Security, ...) -> Spesialisasi (Frontend, Backend, ...) -> Peran/Karier
-> Tech stack (bahasa, framework, database, tools) -> link dokumentasi resmi.

STACK (jangan diganti tanpa izin):

- Vite + React + TypeScript (strict mode)
- Cytoscape.js untuk graf (gunakan wrapper tipis sendiri, bukan library wrapper pihak ketiga)
- Tailwind CSS untuk styling
- Data statis di file JSON, tanpa backend, tanpa login
- Deploy statis (GitHub Pages / Vercel)

ATURAN KERJA:

- Kerjakan HANYA fase yang diminta; jangan mengerjakan fase berikutnya.
- Pisahkan data dari tampilan: semua konten ada di /src/data, UI hanya merender.
- Kode harus typed penuh, tanpa `any`.
- Setelah selesai, jalankan build + lint + typecheck, perbaiki error, lalu beri ringkasan:
  file yang dibuat/diubah, keputusan desain, dan hal yang belum selesai.
- Jika ada keputusan ambigu yang berdampak besar, tanyakan dulu; selain itu pilih default
  yang masuk akal dan catat di ringkasan.
- Bahasa UI: Bahasa Indonesia. Kode, nama variabel, dan komentar: Inggris.
