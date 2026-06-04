interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-yellow-500/10",
    text: "text-yellow-500",
    border: "border-yellow-500/20",
  },
  approved: {
    label: "Approved",
    bg: "bg-green-500/10",
    text: "text-green-500",
    border: "border-green-500/20",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
  },
  active: {
    label: "Active",
    bg: "bg-green-500/10",
    text: "text-green-500",
    border: "border-green-500/20",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-gray-500/10",
    text: "text-gray-500",
    border: "border-gray-500/20",
  },
};

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    label: status,
    bg: "bg-gray-500/10",
    text: "text-gray-500",
    border: "border-gray-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
}
