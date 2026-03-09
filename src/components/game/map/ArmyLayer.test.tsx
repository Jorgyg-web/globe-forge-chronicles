import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// mock dependencies used inside ArmyLayer
vi.mock("@/context/GameContext", () => ({
  useGame: () => ({
    state: {
      armies: {},
      activeBattles: [],
      playerCountryId: "player",
      countries: {},
      provinces: {},
    },
    selectedArmyId: null,
    setSelectedArmyId: vi.fn(),
    setActivePanel: vi.fn(),
  }),
}));

vi.mock("./MapContext", () => ({
  useMapContext: () => ({
    zoom: 2.5,
  }),
}));

// we need a simple stub for getProvinceCentroid used by the component
vi.mock("@/data/provinceGeometry", () => ({
  getProvinceCentroid: (id: string) => ({ x: 10, y: 20 }),
}));

import ArmyLayer, { estimateETA, getDominantUnitIcon } from "./ArmyLayer";
import { UNIT_STATS } from "@/data/unitStats";
import { Army } from "@/types/game";

describe("ArmyLayer helpers", () => {
  it("calculates ETA when no target", () => {
    const army = { provinceId: "p1", units: [{ type: "infantry", count: 10, health: 100 }], movementProgress: 0 } as Army;
    const state = { provinces: {} } as any;
    expect(estimateETA(army, state)).toBe("");
  });

  it("selects dominant unit icon", () => {
    const army = {
      provinceId: "p1",
      units: [
        { type: "infantry", count: 5, health: 100 },
        { type: "tank", count: 10, health: 100 },
      ],
    } as Army;
    const icon = getDominantUnitIcon(army);
    expect(icon).toBe(UNIT_STATS.tank.icon);
  });
});

describe("ArmyLayer component", () => {
  it("renders without armies", () => {
    render(<svg><ArmyLayer /></svg>);
    // with no armies in state, it should not render any <g> elements
    const groups = screen.queryAllByRole("graphics-document");
    expect(groups.length).toBe(0);
  });
});
