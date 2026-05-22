// Skill 4: bangla-localization
// Pain points covered: #3 (bad Bangla output)
// Compliant with MASTER_RULES v2026.05.22-v1

import { registerSkill } from '../_core/runner';

const L10N_CONTEXT = `
## Bangla Localization Rules (Lucky Store BD)
- Font: HindSiliguri (Flutter), loaded via Google Fonts
- ARB file: apps/mobile_app/lib/l10n/app_bn.arb
- Number format: Bengali numerals in UI labels (১২৩), Latin in input fields (123)
- Currency: ৳ symbol prefix, 2 decimal places — e.g., ৳১২০.০০
- Date format: DD/MM/YYYY — no MM-DD-YYYY
- Text direction: LTR (Bengali is LTR — never apply RTL)
- Do NOT auto-translate UI strings — add to ARB file and use AppLocalizations.of(context)
- Payment labels: bKash = "বিকাশ", Cash = "নগদ টাকা", Card = "কার্ড"
`.trim();

registerSkill('bangla-localization', (phase, ctx) => {
  const isL10NFile = ctx.activeFile?.includes('l10n')
    || ctx.activeFile?.includes('app_bn.arb')
    || ctx.prompt.match(/bangla|bengali|বাংলা|HindSiliguri|l10n/i);

  if (phase === 'PRE_PROMPT' && isL10NFile) {
    return { blocked: false, injectedContext: L10N_CONTEXT };
  }

  if (phase === 'PRE_TOOL') {
    const content = (ctx.toolInput?.content as string) ?? '';

    if (content.includes('Directionality.rtl') || content.includes('TextDirection.rtl')) {
      return {
        blocked: true,
        reason: 'L10N: Bengali is LTR — RTL direction is incorrect for this locale'
      };
    }

    if (content.match(/["']bn["']/) && !content.includes('AppLocalizations')) {
      return {
        blocked: false,
        warning: 'L10N: Hardcoded Bengali string detected — use AppLocalizations.of(context) instead'
      };
    }
  }

  return { blocked: false };
});
