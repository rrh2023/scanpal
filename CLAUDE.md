# ScanPal

## Stack
- React Native + Expo SDK 52
- Supabase (auth + DB + storage)
- RevenueCat (subscriptions)
- Anthropic API using claude-haiku-4-5 for AI features
- Google ML Kit for on-device OCR

## Rules
- Always use TypeScript with strict mode
- Free tier: 10 scans/month, watermarked exports
- Pro tier: unlimited scans, no watermark, solver, summarizer
- Never make Anthropic API calls from the client — route through Supabase Edge Functions


## Folder structure
app/
├── (auth)/login.tsx, signup.tsx
├── (tabs)/scan.tsx, history.tsx, settings.tsx
├── mode-select.tsx
├── result.tsx
└── paywall.tsx
components/Scanner/, Result/, UI/
lib/supabase.ts, revenuecat.ts, anthropic.ts, ocr.ts
store/authStore.ts, scanStore.ts
supabase/functions/solve/, functions/summarize/, migrations/
constants/config.ts