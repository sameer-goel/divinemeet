import * as Logic from './logic.js';

// Test utilities
function createTestActivity(id, title, tags = [], estMinutes = 10) {
  return { id, title, tags, estMinutes };
}

function createTestMeet(activities = []) {
  return {
    meetId: 'test-meet',
    title: 'Test Meet',
    seed: 'test-seed',
    status: 'draft',
    activities,
    picks: [],
    reflections: [],
    createdAt: Date.now()
  };
}

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  failures: []
};

function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.failures.push({ name, error: error.message });
    console.log(`✗ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertApproxEqual(a, b, tolerance = 0.1, message = 'Values not approximately equal') {
  if (Math.abs(a - b) > tolerance) {
    throw new Error(`${message}: ${a} vs ${b}`);
  }
}

// Core Tests
console.log('Running Cosmic Connection Game Logic Tests...\n');

// Test 1: Determinism
test('Determinism: same seed + round → same pick', () => {
  const activities = [
    createTestActivity('a1', 'Meditate'),
    createTestActivity('a2', 'Sing'),
    createTestActivity('a3', 'Paint')
  ];
  
  const seed = 'test-seed-123';
  const round = 0;
  
  const rng1 = Logic.rng(seed, round);
  const rng2 = Logic.rng(seed, round);
  
  assert(rng1 === rng2, 'RNG should be deterministic');
  
  const context1 = { seed, activities, history: [], meet: {} };
  const context2 = { seed, activities, history: [], meet: {} };
  const pick1 = Logic.pickNext(context1);
  const pick2 = Logic.pickNext(context2);
  
  assert(pick1.activityId === pick2.activityId, 'Same seed should pick same activity');
  assert(pick1.rng === pick2.rng, 'RNG values should match');
});

// Test 2: Fairness Distribution
test('Fairness: distribution across 10k sims is uniform within tolerance', () => {
  const activities = [
    createTestActivity('a1', 'Activity 1'),
    createTestActivity('a2', 'Activity 2'),
    createTestActivity('a3', 'Activity 3')
  ];
  
  const counts = { a1: 0, a2: 0, a3: 0 };
  const simulations = 10000;
  
  for (let i = 0; i < simulations; i++) {
    const seed = `sim-${i}`;
    const context = { seed, activities, history: [], meet: {} };
    const pick = Logic.pickNext(context);
    counts[pick.activityId]++;
  }
  
  const expected = simulations / activities.length;
  const tolerance = expected * 0.05; // 5% tolerance
  
  Object.values(counts).forEach(count => {
    assertApproxEqual(count, expected, tolerance, 'Distribution not uniform');
  });
});

// Test 3: No Immediate Repeats
test('Constraints: no immediate repeats', () => {
  const activities = [
    createTestActivity('a1', 'Activity 1'),
    createTestActivity('a2', 'Activity 2'),
    createTestActivity('a3', 'Activity 3')
  ];
  
  const seed = 'no-repeat-test';
  const context1 = { seed, activities, history: [], meet: {} };
  const pick1 = Logic.pickNext(context1);
  const history = [pick1];
  
  const eligible = Logic.eligible(activities, history);
  
  assert(!eligible.find(a => a.id === pick1.activityId), 'Last picked activity should not be eligible');
  assert(eligible.length === activities.length - 1, 'Should have n-1 eligible activities');
});

// Test 4: Timer Math
test('Timer math correct', () => {
  const nowMs = 1000000;
  const laterMs = 1000000 + (5 * 60 * 1000); // 5 minutes later
  
  let pick = {
    id: 'test-pick',
    round: 0,
    activityId: 'a1',
    rng: 0.5,
    pickedAt: nowMs
  };
  
  pick = Logic.startPick(pick);
  assert(pick.startedAt, 'Start time should be set');
  
  pick = Logic.endPick(pick);
  assert(pick.endedAt, 'End time should be set');
  
  pick = Logic.editDuration(pick, 10 * 60 * 1000); // 10 minutes in ms
  assert(pick.durationMs === 10 * 60 * 1000, 'Duration should be editable');
});

// Test 5: Summary Generation
test('Summary produces valid metrics and non-empty Divine Code', () => {
  const activities = [
    createTestActivity('a1', 'Meditate', ['spiritual', 'calm']),
    createTestActivity('a2', 'Sing', ['creative', 'joy'])
  ];
  
  const meet = createTestMeet(activities);
  meet.picks = [
    {
      id: 'pick1',
      round: 0,
      activityId: 'a1',
      rng: 0.3,
      pickedAt: 1000,
      startedAt: 1000,
      endedAt: 1000 + (10 * 60 * 1000) // 10 minutes
    }
  ];
  
  const summary = Logic.makeSummary(meet);
  
  assert(summary.meetId === meet.meetId, 'Summary should have correct meetId');
  assert(summary.code && summary.code.length > 0, 'Divine code should not be empty');
  assert(summary.metrics.totalActivities === 2, 'Should count all activities');
  assert(summary.metrics.totalTimeMin === 10, 'Should calculate time correctly');
  assert(summary.narrative && summary.narrative.length > 0, 'Narrative should not be empty');
});

// Test 6: Validation
test('Meet validation catches errors', () => {
  const invalidMeet = {
    // Missing required fields
    activities: [{ title: 'No ID' }], // Missing id
    picks: [],
    reflections: []
  };
  
  const result = Logic.validateMeet(invalidMeet);
  
  assert(!result.ok, 'Invalid meet should fail validation');
  assert(result.issues.length > 0, 'Should report issues');
});

// Test 7: Reflection Management
test('Reflection management works correctly', () => {
  const meet = createTestMeet();
  const reflection = {
    id: 'ref1',
    pickId: 'pick1',
    userId: 'user1',
    text: 'Great experience!',
    mood: 'happy',
    createdAt: Date.now()
  };
  
  const updatedMeet = Logic.appendReflection(meet, reflection);
  
  assert(updatedMeet.reflections.length === 1, 'Should add reflection');
  assert(updatedMeet.reflections[0].id === 'ref1', 'Should preserve reflection data');
  assert(meet.reflections.length === 0, 'Original meet should be unchanged');
});

// Test 8: Edge Cases
test('Edge cases handled correctly', () => {
  // Empty activities
  const emptyContext = { seed: 'seed', activities: [], history: [], meet: {} };
  const emptyPick = Logic.pickNext(emptyContext);
  assert(emptyPick === null, 'Should return null for empty activities');
  
  // Single activity with history
  const singleActivity = [createTestActivity('a1', 'Only One')];
  const historyWithSame = [{
    id: 'pick1',
    round: 0,
    activityId: 'a1',
    rng: 0.5,
    pickedAt: 1000
  }];
  
  const eligible = Logic.eligible(singleActivity, historyWithSame);
  assert(eligible.length === 0, 'Should have no eligible activities when only one exists and was just picked');
});

// Run Self-Improvement Loop
console.log('\n--- Self-Improvement Analysis ---');

function analyzeFairness() {
  const activities = Array.from({ length: 5 }, (_, i) => 
    createTestActivity(`a${i}`, `Activity ${i}`)
  );
  
  const results = {};
  const simulations = 50000;
  
  for (let i = 0; i < simulations; i++) {
    const seed = `fairness-${i}`;
    const context = { seed, activities, history: [], meet: {} };
    const pick = Logic.pickNext(context);
    results[pick.activityId] = (results[pick.activityId] || 0) + 1;
  }
  
  const expected = simulations / activities.length;
  const variance = Object.values(results).reduce((sum, count) => {
    return sum + Math.pow(count - expected, 2);
  }, 0) / activities.length;
  
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / expected;
  
  return {
    distribution: results,
    expected,
    variance,
    stdDev,
    coefficientOfVariation,
    fairnessScore: 1 - coefficientOfVariation // Higher is better
  };
}

const fairnessAnalysis = analyzeFairness();
console.log('Fairness Analysis:', {
  fairnessScore: fairnessAnalysis.fairnessScore.toFixed(4),
  coefficientOfVariation: fairnessAnalysis.coefficientOfVariation.toFixed(4)
});

// Final Results
console.log('\n--- Test Results ---');
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);

if (testResults.failed > 0) {
  console.log('\nFailures:');
  testResults.failures.forEach(failure => {
    console.log(`- ${failure.name}: ${failure.error}`);
  });
}

const allTestsPassed = testResults.failed === 0;
const fairnessAcceptable = fairnessAnalysis.fairnessScore > 0.95;

console.log(`\nOverall Status: ${allTestsPassed && fairnessAcceptable ? 'PASS' : 'FAIL'}`);

export { testResults, fairnessAnalysis, allTestsPassed, fairnessAcceptable };