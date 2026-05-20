const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

const libAuthContext = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

// 1. Create src/hooks/useAuth.ts
const useAuthContent = `import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  authId: string;
  tenantId: string;
  storeId: string;
  role: string;
  name: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: AdminUser | null;
  tenantId: string;
  storeId: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
`;

fs.writeFileSync('src/hooks/useAuth.ts', useAuthContent);

// 2. Modify src/lib/AuthContext.tsx to import from useAuth
let authProviderContent = libAuthContext
  .replace(/export interface AdminUser[\s\S]*?}\n/, '')
  .replace(/export interface AuthContextValue[\s\S]*?}\n/, '')
  .replace(/const AuthContext = createContext<AuthContextValue \| null>\(null\);\n/, '')
  .replace(/export function useAuth\(\): AuthContextValue {[\s\S]*?}\n/, '');

authProviderContent = `import { AuthContext, type AdminUser, type AuthContextValue } from '../hooks/useAuth';\n` + authProviderContent;
fs.writeFileSync('src/lib/AuthProvider.tsx', authProviderContent);
fs.unlinkSync('src/lib/AuthContext.tsx');

// 3. Update all imports
const files = glob.sync('src/**/*.{ts,tsx}');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('/lib/AuthContext')) {
    // If it imports AuthProvider, it needs /lib/AuthProvider
    // If it imports useAuth, it needs /hooks/useAuth
    
    // First, split into two if both are imported (rare, but just in case)
    if (content.includes('AuthProvider')) {
      content = content.replace(/import\s+{([^}]*?AuthProvider[^}]*?)}\s+from\s+['"]([^'"]*?)\/lib\/AuthContext['"]/, (match, p1, p2) => {
        return `import { ${p1} } from '${p2}/lib/AuthProvider'`;
      });
      changed = true;
    }
    
    if (content.includes('useAuth') || content.includes('AuthContextValue')) {
      content = content.replace(/import\s+{([^}]*?useAuth[^}]*?)}\s+from\s+['"]([^'"]*?)\/lib\/AuthContext['"]/, (match, p1, p2) => {
        return `import { ${p1} } from '${p2}/hooks/useAuth'`;
      });
      content = content.replace(/import\s+{([^}]*?useAuth[^}]*?)}\s+from\s+['"]([^'"]*?)\/lib\/AuthProvider['"]/, (match, p1, p2) => {
        return `import { ${p1} } from '${p2}/hooks/useAuth'`;
      });
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated imports in', file);
  }
}
