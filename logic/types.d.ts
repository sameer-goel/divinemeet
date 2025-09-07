export type Activity = {
  id: string;
  title: string;
  tags?: string[];
  estMinutes?: number;
};

export type Pick = {
  id: string;
  round: number;
  activityId: string;
  rng: number;
  pickedAt: number;
  startedAt?: number;
  endedAt?: number;
  editedDurationMinutes?: number;
};

export type Reflection = {
  id: string;
  pickId: string;
  userId: string;
  text: string;
  mood?: string;
  createdAt: number;
};

export type Meet = {
  meetId: string;
  title: string;
  seed: string;
  status: 'draft' | 'live' | 'ended';
  activities: Activity[];
  picks: Pick[];
  reflections: Reflection[];
  createdAt: number;
  datePlanned?: string;
};

export type Summary = {
  meetId: string;
  generatedAt: number;
  code: string;
  metrics: {
    totalActivities: number;
    totalTimeMin: number;
    activityFrequency: Record<string, number>;
    topTags: string[];
    firstPickDistribution: Record<string, number>;
  };
  patterns: Array<{ pattern: string; evidence: any }>;
  narrative: string;
};