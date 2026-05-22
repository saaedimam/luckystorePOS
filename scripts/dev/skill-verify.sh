#!/bin/bash
# Lucky Store POS Guardian — Skill System Verification
# Compliant with MASTER_RULES v2026.05.22-v1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ADMIN_WEB_DIR="$PROJECT_ROOT/apps/admin_web"
SKILLS_DIR="$ADMIN_WEB_DIR/src/lib/ai/skills"

echo "🔍 Lucky Store POS Guardian — Skill System Verification"
echo "======================================================"
echo ""

ERRORS=0

# Check Layer 0 Core Runtime
echo "📦 Checking Layer 0: Core Runtime..."
if [ -f "$SKILLS_DIR/_core/types.ts" ]; then
    echo "   ✅ types.ts exists"
else
    echo "   ❌ types.ts missing"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "$SKILLS_DIR/_core/runner.ts" ]; then
    echo "   ✅ runner.ts exists"
else
    echo "   ❌ runner.ts missing"
    ERRORS=$((ERRORS + 1))
fi

# Check Skill 1: supabase-schema-guardian
echo "📦 Checking Skill 1: supabase-schema-guardian..."
if [ -f "$SKILLS_DIR/supabase-schema-guardian/index.ts" ]; then
    echo "   ✅ supabase-schema-guardian/index.ts exists"
else
    echo "   ❌ supabase-schema-guardian/index.ts missing"
    ERRORS=$((ERRORS + 1))
fi

# Check Skill 2: pos-domain-expert
echo "📦 Checking Skill 2: pos-domain-expert..."
if [ -f "$SKILLS_DIR/pos-domain-expert/index.ts" ]; then
    echo "   ✅ pos-domain-expert/index.ts exists"
else
    echo "   ❌ pos-domain-expert/index.ts missing"
    ERRORS=$((ERRORS + 1))
fi

# Check Skill 3: offline-sync-doctor
echo "📦 Checking Skill 3: offline-sync-doctor..."
if [ -f "$SKILLS_DIR/offline-sync-doctor/index.ts" ]; then
    echo "   ✅ offline-sync-doctor/index.ts exists"
else
    echo "   ❌ offline-sync-doctor/index.ts missing"
    ERRORS=$((ERRORS + 1))
fi

# Check Skill 4: bangla-localization
echo "📦 Checking Skill 4: bangla-localization..."
if [ -f "$SKILLS_DIR/bangla-localization/index.ts" ]; then
    echo "   ✅ bangla-localization/index.ts exists"
else
    echo "   ❌ bangla-localization/index.ts missing"
    ERRORS=$((ERRORS + 1))
fi

# Check Barrel Export
echo "📦 Checking barrel export..."
if [ -f "$SKILLS_DIR/index.ts" ]; then
    echo "   ✅ skills/index.ts exists"
else
    echo "   ❌ skills/index.ts missing"
    ERRORS=$((ERRORS + 1))
fi

# Check Runtime Bootstrap
echo "📦 Checking runtime bootstrap..."
if [ -f "$SKILLS_DIR/runtime-bootstrap.ts" ]; then
    echo "   ✅ runtime-bootstrap.ts exists"
else
    echo "   ❌ runtime-bootstrap.ts missing"
    ERRORS=$((ERRORS + 1))
fi

# Check exports in main AI index
echo "📦 Checking main AI module exports..."
if grep -q "Lucky Store POS Guardian" "$ADMIN_WEB_DIR/src/lib/ai/index.ts"; then
    echo "   ✅ Skill system exports added to index.ts"
else
    echo "   ❌ Skill system exports missing from index.ts"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "======================================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Skill System Compliant"
    echo "   All 4 skills + Layer 0 runtime installed"
    echo "   Exit code: 0"
    exit 0
else
    echo "❌ Skill System Incomplete"
    echo "   $ERRORS file(s) missing"
    echo "   Exit code: 1"
    exit 1
fi
