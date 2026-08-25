import { notFound } from "next/navigation";
import Community from "@/components/community/community";
import PublicFeed from "@/components/community/public-feed";
import {
  listGroups,
  listFeed,
  listUpcomingEvents,
  listSuggestedGroups,
  listPublicFeed,
} from "@/app/community/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/community",
  title: "Community",
  description:
    "Real weddings, advice, and inspiration from the Bridal Team community of couples and vendors.",
});

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

  // Signed-out visitors get a read-only public feed (browse before signup).
  if (!user) {
    const feed = await listPublicFeed();
    return <PublicFeed feed={feed} />;
  }

  const [groups, feed, events, suggested] = await Promise.all([
    listGroups(),
    listFeed("public"),
    listUpcomingEvents(),
    listSuggestedGroups(),
  ]);

  const viewer = {
    id: user.id,
    name:
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "You",
    avatar: (user.user_metadata?.avatar_url as string | undefined) ?? "",
  };

  return (
    <Community
      viewer={viewer}
      initialGroups={groups}
      initialFeed={feed}
      initialEvents={events}
      initialSuggested={suggested}
    />
  );
}
