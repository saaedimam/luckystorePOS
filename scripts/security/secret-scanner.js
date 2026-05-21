#!/usr/bin/env node
/**
 * Secret Scanner - Pre-commit Hook
 * Scans staged files for potential credential leaks
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Secret patterns to detect
const SECRET_PATTERNS = [
  {
    name: 'Supabase Service Key',
    regex: /sbp_[a-zA-Z0-9]{40,}/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Supabase Anon Key',
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    severity: 'HIGH',
  },
  {
    name: 'PostgreSQL Connection String',
    regex: /postgres(?:ql)?:\/\/(?:[^\s:@]+:[^\s:@]+@[^\s:@]+:\d+\/[^\s]+)/gi,
    severity: 'CRITICAL',
  },
  {
    name: 'Database URL with Password',
    regex: /DATABASE_URL\s*=\s*[^\s]*(?:password|pwd)[^\s]*/gi,
    severity: 'CRITICAL',
  },
  {
    name: 'API Key (Generic)',
    regex: /(?:api[_-]?key|apikey)\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi,
    severity: 'HIGH',
  },
  {
    name: 'Private Key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
  },
  {
    name: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
  },
  {
    name: 'GitHub Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Slack Token',
    regex: /xox[baprs]-[a-zA-Z0-9-]+/g,
    severity: 'HIGH',
  },
  {
    name: 'JWT Token',
    regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'MEDIUM',
  },
];

// Files to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.husky\//,
  /scripts\/security\/secret-scanner\.js$/, // Don't scan self
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function scanFile(filePath) {
  const findings = [];

  if (shouldIgnoreFile(filePath)) {
    return findings;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern.regex);
      if (matches) {
        findings.push({
          file: filePath,
          pattern: pattern.name,
          severity: pattern.severity,
          matches: matches.slice(0, 3), // Limit to first 3 matches
        });
      }
    }
  } catch (error) {
    // Skip files that can't be read (binary, etc.)
    if (error.code !== 'ENOENT') {
      console.error(`Warning: Could not read ${filePath}: ${error.message}`);
    }
  }

  return findings;
}

function printError(message) {
  console.error(`${RED}${BOLD}${message}${RESET}`);
}

function main() {
  // Get files from command line arguments
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log('No files to scan.');
    process.exit(0);
  }

  console.log(`🔍 Scanning ${files.length} file(s) for secrets...\n`);

  const allFindings = [];

  for (const file of files) {
    const findings = scanFile(file);
    allFindings.push(...findings);
  }

  if (allFindings.length > 0) {
    printError('🔴 ERROR: Leaked Secret Detected');
    printError('═══════════════════════════════════════\n');

    for (const finding of allFindings) {
      console.error(`${RED}[${finding.severity}]${RESET} ${finding.pattern}`);
      console.error(`  File: ${finding.file}`);
      if (finding.matches) {
        console.error(`  Match: ${finding.matches[0].substring(0, 50)}...`);
      }
      console.error('');
    }

    printError('═══════════════════════════════════════');
    printError('Commit blocked. Remove secrets before committing.');
    printError('If this is a false positive, use: git commit --no-verify');

    process.exit(1);
  }

  console.log('✅ No secrets detected. Proceeding with commit...');
  process.exit(0);
}

main();
