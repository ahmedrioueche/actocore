import React from "react";

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name = "User",
  className = "",
  size = "md",
}) => {
  const getInitials = (str: string) => {
    return str
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl",
  };

  const baseClasses = `rounded-full object-cover flex-shrink-0 shadow-sm ring-1 ring-border ${sizeClasses[size]} ${className}`;

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className={`${baseClasses} border-2 border-surface`}
      />
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={`${baseClasses} flex items-center justify-center border-2 border-surface bg-brand-gradient font-bold text-primary-contrast`}
    >
      {initials || "U"}
    </div>
  );
};

export default UserAvatar;
export type { UserAvatarProps };
