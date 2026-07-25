import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Community from "@/components/community/community";
import { listGroups, listFeed } from "@/app/community/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Community",
  description: "Share updates and photos with the Bridal Team community and your private groups.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The community feed — a place to post messages and photos, either publicly (to
 * signed-in members) or privately to a group you create. Distinct from
 * Inspiration, which is a curated gallery of ideas.
 */
export default async function CommunityPage() {
  if (!SHOW_PLANNER_APP) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/community");

  const [groups, feed] = await Promise.all([listGroups(), listFeed("public")]);

  const viewer = {
    id: user.id,
    name:
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "You",
    avatar: (user.user_metadata?.avatar_url as string | undefined) ?? "",
  };

  return <Community viewer={viewer} initialGroups={groups} initialFeed={feed} />;
}
