# Lucky Store Frontend

React + TypeScript + Vite application for the Lucky Store POS system.

## Project Structure

```
apps/frontend/
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

- Monorepo docs live at the repo root: [`docs/`](../../docs/) (setup, import, POS, deployment).
- Shared SQL snippets and ops scripts: [`scripts/`](../../scripts/) (especially `scripts/db/`).

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Supabase** - Backend services
