/**
 * Fire-and-forget Slack notifications via an Incoming Webhook. Set the
 * SLACK_WEBHOOK_URL env var to enable; if it isn't set, this is a no-op so the
 * app runs fine without Slack. Never throws — a Slack outage must not break the
 * user action that triggered it.
 */
export async function notifySlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url || !text) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("notifySlack failed:", err);
  }
}
