"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { checkAuthorizeRequest, issueCode, withParams } from "@/lib/oauth/core";
import { oauthAvailable } from "@/lib/oauth/http";

const UUID = /^[0-9a-f-]{36}$/i;

/** The consent form's fields: the original OAuth query, plus the couple's choice. */
function paramsFrom(form: FormData): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const k of ["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state", "scope", "resource"]) {
    const v = form.get(k);
    if (typeof v === "string" && v !== "") out[k] = v;
  }
  return out;
}

function backToPage(params: Record<string, string | undefined>, error: string): never {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined));
  q.set("bt_error", error);
  redirect(`/oauth/authorize?${q.toString()}`);
}

/**
 * Approve: mint a site key for the chosen wedding AS the signed-in user (the
 * database checks they can edit it), wrap it in a code, send it back to the
 * assistant. Re-validates everything — the form is just untrusted input.
 */
export async function approveConnection(form: FormData) {
  if (!oauthAvailable()) redirect("/");
  const params = paramsFrom(form);
  const check = checkAuthorizeRequest(params);
  if (!check.ok) {
    if ("redirectTo" in check) redirect(check.redirectTo);
    backToPage(params, "invalid");
  }
  const { request } = check;

  const weddingId = form.get("wedding_id");
  if (typeof weddingId !== "string" || !UUID.test(weddingId)) backToPage(params, "choose");

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) backToPage(params, "signin");

  const { data: key, error } = await supabase.rpc("create_site_key", {
    p_wid: weddingId,
    p_label: request.client.name.slice(0, 60),
  });
  if (error || typeof key !== "string") {
    backToPage(params, error?.code === "54000" ? "too_many" : error?.code === "42501" ? "not_editor" : "failed");
  }

  redirect(withParams(request.redirectUri, { code: issueCode(request, key), state: request.state }));
}

export async function denyConnection(form: FormData) {
  if (!oauthAvailable()) redirect("/");
  const params = paramsFrom(form);
  const check = checkAuthorizeRequest(params);
  if (!check.ok) {
    if ("redirectTo" in check) redirect(check.redirectTo);
    redirect("/dashboard");
  }
  redirect(
    withParams(check.request.redirectUri, {
      error: "access_denied",
      error_description: "The couple declined the connection.",
      state: check.request.state,
    }),
  );
}
