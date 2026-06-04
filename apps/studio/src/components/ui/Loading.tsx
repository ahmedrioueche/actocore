export default function Loading({
  className = "items-start mt-24",
  size = "h-16 w-16",
  fullScreen = true,
}: {
  className?: string;
  size?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      className={`${
        fullScreen ? "min-h-screen" : "w-full"
      } flex justify-center ${className} `}
    >
      <div
        className={`animate-spin rounded-full ${size} border-b-2 border-primary`}
      ></div>
    </div>
  );
}
