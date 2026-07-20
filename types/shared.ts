import type { ReactNode } from "react";
import type { ModuleRow } from "./module-row";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export type MetricCardProps = {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  trend?: string;
  glow?: "blue" | "purple" | "green";
};

export type StatusTone = "amber" | "blue" | "gray" | "green" | "purple" | "red";

export type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export type ConfirmActionDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export type ResponsiveDataViewProps = {
  columns: string[];
  rows: ModuleRow[];
  onOpen: (row: ModuleRow) => void;
  renderActions?: (row: ModuleRow) => ReactNode;
};
