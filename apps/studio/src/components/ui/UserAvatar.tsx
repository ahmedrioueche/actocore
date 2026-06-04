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

  const baseClasses = `rounded-full object-cover flex-shrink-0 shadow-sm border border-border/50 ${sizeClasses[size]} ${className}`;

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className={baseClasses}
      />
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={`${baseClasses} bg-gradient-to-br from-primary/80 via-primary to-secondary/80 flex items-center justify-center font-black text-white`}
    >
      {initials || "U"}
    </div>
  );
};

export default UserAvatar;
export type { UserAvatarProps };
