import { ModulePage } from "@/components/modules/module-page";
import { StoreAdminNav } from "@/components/modules/store-admin-nav";

export default function StoreCampaignsPage() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <StoreAdminNav active="campaigns" />
      <ModulePage moduleKey="campaigns" />
    </div>
  );
}
