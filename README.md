# Role Network 🌐

> **Peta Karier IT Interaktif Berbasis Graf Jaringan (Network Graph)**
> Alternatif modern, dinamis, dan non-linear dari roadmap linear konvensional.

[![CI Quality Gate](https://github.com/username/role-network/actions/workflows/ci.yml/badge.svg)](https://github.com/username/role-network/actions/workflows/ci.yml)
[![Weekly Docs Check](https://github.com/username/role-network/actions/workflows/weekly-docs-check.yml/badge.svg)](https://github.com/username/role-network/actions/workflows/weekly-docs-check.yml)

---

## 📌 Gambaran Umum

Role Network memvisualisasikan ekosistem industri teknologi informasi secara radial konsentris. Dimulai dari node sentral **IT**, cabang menjalar secara bertahap (*progressive disclosure*):
- **Bidang** (*Field*): Web Development, Data, Cybersecurity, Cloud, dll.
- **Spesialisasi** (*Specialization*): Frontend, Backend, Fullstack, dll.
- **Peran / Karier** (*Role*): Frontend Developer, Backend Developer, Fullstack Developer.
- **Tech Stack** (*Skill & Tool*): Bahasa pemrograman, framework, basis data, dan tooling nyata dengan tautan resmi.

Setiap peran dilengkapi dengan:
- **Pengelompokan Kategori**: Bahasa, Framework, Database, Tools, Platform.
- **Urutan Belajar Disarankan**: Diurutkan secara ilmiah menggunakan *Topological Sort (Kahn's Algorithm)* berdasarkan dependensi prasyarat (*prerequisite*).
- **Pranala Resmi**: Seluruh dokumentasi menuju situs resmi berprotokol HTTPS.
- **Progress Tracker**: Tandai skill yang sudah Anda kuasai dengan penyimpanan lokal persisten (*localStorage*).

---

## 📸 Tangkapan Layar Aplikasi

```
+-------------------------------------------------------------------------------+
|  Role Network       [ 🔍 Cari node / peran... (/) ]     [Graf|Pohon] [Tentang]|
+-------------------------------------------------------------------------------+
|                                                |                             |
|                    [ Web Dev ]                 |  Frontend Developer         |
|                         |                      |  [Role] [Web Development]   |
|        [ Frontend ]-----------[ Backend ]      |                             |
|             |                      |           |  Progres Penguasaan:        |
|     [FE Developer]           [BE Developer]    |  ■■■■■■□□□□ 60%             |
|       /    |     \                 |           |                             |
|   [HTML]-[CSS]-[JavaScript]      [Node.js]     |  Tech Stack:                |
|             \        |                         |  - HTML5 (developer.mozilla)|
|           [React] [TypeScript]                 |  - CSS3                     |
|                                                |  - JavaScript               |
|                                                |                             |
+-------------------------------------------------------------------------------+
```

---

## 🚀 Memulai (Menjalankan Secara Lokal)

### Prasyarat
- Node.js versi 18.0 atau lebih baru (direkomendasikan Node.js LTS 20+)
- npm versi 9 atau lebih baru

### Langkah Instalasi
```bash
# 1. Clone repository
git clone https://github.com/username/role-network.git
cd role-network

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan lokal
npm run dev
```
Buka browser dan akses `http://localhost:5173`.

---

## 🧪 Skrip Tersedia

| Skrip | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server dev Vite dengan hot module reloading |
| `npm run build` | Menjalankan typecheck TypeScript dan build bundle produksi ke folder `/dist` |
| `npm run test` | Menjalankan suite pengujian unit (Vitest) |
| `npm run typecheck` | Menjalankan validasi tipe TypeScript (`tsc --noEmit`) tanpa kompilasi |
| `npm run lint` | Menjalankan linting kode ESLint flat-config |
| `npm run validate:data` | Memvalidasi integritas file `graph.json` (ID, orphan node, docsUrl HTTPS) |
| `npm run check:urls` | Menguji ketersediaan HTTP langsung dari seluruh `docsUrl` |

---

## 📁 Struktur Direktori

```
role-network/
├── .github/
│   ├── pull_request_template.md    # Template PR kontribusi
│   └── workflows/
│       ├── ci.yml                  # CI Quality Gate (test, lint, typecheck, build)
│       ├── deploy.yml              # Deployment otomatis GitHub Pages
│       └── weekly-docs-check.yml   # Pengecekan mingguan tautan docs resmi
├── public/
│   └── favicon.svg                 # Favicon graf vektor interaktif
├── scripts/
│   ├── checkDocsUrls.ts            # Skrip pemeriksa responsibilitas tautan docs
│   └── validateData.ts             # Skrip validasi integritas dataset graf
├── src/
│   ├── components/
│   │   ├── AboutModal.tsx          # Modal dialog informasi proyek & cara berkontribusi
│   │   ├── AccessibleTreeView.tsx  # Alternatif tampilan pohon hierarki non-kanvas
│   │   ├── DetailPanel.tsx         # Panel samping detail peran, stack, & tracker
│   │   ├── NetworkGraph.tsx        # Wrapper Cytoscape.js dengan layout deterministik
│   │   ├── SearchBar.tsx           # Pencarian fuzzy dan filter tipe/kategori
│   │   ├── graphStyles.ts          # Stylesheet tema cyber-network
│   │   └── layoutCalculator.ts     # Kalkulator posisi radial konsentris deterministik
│   ├── data/
│   │   ├── graph.json              # Basis data graf statis terverifikasi
│   │   ├── loadGraph.ts            # Data loader bertipe dengan validasi runtime dev
│   │   ├── searchAndProgress.ts    # Algoritma fuzzy search & kalkulasi progres
│   │   ├── searchAndProgress.test.ts # Unit test pencarian & progres
│   │   ├── traversal.ts            # Traversal graf rekursif & topological sorting
│   │   ├── traversal.test.ts       # Unit test traversal & pemilahan stack
│   │   └── validator.ts            # Aturan validasi integritas data graf
│   ├── state/
│   │   ├── graphState.ts           # State reducer untuk progressive disclosure
│   │   └── useProgress.ts          # State hook untuk progress tracker (localStorage)
│   ├── types/
│   │   └── graph.ts                # Definisi tipe TypeScript lengkap
│   ├── App.tsx                     # Komponen utama aplikasi
│   ├── index.css                   # Directive Tailwind CSS
│   └── main.tsx                    # Titik masuk React 18 DOM
├── CONTRIBUTING.md                 # Panduan kontribusi data dan kode
├── package.json                    # Konfigurasi dependensi dan skrip proyek
├── tailwind.config.js              # Konfigurasi Tailwind CSS
├── tsconfig.json                   # Konfigurasi TypeScript strict mode
└── vite.config.ts                  # Konfigurasi bundler Vite
```

---

## 🗺️ Roadmap Pengembangan Domain

- [x] **Fase 1**: Fondasi & Skema Data Web Development
- [x] **Fase 2**: Render Graf Interaktif Deterministik & Progressive Disclosure
- [x] **Fase 3**: Panel Detail Peran & Rekomendasi Urutan Belajar
- [x] **Fase 4**: Fuzzy Search Bar, Penyorotan Jalur, & Pelacak Progres
- [x] **Fase 5**: Aksesibilitas, CI/CD, Pengecekan Docs Berkala, & Deployment
- [ ] **Rilis Mendatang (Domain Baru)**:
  - 📊 **Data Engineering & Data Science**: Python, SQL, Spark, Airflow, Pandas, MLflow.
  - 🔒 **Cybersecurity**: Network Security, Penetration Testing, SOC Analyst, Cryptography.
  - ☁️ **Cloud & DevOps**: Linux, Docker, Kubernetes, Terraform, AWS, CI/CD.
  - 📱 **Mobile Development**: Kotlin, Swift, Flutter, React Native.

---

## 🤝 Berkontribusi

Ingin menambahkan peran atau teknologi baru? Silakan baca panduan lengkap di [CONTRIBUTING.md](CONTRIBUTING.md).
Semua kontributor dipersilakan untuk mengirimkan Pull Request!

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE).
