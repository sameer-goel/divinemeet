// Cosmic Connection Game - Core Logic Engine

// Improved hash function for better distribution (FNV-1a variant)
function betterHash(str) {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, unsigned 32-bit
  }
  return hash;
}

export function makeSeed() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function rng(seed, round) {
  const combined = seed + ':' + round;
  const hash = betterHash(combined);
  return (hash >>> 0) / 4294967296; // Normalize to 0-1 using full 32-bit range
}

export function eligible(activities, history) {
  if (history.length === 0) return activities;
  
  const lastPick = history[history.length - 1];
  return activities.filter(activity => activity.id !== lastPick.activityId);
}

function corePickNext(activities, history, seed, nowMs) {
  const eligibleActivities = eligible(activities, history);
  if (eligibleActivities.length === 0) return null;
  
  const round = history.length;
  const randomValue = rng(seed, round);
  const index = Math.floor(randomValue * eligibleActivities.length);
  const chosen = eligibleActivities[index];
  
  return {
    id: `pick_${nowMs}_${round}`,
    round,
    activityId: chosen.id,
    rng: randomValue,
    pickedAt: nowMs
  };
}

function coreStartPick(pick, nowMs) {
  return { ...pick, startedAt: nowMs };
}

function coreEndPick(pick, nowMs) {
  return { ...pick, endedAt: nowMs };
}

function coreEditDuration(pick, minutes) {
  return { ...pick, editedDurationMinutes: minutes };
}

export function appendReflection(meet, reflection) {
  return {
    ...meet,
    reflections: [...meet.reflections, reflection]
  };
}

function coreMakeSummary(meet) {
  const now = Date.now();
  
  // Calculate metrics
  const activityFreq = {};
  const firstPickDist = {};
  let totalTime = 0;
  
  meet.picks.forEach(pick => {
    activityFreq[pick.activityId] = (activityFreq[pick.activityId] || 0) + 1;
    
    if (pick.round === 0) {
      firstPickDist[pick.activityId] = (firstPickDist[pick.activityId] || 0) + 1;
    }
    
    if (pick.startedAt && pick.endedAt) {
      totalTime += (pick.endedAt - pick.startedAt) / (1000 * 60); // minutes
    } else if (pick.editedDurationMinutes) {
      totalTime += pick.editedDurationMinutes;
    }
  });
  
  // Get top tags
  const tagCounts = {};
  meet.activities.forEach(activity => {
    if (activity.tags) {
      activity.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  const topTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([tag]) => tag);
  
  // Detect patterns
  const patterns = [];
  
  // Pattern: Repeated activities
  const repeatedActivities = Object.entries(activityFreq)
    .filter(([, count]) => count > 1);
  
  if (repeatedActivities.length > 0) {
    patterns.push({
      pattern: 'repeated_activities',
      evidence: repeatedActivities
    });
  }
  
  // Pattern: Tag clustering
  if (topTags.length > 0) {
    patterns.push({
      pattern: 'tag_resonance',
      evidence: topTags
    });
  }
  
  // Generate Divine Code
  const codeElements = [
    meet.seed.slice(0, 3).toUpperCase(),
    meet.picks.length.toString(),
    topTags[0]?.slice(0, 2).toUpperCase() || 'XX'
  ];
  const code = codeElements.join('-');
  
  // Generate narrative
  const narrative = generateNarrative(meet, patterns, totalTime);
  
  return {
    meetId: meet.meetId,
    generatedAt: now,
    code,
    metrics: {
      totalActivities: meet.activities.length,
      totalTimeMin: Math.round(totalTime),
      activityFrequency: activityFreq,
      topTags,
      firstPickDistribution: firstPickDist
    },
    patterns,
    narrative
  };
}

function generateNarrative(meet, patterns, totalTime) {
  const narratives = [
    `The universe guided ${meet.picks.length} moments of connection across ${Math.round(totalTime)} minutes.`,
    `Through ${meet.activities.length} possibilities, the cosmos chose a path of discovery.`,
    `${meet.picks.length} divine selections wove together a tapestry of shared experience.`
  ];
  
  let narrative = narratives[meet.picks.length % narratives.length];
  
  if (patterns.length > 0) {
    narrative += ` Patterns emerged: ${patterns.map(p => p.pattern).join(', ')}.`;
  }
  
  narrative += ' The connection deepens.';
  
  return narrative;
}

export function validateMeet(meet) {
  const issues = [];
  
  if (!meet.meetId) issues.push('Missing meetId');
  if (!meet.seed) issues.push('Missing seed');
  if (!Array.isArray(meet.activities)) issues.push('Activities must be array');
  if (!Array.isArray(meet.picks)) issues.push('Picks must be array');
  if (!Array.isArray(meet.reflections)) issues.push('Reflections must be array');
  
  // Validate activities have required fields
  meet.activities.forEach((activity, i) => {
    if (!activity.id) issues.push(`Activity ${i} missing id`);
    if (!activity.title) issues.push(`Activity ${i} missing title`);
  });
  
  // Validate picks reference valid activities
  meet.picks.forEach((pick, i) => {
    if (!pick.id) issues.push(`Pick ${i} missing id`);
    if (!pick.activityId) issues.push(`Pick ${i} missing activityId`);
    if (!meet.activities.find(a => a.id === pick.activityId)) {
      issues.push(`Pick ${i} references invalid activity ${pick.activityId}`);
    }
  });
  
  return {
    ok: issues.length === 0,
    issues
  };
}

// Frontend Integration Adapters
export function pickNext(context) {
  const { seed, activities, history, meet } = context;
  const nowMs = Date.now();
  return corePickNext(activities, history || [], seed, nowMs);
}

export function startPick(pick) {
  const nowMs = Date.now();
  return coreStartPick(pick, nowMs);
}

export function endPick(pick) {
  const nowMs = Date.now();
  return coreEndPick(pick, nowMs);
}

export function editDuration(pick, ms) {
  const minutes = ms / (1000 * 60);
  const result = coreEditDuration(pick, minutes);
  return {
    ...result,
    durationMs: result.editedDurationMinutes * 60 * 1000
  };
}

export function makeSummary(data) {
  if (data.meet) {
    const meet = {
      ...data.meet,
      activities: data.activities || [],
      picks: data.picks || [],
      reflections: data.reflections || []
    };
    return coreMakeSummary(meet);
  }
  return coreMakeSummary(data);
}

