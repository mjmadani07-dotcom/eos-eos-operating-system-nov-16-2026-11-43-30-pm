import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditEveryoneHasANumber,
  calculateOrganizationalCheckup,
  calculateProcessFBACompliance,
  calculateRocksHealth,
  calculateScorecardHealth,
  calculateToDoCompletionRate,
  evaluatePerson,
  getConsecutiveRedWeeks,
  isScorecardValueOnTrack,
  validateL10Ratings,
} from './eosLogic';
import type {
  AccountabilitySeat,
  CoreProcess,
  CoreValue,
  OrgCheckupQuestion,
  PeopleBarConfig,
  RockItem,
  ScorecardMeasurable,
  TeamMember,
  ToDoItem,
} from '../types/eos';

const sampleValues: CoreValue[] = [
  { id: 'cv1', title: 'مالکیت مطلق', description: '...', speechExample: '...' },
  { id: 'cv2', title: 'صداقت شفاف', description: '...', speechExample: '...' },
  { id: 'cv3', title: 'تکامل مستمر', description: '...', speechExample: '...' },
  { id: 'cv4', title: 'همدلی تیمی', description: '...', speechExample: '...' },
  { id: 'cv5', title: 'نتیجه‌گرایی', description: '...', speechExample: '...' },
];

const sampleBar: PeopleBarConfig = {
  minPlusCount: 3,
  allowMinus: false,
  requireFullGWC: true,
};

test('People Analyzer classifies Right Person / Right Seat accurately', () => {
  const member: TeamMember = {
    id: 'm1',
    name: 'آرش',
    roleTitle: 'مجرّی',
    email: 'a@co.ir',
    avatarInitials: 'آ',
    valueScores: { cv1: '+', cv2: '+', cv3: '+', cv4: '+/-', cv5: '+' },
    gwc: { getIt: true, wantIt: true, capacity: true },
    strikes: [],
    last555Date: '2026-10-01',
    annualReviewDate: '2026-01-15',
    annualReviewSummary: '',
  };

  const res = evaluatePerson(member, sampleValues, sampleBar);
  assert.equal(res.rightPerson, true);
  assert.equal(res.rightSeat, true);
  assert.equal(res.classification, 'right_person_right_seat');
  assert.equal(res.needsThreeStrike, false);
});

test('People Analyzer flags Wrong Person when a minus exists even if GWC is Yes/Yes/Yes', () => {
  const member: TeamMember = {
    id: 'm2',
    name: 'سارا',
    roleTitle: 'فروش',
    email: 's@co.ir',
    avatarInitials: 'س',
    valueScores: { cv1: '+', cv2: '+', cv3: '+', cv4: '+', cv5: '-' },
    gwc: { getIt: true, wantIt: true, capacity: true },
    strikes: [],
    last555Date: '2026-10-01',
    annualReviewDate: '2026-01-15',
    annualReviewSummary: '',
  };

  const res = evaluatePerson(member, sampleValues, sampleBar);
  assert.equal(res.rightPerson, false);
  assert.equal(res.rightSeat, true);
  assert.equal(res.classification, 'wrong_person_right_seat');
  assert.equal(res.needsThreeStrike, true);
});

test('People Analyzer flags Wrong Seat if Capacity is false', () => {
  const member: TeamMember = {
    id: 'm3',
    name: 'رضا',
    roleTitle: 'عملیات',
    email: 'r@co.ir',
    avatarInitials: 'ر',
    valueScores: { cv1: '+', cv2: '+', cv3: '+', cv4: '+', cv5: '+' },
    gwc: { getIt: true, wantIt: true, capacity: false },
    strikes: [],
    last555Date: '2026-10-01',
    annualReviewDate: '2026-01-15',
    annualReviewSummary: '',
  };

  const res = evaluatePerson(member, sampleValues, sampleBar);
  assert.equal(res.rightPerson, true);
  assert.equal(res.rightSeat, false);
  assert.equal(res.classification, 'right_person_wrong_seat');
});

test('Scorecard evaluates >=, <=, = operators and consecutive red streaks', () => {
  assert.equal(isScorecardValueOnTrack(52, '>=', 50), true);
  assert.equal(isScorecardValueOnTrack(49, '>=', 50), false);
  assert.equal(isScorecardValueOnTrack(3, '<=', 5), true);
  assert.equal(isScorecardValueOnTrack(0, '=', 0), true);
  assert.equal(isScorecardValueOnTrack(null, '>=', 10), null);

  const measurable: ScorecardMeasurable = {
    id: 'sc1',
    name: 'وصول مطالبات',
    ownerId: 'm1',
    unit: 'M',
    operator: '>=',
    goal: 100,
    weeks: [
      { weekLabel: 'هفته ۱', value: 110 },
      { weekLabel: 'هفته ۲', value: 80 },
      { weekLabel: 'هفته ۳', value: 75 },
      { weekLabel: 'هفته ۴', value: null },
    ],
  };

  assert.equal(getConsecutiveRedWeeks(measurable), 2);
  const health = calculateScorecardHealth([measurable]);
  assert.equal(health.offTrackCount, 1);
  assert.equal(health.percentage, 0);
});

test('Everyone Has a Number identifies uncovered seat owners', () => {
  const members: TeamMember[] = [
    {
      id: 'm1',
      name: 'آرش',
      roleTitle: 'مجرّی',
      email: 'a@co.ir',
      avatarInitials: 'آ',
      valueScores: {},
      gwc: { getIt: true, wantIt: true, capacity: true },
      strikes: [],
      last555Date: '',
      annualReviewDate: '',
      annualReviewSummary: '',
    },
    {
      id: 'm2',
      name: 'مینا',
      roleTitle: 'مالی',
      email: 'm@co.ir',
      avatarInitials: 'م',
      valueScores: {},
      gwc: { getIt: true, wantIt: true, capacity: true },
      strikes: [],
      last555Date: '',
      annualReviewDate: '',
      annualReviewSummary: '',
    },
  ];
  const seats: AccountabilitySeat[] = [
    {
      id: 's1',
      title: 'Integrator',
      department: 'leadership',
      parentId: null,
      ownerId: 'm1',
      hasDirectReports: true,
      roles: ['LMA', 'P&L', 'Strategy', 'Sync', 'Culture'],
    },
    {
      id: 's2',
      title: 'Finance',
      department: 'finance',
      parentId: 's1',
      ownerId: 'm2',
      hasDirectReports: false,
      roles: ['Cash', 'AR', 'AP', 'Reporting', 'Audit'],
    },
  ];
  const scorecard: ScorecardMeasurable[] = [
    {
      id: 'sc1',
      name: 'Revenue',
      ownerId: 'm1',
      unit: 'M',
      operator: '>=',
      goal: 100,
      weeks: [],
    },
  ];

  const audit = auditEveryoneHasANumber(members, seats, scorecard);
  assert.deepEqual(audit.coveredMemberIds, ['m1']);
  assert.deepEqual(audit.uncoveredMemberIds, ['m2']);
  assert.equal(audit.coveragePercent, 50);
});

test('Organizational Checkup calculates 80% threshold accurately', () => {
  const qs: OrgCheckupQuestion[] = [
    { id: 'q1', component: 'vision', text: 'V1', score: 4 },
    { id: 'q2', component: 'people', text: 'P1', score: 5 },
    { id: 'q3', component: 'data', text: 'D1', score: 4 },
    { id: 'q4', component: 'issues', text: 'I1', score: 4 },
    { id: 'q5', component: 'process', text: 'Pr1', score: 4 },
    { id: 'q6', component: 'traction', text: 'T1', score: 4 },
  ];
  const summary = calculateOrganizationalCheckup(qs);
  assert.equal(summary.overallScore, 25);
  assert.equal(summary.maxScore, 30);
  assert.equal(summary.overallPercentage, 83);
  assert.equal(summary.meets80Threshold, true);
});

test('L10 Rating validation rejects ratings below 8 without a reason', () => {
  const bad = validateL10Ratings([
    { memberId: 'm1', score: 9 },
    { memberId: 'm2', score: 6, reasonBelow8: '' },
  ]);
  assert.equal(bad.valid, false);
  assert.deepEqual(bad.missingReasonsForMemberIds, ['m2']);

  const good = validateL10Ratings([
    { memberId: 'm1', score: 9 },
    { memberId: 'm2', score: 7, reasonBelow8: 'بحث بیش از حد در اسکورکارد' },
  ]);
  assert.equal(good.valid, true);
  assert.equal(good.averageScore, 8);
});

test('To-Do, Rocks, and Process FBA calculators compute expected percentages', () => {
  const todos: ToDoItem[] = [
    { id: 't1', title: 'A', ownerId: 'm1', dueDate: '2026-11-23', done: true, createdAt: '2026-11-16' },
    { id: 't2', title: 'B', ownerId: 'm1', dueDate: '2026-11-23', done: false, createdAt: '2026-11-16' },
  ];
  assert.equal(calculateToDoCompletionRate(todos).percentage, 50);
  assert.equal(calculateToDoCompletionRate(todos).meets90Target, false);

  const rocks: RockItem[] = [
    {
      id: 'r1',
      title: 'R1',
      ownerId: 'm1',
      scope: 'company',
      quarter: 'Q4',
      dueDate: '2026-12-30',
      status: 'on_track',
      smartCheck: { specific: true, measurable: true, achievable: true, relevant: true, timeBound: true },
      milestones: [],
    },
    {
      id: 'r2',
      title: 'R2',
      ownerId: 'm1',
      scope: 'company',
      quarter: 'Q4',
      dueDate: '2026-12-30',
      status: 'off_track',
      smartCheck: { specific: true, measurable: true, achievable: true, relevant: true, timeBound: true },
      milestones: [],
    },
  ];
  assert.equal(calculateRocksHealth(rocks).healthyPercentage, 50);

  const processes: CoreProcess[] = [
    {
      id: 'p1',
      name: 'فروش',
      ownerId: 'm1',
      summary: 'خلاصه',
      steps: ['گام ۱', 'گام ۲'],
      fba: { trained: true, measured: true, managedLma: true, updatedAt: '2026-10-01' },
    },
  ];
  assert.equal(calculateProcessFBACompliance(processes).compliancePercentage, 100);
});
