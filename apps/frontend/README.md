# Lucky Store Frontend

React + TypeScript + Vite application for the Lucky Store POS system.

## Project Structure

```
frontend/
├── docs/                    # Documentation files
│   ├── ARCHITECTURE.md
│   ├── AUTH-SETUP.md
│   ├── DEBUG-*.md
│   └── ...
├── scripts/                 # SQL scripts and utilities
│   ├── CREATE-PROFILE-*.sql
│   └── FIX-RLS-POLICY.sql
├── src/
│   ├── components/         # React components
│   │   ├── pos/           # POS-specific components
│   │   └── ...
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and service layer
│   └── utils/             # Utility functions
├── public/                 # Static assets
└── [config files]          # Vite, TypeScript, ESLint configs
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Documentation

- See `docs/` folder for setup guides, architecture documentation, and troubleshooting guides
- SQL scripts for database setup are in `scripts/` folder

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Supabase** - Backend services
