import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ConnectYourAiPage from "./page";
import { SITE_URL } from "@/lib/site";
import { MCP_RESOURCE_PATH } from "@/lib/oauth/core";

describe("/connect-your-ai", () => {
  it("gives the signed-in connector URL, the public one, and the steps", () => {
    render(<ConnectYourAiPage />);
    expect(screen.getByText(`${SITE_URL}${MCP_RESOURCE_PATH}`)).toBeInTheDocument();
    expect(screen.getByText(`${SITE_URL}/api/mcp`)).toBeInTheDocument();
    expect(screen.getByText("Paste this URL and choose OAuth sign-in")).toBeInTheDocument();
    expect(screen.getByText("Log in and click Allow")).toBeInTheDocument();
  });

  it("tells couples how to disconnect, where the app actually puts it", () => {
    render(<ConnectYourAiPage />);
    expect(screen.getByText(/Website, then Design, then Your own AI/)).toBeInTheDocument();
  });
});
