import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createModePayload, isGameMode } from "./modes.ts";
import { createRoom } from "./room.ts";

describe("modes", () => {
  it("recognizes game modes", () => {
    assert.equal(isGameMode("swipe"), true);
    assert.equal(isGameMode("dice"), true);
    assert.equal(isGameMode("wheel"), true);
    assert.equal(isGameMode("poker"), false);
  });

  it("creates swipe payload by default", () => {
    const p = createModePayload("swipe");
    assert.equal(p.mode, "swipe");
    if (p.mode === "swipe") assert.equal(p.cards.length, 0);
  });
});

describe("room", () => {
  it("creates host participant with anonymous id", () => {
    const room = createRoom({
      title: "Dinner",
      hostDeviceId: "device-abc",
      mode: "swipe",
    });
    assert.equal(room.mode, "swipe");
    assert.equal(room.participants.length, 1);
    assert.equal(room.participants[0].isHost, true);
    assert.ok(room.participants[0].participantId.includes("device-abc"));
  });
});
