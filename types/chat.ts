import type {
  AIHarnessMode,
  AIHarnessSessionType,
} from "@/lib/ai/harness/types";
import type { SalesTicketView } from "@/lib/supabase/queries/sales";
import type { SupportTicketView } from "@/lib/supabase/queries/support";

export type AIHarnessPanelProps = {
  currentMessage: string;
  handledByType?: string | null;
  model?: string;
  mode: AIHarnessMode;
  modelId?: string;
  onUseSuggestion: (suggestion: string) => void;
  organizationId?: string;
  sessionId: string;
  sessionType: AIHarnessSessionType;
};

export type FormattedContentProps = {
  /** Conteúdo da mensagem. Partes envoltas em **texto** viram negrito. */
  children: string;
  className?: string;
};

export type InlineSegmentProps = {
  isBold?: boolean;
  text: string;
};

export type ManualEvaluationDialogProps = {
  productId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type SalesWorkspaceProps = {
  isConfirmingSale?: boolean;
  isTransferringToQueue?: boolean;
  onConfirmSale?: () => void;
  onTransferToQueue?: () => void;
  session: SalesTicketView;
};

export type SupportWorkspaceProps = {
  session: SupportTicketView;
};
