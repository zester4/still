import assert from "node:assert/strict";
import test from "node:test";
import { crisisCompanionText, detectCrisis, outputLooksUnsafe } from "./safety.ts";

test("detects direct crisis language while leaving ordinary sadness alone", () => {
  assert.equal(detectCrisis("I want to kill myself tonight"), true);
  assert.equal(detectCrisis("I cannot keep myself safe right now"), false);
  assert.equal(detectCrisis("I feel numb and exhausted after work"), false);
});

test("hard-coded crisis copy points to human help and keeps its limits clear", () => {
  const copy = crisisCompanionText();
  assert.match(copy, /human/i);
  assert.match(copy, /cannot keep you safe/i);
  assert.match(copy, /survivable/i);
});

test("blocks unsafe generated instructions", () => {
  assert.equal(outputLooksUnsafe("Here is how to overdose safely"), true);
  assert.equal(outputLooksUnsafe("That sounds painful. We can take this one minute at a time."), false);
});
