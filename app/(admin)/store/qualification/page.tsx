"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProductQualificationPanel } from "@/components/modules/product-qualification-panel";
import { StoreAdminNav } from "@/components/modules/store-admin-nav";
import { ManualEvaluationDialog } from "@/components/products/manual-evaluation-dialog";
import { Button } from "@/components/ui/button";

export default function StoreQualificationPage() {
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <StoreAdminNav active="qualification" />
      <PageHeader
        actions={
          <Button
            className="gap-2"
            onClick={() => setIsEvaluationOpen(true)}
            size="sm"
          >
            <Plus data-icon="inline-start" />
            Inserir Avaliação Manual
          </Button>
        }
        breadcrumbs={[
          { label: "Admin" },
          { label: "Loja" },
          { label: "Qualificação" },
        ]}
        description="Acompanhe produtos qualificados pelos clientes e fiscalize comentários adicionados depois dos atendimentos."
        title="Qualificação dos Produtos"
      />
      <ProductQualificationPanel />
      <ManualEvaluationDialog
        open={isEvaluationOpen}
        onOpenChange={setIsEvaluationOpen}
        productId={undefined}
      />
    </div>
  );
}
