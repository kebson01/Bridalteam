"use client";

/**
 * The "Visit" link on a vendor's public profile. Counts a link_click when a
 * person actually clicks it, the same way TrackView counts a profile view.
 *
 * The href still goes through /api/vendor/link, which redirects to the
 * vendor's site (and checks their plan allows the link) but no longer counts
 * anything: crawlers, link previewers and AI assistants load that URL without
 * anyone clicking, and counting those once inflated a day's clicks to 445
 * against 2 profile views.
 */
export default function VendorWebsiteLink({ orgId }: { orgId: string }) {
  const record = () => {
    fetch("/api/vendor/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org: orgId, kind: "link_click" }),
      keepalive: true,
    }).catch(() => {});
  };
  return (
    <a
      href={`/api/vendor/link?org=${orgId}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={record}
      onAuxClick={(e) => {
        if (e.button === 1) record();
      }}
      className="text-brand-text hover:underline"
    >
      Visit
    </a>
  );
}
