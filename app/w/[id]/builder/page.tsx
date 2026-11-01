import { redirect } from "next/navigation";

/**
 * The Website builder is now the Design section of the Website tab
 * (app/w/[id]/website/page.tsx). Old links, bookmarks and emails land here.
 * The server actions it used still live next to this file (site-actions.ts).
 */
export default async function WebsiteBuilderRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/w/${id}/website`);
}
