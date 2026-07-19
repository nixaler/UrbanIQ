export interface CrisisResource {
  label: string;
  detail: string;
  href: string;
}

// US-only for MVP, called out explicitly in the UI. Localization is a config
// change here, not a rewrite, once resources for other regions are vetted.
export const crisisResources: CrisisResource[] = [
  {
    label: '988 Suicide & Crisis Lifeline',
    detail: 'Call or text 988 — free, confidential, 24/7 (US).',
    href: 'tel:988',
  },
  {
    label: 'Crisis Text Line',
    detail: 'Text HOME to 741741 (US).',
    href: 'sms:741741&body=HOME',
  },
  {
    label: 'Emergency services',
    detail: 'If you or someone else is in immediate danger, contact local emergency services.',
    href: 'tel:911',
  },
];

export const crisisDisclaimer =
  'This app connects you with a peer listener, not a licensed therapist or crisis counselor. ' +
  "It is not a substitute for professional care. If you're in crisis, please use one of the resources above.";
