import { AppointmentStatus } from "../../../types/appointment";
import { Badge } from "./ui/badge";
import { Clock, Activity, CheckCircle2, XCircle, UserX } from "lucide-react";

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  QUEUED: {
    label: "Queued",
    icon: Clock,
    className: "bg-status-queued/10 text-status-queued border-status-queued/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Activity,
    className: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  },
  READY: {
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-status-ready/10 text-status-ready border-status-ready/20",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-status-completed/10 text-status-completed border-status-completed/20",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
  },
  NO_SHOW: {
    label: "No Show",
    icon: UserX,
    className: "bg-status-no-show/10 text-status-no-show border-status-no-show/20",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <Badge variant="outline" className={`${config.className} ${sizeClasses[size]} flex items-center gap-1.5 font-medium`}>
      <Icon className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      {config.label}
    </Badge>
  );
}