export type ModuleKey =
  | "audit"
  | "campaigns"
  | "inventory"
  | "leads"
  | "products"
  | "quality"
  | "settings"
  | "team";

export type ModuleConfig = {
  columns: string[];
  createLabel: string;
  emptyText: string;
  emptyTitle: string;
  key: ModuleKey;
  subtitle: string;
  title: string;
};

export type WizardField = {
  disabledWhen?: (formState: WizardFormState) => boolean;
  hiddenWhen?: (formState: WizardFormState) => boolean;
  id: string;
  helperText?: string;
  label: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  options?: Array<{ description?: string; label: string; value: string }>;
  maxFiles?: number;
  previewRatio?: "12:5" | "2458:640" | "4:3";
  selection?: "multiple" | "single";
  type?:
    | "checkbox"
    | "date"
    | "file"
    | "multi-image"
    | "number"
    | "text"
    | "textarea";
};

export type WizardStep = {
  description?: string;
  fields: WizardField[];
  id: string;
  title: string;
};

export type WizardFormState = Record<
  string,
  boolean | File | File[] | string | string[] | undefined
>;

export type StoreAdminNavActive = "campaigns" | "categories" | "qualification";

export type StoreAdminNavProps = {
  active: StoreAdminNavActive;
};
