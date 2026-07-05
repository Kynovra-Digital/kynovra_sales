import { PageHeader } from "@/components/layout/page-header";
import { ProductCategoriesPanel } from "@/components/modules/product-categories-panel";
import { StoreAdminNav } from "@/components/modules/store-admin-nav";

export default function StoreCategoriesPage() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <StoreAdminNav active="categories" />
      <PageHeader
        breadcrumbs={[
          { label: "Admin" },
          { label: "Loja" },
          { label: "Categorias" },
        ]}
        description="Gerencie categorias primárias e secundárias reais usadas na organização da loja."
        title="Categorias da Loja"
      />
      <ProductCategoriesPanel />
    </div>
  );
}
