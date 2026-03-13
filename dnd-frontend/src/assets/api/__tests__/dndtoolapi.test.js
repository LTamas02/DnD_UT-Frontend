import { describe, expect, it, vi } from "vitest";

const setupMocks = () => {
  const apiGet = vi.fn();
  const apiMock = { get: apiGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() };
  const axiosCreate = vi.fn(() => ({ get: vi.fn() }));

  vi.doMock("axios", () => ({
    default: { create: axiosCreate },
    create: axiosCreate
  }));

  vi.doMock("../../../Api", () => ({
    default: apiMock,
    API_BASE: "https://api.test.local"
  }));

  return { apiGet, apiMock };
};

const importFresh = async () => {
  return import("../dndtoolapi");
};

describe("dndtoolapi caching", () => {
  it("caches getMarkdownBooks result and avoids refetch", async () => {
    vi.resetModules();
    const { apiGet } = setupMocks();
    apiGet.mockResolvedValueOnce({ data: [{ fileName: "a.md" }] });

    const { getMarkdownBooks } = await importFresh();

    const first = await getMarkdownBooks();
    const second = await getMarkdownBooks();

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(first.data).toEqual([{ fileName: "a.md" }]);
    expect(second.data).toEqual([{ fileName: "a.md" }]);
  });

  it("shares inflight getMarkdownBooks request", async () => {
    vi.resetModules();
    const { apiGet } = setupMocks();
    let resolve;
    const pending = new Promise((res) => {
      resolve = res;
    });
    apiGet.mockReturnValueOnce(pending);

    const { getMarkdownBooks } = await importFresh();

    const p1 = getMarkdownBooks();
    const p2 = getMarkdownBooks();

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(p1).toBe(p2);

    resolve({ data: [{ fileName: "b.md" }] });
    const res = await p1;
    expect(res.data).toEqual([{ fileName: "b.md" }]);
  });

  it("caches getAllMonsters result and avoids refetch", async () => {
    vi.resetModules();
    const { apiGet } = setupMocks();
    apiGet.mockResolvedValueOnce({ data: [{ index: "goblin" }] });

    const { getAllMonsters } = await importFresh();

    const first = await getAllMonsters();
    const second = await getAllMonsters();

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(first).toEqual([{ index: "goblin" }]);
    expect(second).toEqual([{ index: "goblin" }]);
  });

  it("shares inflight getAllMonsters request", async () => {
    vi.resetModules();
    const { apiGet } = setupMocks();
    let resolve;
    const pending = new Promise((res) => {
      resolve = res;
    });
    apiGet.mockReturnValueOnce(pending);

    const { getAllMonsters } = await importFresh();

    const p1 = getAllMonsters();
    const p2 = getAllMonsters();

    expect(apiGet).toHaveBeenCalledTimes(1);
    resolve({ data: [{ index: "dragon" }] });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual(r2);
    expect(r1).toEqual([{ index: "dragon" }]);
  });
});
