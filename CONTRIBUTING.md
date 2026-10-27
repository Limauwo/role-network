# Panduan Kontribusi Role Network

Terima kasih atas ketertarikan Anda untuk berkontribusi pada **Role Network**! Kami menyambut baik kontribusi penambahan bidang teknologi baru, pembaruan tautan dokumentasi resmi, maupun peningkatan visual dan fitur.

---

## 1. Aturan Penambahan Data Graf

Seluruh data hierarki dan relasi disimpan di file:
👉 [`src/data/graph.json`](src/data/graph.json)

### A. Struktur Node
Setiap node harus memiliki properti berikut:
```json
{
  "id": "slug-unik-huruf-kecil",
  "label": "Nama Tampilan Node",
  "type": "root" | "field" | "specialization" | "role" | "skill" | "tool",
  "category": "language" | "framework" | "database" | "tooling" | "platform" | "concept",
  "description": "Deskripsi singkat dalam bahasa Indonesia.",
  "docsUrl": "https://situs-resmi.org/docs"
}
```

#### Aturan Wajib untuk Node:
1. **ID Unik**: Gunakan format slug huruf kecil dengan tanda minus (contoh: `react`, `frontend-developer`, `postgresql`). Tidak boleh ada ID duplikat.
2. **docsUrl Wajib untuk Skill & Tool**:
   - Hanya gunakan tautan ke **situs resmi** (MDN Web Docs, situs vendor/organisasi resmi seperti `nodejs.org`, `react.dev`, `postgresql.org`).
   - Hindari blog tutorial pihak ketiga, artikel Medium, atau video YouTube.
   - **Protokol Wajib HTTPS**: Semua tautan wajib diawali dengan `https://`.
3. **Kategori Node**:
   - `language` (Bahasa pemrograman / markah)
   - `framework` (Framework atau library UI)
   - `database` (Sistem basis data relasional/NoSQL)
   - `tooling` (Tools pengembangan seperti Git, Docker, bundler)
   - `platform` (Runtime atau sistem operasi)
   - `concept` (Prinsip desain atau fundamental sistem)

### B. Struktur Edge
Setiap edge menghubungkan dua node:
```json
{
  "source": "id-sumber",
  "target": "id-tujuan",
  "kind": "part_of" | "prerequisite"
}
```
1. **`part_of`**: Relasi hierarkis struktural (misal: `it -> web-development`, `web-development -> frontend`, `frontend -> frontend-developer`, `frontend-developer -> react`).
   - *Penting*: Semua node non-root wajib memiliki minimal 1 incoming `part_of` edge agar tidak menjadi node yatim (orphan).
2. **`prerequisite`**: Relasi urutan belajar logis (misal: `html -> css -> javascript`, `javascript -> react`).

---

## 2. Validasi Integritas Data

Sebelum membuat commit atau Pull Request, Anda **wajib** menjalankan script validasi data:

```bash
npm run validate:data
```

Script ini akan memeriksa secara otomatis:
- Apakah terdapat duplikasi ID node.
- Apakah ada edge yang merujuk ke node yang tidak terdaftar.
- Apakah ada node yatim (orphan node) tanpa parent `part_of`.
- Apakah ada node `skill` atau `tool` tanpa `docsUrl`.
- Apakah semua `docsUrl` valid dan menggunakan protokol `https://`.

---

## 3. Menjalankan Pengujian & Pengecekan Kode

Pastikan seluruh verifikasi lolos sebelum membuka Pull Request:

```bash
# 1. Jalankan unit test
npm run test

# 2. Periksa kesesuaian tipe data TypeScript
npm run typecheck

# 3. Jalankan linter ESLint
npm run lint

# 4. Validasi build produksi
npm run build
```

---

## 4. Alur Kerja Pull Request (PR)

1. Buat branch baru dari branch `main`:
   ```bash
   git checkout -b feat/tambah-domain-cloud
   ```
2. Lakukan perubahan pada `src/data/graph.json` atau file terkait.
3. Jalankan validasi dan commit perubahan:
   ```bash
   git commit -m "feat(data): tambah bidang cloud computing dan aws"
   ```
4. Push ke repository fork Anda dan buka Pull Request ke branch `main`.
5. Pastikan seluruh pengecekan otomatis GitHub Actions berstatus hijau (passing).
