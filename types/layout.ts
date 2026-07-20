import type { ReactNode } from "react";
import type { BreadcrumbItem } from "./breadcrumbs";

export type AdminShellProps = {
  children: ReactNode;
};

export type AdminSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
};

export type AdminLayoutProps = {
  children: ReactNode;
};
