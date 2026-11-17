import type {
  AccountabilitySeat,
  CoreProcess,
  CoreValue,
  MeetingRating,
  OrgCheckupQuestion,
  PeopleBarConfig,
  RockItem,
  ScorecardMeasurable,
  TargetOperator,
  TeamMember,
  ToDoItem,
} from '../types/eos';

export type PeopleClassification =
  | 'right_person_right_seat'
  | 'wrong_person_right_seat'
  | 'right_person_wrong_seat'
  | 'wrong_person_wrong_seat';

export interface PeopleEvaluationResult {
  rightPerson: boolean;
  rightSeat: boolean;
  plusCount: number;
  plusMinusCount: number;
  minusCount: number;
  classification: PeopleClassification;
  needsThreeStrike: boolean;
}

/**
 * Evaluates a team member against V/TO Core Values ("The Bar") and GWC (Get it, Want it, Capacity).
 * Per EOS specification §3.2:
 * - Right Person: meets minPlusCount '+' scores and respects allowMinus rule across all Core Values.
 * - Right Seat: GWC must be 100% Yes/Yes/Yes when requireFullGWC is enabled.
 */
export function evaluatePerson(
  member: TeamMember,
  coreValues: CoreValue[],
  bar: PeopleBarConfig
): PeopleEvaluationResult {
  let plusCount = 0;
  let plusMinusCount = 0;
  let minusCount = 0;

  for (const cv of coreValues) {
    const score = member.valueScores[cv.id] ?? '+/-';
    if (score === '+') plusCount += 1;
    else if (score === '+/-') plusMinusCount += 1;
    else minusCount += 1;
  }

  const effectiveMinPlus = Math.min(bar.minPlusCount, coreValues.length);
  const rightPerson =
    plusCount >= effectiveMinPlus && (bar.allowMinus || minusCount === 0);

  const fullGwc = member.gwc.getIt && member.gwc.wantIt && member.gwc.capacity;
  const rightSeat = bar.requireFullGWC ? fullGwc : (member.gwc.getIt && member.gwc.wantIt);

  let classification: PeopleClassification;
  if (rightPerson && rightSeat) {
    classification = 'right_person_right_seat';
  } else if (!rightPerson && rightSeat) {
    classification = 'wrong_person_right_seat';
  } else if (rightPerson && !rightSeat) {
    classification = 'right_person_wrong_seat';
  } else {
    classification = 'wrong_person_wrong_seat';
  }

  return {
    rightPerson,
    rightSeat,
    plusCount,
    plusMinusCount,
    minusCount,
    classification,
    needsThreeStrike: classification !== 'right_person_right_seat',
  };
}

/**
 * Evaluates whether a single Scorecard value meets its weekly goal.
 */
export function isScorecardValueOnTrack(
  value: number | null,
  operator: TargetOperator,
  goal: number
): boolean | null {
  if (value === null || Number.isNaN(value)) return null;
  if (operator === '>=') return value >= goal;
  if (operator === '<=') return value <= goal;
  return value === goal;
}

/**
 * Counts consecutive off-track (red) weeks starting from the most recent populated week.
 */
export function getConsecutiveRedWeeks(measurable: ScorecardMeasurable): number {
  let streak = 0;
  for (let i = measurable.weeks.length - 1; i >= 0; i -= 1) {
    const entry = measurable.weeks[i];
    if (entry.value === null) continue;
    const ok = isScorecardValueOnTrack(entry.value, measurable.operator, measurable.goal);
    if (ok === false) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Computes overall Scorecard health percentage based on the latest populated value for each measurable.
 */
export function calculateScorecardHealth(scorecard: ScorecardMeasurable[]): {
  onTrackCount: number;
  offTrackCount: number;
  totalWithData: number;
  percentage: number;
} {
  let onTrackCount = 0;
  let offTrackCount = 0;

  for (const item of scorecard) {
    const latest = [...item.weeks].reverse().find((w) => w.value !== null);
    if (!latest) continue;
    const ok = isScorecardValueOnTrack(latest.value, item.operator, item.goal);
    if (ok === true) onTrackCount += 1;
    else if (ok === false) offTrackCount += 1;
  }

  const totalWithData = onTrackCount + offTrackCount;
  const percentage = totalWithData === 0 ? 100 : Math.round((onTrackCount / totalWithData) * 100);
  return { onTrackCount, offTrackCount, totalWithData, percentage };
}

/**
 * Verifies the EOS "Everyone Has a Number" principle (§4.2).
 * Returns members assigned to Accountability Chart seats who currently lack a Scorecard measurable.
 */
export function auditEveryoneHasANumber(
  members: TeamMember[],
  seats: AccountabilitySeat[],
  scorecard: ScorecardMeasurable[]
): {
  coveredMemberIds: string[];
  uncoveredMemberIds: string[];
  coveragePercent: number;
} {
  const assignedMemberIds = Array.from(
    new Set(seats.map((s) => s.ownerId).filter((id): id is string => Boolean(id)))
  );
  const measurableOwners = new Set(scorecard.map((m) => m.ownerId));

  const targetIds = assignedMemberIds.length > 0 ? assignedMemberIds : members.map((m) => m.id);
  const coveredMemberIds = targetIds.filter((id) => measurableOwners.has(id));
  const uncoveredMemberIds = targetIds.filter((id) => !measurableOwners.has(id));
  const coveragePercent =
    targetIds.length === 0 ? 100 : Math.round((coveredMemberIds.length / targetIds.length) * 100);

  return { coveredMemberIds, uncoveredMemberIds, coveragePercent };
}

export interface ComponentCheckupSummary {
  component: OrgCheckupQuestion['component'];
  score: number;
  maxScore: number;
  percentage: number;
  meetsThreshold: boolean; // >= 80%
}

/**
 * Computes Organizational Checkup scores across all 6 Key Components and overall EOS readiness.
 * Target threshold in EOS is >= 80%.
 */
export function calculateOrganizationalCheckup(questions: OrgCheckupQuestion[]): {
  overallScore: number;
  maxScore: number;
  overallPercentage: number;
  meets80Threshold: boolean;
  byComponent: ComponentCheckupSummary[];
} {
  const components: OrgCheckupQuestion['component'][] = [
    'vision',
    'people',
    'data',
    'issues',
    'process',
    'traction',
  ];

  const byComponent: ComponentCheckupSummary[] = components.map((comp) => {
    const items = questions.filter((q) => q.component === comp);
    const score = items.reduce((acc, q) => acc + Math.min(5, Math.max(1, q.score)), 0);
    const maxScore = items.length * 5;
    const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
    return {
      component: comp,
      score,
      maxScore,
      percentage,
      meetsThreshold: percentage >= 80,
    };
  });

  const overallScore = byComponent.reduce((acc, c) => acc + c.score, 0);
  const maxScore = byComponent.reduce((acc, c) => acc + c.maxScore, 0);
  const overallPercentage = maxScore === 0 ? 0 : Math.round((overallScore / maxScore) * 100);

  return {
    overallScore,
    maxScore,
    overallPercentage,
    meets80Threshold: overallPercentage >= 80,
    byComponent,
  };
}

/**
 * Computes L10 To-Do completion percentage (EOS target >= 90%).
 */
export function calculateToDoCompletionRate(todos: ToDoItem[]): {
  completed: number;
  total: number;
  percentage: number;
  meets90Target: boolean;
} {
  const total = todos.length;
  const completed = todos.filter((t) => t.done).length;
  const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);
  return {
    completed,
    total,
    percentage,
    meets90Target: percentage >= 90,
  };
}

/**
 * Validates Level 10 Meeting ratings per EOS rule §7.2:
 * Any score below 8 requires a 1-sentence reason so the next L10 meeting improves.
 */
export function validateL10Ratings(ratings: MeetingRating[]): {
  valid: boolean;
  averageScore: number;
  missingReasonsForMemberIds: string[];
} {
  const missingReasonsForMemberIds: string[] = [];
  let sum = 0;

  for (const r of ratings) {
    sum += r.score;
    if (r.score < 8 && (!r.reasonBelow8 || r.reasonBelow8.trim().length < 3)) {
      missingReasonsForMemberIds.push(r.memberId);
    }
  }

  const averageScore =
    ratings.length === 0 ? 0 : Number((sum / ratings.length).toFixed(1));

  return {
    valid: missingReasonsForMemberIds.length === 0,
    averageScore,
    missingReasonsForMemberIds,
  };
}

/**
 * Computes Rock completion/health stats (target >= 80% completion/on-track).
 */
export function calculateRocksHealth(rocks: RockItem[]): {
  onTrack: number;
  offTrack: number;
  done: number;
  total: number;
  healthyPercentage: number;
} {
  const onTrack = rocks.filter((r) => r.status === 'on_track').length;
  const offTrack = rocks.filter((r) => r.status === 'off_track').length;
  const done = rocks.filter((r) => r.status === 'done').length;
  const total = rocks.length;
  const healthyPercentage =
    total === 0 ? 100 : Math.round(((onTrack + done) / total) * 100);
  return { onTrack, offTrack, done, total, healthyPercentage };
}

/**
 * Computes FBA (Followed By All) compliance % across Core Processes (§6.2).
 */
export function calculateProcessFBACompliance(processes: CoreProcess[]): {
  fullyFollowedCount: number;
  totalProcesses: number;
  compliancePercentage: number;
} {
  const totalProcesses = processes.length;
  if (totalProcesses === 0) {
    return { fullyFollowedCount: 0, totalProcesses: 0, compliancePercentage: 100 };
  }
  let checksCompleted = 0;
  let fullyFollowedCount = 0;

  for (const p of processes) {
    const hasSteps = p.steps.length > 0;
    const count =
      (hasSteps ? 1 : 0) +
      (p.fba.trained ? 1 : 0) +
      (p.fba.measured ? 1 : 0) +
      (p.fba.managedLma ? 1 : 0);
    checksCompleted += count;
    if (count === 4) fullyFollowedCount += 1;
  }

  const compliancePercentage = Math.round(
    (checksCompleted / (totalProcesses * 4)) * 100
  );

  return {
    fullyFollowedCount,
    totalProcesses,
    compliancePercentage,
  };
}
