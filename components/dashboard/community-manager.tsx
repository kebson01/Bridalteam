"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import GroupMembers from "@/components/community/group-members";
import {
  createEvent,
  createGroup,
  deleteEvent,
  joinGroup,
  type AppEvent,
  type PostGroup,
} from "@/app/community/actions";
import { GROUP_PRESETS } from "@/lib/community";
import { shortDate } from "@/lib/dates";

function eventWhen(iso: string): string {
  const d = new Date(iso);
  const date = shortDate(d);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/**
 * Dashboard home for creating and managing everything structural in the
 * community — groups (and their invites/members) and events. The Community
 * page itself is view-and-participate only; creation happens here.
 */
export default function CommunityManager({
  viewerId,
  initialGroups,
  initialEvents,
  loadFailed = false,
}: {
  viewerId: string;
  initialGroups: PostGroup[];
  initialEvents: AppEvent[];
  /** A list failed to load, as opposed to being empty. */
  loadFailed?: boolean;
}) {
  const [groups, setGroups] = useState<PostGroup[]>(initialGroups);
  const [events, setEvents] = useState<AppEvent[]>(initialEvents);

  // Create / join group
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupKind, setNewGroupKind] = useState("custom");
  const [newGroupPublic, setNewGroupPublic] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [groupMsg, setGroupMsg] = useState<string | null>(null);
  const [groupBusy, startGroup] = useTransition();
  const [manageGroup, setManageGroup] = useState<string | null>(null);

  // Create event
  const [evTitle, setEvTitle] = useState("");
  const [evLocation, setEvLocation] = useState("");
  const [evWhen, setEvWhen] = useState("");
  const [evMsg, setEvMsg] = useState<string | null>(null);
  const [evBusy, startEvent] = useTransition();

  function doCreateGroup() {
    setGroupMsg(null);
    startGroup(async () => {
      const res = await createGroup(newGroupName, newGroupKind, newGroupPublic);
      if (!res.ok || !res.group) {
        setGroupMsg(res.error ?? "Couldn't create group.");
        return;
      }
      setGroups((g) => [...g, res.group!]);
      setNewGroupName("");
      setNewGroupKind("custom");
      setNewGroupPublic(false);
      setGroupMsg(
        res.group.is_public
          ? `Created “${res.group.name}”. It's discoverable, and its join code is ${res.group.join_code}.`
          : `Created “${res.group.name}”. Invite people below or share code ${res.group.join_code}.`,
      );
      setManageGroup(res.group.id);
    });
  }

  function doJoinGroup() {
    setGroupMsg(null);
    startGroup(async () => {
      const res = await joinGroup(joinCode);
      if (!res.ok || !res.group) {
        setGroupMsg(res.error ?? "Couldn't join.");
        return;
      }
      setGroups((g) => (g.some((x) => x.id === res.group!.id) ? g : [...g, res.group!]));
      setJoinCode("");
      setGroupMsg(`Joined “${res.group.name}”.`);
    });
  }

  function handleLeft(groupId: string) {
    setGroups((g) => g.filter((x) => x.id !== groupId));
    setManageGroup(null);
  }

  function doCreateEvent() {
    setEvMsg(null);
    startEvent(async () => {
      const res = await createEvent({ title: evTitle, location: evLocation, startsAt: evWhen });
      if (!res.ok || !res.event) {
        setEvMsg(res.error ?? "Couldn't create event.");
        return;
      }
      setEvents((list) => [...list, res.event!].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setEvTitle("");
      setEvLocation("");
      setEvWhen("");
    });
  }

  function removeEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    setEvents((list) => list.filter((e) => e.id !== id));
    deleteEvent(id);
  }

  return (
    <>
      {/* One notice for the whole section: if either list failed to load, what
          follows is incomplete, and saying nothing would pass it off as empty. */}
      {loadFailed && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          We couldn&rsquo;t load your groups and events just now, so this may be incomplete.
          Please refresh to try again.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
      {/* -------- Groups -------- */}
      <section className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Groups</h2>
          <Link href="/community" className="text-xs font-semibold text-brand-text hover:underline">
            Open Community →
          </Link>
        </div>

        {/* Create */}
        <p className="text-sm font-semibold text-ink">Create a group</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GROUP_PRESETS.map((p) => (
            <button
              key={p.kind}
              type="button"
              onClick={() => {
                setNewGroupKind(p.kind);
                setNewGroupName(p.label);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                newGroupKind === p.kind
                  ? "border-brand bg-brand/10 text-brand-text"
                  : "border-stone-2 text-ink-soft hover:border-brand"
              }`}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newGroupName}
            onChange={(e) => {
              setNewGroupName(e.target.value);
              setNewGroupKind("custom");
            }}
            placeholder="Group name"
            maxLength={60}
            className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={doCreateGroup}
            disabled={groupBusy || !newGroupName.trim()}
            className="flex-none rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create
          </button>
        </div>
        <label className="mt-2 flex items-start gap-2 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={newGroupPublic}
            onChange={(e) => setNewGroupPublic(e.target.checked)}
            className="mt-0.5 accent-brand"
          />
          <span>
            <span className="font-semibold text-ink">Make discoverable</span> — anyone can find it
            under Suggested Groups and join without a code. Leave off for a private, invite-only group.
          </span>
        </label>

        {/* Join by code */}
        <p className="mt-5 text-sm font-semibold text-ink">Join with a code</p>
        <div className="mt-2 flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={doJoinGroup}
            disabled={groupBusy || !joinCode.trim()}
            className="flex-none rounded-lg border border-stone-2 px-3 py-2 text-sm font-semibold text-ink-soft hover:border-brand disabled:opacity-50"
          >
            Join
          </button>
        </div>
        {groupMsg && <p className="mt-2 text-xs text-ink-soft/80">{groupMsg}</p>}

        {/* My groups + invites/members */}
        <p className="mt-5 text-sm font-semibold text-ink">Your groups</p>
        {groups.length === 0 ? (
          <p className="mt-2 text-xs text-ink-soft/60">You're not in any groups yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="rounded-xl border border-stone-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <b className="block truncate text-sm text-ink">{g.name}</b>
                    <small className="text-[11.5px] text-ink-soft/60">
                      {g.is_public ? "Discoverable" : "Private"} · code {g.join_code}
                    </small>
                  </span>
                  <button
                    type="button"
                    onClick={() => setManageGroup((m) => (m === g.id ? null : g.id))}
                    className="flex-none rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
                  >
                    {manageGroup === g.id ? "Hide" : "Manage members"}
                  </button>
                </div>
                {manageGroup === g.id && (
                  <div className="mt-3">
                    <GroupMembers group={g} viewerId={viewerId} onLeft={handleLeft} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* -------- Events -------- */}
      <section className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Events</h2>

        <p className="text-sm font-semibold text-ink">Create an event</p>
        <div className="mt-2 space-y-2">
          <input
            value={evTitle}
            onChange={(e) => setEvTitle(e.target.value)}
            placeholder="Event name"
            maxLength={120}
            className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            value={evLocation}
            onChange={(e) => setEvLocation(e.target.value)}
            placeholder="Location (optional)"
            maxLength={120}
            className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            type="datetime-local"
            value={evWhen}
            onChange={(e) => setEvWhen(e.target.value)}
            className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink-soft outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={doCreateEvent}
            disabled={evBusy || !evTitle.trim() || !evWhen}
            className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {evBusy ? "Adding…" : "Create event"}
          </button>
          {evMsg && <p className="text-xs text-red-600">{evMsg}</p>}
        </div>

        <p className="mt-5 text-sm font-semibold text-ink">Your events</p>
        {events.length === 0 ? (
          <p className="mt-2 text-xs text-ink-soft/60">You haven't created any events yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start justify-between gap-2 rounded-xl border border-stone-2 p-3">
                <span className="min-w-0">
                  <b className="block truncate text-sm text-ink">{ev.title}</b>
                  <small className="block text-[11.5px] text-brand-text">
                    {eventWhen(ev.starts_at)}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </small>
                  <small className="text-[11.5px] text-ink-soft/60">{ev.going_count} going</small>
                </span>
                <button
                  type="button"
                  onClick={() => removeEvent(ev.id)}
                  className="flex-none text-ink-soft/40 hover:text-red-600"
                  aria-label="Delete event"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </>
  );
}
