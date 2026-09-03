import { describe, expect, it } from "vitest";
import { slotsOverlap, timeToMinutes } from "@/lib/dates";
import {
  evaluateSlot,
  parseAccessoryIds,
  resolveAccessoryFallbacks,
  type SlotReservation,
} from "@/lib/slotConflicts";

function reservation(
  overrides: Partial<SlotReservation> & { time: string },
): SlotReservation {
  return {
    consoleId: 1,
    game1Id: null,
    game2Id: null,
    game3Id: null,
    accessoryIds: null,
    stationId: 1,
    ...overrides,
  };
}

const base = {
  holds: [],
  userReservationTimes: [],
  consoleUnitIds: [1],
  requestedGameIds: [],
  requestedAccessoryIds: [],
  stationIds: [1, 2],
};

describe("slotsOverlap", () => {
  it("considère une session de deux heures", () => {
    expect(timeToMinutes("10:30:00")).toBe(630);
    expect(slotsOverlap("10:00:00", "10:00:00")).toBe(true);
    expect(slotsOverlap("10:00:00", "11:00:00")).toBe(true);
    expect(slotsOverlap("11:00:00", "10:00:00")).toBe(true);
    expect(slotsOverlap("10:00:00", "12:00:00")).toBe(false);
    expect(slotsOverlap("10:00", "11:59")).toBe(true);
  });
});

describe("parseAccessoryIds", () => {
  it("accepte tableau, chaîne JSON ou NULL", () => {
    expect(parseAccessoryIds([1, "2"])).toEqual([1, 2]);
    expect(parseAccessoryIds("[3,4]")).toEqual([3, 4]);
    expect(parseAccessoryIds("oops")).toEqual([]);
    expect(parseAccessoryIds(null)).toEqual([]);
  });
});

describe("evaluateSlot", () => {
  it("bloque la station réservée une heure plus tôt (chevauchement)", () => {
    const result = evaluateSlot({
      ...base,
      time: "11:00:00",
      stationIds: [1],
      consoleUnitIds: [1, 2],
      reservations: [reservation({ time: "10:00:00", stationId: 1 })],
    });
    expect(result.available).toBe(false);
    expect(result.conflicts?.station).toBe(true);
  });

  it("laisse libre le créneau qui suit immédiatement la session", () => {
    const result = evaluateSlot({
      ...base,
      time: "12:00:00",
      stationIds: [1],
      consoleUnitIds: [1, 2],
      reservations: [reservation({ time: "10:00:00", stationId: 1 })],
    });
    expect(result.available).toBe(true);
  });

  it("bloque un jeu ou un accessoire réservé sur une session qui chevauche", () => {
    const games = evaluateSlot({
      ...base,
      time: "11:00:00",
      consoleUnitIds: [1, 2],
      requestedGameIds: [42],
      reservations: [reservation({ time: "10:00:00", game2Id: 42, stationId: 1 })],
    });
    expect(games.conflicts?.games).toEqual([42]);

    const accessories = evaluateSlot({
      ...base,
      time: "09:00:00",
      consoleUnitIds: [1, 2],
      requestedAccessoryIds: [7],
      reservations: [reservation({ time: "10:00:00", accessoryIds: "[7]", stationId: 1 })],
    });
    expect(accessories.conflicts?.accessories).toEqual([7]);
  });

  it("garde la plateforme disponible tant qu'une unité est libre", () => {
    const twoUnits = evaluateSlot({
      ...base,
      time: "10:00:00",
      consoleUnitIds: [1, 2],
      reservations: [reservation({ time: "10:00:00", consoleId: 1, stationId: 1 })],
    });
    expect(twoUnits.available).toBe(true);

    const allTaken = evaluateSlot({
      ...base,
      time: "11:00:00",
      consoleUnitIds: [1, 2],
      reservations: [
        reservation({ time: "10:00:00", consoleId: 1, stationId: 1 }),
        reservation({ time: "11:00:00", consoleId: 2, stationId: 2 }),
      ],
    });
    expect(allTaken.conflicts?.console).toBe(true);
  });

  it("refuse un créneau qui chevauche une autre réservation de l'usager", () => {
    const result = evaluateSlot({
      ...base,
      time: "11:00:00",
      consoleUnitIds: [1],
      reservations: [],
      userReservationTimes: ["10:00:00"],
    });
    expect(result.available).toBe(false);
    expect(result.conflicts?.user).toBe(true);
  });

  it("tient compte des holds sur les stations", () => {
    const result = evaluateSlot({
      ...base,
      time: "10:00:00",
      stationIds: [1],
      reservations: [],
      holds: [{ time: "09:00:00", stationId: 1 }],
    });
    expect(result.conflicts?.station).toBe(true);
  });
});

describe("resolveAccessoryFallbacks", () => {
  it("prend un substitut libre quand l'accessoire requis est pris", () => {
    const result = resolveAccessoryFallbacks(
      "11:00:00",
      [{ time: "10:00:00", accessoryIds: [5] }],
      [],
      { 1: [5, 6] },
    );
    expect(result).toEqual({ valid: true, finalAccessoryIds: [6] });
  });

  it("invalide le créneau quand aucun substitut n'est libre", () => {
    const result = resolveAccessoryFallbacks(
      "11:00:00",
      [{ time: "10:00:00", accessoryIds: [5, 6] }],
      [],
      { 1: [5, 6] },
    );
    expect(result.valid).toBe(false);
  });
});
