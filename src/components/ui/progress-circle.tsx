
import React from "react";
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  textClassName?: string;
  showText?: boolean;
  color?: "primary" | "success" | "warning" | "danger" | "info";
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  className,
  textClassName,
  showText = true,
  color = "primary"
}) => {
  // Sanitize progress value to be between 0-100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedProgress / 100) * circumference;

  // Determine color class
  const colorClass = {
    primary: "stroke-primary-600",
    success: "stroke-success",
    warning: "stroke-warning",
    danger: "stroke-danger",
    info: "stroke-info"
  }[color];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="stroke-muted"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        
        {/* Progress circle */}
        <circle
          className={cn(colorClass, "transition-all duration-500 ease-out")}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      
      {showText && (
        <span 
          className={cn(
            "absolute text-center font-medium", 
            normalizedProgress > 66 ? "text-success" : 
            normalizedProgress > 33 ? "text-warning" : 
            "text-danger",
            textClassName
          )}
        >
          {normalizedProgress}%
        </span>
      )}
    </div>
  );
};

export default ProgressCircle;
