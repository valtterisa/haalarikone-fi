import { describe, it, expect } from "vitest";
import type { University } from "@/types/university";
import { rankSemantically } from "./semantic-ranking";

const candidates: University[] = [
  {
    id: 1,
    vari: "Punainen",
    hex: "#ff0000",
    alue: "Helsinki",
    ala: "fysiikka",
    ainejärjestö: "Fyysikkokilta",
    oppilaitos: "Helsingin yliopisto",
  },
  {
    id: 2,
    vari: "Vihreä",
    hex: "#00ff00",
    alue: "Tampere",
    ala: "insinööri",
    ainejärjestö: null,
    oppilaitos: "Tampereen yliopisto",
  },
  {
    id: 3,
    vari: "Sininen",
    hex: "#0000ff",
    alue: "Helsinki",
    ala: "insinööri",
    ainejärjestö: null,
    oppilaitos: "Metropolia ammattikorkeakoulu",
  },
];

describe("rankSemantically", () => {
  it("returns the original list when semantic query is empty", async () => {
    const result = await rankSemantically([...candidates], "   ");

    expect(result).toEqual(candidates);
  });

  it("ranks candidates based on relevance to the semantic query", async () => {
    const result = await rankSemantically(
      [...candidates],
      "insinööri Helsinki",
    );

    expect(result[0].id).toBe(3);
    expect(result.map((u) => u.id)).toContain(1);
    expect(result.map((u) => u.id)).toContain(2);
  });
});

