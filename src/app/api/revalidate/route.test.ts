import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (tag: string) => revalidateTag(tag) }));

const { POST } = await import("./route");

const SECRET = "s".repeat(32);

function call(body: unknown, auth = `Bearer ${SECRET}`): Promise<Response> {
  return POST(
    new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
    revalidateTag.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("revalidates each distinct tag", async () => {
    const response = await call({ tags: ["catalog", "match:abc", "catalog"] });
    expect(response.status).toBe(200);
    expect(revalidateTag.mock.calls).toEqual([["catalog"], ["match:abc"]]);
  });

  it("rejects a wrong secret without revalidating", async () => {
    const response = await call({ tags: ["catalog"] }, "Bearer nope");
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each([{}, { tags: [] }, { tags: ["bad tag!"] }, { tags: [1] }, "{not json"])(
    "rejects invalid body %p",
    async (body) => {
      expect((await call(body)).status).toBe(400);
    },
  );

  it("is disabled when no secret is configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect((await call({ tags: ["catalog"] })).status).toBe(404);
  });
});
