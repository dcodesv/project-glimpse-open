
import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = "md",
  className
}) => {
  const initials = name
    .split(" ")
    .map(part => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base"
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-100 font-medium overflow-hidden",
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            // Show initials as fallback
            target.parentElement!.dataset.initials = initials;
          }} 
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

interface AvatarGroupProps {
  users: Array<{ id: string | number; name: string; src?: string }>;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 5,
  size = "md",
  className
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleUsers.map((user) => (
        <Avatar
          key={user.id}
          name={user.name}
          src={user.src}
          size={size}
          className="border-2 border-background"
        />
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            "relative inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium border-2 border-background",
            {
              "w-6 h-6 text-xs": size === "sm",
              "w-8 h-8 text-sm": size === "md",
              "w-10 h-10 text-base": size === "lg"
            }
          )}
          title={`${remainingCount} más`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
