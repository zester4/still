import assert from "node:assert/strict";
import test from "node:test";
import { crisisCompanionText, detectCrisis, outputLooksUnsafe } from "./safety.ts";
import { detectPrivacyQuestion, privacyCompanionText } from "./privacy.ts";

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

test("answers privacy concerns with the product's actual data boundary", () => {
  assert.equal(detectPrivacyQuestion("Are you sharing this or can someone see it?"), true);
  assert.equal(detectPrivacyQuestion("I had a long day at work"), false);
  const copy = privacyCompanionText();
  assert.match(copy, /not public or visible to other users/i);
  assert.match(copy, /not end-to-end encrypted/i);
  assert.match(copy, /export, or erase/i);
  assert.match(privacyCompanionText({ zeroDataRetention: true }), /zero data retention/i);
  assert.doesNotMatch(privacyCompanionText({ zeroDataRetention: true }), /retention and training rules depend/i);
});
