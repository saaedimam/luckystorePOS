# Lucky Store POS - Complete Directory Tree

This document provides a comprehensive overview of the project structure, including all hidden folders, dotfiles, and nested directories up to depth 4.

---

```text
luckystorePOS/
├── .agents/                          # AI agent configuration
│   └── skills/
├── .gemini/                          # Gemini AI integration
│   └── skills/
│       └── token-optimizer/
│           ├── assets/
│           ├── examples/
│           ├── references/
│           └── scripts/
├── .github/                          # GitHub configuration
│   └── workflows/
│       ├── apk-release.yml
│       ├── ci.yml
│       ├── distributed-evals.yml
│       ├── flutter-ci.yml
│       ├── migration-replay.yml
│       ├── replay-governance.yml
│       └── scraper-daily.yml
├── .hermes/                          # Antigravity memory hub
│   ├── memory-hub/
│   │   ├── forensics/
│   │   ├── governance/
│   │   ├── lineage/
│   │   └── repairs/
│   └── plans/
├── .idea/                            # JetBrains IDE config
│   ├── caches/
│   └── .gitignore
├── .learnings/                       # AI learning logs
├── .venv/                            # Python virtual environment
│   ├── bin/
│   ├── include/
│   └── lib/
├── .vercel/                          # Vercel deployment config
├── .vscode/                          # VS Code settings
├── apps/                             # Application source code
│   ├── admin_web/                    # React + Vite admin dashboard
│   │   ├── .storybook/
│   │   ├── .vercel/
│   │   ├── dist/
│   │   ├── node_modules/
│   │   ├── public/
│   │   ├── scripts/
│   │   └── src/
│   │       ├── app/
│   │       ├── assets/
│   │       ├── components/
│   │       ├── design-system/
│   │       ├── features/
│   │       ├── hooks/
│   │       ├── layouts/
│   │       ├── lib/
│   │       ├── routes/
│   │       ├── schemas/
│   │       ├── services/
│   │       ├── stores/
│   │       ├── styles/
│   │       ├── sw/
│   │       ├── theme/
│   │       ├── types/
│   │       └── utils/
│   ├── customer_storefront/          # Next.js storefront
│   │   ├── .next/
│   │   ├── node_modules/
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       ├── lib/
│   │       └── store/
│   ├── mobile_app/                   # Flutter POS app
│   │   ├── .dart_tool/
│   │   ├── android/
│   │   ├── assets/
│   │   │   └── fonts/
│   │   ├── build/
│   │   ├── coverage/
│   │   ├── integration_test/
│   │   ├── ios/
│   │   │   ├── Flutter/
│   │   │   ├── Runner/
│   │   │   ├── Runner.xcodeproj/
│   │   │   ├── Runner.xcworkspace/
│   │   │   └── RunnerTests/
│   │   ├── lib/
│   │   │   ├── config/
│   │   │   ├── core/
│   │   │   ├── demo/
│   │   │   ├── features/
│   │   │   ├── l10n/
│   │   │   ├── models/
│   │   │   ├── offline/
│   │   │   ├── shared/
│   │   │   ├── sync/
│   │   │   ├── telemetry/
│   │   │   ├── theme/
│   │   │   └── widgets/
│   │   ├── macos/
│   │   │   ├── Flutter/
│   │   │   ├── Runner/
│   │   │   ├── Runner.xcodeproj/
│   │   │   ├── Runner.xcworkspace/
│   │   │   └── RunnerTests/
│   │   ├── test/
│   │   │   ├── _deprecated/
│   │   │   ├── integration/
│   │   │   ├── load/
│   │   │   ├── offline/
│   │   │   ├── performance/
│   │   │   └── unit/
│   │   └── web/
│   │       └── icons/
│   ├── scraper/                      # Puppeteer price scraper
│   │   └── lib/
│   └── store/                        # Store management app
│       ├── .next/
│       ├── node_modules/
│       ├── public/
│       └── src/
│           ├── app/
│           ├── components/
│           └── lib/
├── artifacts/                        # Build artifacts & metadata
│   ├── certification/
│   ├── cleanup_archived_logs/
│   ├── governance/
│   ├── lineage/
│   ├── migration-replay/
│   ├── pre-reset/
│   ├── quarantine/
│   └── schema/
├── data/                             # Data files & CSVs
│   ├── Accounts/
│   ├── competitors/
│   ├── inventory/
│   └── samples/
├── docker/                           # Docker configuration
│   └── seed-db/
├── docs/                             # Documentation
│   ├── 01-getting-started/
│   ├── 02-setup/
│   ├── 03-import-system/
│   ├── 06-deployment/
│   ├── 07-reference/
│   ├── architecture/
│   ├── audits/
│   ├── design-system/
│   ├── root-docs/
│   ├── runbooks/
│   ├── screenshots/
│   └── testing/
├── evals/                            # Evaluation scripts
│   └── distributed/
├── figma_exports/                    # Design assets
│   ├── blob_store/
│   └── images/
├── Generate Design/                  # Design generation assets
│   ├── guidelines/
│   ├── src/
│   ├── supabase/
│   └── utils/
├── infra/                            # Infrastructure config
│   └── migration-replay/
├── landing/                          # Landing page
├── lib/                              # Shared libraries
│   └── features/
├── node_modules/                     # Root node_modules
├── scripts/                          # Utility scripts
│   ├── data/
│   ├── db/
│   ├── deploy/
│   ├── dev/
│   ├── evals/
│   ├── git/
│   ├── governance/
│   ├── lib/
│   ├── offline/
│   ├── ops/
│   ├── replay-certification/
│   │   └── artifacts/
│   ├── safety/
│   ├── seed/
│   ├── test/
│   └── tools/
│       └── price_tags/
├── skills/                           # MCP skills registry
├── supabase/                         # Supabase backend
│   ├── .branches/
│   ├── .temp/
│   ├── diagnostics/
│   ├── functions/                    # Edge functions
│   │   ├── _shared/
│   │   ├── .types/
│   │   ├── adjust-stock/
│   │   ├── create-bkash-checkout/
│   │   ├── create-card-checkout/
│   │   ├── create-sale/
│   │   ├── import-inventory/
│   │   ├── notify-order/
│   │   ├── payment-ipn/
│   │   ├── payment-return-cancel/
│   │   ├── payment-return-fail/
│   │   ├── payment-return-success/
│   │   ├── send-invoice/
│   │   ├── send-whatsapp-message/
│   │   ├── stitch-orchestrator/
│   │   ├── sync-alert-bridge/
│   │   └── whatsapp-order-notify/
│   ├── migration-docs/
│   ├── migrations/
│   ├── public/
│   │   └── policies/
│   ├── quarantined_migrations/
│   ├── rpc/
│   ├── snippets/
│   └── views/
├── test/                             # Root test files
│   ├── integration/
│   ├── load/
│   └── unit/
├── VibeCoderOutput/                  # AI code generation output
│   ├── code-map-generator/
│   ├── generated_task_lists/
│   └── rules-generator/
│
├── [ROOT FILES]
│
├── .contextignore                    # Context exclusion rules
├── .dockerignore                     # Docker ignore rules
├── .DS_Store                         # macOS metadata (hidden)
├── .editorconfig                     # Editor configuration
├── .env                              # Environment variables (gitignored)
├── .env.certify.local                # Local cert env
├── .env.certify.staging              # Staging cert env
├── .env.example                      # Env template
├── .env.local                        # Local env
├── .env.local.example                # Local env template
├── .gitattributes                    # Git attributes
├── .gitignore                        # Git ignore rules
├── .supabase-migration-sync           # Migration sync marker
├── .vibe-config.json                 # VibeCoder config
│
├── AGENTS.md                         # Agent configuration doc
├── AI_TASKS.md                       # AI task tracking
├── analysis_options.yaml             # Flutter analysis config
├── ARCHITECTURE.md                   # System architecture doc
├── ARTIFACTS_INDEX.md                # Artifacts documentation
├── CLAUDE.md                         # Claude AI context
├── context.md                        # Project context
├── DELIVERY_MANIFEST.md              # Delivery tracking
├── docker-compose.yml                # Docker orchestration
├── Dockerfile                        # Container definition
├── ENHANCEMENT_INTEGRATION_SUMMARY.md # Enhancement log
├── fix_and_seed.js                   # Seeding script
├── fix_store_location.sql            # Location fix SQL
├── GEMINI.md                         # Gemini integration doc
├── IMPLEMENTATION_SUMMARY.md         # Implementation notes
├── index.html                        # Root HTML
├── lint_report.json                  # Lint results
├── llm_config.json                   # LLM routing config
├── LICENSE                           # Apache 2.0 license
├── package.json                      # Root package.json
├── package-lock.json                 # Lockfile
├── PRIORITY_ENHANCEMENTS.md           # Priority features
├── privacy-policy.html               # Privacy policy
├── prod-ca-2021.crt                  # SSL certificate
├── README.md                         # Project readme
├── REPLAY_VERIFICATION_CHECKLIST.md  # Replay checklist
├── REPO_AUDIT.md                     # Security audit
├── run_migration.js                  # Migration runner
├── seed_test.js                      # Test seeder
├── SECURITY_RECOMMENDATIONS.md       # Security guide
├── skills-lock.json                  # Skills lockfile
├── STOREFRONT_ARCHITECTURE.md        # Storefront arch
├── STRATEGIC_ARCHITECTURE.md         # Strategic docs
├── terms-of-service.html             # ToS page
├── test_out.txt                      # Test output log
├── vercel.json                       # Vercel config
├── VERIFICATION_REPORT.md            # Verification report
│
└── vibe-session.log                  # Session log
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Directories** | ~250+ |
| **Hidden Folders** | 10 (`.agents`, `.gemini`, `.github`, `.git`, `.hermes`, `.idea`, `.learnings`, `.venv`, `.vercel`, `.vscode`) |
| **Applications** | 5 (`admin_web`, `customer_storefront`, `mobile_app`, `scraper`, `store`) |
| **Edge Functions** | 16 in `supabase/functions/` |
| **Documentation Sections** | 12 organized folders |
| **CI/CD Workflows** | 7 GitHub Actions |
| **Configuration Files** | 20+ dotfiles at root |

---

*Generated: 2026-05-21*
