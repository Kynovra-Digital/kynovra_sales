export type PublicAccessModalProps = {
  description?: string;
  initialView?: "choice" | "auth";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  redirectPath?: string;
  title?: string;
};

export type SessionFeedbackProps = {
  publicToken: string;
  sessionType: "sales" | "support";
};

export type PublicLoginPromptProps = {
  description?: string;
  onLoginComplete?: () => void;
  redirectPath?: string;
  title?: string;
};
