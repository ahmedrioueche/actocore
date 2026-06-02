/** Default launcher bubble icon — uses `currentColor` for theme tokens. */
export function DefaultLauncherIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3C7.03 3 3 6.58 3 11c0 2.01.9 3.83 2.36 5.2L4 21l5.05-2.54C10.28 18.82 11.12 19 12 19c4.97 0 9-3.58 9-8s-4.03-8-9-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="8.25" cy="11" r="1.1" fill="currentColor" />
      <circle cx="12" cy="11" r="1.1" fill="currentColor" />
      <circle cx="15.75" cy="11" r="1.1" fill="currentColor" />
    </svg>
  );
}
