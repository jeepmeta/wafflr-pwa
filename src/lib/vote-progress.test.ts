import { describe, it } from "node:test";
import assert from "node:assert/strict";

/** Pure helpers mirroring SwipeStack vote-progress rules. */
function mergeVoted(serverIds: string[], optimistic: Set<string>): Set<string> {
  const out = new Set(optimistic);
  for (const id of serverIds) out.add(id);
  return out;
}

function nextIndex(cardIds: string[], voted: Set<string>): number {
  const i = cardIds.findIndex((id) => !voted.has(id));
  return i === -1 ? cardIds.length : i;
}

describe("vote progress", () => {
  it("keeps optimistic votes when cards refresh", () => {
    const optimistic = new Set(["a"]);
    const afterTallyRefresh = mergeVoted(["a"], optimistic);
    assert.equal(afterTallyRefresh.has("a"), true);
    assert.equal(nextIndex(["a", "b", "c"], afterTallyRefresh), 1);
  });

  it("does not clear optimistic when server lags", () => {
    const optimistic = new Set(["a", "b"]);
    const merged = mergeVoted([], optimistic);
    assert.deepEqual([...merged].sort(), ["a", "b"]);
    assert.equal(nextIndex(["a", "b", "c"], merged), 2);
  });

  it("one-time: already voted card is skipped", () => {
    const voted = mergeVoted(["a"], new Set());
    assert.equal(nextIndex(["a", "b"], voted), 1);
  });
});
