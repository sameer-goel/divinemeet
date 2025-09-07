# Cosmic Connection Game - Logic Engine

## Overview

The logic engine provides deterministic randomness and pattern detection for meaningful social gatherings. It transforms casual meetups into opportunities for insight and connection through guided activities and reflection.

## Core Functions

### Random Selection
- `makeSeed()` - Generates unique session seeds
- `rng(seed, round)` - Deterministic random number generation
- `eligible(activities, history)` - Filters out recently picked activities
- `pickNext(activities, history, seed, nowMs)` - Selects next activity

### Activity Management
- `startPick(pick, nowMs)` - Marks activity start time
- `endPick(pick, nowMs)` - Marks activity end time  
- `editDuration(pick, minutes)` - Manually sets duration

### Reflection & Summary
- `appendReflection(meet, reflection)` - Adds user reflections
- `makeSummary(meet)` - Generates Divine Decoded summary with patterns
- `validateMeet(meet)` - Validates data integrity

## Key Features

### Deterministic Randomness
Uses FNV-1a hash algorithm for consistent, fair distribution while maintaining the mystical feeling of "cosmic selection."

### Pattern Detection
- **Repeated Activities**: Identifies activities chosen multiple times
- **Tag Resonance**: Finds recurring themes across activities
- **Divine Code**: Generates unique session identifiers

### No Immediate Repeats
Prevents the same activity from being selected consecutively, ensuring variety while maintaining randomness.

## Data Flow

1. **Setup**: Create meet with activities and seed
2. **Selection**: Use `pickNext()` to choose activities
3. **Timing**: Track with `startPick()` and `endPick()`
4. **Reflection**: Collect insights with `appendReflection()`
5. **Summary**: Generate patterns with `makeSummary()`

## Testing

The engine includes comprehensive self-testing:
- Determinism verification
- Fairness distribution analysis (>95% score required)
- Edge case handling
- Data validation

Run tests: `node logic.test.js`

## Integration

Export as ESM module for browser use:
```javascript
import * as Logic from './logic/logic.js';
```

All functions are pure (no side effects) and work with JSON data structures only.