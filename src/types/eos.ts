export type CoreValueScore = '+' | '+/-' | '-';
export type TargetOperator = '>=' | '<=' | '=';
export type RockStatus = 'on_track' | 'off_track' | 'done';
export type IssueListType = 'long_term' | 'l10' | 'departmental';
export type DepartmentType = 'leadership' | 'sales' | 'operations' | 'finance';

export interface CoreValue {
  id: string;
  title: string;
  description: string;
  speechExample: string;
}

export interface ProvenProcessStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
}

export interface VTOData {
  companyName: string;
  coreValues: CoreValue[];
  coreFocus: {
    purpose: string;
    niche: string;
  };
  tenYearTarget: {
    statement: string;
    metricLabel: string;
    targetYear: string;
  };
  marketingStrategy: {
    demographics: string;
    psychographics: string;
    geographic: string;
    threeUniques: [string, string, string];
    provenProcessName: string;
    provenProcessSteps: ProvenProcessStep[];
    guarantee: string;
  };
  threeYearPicture: {
    futureDate: string;
    revenue: string;
    profit: string;
    measurables: string;
    looksLike: string[];
  };
  oneYearPlan: {
    futureDate: string;
    revenue: string;
    profit: string;
    measurables: string;
    goals: string[];
  };
  stateOfCompanyNotes: string;
}

export interface AccountabilitySeat {
  id: string;
  title: string;
  department: DepartmentType;
  parentId: string | null;
  ownerId: string | null;
  hasDirectReports: boolean;
  roles: [string, string, string, string, string];
}

export interface StrikeRecord {
  id: string;
  strikeNumber: 1 | 2 | 3;
  date: string;
  note: string;
  status: 'active' | 'resolved';
}

export interface TeamMember {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  avatarInitials: string;
  isVisionary?: boolean;
  isIntegrator?: boolean;
  valueScores: Record<string, CoreValueScore>;
  gwc: {
    getIt: boolean;
    wantIt: boolean;
    capacity: boolean;
  };
  strikes: StrikeRecord[];
  last555Date: string;
  annualReviewDate: string;
  annualReviewSummary: string;
}

export interface PeopleBarConfig {
  minPlusCount: number;
  allowMinus: boolean;
  requireFullGWC: boolean;
}

export interface ScorecardWeekEntry {
  weekLabel: string;
  value: number | null;
}

export interface ScorecardMeasurable {
  id: string;
  name: string;
  ownerId: string;
  unit: string;
  operator: TargetOperator;
  goal: number;
  weeks: ScorecardWeekEntry[];
}

export interface IssueItem {
  id: string;
  title: string;
  listType: IssueListType;
  department: DepartmentType;
  ownerId: string;
  priority: 1 | 2 | 3 | null;
  status: 'open' | 'solved';
  rootCauseSentence: string;
  enterTheDangerNote: string;
  linkedSource?: {
    type: 'scorecard' | 'rock' | 'headline' | 'manual';
    sourceId?: string;
    label?: string;
  };
  createdAt: string;
  solvedAt?: string;
  resolutionSummary?: string;
}

export interface RockMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface RockItem {
  id: string;
  title: string;
  ownerId: string;
  scope: 'company' | 'individual';
  quarter: string;
  dueDate: string;
  status: RockStatus;
  smartCheck: {
    specific: boolean;
    measurable: boolean;
    achievable: boolean;
    relevant: boolean;
    timeBound: boolean;
  };
  milestones: RockMilestone[];
}

export interface ToDoItem {
  id: string;
  title: string;
  ownerId: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
  sourceIssueId?: string;
}

export interface HeadlineItem {
  id: string;
  text: string;
  category: 'customer' | 'employee';
  sentiment: 'good' | 'bad' | 'neutral';
  ownerId: string;
  date: string;
  droppedToIssueId?: string;
}

export interface MeetingRating {
  memberId: string;
  score: number;
  reasonBelow8?: string;
}

export interface L10MeetingRecord {
  id: string;
  date: string;
  facilitatorId: string;
  scribeId: string;
  durationMinutes: number;
  ratings: MeetingRating[];
  cascadingMessages: string[];
  toDoCompletionRate: number;
  notes: string;
}

export interface CoreProcess {
  id: string;
  name: string;
  ownerId: string;
  summary: string;
  steps: string[];
  fba: {
    trained: boolean;
    measured: boolean;
    managedLma: boolean;
    updatedAt: string;
  };
  linkedMeasurableId?: string;
}

export interface DelegateTask {
  id: string;
  title: string;
  quadrant: 1 | 2 | 3 | 4;
  ownerId: string;
  delegatedToId?: string;
  status: 'active' | 'delegated';
}

export interface ClarityBreakEntry {
  id: string;
  date: string;
  authorId: string;
  prompt: string;
  reflection: string;
  actionItem: string;
}

export interface SamePageEntry {
  id: string;
  date: string;
  topic: string;
  visionaryView: string;
  integratorView: string;
  agreedDecision: string;
  resolved: boolean;
}

export interface EOSLifeScore {
  memberId: string;
  doingWhatYouLove: number;
  peopleYouLove: number;
  hugeDifference: number;
  compensatedAppropriately: number;
  timeForPassions: number;
  notes: string;
}

export interface OrgCheckupQuestion {
  id: string;
  component: 'vision' | 'people' | 'data' | 'issues' | 'process' | 'traction';
  text: string;
  score: number; // 1 to 5
}

export interface LMAAuditItem {
  id: string;
  category: 'leadership' | 'management';
  title: string;
  description: string;
  rating: number; // 1 to 5
}

export interface EOSState {
  vto: VTOData;
  seats: AccountabilitySeat[];
  members: TeamMember[];
  peopleBar: PeopleBarConfig;
  scorecard: ScorecardMeasurable[];
  issues: IssueItem[];
  rocks: RockItem[];
  todos: ToDoItem[];
  headlines: HeadlineItem[];
  meetings: L10MeetingRecord[];
  processes: CoreProcess[];
  delegateTasks: DelegateTask[];
  clarityBreaks: ClarityBreakEntry[];
  samePageEntries: SamePageEntry[];
  eosLifeScores: EOSLifeScore[];
  checkupQuestions: OrgCheckupQuestion[];
  lmaAudit: LMAAuditItem[];
  activeQuarter: string;
}
