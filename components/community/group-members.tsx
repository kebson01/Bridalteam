"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addGroupMembers,
  listGroupMembers,
  removeGroupMember,
  type GroupMember,
  type PostGroup,
} from "@/app/community/actions";

/**
 * Manage a private group's members: see who's in, add people by email (one or
 * many at once), and remove members (owner) or leave (yourself).
 */
export default function GroupMembers({
  group,
  viewerId,
  onLeft,
}: {
  group: PostGroup;
  viewerId: string;
  onLeft: (groupId: string) => void;
}) {
  const isOwner = group.owner_id === viewerId;
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function refresh() {
    setLoading(true);
    listGroupMembers(group.id).then((m) => {
      setMembers(m);
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  function add() {
    setMsg(null);
    startTransition(async () => {
      const res = await addGroupMembers(group.id, emails);
      if (!res.ok) {
        setMsg(res.error ?? "Couldn't add members.");
        return;
      }
      setEmails("");
      const parts: string[] = [];
      if (res.added) parts.push(`Added ${res.added}`);
      if (res.invited) parts.push(`Invited ${res.invited} by email`);
      setMsg(parts.length ? `${parts.join(" · ")}.` : "No one to add.");
      refresh();
    });
  }

  function remove(target: GroupMember) {
    const self = target.user_id === viewerId;
    if (!confirm(self ? "Leave this group?" : `Remove ${target.name}?`)) return;
    startTransition(async () => {
      const res = await removeGroupMember(group.id, target.user_id);
      if (!res.ok) {
        setMsg(res.error ?? "Couldn't remove.");
        return;
      }
      if (self) onLeft(group.id);
      else setMembers((m) => m.filter((x) => x.user_id !== target.user_id));
    });
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">
          Members{members.length > 0 ? ` (${members.length})` : ""}
        </p>
        <span className="text-xs text-ink-soft/60">Invite code {group.join_code}</span>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-sm text-ink-soft/50">Loading…</p>
        ) : (
          members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2">
              {m.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatar} alt="" className="h-8 w-8 flex-none rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-text">
                  {m.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {m.name}
                {m.is_owner && <span className="ml-1.5 text-xs text-ink-soft/50">· owner</span>}
              </span>
              {!m.is_owner && (isOwner || m.user_id === viewerId) && (
                <button
                  type="button"
                  onClick={() => remove(m)}
                  disabled={busy}
                  className="flex-none text-xs font-medium text-ink-soft/60 hover:text-red-600 disabled:opacity-50"
                >
                  {m.user_id === viewerId ? "Leave" : "Remove"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isOwner && (
        <div className="mt-4 border-t border-stone-2 pt-4">
          <p className="text-sm font-semibold text-ink">Add people</p>
          <p className="mt-0.5 text-xs text-ink-soft/60">
            Emails, separated by commas or new lines. People without an account get an invite.
          </p>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={2}
            placeholder="maid@email.com, mom@email.com"
            className="mt-2 w-full resize-none rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={add}
              disabled={busy || !emails.trim()}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add members"}
            </button>
            {msg && <span className="text-xs text-ink-soft/80">{msg}</span>}
          </div>
        </div>
      )}
      {!isOwner && msg && <p className="mt-3 text-xs text-ink-soft/80">{msg}</p>}
    </div>
  );
}
