import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Star,
} from 'lucide-react';
import type {
  EOSState,
  HeadlineItem,
  L10MeetingRecord,
  MeetingRating,
  RockItem,
  RockStatus,
  ToDoItem,
} from '../types/eos';
import {
  calculateRocksHealth,
  calculateToDoCompletionRate,
  isScorecardValueOnTrack,
  validateL10Ratings,
} from '../utils/eosLogic';

interface TractionViewProps {
  state: EOSState;
  initialSubTab?: 'rocks' | 'l10' | 'todos';
  onUpdateRocks: (next: RockItem[]) => void;
  onUpdateTodos: (next: ToDoItem[]) => void;
  onUpdateHeadlines: (next: HeadlineItem[]) => void;
  onSaveMeeting: (meeting: L10MeetingRecord) => void;
  onDropRockToIssues: (rock: RockItem) => void;
  onDropScorecardToIssues: (scId: string) => void;
  onDropHeadlineToIssues: (headlineId: string, text: string, ownerId: string) => void;
  onSolveIssueWithToDo: (
    issueId: string,
    rootCauseSentence: string,
    todoTitle: string,
    todoOwnerId: string,
    todoDueDate: string
  ) => void;
}

const L10_SEGMENTS = [
  { id: 'segue', title: '۱. مقدمه (Segue / اخبار خوب)', minutes: 5 },
  { id: 'scorecard', title: '۲. مرور کارت امتیاز (Scorecard)', minutes: 5 },
  { id: 'rocks', title: '۳. مرور راک‌های ۹۰ روزه', minutes: 5 },
  { id: 'headlines', title: '۴. تیترهای مشتریان و پرسنل', minutes: 5 },
  { id: 'todos', title: '۵. مرور اقدامات ۷ روزه (To-Do)', minutes: 5 },
  { id: 'ids', title: '۶. حل مسائل ریشه‌ای (IDS)', minutes: 60 },
  { id: 'conclude', title: '۷. جمع‌بندی و امتیازدهی (Conclude)', minutes: 5 },
] as const;

export const TractionView: React.FC<TractionViewProps> = ({
  state,
  initialSubTab = 'rocks',
  onUpdateRocks,
  onUpdateTodos,
  onUpdateHeadlines,
  onSaveMeeting,
  onDropRockToIssues,
  onDropScorecardToIssues,
  onDropHeadlineToIssues,
  onSolveIssueWithToDo,
}) => {
  const [subTab, setSubTab] = useState<'rocks' | 'l10' | 'todos'>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Rocks state
  const [rockScopeFilter, setRockScopeFilter] = useState<'all' | 'company' | 'individual'>('all');
  const [newRockTitle, setNewRockTitle] = useState('');
  const [newRockOwner, setNewRockOwner] = useState(state.members[0]?.id ?? '');
  const [newRockScope, setNewRockScope] = useState<'company' | 'individual'>('company');
  const [newRockDue, setNewRockDue] = useState('2026-12-21');

  // L10 Meeting live state
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(90 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [facilitatorId, setFacilitatorId] = useState(
    state.members.find((m) => m.isIntegrator)?.id ?? state.members[0]?.id ?? ''
  );
  const [scribeId, setScribeId] = useState(
    state.members[4]?.id ?? state.members[1]?.id ?? ''
  );
  const [newHeadlineText, setNewHeadlineText] = useState('');
  const [newHeadlineCat, setNewHeadlineCat] = useState<'customer' | 'employee'>('customer');
  const [newHeadlineSentiment, setNewHeadlineSentiment] = useState<'good' | 'bad'>('good');

  // Inline IDS inside L10
  const [l10IssueId, setL10IssueId] = useState<string>(
    state.issues.find((i) => i.status === 'open' && i.listType === 'l10')?.id ?? ''
  );
  const [l10RootCause, setL10RootCause] = useState('');
  const [l10TodoTitle, setL10TodoTitle] = useState('');
  const [l10TodoOwner, setL10TodoOwner] = useState(state.members[0]?.id ?? '');

  // Conclude & Ratings
  const [cascadingInput, setCascadingInput] = useState('');
  const [cascadingList, setCascadingList] = useState<string[]>([
    'تعهد تیم رهبری به تکمیل ۱۰۰٪ گزارش اسکورکارد پیش از جلسه دوشنبه.',
  ]);
  const [ratings, setRatings] = useState<MeetingRating[]>(() =>
    state.members.slice(0, 5).map((m) => ({ memberId: m.id, score: 9, reasonBelow8: '' }))
  );
  const [ratingError, setRatingError] = useState('');
  const [meetingSavedMsg, setMeetingSavedMsg] = useState('');

  // Standalone To-Do form
  const [standaloneTodoTitle, setStandaloneTodoTitle] = useState('');
  const [standaloneTodoOwner, setStandaloneTodoOwner] = useState(state.members[0]?.id ?? '');

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getMemberName = (id: string) =>
    state.members.find((m) => m.id === id)?.name ?? 'نامشخص';

  const rocksHealth = calculateRocksHealth(state.rocks);
  const todoStats = calculateToDoCompletionRate(state.todos);
  const filteredRocks =
    rockScopeFilter === 'all'
      ? state.rocks
      : state.rocks.filter((r) => r.scope === rockScopeFilter);

  const openL10Issues = state.issues
    .filter((i) => i.status === 'open' && i.listType === 'l10')
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  const selectedL10Issue = openL10Issues.find((i) => i.id === l10IssueId) ?? openL10Issues[0];

  const handleAddRock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRockTitle.trim()) return;
    const item: RockItem = {
      id: `rock-${Date.now()}`,
      title: newRockTitle.trim(),
      ownerId: newRockOwner,
      scope: newRockScope,
      quarter: state.activeQuarter,
      dueDate: newRockDue,
      status: 'on_track',
      smartCheck: {
        specific: true,
        measurable: true,
        achievable: true,
        relevant: true,
        timeBound: true,
      },
      milestones: [],
    };
    onUpdateRocks([item, ...state.rocks]);
    setNewRockTitle('');
  };

  const handleRockStatusChange = (rockId: string, status: RockStatus) => {
    onUpdateRocks(
      state.rocks.map((r) => (r.id === rockId ? { ...r, status } : r))
    );
  };

  const handleToggleMilestone = (rockId: string, msId: string) => {
    onUpdateRocks(
      state.rocks.map((r) =>
        r.id === rockId
          ? {
              ...r,
              milestones: r.milestones.map((m) =>
                m.id === msId ? { ...m, done: !m.done } : m
              ),
            }
          : r
      )
    );
  };

  const handleAddHeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadlineText.trim()) return;
    const item: HeadlineItem = {
      id: `hl-${Date.now()}`,
      text: newHeadlineText.trim(),
      category: newHeadlineCat,
      sentiment: newHeadlineSentiment,
      ownerId: facilitatorId,
      date: new Date().toISOString().slice(0, 10),
    };
    onUpdateHeadlines([item, ...state.headlines]);
    setNewHeadlineText('');
  };

  const handleSolveInL10 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedL10Issue || !l10TodoTitle.trim()) return;
    onSolveIssueWithToDo(
      selectedL10Issue.id,
      l10RootCause.trim() || selectedL10Issue.rootCauseSentence || 'ریشه‌یابی در جلسه L10',
      l10TodoTitle.trim(),
      l10TodoOwner,
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    );
    setL10RootCause('');
    setL10TodoTitle('');
  };

  const handleConcludeMeeting = () => {
    const validation = validateL10Ratings(ratings);
    if (!validation.valid) {
      setRatingError(
        'طبق قانون جلسه سطح ۱۰، برای هر امتیازی که زیر ۸ باشد نوشتن دلیل یک‌جمله‌ای الزامی است.'
      );
      return;
    }
    setRatingError('');
    const record: L10MeetingRecord = {
      id: `mtg-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      facilitatorId,
      scribeId,
      durationMinutes: 90 - Math.floor(secondsLeft / 60),
      ratings,
      cascadingMessages: cascadingList,
      toDoCompletionRate: todoStats.percentage,
      notes: `میانگین امتیاز جلسه: ${validation.averageScore}/10`,
    };
    onSaveMeeting(record);
    setTimerRunning(false);
    setMeetingSavedMsg(`جلسه سطح ۱۰ با میانگین امتیاز ${validation.averageScore} از ۱۰ ثبت و بایگانی شد.`);
    window.setTimeout(() => setMeetingSavedMsg(''), 4000);
  };

  const handleAddStandaloneTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!standaloneTodoTitle.trim()) return;
    const td: ToDoItem = {
      id: `td-${Date.now()}`,
      title: standaloneTodoTitle.trim(),
      ownerId: standaloneTodoOwner,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      done: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onUpdateTodos([td, ...state.todos]);
    setStandaloneTodoTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            مؤلفه ششم: اجرا (Traction) · انضباط ۹۰ روزه و ریتم جلسات هفتگی
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            اولویت‌های ۹۰ روزه (Rocks) و جلسه سطح ۱۰ <span dir="ltr" className="inline-block">(Level 10™)</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('rocks')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'rocks'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            راک‌های ۹۰ روزه ({state.rocks.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('l10')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'l10'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            جلسه زنده سطح ۱۰ (۹۰ دقیقه)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('todos')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'todos'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            اقدامات ۷ روزه و تاریخچه ({todoStats.percentage}٪)
          </button>
        </div>
      </div>

      {subTab === 'rocks' && (
        <div className="space-y-6">
          {/* Rocks Summary & Filter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-500">سلامت کل راک‌ها: </span>
                <span className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
                  {rocksHealth.healthyPercentage}٪
                </span>
              </div>
              <div>
                <span className="text-slate-500">در مسیر: </span>
                <span className="font-mono-num font-bold text-emerald-600">{rocksHealth.onTrack}</span>
              </div>
              <div>
                <span className="text-slate-500">تکمیل‌شده: </span>
                <span className="font-mono-num font-bold text-indigo-600">{rocksHealth.done}</span>
              </div>
              <div>
                <span className="text-slate-500">عقب‌افتاده: </span>
                <span className="font-mono-num font-bold text-red-600">{rocksHealth.offTrack}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['all', 'company', 'individual'] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setRockScopeFilter(sc)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                    rockScopeFilter === sc
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sc === 'all' ? 'همه راک‌ها' : sc === 'company' ? 'راک‌های شرکتی (۳-۷)' : 'راک‌های فردی'}
                </button>
              ))}
            </div>
          </div>

          {/* Add Rock Form */}
          <form
            onSubmit={handleAddRock}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-5">
              <label className="block text-xs text-slate-500 mb-1">عنوان راک ۹۰ روزه (SMART)</label>
              <input
                type="text"
                required
                placeholder="مثلاً: استقرار کامل داشبورد فروش برای ۲۰ مشتری اول..."
                value={newRockTitle}
                onChange={(e) => setNewRockTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">مالک</label>
              <select
                value={newRockOwner}
                onChange={(e) => setNewRockOwner(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">سطح راک</label>
              <select
                value={newRockScope}
                onChange={(e) => setNewRockScope(e.target.value as 'company' | 'individual')}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="company">شرکتی (Company)</option>
                <option value="individual">فردی (Individual)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">سررسید</label>
              <input
                type="date"
                value={newRockDue}
                onChange={(e) => setNewRockDue(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت</span>
              </button>
            </div>
          </form>

          {/* Rocks List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRocks.map((rock) => (
              <div
                key={rock.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span>{rock.scope === 'company' ? 'راک شرکتی' : 'راک فردی'}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>مالک: {getMemberName(rock.ownerId)}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-mono-num">{rock.dueDate}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rock.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {(
                      [
                        { key: 'on_track', label: 'در مسیر' },
                        { key: 'off_track', label: 'عقب‌افتاده' },
                        { key: 'done', label: 'تکمیل' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleRockStatusChange(rock.id, opt.key)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                          rock.status === opt.key
                            ? opt.key === 'done'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : opt.key === 'off_track'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {rock.milestones.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-500">مایلستون‌ها:</div>
                    {rock.milestones.map((ms) => (
                      <label
                        key={ms.id}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={ms.done}
                          onChange={() => handleToggleMilestone(rock.id, ms.id)}
                        />
                        <span className={ms.done ? 'line-through text-slate-400' : ''}>
                          {ms.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {rock.status === 'off_track' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      راک خارج از مسیر است؛ برای ریشه‌یابی به جلسه L10 بفرستید.
                    </span>
                    <button
                      type="button"
                      onClick={() => onDropRockToIssues(rock)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg whitespace-nowrap"
                    >
                      انتقال به IDS
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'l10' && (
        <div className="space-y-6">
          {/* L10 Top Timer & Facilitator/Scribe Control Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs text-slate-400">زمان‌سنج ۹۰ دقیقه‌ای جلسه L10</div>
                  <div className="text-2xl font-bold font-mono-num" data-testid="l10-timer">
                    {formatTimer(secondsLeft)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{timerRunning ? 'توقف تایمر' : 'شروع تایمر'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsLeft(90 * 60);
                  }}
                  aria-label="بازنشانی تایمر ۹۰ دقیقه"
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2">
                <span className="text-slate-400">تسهیل‌گر (Facilitator):</span>
                <select
                  value={facilitatorId}
                  onChange={(e) => setFacilitatorId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  {state.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-slate-400">ثبت‌کننده (Scribe):</span>
                <select
                  value={scribeId}
                  onChange={(e) => setScribeId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  {state.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* 7-Step L10 Agenda Stepper + Active Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <nav
              aria-label="دستور جلسه ۷ مرحله‌ای سطح ۱۰"
              className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1"
            >
              {L10_SEGMENTS.map((seg, idx) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setActiveSegmentIdx(idx)}
                  className={`w-full text-right px-3.5 py-3 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    activeSegmentIdx === idx
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{seg.title}</span>
                  <span className="font-mono-num opacity-80">{seg.minutes} دقیقه</span>
                </button>
              ))}
            </nav>

            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              {/* Segment 0: Segue */}
              {activeSegmentIdx === 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ۱. مقدمه و اخبار خوب (Segue — ۵ دقیقه)
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    هر عضو تیم رهبری یک خبر خوب شخصی و یک خبر خوب کاری بیان می‌کند تا ذهن‌ها از درگیری‌های روزمره رها و همسو شود.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.members.slice(0, 6).map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          آماده بیان ۱ خبر خوب شخصی + ۱ خبر خوب کاری
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Segment 1: Scorecard Review (No discussion, Drop it down!) */}
              {activeSegmentIdx === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        ۲. مرور کارت امتیاز هفتگی (۵ دقیقه — بدون بحث)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        فقط اعلام On Track یا Off Track. در صورت نیاز به بحث، دکمه «Drop it down» را بزنید.
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {state.scorecard.map((sc) => {
                      const latest = [...sc.weeks].reverse().find((w) => w.value !== null);
                      const ok = isScorecardValueOnTrack(latest?.value ?? null, sc.operator, sc.goal);
                      return (
                        <div key={sc.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {sc.name}
                            </div>
                            <div className="text-slate-500">
                              {getMemberName(sc.ownerId)} · هدف {sc.operator} {sc.goal} {sc.unit} · ثبت‌شده:{' '}
                              <span className="font-mono-num font-bold">{latest?.value ?? '—'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-1 rounded font-semibold ${
                                ok === false
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {ok === false ? 'Off Track' : 'On Track'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onDropScorecardToIssues(sc.id)}
                              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              Drop it down
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Segment 2: Rock Review */}
              {activeSegmentIdx === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      ۳. مرور راک‌های فصلی (۵ دقیقه — بدون بحث)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      هر راک فقط در یک کلمه «در مسیر» یا «عقب‌افتاده» اعلام می‌شود.
                    </p>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {state.rocks.map((rk) => (
                      <div key={rk.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {rk.title}
                          </div>
                          <div className="text-slate-500">{getMemberName(rk.ownerId)}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-1 rounded font-semibold ${
                              rk.status === 'off_track'
                                ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {rk.status === 'done' ? 'Done' : rk.status === 'off_track' ? 'Off Track' : 'On Track'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDropRockToIssues(rk)}
                            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Drop it down
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Segment 3: Customer / Employee Headlines */}
              {activeSegmentIdx === 3 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ۴. تیترهای مشتریان و پرسنل (۵ دقیقه — در ۱ جمله)
                  </h2>
                  <form onSubmit={handleAddHeadline} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="تیتر خبر مشتری یا کارمند در یک جمله..."
                      value={newHeadlineText}
                      onChange={(e) => setNewHeadlineText(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <select
                      value={newHeadlineCat}
                      onChange={(e) => setNewHeadlineCat(e.target.value as 'customer' | 'employee')}
                      className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="customer">مشتری</option>
                      <option value="employee">پرسنل</option>
                    </select>
                    <select
                      value={newHeadlineSentiment}
                      onChange={(e) => setNewHeadlineSentiment(e.target.value as 'good' | 'bad')}
                      className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="good">خبر خوب</option>
                      <option value="bad">هشدار / گلایه</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                    >
                      ثبت تیتر
                    </button>
                  </form>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {state.headlines.map((hl) => (
                      <div key={hl.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {hl.text}
                          </div>
                          <div className="text-slate-500">
                            {hl.category === 'customer' ? 'مشتری' : 'پرسنل'} ·{' '}
                            {hl.sentiment === 'good' ? 'مثبت' : 'نیازمند توجه'} · {getMemberName(hl.ownerId)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDropHeadlineToIssues(hl.id, hl.text, hl.ownerId)}
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                        >
                          Drop it down
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Segment 4: To-Do List Review (90% Target) */}
              {activeSegmentIdx === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        ۵. مرور اقدامات ۷ روزه (To-Do Review — تارگت ۹۰٪)
                      </h2>
                      <p className="text-xs text-slate-500">
                        نرخ انجام فعلی: <span className="font-mono-num font-bold">{todoStats.percentage}٪</span> ({todoStats.completed} از {todoStats.total})
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {state.todos.map((td) => (
                      <label
                        key={td.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={td.done}
                            onChange={() =>
                              onUpdateTodos(
                                state.todos.map((t) =>
                                  t.id === td.id ? { ...t, done: !t.done } : t
                                )
                              )
                            }
                          />
                          <span className={td.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100 font-medium'}>
                            {td.title}
                          </span>
                        </div>
                        <span className="text-slate-500 shrink-0">{getMemberName(td.ownerId)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Segment 5: IDS (60 Minutes) */}
              {activeSegmentIdx === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      ۶. حل ریشه‌ای مسائل در جلسه (IDS — ۶۰ دقیقه)
                    </h2>
                    <p className="text-xs text-slate-500">
                      مسائل اولویت ۱، ۲ و ۳ را انتخاب کرده و با تعریف اقدام ۷ روزه به‌طور دائمی حل کنید.
                    </p>
                  </div>

                  {openL10Issues.length === 0 ? (
                    <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg">
                      تمامی مسائل لیست L10 حل شده‌اند!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <select
                        aria-label="انتخاب مسئله L10 برای IDS"
                        value={selectedL10Issue?.id ?? ''}
                        onChange={(e) => setL10IssueId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        {openL10Issues.map((iss) => (
                          <option key={iss.id} value={iss.id}>
                            {iss.priority ? `[اولویت ${iss.priority}] ` : ''}
                            {iss.title}
                          </option>
                        ))}
                      </select>

                      {selectedL10Issue && (
                        <form onSubmit={handleSolveInL10} className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <div>
                            <label className="block text-xs font-semibold mb-1">
                              ۱. ریشه واقعی مسئله (Identify):
                            </label>
                            <input
                              type="text"
                              placeholder={selectedL10Issue.rootCauseSentence || 'ریشه ۱ جمله‌ای مسئله...'}
                              value={l10RootCause}
                              onChange={(e) => setL10RootCause(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">
                              ۲. اقدام ۷ روزه برای حل قطعی (Solve → To-Do):
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <input
                                type="text"
                                required
                                placeholder="اقدام مشخص هفته آینده..."
                                value={l10TodoTitle}
                                onChange={(e) => setL10TodoTitle(e.target.value)}
                                className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                              <select
                                value={l10TodoOwner}
                                onChange={(e) => setL10TodoOwner(e.target.value)}
                                className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                              >
                                {state.members.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                              >
                                حل مسئله و ثبت To-Do
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Segment 6: Conclude & Ratings */}
              {activeSegmentIdx === 6 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      ۷. جمع‌بندی، پیام‌های آبشاری و امتیازدهی ۱ تا ۱۰ (Conclude)
                    </h2>
                    <p className="text-xs text-slate-500">
                      هر عضو به جلسه نمره ۱ تا ۱۰ می‌دهد. هر نمره زیر ۸ نیازمند ذکر دلیل در یک جمله است.
                    </p>
                  </div>

                  {/* Cascading Messages */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      پیام‌های آبشاری به بدنه سازمان (Cascading Messages):
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {cascadingList.map((msg, i) => (
                        <li key={i}>• {msg}</li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="افزودن پیام آبشاری جدید..."
                        value={cascadingInput}
                        onChange={(e) => setCascadingInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!cascadingInput.trim()) return;
                          setCascadingList([...cascadingList, cascadingInput.trim()]);
                          setCascadingInput('');
                        }}
                        className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white dark:bg-indigo-600 rounded-lg"
                      >
                        افزودن پیام
                      </button>
                    </div>
                  </div>

                  {/* Member Ratings 1-10 */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      امتیازدهی پایان جلسه (هدف: ۸ به بالا):
                    </div>
                    {ratings.map((r) => (
                      <div key={r.memberId} className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="w-32 font-semibold text-slate-900 dark:text-slate-100">
                          {getMemberName(r.memberId)}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          aria-label={`امتیاز جلسه برای ${getMemberName(r.memberId)}`}
                          value={r.score}
                          onChange={(e) => {
                            const score = Math.min(10, Math.max(1, Number(e.target.value) || 1));
                            setRatings(
                              ratings.map((item) =>
                                item.memberId === r.memberId ? { ...item, score } : item
                              )
                            );
                          }}
                          className="w-16 px-2 py-1.5 font-mono-num text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                        {r.score < 8 && (
                          <input
                            type="text"
                            placeholder="علت نمره زیر ۸ در یک جمله..."
                            value={r.reasonBelow8 ?? ''}
                            onChange={(e) =>
                              setRatings(
                                ratings.map((item) =>
                                  item.memberId === r.memberId
                                    ? { ...item, reasonBelow8: e.target.value }
                                    : item
                                )
                              )
                            }
                            className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {ratingError && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{ratingError}</span>
                    </div>
                  )}

                  {meetingSavedMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{meetingSavedMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConcludeMeeting}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    بستن و ثبت رسمی جلسه سطح ۱۰
                  </button>
                </div>
              )}

              {/* Prev / Next Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={activeSegmentIdx === 0}
                  onClick={() => setActiveSegmentIdx((i) => Math.max(0, i - 1))}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  بخش قبلی
                </button>
                <button
                  type="button"
                  disabled={activeSegmentIdx === L10_SEGMENTS.length - 1}
                  onClick={() =>
                    setActiveSegmentIdx((i) => Math.min(L10_SEGMENTS.length - 1, i + 1))
                  }
                  className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 rounded-lg disabled:opacity-40"
                >
                  بخش بعدی دستور جلسه
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'todos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 7-Day To-Do List */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  لیست اقدامات ۷ روزه (To-Do List)
                </h2>
                <p className="text-xs text-slate-500">
                  تارگت استاندارد EOS: انجام حداقل ۹۰٪ اقدامات تا جلسه هفته بعد
                </p>
              </div>
              <span
                className={`text-sm font-mono-num font-bold ${
                  todoStats.meets90Target ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {todoStats.percentage}٪ ({todoStats.completed}/{todoStats.total})
              </span>
            </div>

            <form onSubmit={handleAddStandaloneTodo} className="flex flex-wrap gap-2">
              <input
                type="text"
                required
                placeholder="اقدام ۷ روزه جدید..."
                value={standaloneTodoTitle}
                onChange={(e) => setStandaloneTodoTitle(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <select
                value={standaloneTodoOwner}
                onChange={(e) => setStandaloneTodoOwner(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
              >
                افزودن
              </button>
            </form>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {state.todos.map((td) => (
                <label
                  key={td.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={td.done}
                      onChange={() =>
                        onUpdateTodos(
                          state.todos.map((t) =>
                            t.id === td.id ? { ...t, done: !t.done } : t
                          )
                        )
                      }
                    />
                    <span className={td.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100 font-medium'}>
                      {td.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 shrink-0 font-mono-num">
                    {getMemberName(td.ownerId)} · {td.dueDate}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Past L10 Meeting History */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تاریخچه جلسات سطح ۱۰
            </h2>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {state.meetings.map((mtg) => {
                const avg = (
                  mtg.ratings.reduce((acc, r) => acc + r.score, 0) /
                  Math.max(1, mtg.ratings.length)
                ).toFixed(1);
                return (
                  <div key={mtg.id} className="py-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
                        جلسه {mtg.date}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono-num font-bold text-indigo-600 dark:text-indigo-400">
                        <Star className="w-3.5 h-3.5" />
                        <span>{avg} / 10</span>
                      </span>
                    </div>
                    <div className="text-slate-500">
                      تسهیل‌گر: {getMemberName(mtg.facilitatorId)} · نرخ To-Do: {mtg.toDoCompletionRate}٪
                    </div>
                    {mtg.cascadingMessages.length > 0 && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        پیام آبشاری: {mtg.cascadingMessages[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
