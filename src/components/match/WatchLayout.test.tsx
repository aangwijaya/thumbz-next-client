// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WatchLayout } from "./WatchLayout";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

function renderLayout() {
  render(<WatchLayout stage={<p>stage</p>} chat={<p>chat</p>} moments={<p>moments</p>} stats={<p>stats</p>} more={<p>more</p>} />);
  return screen.getByRole("tablist", { name: "Match" });
}

describe("WatchLayout tabs", () => {
  afterEach(cleanup);

  it("keeps a single tab stop per tab list", () => {
    const list = renderLayout();
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>("[role=tab]"));
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it("moves selection and focus with the arrow, Home and End keys", () => {
    const list = renderLayout();
    const tab = (name: string) => list.querySelector<HTMLButtonElement>(`[role=tab][aria-controls=watch-${name}]`)!;

    tab("chat").focus();
    fireEvent.keyDown(tab("chat"), { key: "ArrowRight" });
    expect(tab("moments").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab("moments"));

    fireEvent.keyDown(tab("moments"), { key: "End" });
    expect(tab("more").getAttribute("aria-selected")).toBe("true");
    expect(window.location.search).toBe("?tab=more"); // deep link kept in sync

    fireEvent.keyDown(tab("more"), { key: "ArrowRight" }); // wraps around
    expect(tab("chat").getAttribute("aria-selected")).toBe("true");
    expect(window.location.search).toBe("");

    fireEvent.keyDown(tab("chat"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tab("more"));
  });
});
