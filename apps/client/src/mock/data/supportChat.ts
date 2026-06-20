/**
 * Mock support-chat strings (merchant-facing).
 *
 * Frontend-safe, Persian-first demo copy used to seed the mock support conversation. In a real
 * deployment these messages come from a human support agent (already localized) via the backend
 * and the admin inbox; here they are static demo text. No secrets, no PII.
 */
export const supportChatStrings = {
  subject: 'گفتگو با پشتیبانی',
  agentLabel: 'تیم پشتیبانی',
  greeting: 'سلام! چطور می‌تونیم کمکت کنیم؟',
  autoReply: 'ممنون از پیامت — همکاران ما به‌زودی پاسخ می‌دهند.',
} as const;
