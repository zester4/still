const PRIVACY_PATTERNS = [
  /\b(?:private|privacy|secure|security|confidential|confidentiality)\b/i,
  /\b(?:who can see|can someone see|anyone see|share|shares|shared|sharing|sell|selling|stored|store|data|delete|erase)\b/i,
  /\b(?:talk behind my back|gossip|spying|watching me)\b/i,
];

export function detectPrivacyQuestion(text: string): boolean {
  return PRIVACY_PATTERNS.some((pattern) => pattern.test(text));
}

export function privacyCompanionText(options: { zeroDataRetention?: boolean } = {}): string {
  const providerLine = options.zeroDataRetention
    ? "The configured AI provider is set to zero data retention and does not use your content to train models; it still receives the current conversation briefly to generate a reply."
    : "When an external AI provider is configured, the current conversation is sent there to generate a reply, and its retention and training rules depend on that provider.";
  return `I hear why that feels unsettling. Here is the straight answer: what you share in Still is tied to your account and is not public or visible to other users. Still stores conversations so you can return to them. ${providerLine} Still is not end-to-end encrypted, so the service operator can technically access account data they host. Still does not contact your friends or tell other users what you wrote, and you can stop, export, or erase your account from You. You never owe me more details.`;
}
