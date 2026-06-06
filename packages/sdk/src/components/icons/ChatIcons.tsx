import { mergeClassNames } from '../../utils/merge-class-names';

type IconProps = {
  className?: string;
};

export function IconMic({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}

export function IconStop({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  );
}

export function IconSpinner({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon ac-icon--spin', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
    </svg>
  );
}

export function IconSend({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

export function IconVolume({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a9 9 0 0 1 0 12.73" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconZap({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg
      className={mergeClassNames('ac-icon', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
