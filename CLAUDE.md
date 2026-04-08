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