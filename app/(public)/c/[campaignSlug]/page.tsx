import { redirect } from "next/navigation";

export default async function CampaignShowcasePage({
  params,
}: {
  params: Promise<{ campaignSlug: string }>;
}) {
  const { campaignSlug } = await params;

  redirect(`/#${encodeURIComponent(campaignSlug)}`);
}
