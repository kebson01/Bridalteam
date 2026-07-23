"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Stats {
  vendors: number;
  vendorsPublished: number;
  weddings: number;
  waitlist: number;
  comments: number;
  inspiration: number;
  featured: number;
  reports: number;
}
interface VendorRow {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  status: string;
  organizations: { plan: string; subscription_status: string | null } | null;
}
interface WaitlistRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  source: string | null;
  created_at: string;
}
interface CommentRow {
  id: string;
  author_name: string;
  body: string;
  image_id: string;
  created_at: string;
}
interface ReportRow {
  id: string;
  reason: string | null;
  status: string;
  created_at: string;
  image_id: string;
  inspiration_images: { title: string; image_url: string } | null;
}
interface Dashboard {
  stats: Stats;
  vendors: VendorRow[];
  waitlist: WaitlistRow[];
  comments: CommentRow[];
  reports: ReportRow[];
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function AdminDashboardPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (user: string, pw: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { "x-admin-user": user, "x-admin-password": pw },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load.");
        setUnlocked(false);
        return;
      }
      setData(json);
      setUnlocked(true);
      sessionStorage.setItem("bt_admin_user", user);
      sessionStorage.setItem("bt_admin_pw", pw);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("bt_admin_user") ?? "";
    const savedPw = sessionStorage.getItem("bt_admin_pw");
    if (savedPw) {
      setUsername(savedUser);
      setPassword(savedPw);
      load(savedUser, savedPw);
    }
  }, [load]);

  async function act(action: string, id: string) {
    const user = sessionStorage.getItem("bt_admin_user") ?? username;
    const pw = sessionStorage.getItem("bt_admin_pw") ?? password;
    setBusy(true);
    const res = await fetch("/api/admin/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-user": user, "x-admin-password": pw },
      body: JSON.stringify({ action, id }),
    });
    setBusy(false);
    if (res.ok) load(user, pw);
    else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Action failed.");
    }
  }

  function logout() {
    sessionStorage.removeItem("bt_admin_user");
    sessionStorage.removeItem("bt_admin_pw");
    setUnlocked(false);
    setData(null);
    setUsername("");
    setPassword("");
  }

  // ---- Locked view ----
  if (!unlocked || !data) {
    return (
      <section className="mx-auto max-w-md px-5 py-24">
        <h1 className="text-2xl font-light uppercase tracking-wide text-ink">Admin</h1>
        <p className="mt-2 text-sm text-ink-soft/70">Enter the admin password to continue.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(username, password);
          }}
          className="mt-6 space-y-3"
        >
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex-none rounded-lg bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "…" : "Unlock"}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-6 text-xs text-ink-soft/50">
          Set <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> in your server environment to enable admin.
        </p>
      </section>
    );
  }

  const { stats, vendors, waitlist, comments, reports } = data;
  const tiles: Array<[string, number, string?]> = [
    ["Reports", stats.reports, stats.reports > 0 ? "needs review" : undefined],
    ["Vendors", stats.vendors, `${stats.vendorsPublished} live`],
    ["Featured (paid)", stats.featured],
    ["Weddings", stats.weddings],
    ["Waitlist", stats.waitlist],
    ["Comments", stats.comments],
  ];

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light uppercase tracking-wide text-ink">Admin dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/venues" className="font-semibold text-brand-dark">Manage venues →</Link>
          <button onClick={logout} className="text-ink-soft/60 hover:text-ink">Lock</button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
            <div className="text-2xl font-semibold text-brand-dark">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-ink-soft/60">{label}</div>
            {sub && <div className="mt-0.5 text-xs text-ink-soft/50">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Reported images (priority) */}
      {reports.length > 0 && (
        <>
          <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-red-600">
            Reported images ({reports.length})
          </h2>
          <div className="mt-3 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50/40 p-4">
                {r.inspiration_images?.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.inspiration_images.image_url}
                    alt=""
                    className="h-16 w-16 flex-none rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.inspiration_images?.title ?? "(image removed)"}</p>
                  <p className="text-sm text-ink-soft/80">{r.reason ? `“${r.reason}”` : "No reason given"}</p>
                  <p className="mt-0.5 text-xs text-ink-soft/50">{fmt(r.created_at)}</p>
                </div>
                <div className="flex flex-none flex-col items-end gap-2">
                  <button
                    onClick={() => act("delete_reported_image", r.image_id)}
                    disabled={busy}
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Remove image
                  </button>
                  <button
                    onClick={() => act("dismiss_report", r.id)}
                    disabled={busy}
                    className="text-xs font-semibold text-ink-soft/50 hover:text-ink"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vendors */}
      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-ink-soft/50">
        Vendor listings ({vendors.length})
      </h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-2 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-2 text-left text-xs uppercase tracking-wide text-ink-soft/50">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-ink-soft/50">No vendors yet.</td></tr>
            ) : (
              vendors.map((v) => {
                const live = v.status === "published";
                return (
                  <tr key={v.org_id} className="border-b border-stone-2/60">
                    <td className="px-4 py-3 font-medium text-ink">{v.business_name}</td>
                    <td className="px-4 py-3 text-ink-soft/80">{v.category ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft/80">{[v.city, v.region].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3">
                      {v.organizations?.plan === "featured" ? (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">Featured</span>
                      ) : (
                        <span className="text-ink-soft/50">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={live ? "text-green-700" : "text-ink-soft/50"}>{live ? "Published" : "Draft"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => act(live ? "unpublish_vendor" : "publish_vendor", v.org_id)}
                        disabled={busy}
                        className="rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-ink-soft hover:border-brand disabled:opacity-50"
                      >
                        {live ? "Unpublish" : "Publish"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Waitlist */}
      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-ink-soft/50">
        Waitlist ({waitlist.length})
      </h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-2 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-2 text-left text-xs uppercase tracking-wide text-ink-soft/50">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-ink-soft/50">No signups yet.</td></tr>
            ) : (
              waitlist.map((w) => (
                <tr key={w.id} className="border-b border-stone-2/60">
                  <td className="px-4 py-3 font-medium text-ink">{w.email}</td>
                  <td className="px-4 py-3 text-ink-soft/80">{w.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft/80 capitalize">{w.role}</td>
                  <td className="px-4 py-3 text-ink-soft/60">{fmt(w.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => act("delete_waitlist", w.id)}
                      disabled={busy}
                      className="text-xs font-semibold text-ink-soft/40 hover:text-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Comments moderation */}
      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-ink-soft/50">
        Recent comments ({comments.length})
      </h2>
      <div className="mt-3 space-y-2">
        {comments.length === 0 ? (
          <p className="text-sm text-ink-soft/50">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-stone-2 bg-white p-4 shadow-card">
              <div className="min-w-0">
                <p className="text-sm text-ink">
                  <span className="font-semibold">{c.author_name}</span>{" "}
                  <span className="text-ink-soft/60">· {fmt(c.created_at)}</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft/85">{c.body}</p>
              </div>
              <button
                onClick={() => act("delete_comment", c.id)}
                disabled={busy}
                className="flex-none text-xs font-semibold text-ink-soft/40 hover:text-red-600 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <p className="mt-12 text-xs text-ink-soft/50">
        For anything not shown here (user accounts, payments), use the Supabase and Stripe
        dashboards.
      </p>
    </section>
  );
}
