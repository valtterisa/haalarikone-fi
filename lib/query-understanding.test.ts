import { describe, it, expect, vi } from "vitest";
import type { QueryUnderstanding } from "./query-understanding";

vi.mock("@upstash/redis", () => {
  const store = new Map<string, QueryUnderstanding>();

  return {
    Redis: {
      fromEnv: () => ({
        get: async (key: string) => store.get(key),
        setex: async (key: string, _ttl: number, value: QueryUnderstanding) => {
          store.set(key, value);
        },
      }),
    },
  };
});

vi.mock("./load-color-data", () => ({
  loadColorData: async () => ({
    colors: {
      vihrea: {
        main: ["vihreä"],
        shades: ["tummanvihreä"],
      },
    },
  }),
}));

vi.mock("ai", () => ({
  generateText: async (options: { prompt?: string }) => {
    const prompt = String(options.prompt ?? "");

    if (prompt.includes("asdf")) {
      return {
        output: {
          isGibberish: true,
          filters: {
            color: undefined,
            area: undefined,
            field: undefined,
            school: undefined,
          },
          semanticQuery: "",
        },
      };
    }

    return {
      output: {
        isGibberish: false,
        filters: {
          color: undefined,
          area: "Tampere",
          field: "insinööri",
          school: undefined,
        },
        semanticQuery: "insinööri Tampere",
      },
    };
  },
  Output: {
    object: (input: unknown) => input,
  },
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: () => "anthropic-mocked-model",
}));

import { understandQuery } from "./query-understanding";

describe("understandQuery", () => {
  it("extracts a color filter from simple color queries without treating them as gibberish", async () => {
    const result = await understandQuery("  vihreä  ", "fi");

    expect(result.isGibberish).toBe(false);
    expect(result.filters.color).toBe("vihreä");
    expect(result.filters.area).toBeUndefined();
    expect(result.filters.field).toBeUndefined();
    expect(result.filters.school).toBeUndefined();
  });

  it("uses the AI pipeline to extract filters and semantic query for more complex queries", async () => {
    const result = await understandQuery("insinöörit Tampereella", "fi");

    expect(result.isGibberish).toBe(false);
    expect(result.filters.area).toBe("Tampere");
    expect(result.filters.field).toBe("insinööri");
    expect(result.semanticQuery).toBe("insinööri Tampere");
  });

  it("marks clearly meaningless queries as gibberish", async () => {
    const result = await understandQuery("asdf qwer zxcv", "fi");

    expect(result.isGibberish).toBe(true);
    expect(result.filters.color).toBeUndefined();
    expect(result.filters.area).toBeUndefined();
    expect(result.filters.field).toBeUndefined();
    expect(result.filters.school).toBeUndefined();
    expect(result.semanticQuery).toBe("");
  });
});

