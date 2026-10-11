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

  it("opens on Stats and keeps a single tab stop per tab list", () => {
    const list = renderLayout();
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>("[role=tab]"));
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, -1, 0, -1]);
    expect(list.querySelector("[aria-controls=watch-stats]")?.getAttribute("aria-selected")).toBe("true");
  });

  it("moves selection and focus with the arrow, Home and End keys", () => {
    const list = renderLayout();
    const tab = (name: string) => list.querySelector<HTMLButtonElement>(`[role=tab][aria-controls=watch-${name}]`)!;

    tab("stats").focus();
    fireEvent.keyDown(tab("stats"), { key: "ArrowRight" });
    expect(tab("more").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab("more"));
    expect(window.location.search).toBe("?tab=more"); // deep link kept in sync

    fireEvent.keyDown(tab("more"), { key: "ArrowRight" }); // wraps around
    expect(tab("chat").getAttribute("aria-selected")).toBe("true");
    expect(window.location.search).toBe("?tab=chat");

    fireEvent.keyDown(tab("chat"), { key: "End" });
    expect(tab("more").getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(tab("more"), { key: "ArrowLeft" });
    expect(tab("stats").getAttribute("aria-selected")).toBe("true");
    expect(window.location.search).toBe(""); // the default tab needs no query

    fireEvent.keyDown(tab("stats"), { key: "Home" });
    expect(document.activeElement).toBe(tab("chat"));
  });
});
