<div align="center">

<img src="docs/assets/logo.png" alt="Lucky Store POS" width="200">

# Lucky Store POS

A free, open-source Point of Sale system built for retail shops in Bangladesh

bKash Payments • Offline-First • Bangla Interface • Bluetooth Label Printing • 
Real-Time Inventory • AI Price Monitoring

[![🚀 Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-adminweb--blond.vercel.app-000000?style=for-the-badge&logo=vercel)](https://adminweb-blond.vercel.app/)
[![⬇️ Download APK](https://img.shields.io/badge/⬇️%20Download%20APK-Latest%20Release-32CD32?style=for-the-badge&logo=github)](https://github.com/saaedimam/luckystorePOS/releases)

</div>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/saaedimam/luckystorePOS/ci.yml?style=flat-square&logo=github&label=CI" alt="Build">
  <img src="https://img.shields.io/badge/version-1.0.0-32CD32?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20Web%2FPWA-6C757D?style=flat-square&logo=android" alt="Platform">
  <img src="https://img.shields.io/badge/Flutter-3.29.3-02569B?style=flat-square&logo=flutter" alt="Flutter">
  <img src="https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-Apache--2.0-32CD32?style=flat-square&logo=apache" alt="License">
</p>

---

## 🤔 Why Lucky Store POS?

Lucky Store POS is purpose-built for the reality of Bangladeshi retail: intermittent 
internet, bKash dominance, thermal label culture, and the need for both Bangla and English 
at the counter.

| Feature | **Lucky Store POS** | Traditional POS | Cloud-Only POS |
|:--------|:-------------------|:----------------|:---------------|
| **Offline Mode** | Full offline with Drift SQLite; auto-syncs | Paper fallback only | Stops working |
| **bKash Payments** | Native bKash checkout built-in | Manual reconciliation | Not available |
| **SSLCommerz Cards** | Integrated card + mobile banking | Separate terminal | Generic support |
| **Bluetooth Label Printing** | MHT-P29L TSPL, Code128, 40x30mm | Manual price tagging | Not supported |
| **Bangla Interface** | English + Bangla with HindSiliguri | English-only | English-only |
| **Competitor Price Monitoring** | AI-powered scraping | Not available | Not available |
| **Multi-Tenant Security** | Supabase RLS with tenant isolation | Basic auth | Basic auth |
| **Cost** | Free & Open Source | License fees + hardware | Monthly SaaS |

---

## 📸 Screenshots

<div align="center">

<img src="docs/screenshots/admin_dashboard_loaded.png" alt="Admin Dashboard" width="90%">
<br>
<em>Admin Dashboard — Live sales analytics & business metrics</em>

<br><br>

<img src="docs/screenshots/mobile_pos.png" alt="Mobile POS" width="300">
<br>
<em>Mobile POS — Offline-first Flutter app with barcode scanning</em>

</div>

---

## ✨ Features

### 📱 Mobile POS (Flutter)

| Sales Management | Barcode Scanning | Offline Mode |
|:----------------:|:---------------:|:------------:|
| Cash, bKash, Card & Credit | Camera-based (Code128, EAN-13, QR) | Drift SQLite with background sync |

| Inventory Tracking | Label Printing | Localization |
|:------------------:|:-------------:|:------------:|
| Real-time stock + low-stock alerts | MHT-P29L Bluetooth, TSPL, 40×30mm | English + Bangla (HindSiliguri) |

| PIN-Based Auth | Manager Dashboard | Store Operations |
|:-------------:|:-----------------:|:----------------:|
| Staff PIN via Supabase RPC | Close review, risk analytics | Open/close shifts, cash reconciliation |

<details>
<summary><strong>🔍 Offline-First Architecture</strong></summary>

<br>

- **Drift (SQLite ORM)** for full local product catalog, cart, and sale recording
- **Background sync** via WorkManager + flutter_background_service
- **Conflict resolution** with idempotency keys and server-authoritative override
- **Feature toggle:** `ENABLE_OFFLINE_MODE=true`

See: [Conflict Resolution Policy](docs/conflict_resolution_policy.md)

</details>

<details>
<summary><strong>🔍 Payment Methods</strong></summary>

<br>

- **Cash** — default tender with change calculation
- **bKash** — native mobile banking checkout flow
- **SSLCommerz** — card payments (Visa, Mastercard) + mobile banking gateways
- **Credit** — customer ledger posting for deferred payment
- **Split payments** — multiple tenders per sale

</details>

<details>
<summary><strong>🔍 Bluetooth Label Printing (MHT-P29L)</strong></summary>

<br>

- Bluetooth connection via `flutter_blue_plus`
- TSPL command format for MHT-P29L thermal printers
- Code128 barcode generation via `barcode_widget`
- 40×30mm labels with MRP strikethrough pricing
- Bulk printing from CSV files

</details>

<details>
<summary><strong>🔍 Barcode Scanning</strong></summary>

<br>

- Camera-based scanning via `mobile_scanner` package
- Supports Code128, EAN-13, and QR code formats
- Instant product lookup in POS flow
- Auto-barcode generation (EAN-13) on product import

</details>

---

### 💻 Admin Web (React + Vite + TypeScript)

| Analytics Dashboard | POS Checkout | Product Management |
|:------------------:|:-----------:|:-----------------:|
| Sales trends, Recharts, low-stock alerts | Cart checkout, barcode lookup, receipt preview | Category thumbnails, grid/list, image upload |

| Inventory Control | Finance Ledgers | Collections |
|:-----------------:|:--------------:|:-----------:|
| Real-time stock, adjust/history | Supplier payables + Customer receivables with aging | Overdue follow-ups, payment tracking |

| Purchase Management | Expense Tracking | PWA Support |
|:------------------:|:--------------:|:-----------:|
| Purchase entry, receiving, history | Pie/bar charts, 6 categories, 4 payment types | Installable, offline caching |

<details>
<summary><strong>🔍 Dashboard & Analytics</strong></summary>

<br>

- **5 MetricCards:** To Receive, To Give, Today Sales, Stock Purchases, Expense
- **Custom bar chart:** Sales vs Expenses vs Stock Purchases (14-day view)
- **Payment breakdown:** Cash/bKash/Credit with percentage progress bars
- **Low-stock alerts** and **upcoming reminders** widgets
- **Realtime toast notifications** on new sales via Supabase Realtime

</details>

<details>
<summary><strong>🔍 Finance, Ledgers & Collections</strong></summary>

<br>

- **Supplier Ledger** — payables, aging summary, transaction history
- **Customer Ledger** — receivables, credit history, balance tracking
- **Collections Workspace** — overdue customer list with days-overdue, 
  promise-to-pay dates, quick actions (call/SMS/note/payment)
- **Expense Tracking** — pie + bar charts (Recharts), 6 categories, 4 payment types
- **Daily Sales** — end-of-day manual entry with line+bar charts

</details>

<details>
<summary><strong>🔍 PWA (Progressive Web App)</strong></summary>

<br>

- Installable on desktop, tablet, and mobile — no app store needed
- Service worker with offline caching (custom Vite build via `build-sw.mjs`)
- Install prompt banner and offline indicator
- Works on any modern browser

</details>

---

### 🔐 Backend & Security (Supabase)

| Dimension | Count |
|:----------|:-----|
| Database tables | 50+ |
| SQL migrations | 80+ |
| Stored procedures (RPCs) | 80+ |
| Edge functions (Deno) | 17 |
| RLS policies | Tenant-isolated on every table |

<details>
<summary><strong>🔍 Edge Functions</strong></summary>

<br>

| Function | Purpose |
|:---------|:--------|
| `create-sale` | Rate-limited sale creation with input validation, auth verification, and `complete_sale` RPC |
| `adjust-stock` | Stock adjustment with configurable CORS |
| `import-inventory` | CSV/XLSX import with auto-barcode (EAN-13), image upload, batch/expiry tracking, audit trail |
| `create-card-checkout` | SSLCommerz card checkout session initiation |
| `create-bkash-checkout` | bKash payment processing |
| `payment-ipn` | SSLCommerz Instant Payment Notification validator |
| `payment-return-success` | SSLCommerz success callback handler |
| `payment-return-fail` | SSLCommerz failure callback handler |
| `payment-return-cancel` | SSLCommerz cancellation callback handler |
| `notify-order` | Order notifications via multiple channels |
| `send-invoice` | Invoice delivery automation |
| `send-whatsapp-message` | WhatsApp messaging integration |
| `whatsapp-order-notify` | WhatsApp order alerts |
| `stitch-orchestrator` | Data stitching and orchestration |
| `sync-alert-bridge` | Sync alerting and monitoring |

</details>

<details>
<summary><strong>🔍 Security Architecture</strong></summary>

<br>

- **Tenant-Isolated Row-Level Security** — every table has RLS policies isolating data per store
- **Multi-tenant** — single Supabase project serves unlimited stores
- **PIN-based staff auth** via `authenticate_staff_pin` RPC
- **Service role key** used only in edge functions; anon key for client operations
- **Rate limiting** via database-backed `rate_limits` table

See: [RLS Security Model](docs/RLS_SECURITY_MODEL.md)

</details>

<details>
<summary><strong>🔍 SSLCommerz Payment Flow</strong></summary>

<br>

1. **Edge function** creates checkout session with sale details
2. **Redirect** to SSLCommerz hosted payment page
3. **IPN edge function** processes SSLCommerz callback (validates, records payment)
4. **Success/fail/cancel** return handlers update sale status
5. Supports **Visa, Mastercard, bKash, Nagad, Rocket** through a single gateway

</details>

---

### 🕵️ Competitor Price Monitoring

<details>
<summary><strong>🔍 AI-Powered Scraping of Bangladeshi Retailers</strong></summary>

<br>

- **Puppeteer-based scraping** of major Bangladeshi retailers:
  - **Shwapno** — Bangladesh's largest retail chain
  - **Chaldal** — leading online grocery (per-category: biscuits, chocolates, beverages, etc.)
  - **AamaderBazar** — competitive pricing data
  - **Unilever Bangladesh** — brand-level pricing
- **AI product mapping** via string-similarity algorithms
- **Price comparison generation** for reporting and competitive analysis

Run: `cd apps/scraper && npm run update-prices`

</details>

---

## 🛠 Tech Stack

### Mobile

![Flutter](https://img.shields.io/badge/Flutter-3.29.3-02569B?style=flat-square&logo=flutter)
![Dart](https://img.shields.io/badge/Dart-≥3.7.2-00B4AB?style=flat-square&logo=dart)
![Provider](https://img.shields.io/badge/Provider-State%20Mgmt-FF5722?style=flat-square)
![Drift](https://img.shields.io/badge/Drift-SQLite%20ORM-3ECF8E?style=flat-square)
![Supabase Flutter](https://img.shields.io/badge/supabase_flutter-Auth%2FDB-3ECF8E?style=flat-square&logo=supabase)
![Bluetooth](https://img.shields.io/badge/flutter_blue_plus-Bluetooth-0082FC?style=flat-square&logo=bluetooth)
![Scanner](https://img.shields.io/badge/mobile_scanner-Barcode-FF9800?style=flat-square)
![Charts](https://img.shields.io/badge/fl_chart-DataViz-2196F3?style=flat-square)
![Background](https://img.shields.io/badge/workmanager-Scheduling-4CAF50?style=flat-square)
![Fonts](https://img.shields.io/badge/google_fonts-Typography-4285F4?style=flat-square)
![Barcode](https://img.shields.io/badge/barcode_widget-Generation-9C27B0?style=flat-square)
![PDF](https://img.shields.io/badge/pdf-Reports-F44336?style=flat-square)
![Excel](https://img.shields.io/badge/excel-Data%20Export-217346?style=flat-square)

### Web

![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)
![Router](https://img.shields.io/badge/React%20Router-7-CA4245?style=flat-square&logo=reactrouter)
![Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154?style=flat-square)
![Virtual](https://img.shields.io/badge/TanStack%20Virtual-3-FF4154?style=flat-square)
![Recharts](https://img.shields.io/badge/Recharts-3-22B5BF?style=flat-square)
![Forms](https://img.shields.io/badge/React%20Hook%20Form-7-EC5990?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-4-3E67B1?style=flat-square)
![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565?style=flat-square)

### Backend

![Supabase](https://img.shields.io/badge/Supabase-Production-3ECF8E?style=flat-square&logo=supabase)
![Postgres](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql)
![Deno](https://img.shields.io/badge/Deno-Edge%20Functions-000000?style=flat-square&logo=deno)
![RLS](https://img.shields.io/badge/RLS-Security-4CAF50?style=flat-square)
![Realtime](https://img.shields.io/badge/Realtime-Subscriptions-FF9800?style=flat-square)

### DevOps

![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?style=flat-square&logo=githubactions)
![Vercel](https://img.shields.io/badge/Vercel-Hosting-000000?style=flat-square&logo=vercel)

### Scraper

![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=flat-square&logo=nodedotjs)
![Puppeteer](https://img.shields.io/badge/Puppeteer-Scraping-40B5A4?style=flat-square)
![XLSX](https://img.shields.io/badge/xlsx-Data%20Processing-217346?style=flat-square)

---

## 🚀 Quick Start

### Prerequisites

| Tool | Minimum Version | Check Command |
|:-----|:---------------|:--------------|
| Flutter SDK | ≥ 3.29.3 | `flutter --version` |
| Node.js | ≥ 20.0.0 | `node --version` |
| npm | ≥ 10.0.0 | `npm --version` |
| Supabase CLI | ≥ 1.0.0 | `supabase --version` |

### Setup

```bash
# 1. Clone and configure
git clone https://github.com/saaedimam/luckystorePOS.git
cd luckystorePOS
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 2. Start Supabase locally (optional — skip to use remote staging)
supabase db reset

# 3. Run the Flutter mobile app
cd apps/mobile_app
flutter pub get
flutter run

# 4. Run the admin web dashboard
cd apps/admin_web
npm install
npm run dev                  # Opens at http://localhost:5173/admin/

```

> seed credentials, and local vs. remote Supabase mode, see the **[Developer Runbook](docs/DEVELOPER.md)**.

---

## 📁 Project Structure

```
luckystorePOS/
├── apps/
│   ├── admin_web/           # React + Vite admin dashboard
│   ├── customer_storefront/ # Next.js customer storefront
│   ├── mobile_app/          # Flutter POS app
│   ├── scraper/             # Puppeteer price scraper
│   └── store/               # Store management app
├── supabase/
│   ├── functions/           # 17 Deno edge functions
│   ├── migrations/          # 80+ SQL migration files
│   └── config.toml          # Local configuration
├── .ai/                     # AI command center
│   ├── AI_TASKS.md          # Task queue
│   ├── llm_config.json      # Model routing
│   ├── .vibe-config.json     # Vibe coding rules
│   ├── prompts/             # Reusable AI prompts
│   ├── antigravity/         # IDE integration docs
│   └── memory/              # Session backups
├── .vibe/                   # Vibe coding workspace
│   ├── current/             # Active session
│   └── history/             # Archived sessions
├── .antigravity/            # IDE configuration
├── .agents/                 # AI agent configuration
├── .gemini/                 # Gemini token optimizer
├── .hermes/                 # Antigravity memory hub
├── scripts/                 # Build, deploy, governance, safety
│   └── dev/                 # AI helper, sync, checkpoint, vibe-start
├── infra/                   # Migration replay infrastructure
├── artifacts/               # Build certification & lineage
├── docs/                    # Documentation
│   ├── architecture/        # System docs
│   ├── runbooks/            # Operational guides
│   └── vibe-guides/         # React/Flutter/Supabase patterns
├── data/                    # Inventory CSVs & assets
├── landing/                 # Marketing page
└── [root config files]
```

---

## 🚢 Deployment

<details>
<summary><strong>🔍 Vercel (Admin Web — Live Now)</strong></summary>

<br>

- **Live Admin Dashboard:** [adminweb-blond.vercel.app](https://adminweb-blond.vercel.app/)
- Connected to real pre-production Supabase staging database
- Build command: `cd apps/admin_web && npm run build`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

</details>

<details>
<summary><strong>🔍 Android APK</strong></summary>

<br>

- CI builds debug APK on every push to `main`/`develop`
- Release APKs: [GitHub Releases](https://github.com/saaedimam/luckystorePOS/releases)
- Google Play Store listing: planned

</details>

<details>

<br>

- Multi-stage build: Node 22 Alpine builds React app → Nginx 1.27 Alpine serves it
- Non-root `appuser` (UID 1001) for security
- Health check configured on port 80

</details>

<details>
<summary><strong>🔍 Supabase Production</strong></summary>

<br>

```bash
supabase link --project-ref <your-project-ref>
supabase db push              # Apply all migrations
supabase functions deploy <name>  # Deploy edge functions
```

Set required secrets on each edge function:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `ALLOWED_ORIGIN` — for CORS

</details>

---

## 📖 Documentation

| Document | Purpose |
|:---------|:--------|
| [RLS Security Model](docs/RLS_SECURITY_MODEL.md) | Row-level security architecture |
| [Offline Sync Implementation](docs/OFFLINE_SYNC_IMPLEMENTATION.md) | Offline-first sync design |
| [Conflict Resolution Policy](docs/conflict_resolution_policy.md) | Offline sync conflict handling |
| [Branch Strategy](docs/BRANCH_STRATEGY.md) | Git workflow |

---

## 💬 Community & Support

| Channel | Contact |
|:--------|:--------|
| 📧 Email | luckystore.1947@gmail.com |
| 📞 Phone | 01731944544 |
| 🐛 Issues | [GitHub Issues](https://github.com/saaedimam/luckystorePOS/issues) |
| 💬 Discussions | [GitHub Discussions](https://github.com/saaedimam/luckystorePOS/discussions) |
| 📍 Address | 665 Percival Hill Road, Emdad Park, Chawkbazar, Chittagong, Bangladesh |

---

## 🤝 Contributing

We welcome contributions!

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes using conventional commits:
   ```bash
   git commit -m 'feat(pos): add split payment support'
   git commit -m 'fix(rls): tighten tenant isolation'
   git commit -m 'docs(readme): update deployment guide'
   ```
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

**Commit format:** `type(scope): message`

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).

---

## ⭐ Star History

<p align="center">
  <a href="https://www.star-history.com/#saaedimam/luckystorePOS&Date" target="_blank">
    <img src="https://api.star-history.com/svg?repos=saaedimam/luckystorePOS&type=Date" 
         alt="Star History" width="600">
  </a>
</p>

## Contributors

<p align="center">
  <a href="https://github.com/saaedimam/luckystorePOS/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=saaedimam/luckystorePOS&max=100" 
         alt="Contributors" />
  </a>
</p>

<div align="center">

**If you find this useful, give us a star ⭐**

[Report Bug](https://github.com/saaedimam/luckystorePOS/issues) · 
[Request Feature](https://github.com/saaedimam/luckystorePOS/issues)

</div>
