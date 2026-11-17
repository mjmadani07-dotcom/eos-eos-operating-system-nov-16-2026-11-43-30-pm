import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Flame,
  Plus,
} from 'lucide-react';
import type {
  DepartmentType,
  EOSState,
  IssueItem,
  IssueListType,
} from '../types/eos';

interface IssuesIDSViewProps {
  state: EOSState;
  initialListType?: IssueListType;
  onUpdateIssues: (next: IssueItem[]) => void;
  onSolveIssueWithToDo: (
    issueId: string,
    rootCauseSentence: string,
    todoTitle: string,
    todoOwnerId: string,
    todoDueDate: string
  ) => void;
}

const DEPT_LABELS: Record<DepartmentType, string> = {
  leadership: 'تیم رهبری',
  sales: 'فروش و بازاریابی',
  operations: 'عملیات و پشتیبانی',
  finance: 'مالی و اداری',
};

export const IssuesIDSView: React.FC<IssuesIDSViewProps> = ({
  state,
  initialListType = 'l10',
  onUpdateIssues,
  onSolveIssueWithToDo,
}) => {
  const [listTab, setListTab] = useState<IssueListType>(initialListType);
  const [statusFilter, setStatusFilter] = useState<'open' | 'solved'>('open');
  const [deptFilter, setDeptFilter] = useState<'all' | DepartmentType>('all');

  // New issue form
  const [newTitle, setNewTitle] = useState('');
  const [newOwnerId, setNewOwnerId] = useState(state.members[0]?.id ?? '');
  const [newDept, setNewDept] = useState<DepartmentType>('leadership');
  const [newDangerNote, setNewDangerNote] = useState('');

  // Active IDS Solver state
  const [activeIssueId, setActiveIssueId] = useState<string | null>(
    state.issues.find((i) => i.status === 'open' && i.listType === initialListType)?.id ?? null
  );
  const [rootCauseDraft, setRootCauseDraft] = useState('');
  const [discussedOnceAck, setDiscussedOnceAck] = useState(false);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoOwnerId, setTodoOwnerId] = useState(state.members[0]?.id ?? '');
  const [todoDueDate, setTodoDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [solveError, setSolveError] = useState('');

  const getMemberName = (id: string) =>
    state.members.find((m) => m.id === id)?.name ?? 'نامشخص';

  const filteredIssues = state.issues
    .filter((i) => i.listType === listTab && i.status === statusFilter)
    .filter((i) => (listTab === 'departmental' && deptFilter !== 'all' ? i.department === deptFilter : true))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  const activeIssue = state.issues.find((i) => i.id === activeIssueId && i.status === 'open');

  const handleSelectForIDS = (iss: IssueItem) => {
    setActiveIssueId(iss.id);
    setRootCauseDraft(iss.rootCauseSentence || '');
    setDiscussedOnceAck(false);
    setTodoTitle('');
    setTodoOwnerId(iss.ownerId || state.members[0]?.id || '');
    setSolveError('');
  };

  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item: IssueItem = {
      id: `iss-${Date.now()}`,
      title: newTitle.trim(),
      listType: listTab,
      department: newDept,
      ownerId: newOwnerId,
      priority: null,
      status: 'open',
      rootCauseSentence: '',
      enterTheDangerNote: newDangerNote.trim(),
      linkedSource: { type: 'manual', label: 'ثبت مستقیم' },
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onUpdateIssues([item, ...state.issues]);
    setNewTitle('');
    setNewDangerNote('');
    handleSelectForIDS(item);
  };

  const handleSetPriority = (issueId: string, prio: 1 | 2 | 3 | null) => {
    const next = state.issues.map((i) => {
      if (i.id === issueId) return { ...i, priority: prio };
      if (prio !== null && i.listType === listTab && i.priority === prio) {
        return { ...i, priority: null };
      }
      return i;
    });
    onUpdateIssues(next);
  };

  const handleMoveList = (issueId: string, targetList: IssueListType) => {
    onUpdateIssues(
      state.issues.map((i) =>
        i.id === issueId ? { ...i, listType: targetList, priority: null } : i
      )
    );
  };

  const handleCompleteIDS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIssue) return;
    if (!rootCauseDraft.trim()) {
      setSolveError('گام ۱ (Identify): لطفاً ریشه واقعی مسئله را در ۱ جمله بنویسید.');
      return;
    }
    if (!todoTitle.trim()) {
      setSolveError('گام ۳ (Solve): برای بستن مسئله باید حداقل یک اقدام ۷ روزه (To-Do) تعریف کنید.');
      return;
    }
    onSolveIssueWithToDo(
      activeIssue.id,
      rootCauseDraft,
      todoTitle,
      todoOwnerId,
      todoDueDate
    );
    setSolveError('');
    setTodoTitle('');
    setRootCauseDraft('');
    setDiscussedOnceAck(false);
    const nextOpen = state.issues.find(
      (i) => i.id !== activeIssue.id && i.status === 'open' && i.listType === listTab
    );
    setActiveIssueId(nextOpen?.id ?? null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            مؤلفه چهارم: مسائل (Issues) · شناسایی، بحث و حل دائمی بدون بازگشت
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            لیست‌های سه‌گانه مسائل و موتور حل مسئله IDS™
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setListTab('l10')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              listTab === 'l10'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            مسائل هفتگی L10 ({state.issues.filter((i) => i.listType === 'l10' && i.status === 'open').length})
          </button>
          <button
            type="button"
            onClick={() => setListTab('departmental')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              listTab === 'departmental'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            مسائل دپارتمانی ({state.issues.filter((i) => i.listType === 'departmental' && i.status === 'open').length})
          </button>
          <button
            type="button"
            onClick={() => setListTab('long_term')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              listTab === 'long_term'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            مسائل بلندمدت V/TO ({state.issues.filter((i) => i.listType === 'long_term' && i.status === 'open').length})
          </button>
        </div>
      </div>

      {/* Add New Issue Form */}
      <form
        onSubmit={handleAddIssue}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-4">
          <label className="block text-xs text-slate-500 mb-1">
            عنوان مسئله یا فرصت جدید (ورود به خطر / Enter the Danger)
          </label>
          <input
            type="text"
            required
            placeholder="مسئله واقعی را صریح و بی‌تعارف بنویسید..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-xs text-slate-500 mb-1">یادداشت صراحت (اختیاری)</label>
          <input
            type="text"
            placeholder="چرا این موضوع گره ایجاد کرده؟"
            value={newDangerNote}
            onChange={(e) => setNewDangerNote(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-500 mb-1">مطرح‌کننده</label>
          <select
            value={newOwnerId}
            onChange={(e) => setNewOwnerId(e.target.value)}
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
          <label className="block text-xs text-slate-500 mb-1">دپارتمان</label>
          <select
            value={newDept}
            onChange={(e) => setNewDept(e.target.value as DepartmentType)}
            className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            {Object.entries(DEPT_LABELS).map(([k, lbl]) => (
              <option key={k} value={k}>
                {lbl}
              </option>
            ))}
          </select>
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

      {/* Main Split: Issues List + IDS 3-Step Solver */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Right List */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  statusFilter === 'open'
                    ? 'bg-slate-900 text-white dark:bg-indigo-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                مسائل باز
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('solved')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  statusFilter === 'solved'
                    ? 'bg-slate-900 text-white dark:bg-indigo-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                حل‌شده (کشته‌شده)
              </button>
            </div>

            {listTab === 'departmental' && (
              <select
                aria-label="فیلتر دپارتمان"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value as 'all' | DepartmentType)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">همه دپارتمان‌ها</option>
                {Object.entries(DEPT_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredIssues.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              در این بخش مسئله‌ای وجود ندارد.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredIssues.map((iss) => {
                const isSelected = activeIssue?.id === iss.id;
                return (
                  <div
                    key={iss.id}
                    className={`py-3.5 px-2 rounded-lg transition-colors space-y-2 ${
                      isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => iss.status === 'open' && handleSelectForIDS(iss)}
                        className="text-right flex-1 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          {iss.priority && (
                            <span className="px-1.5 py-0.5 text-[11px] font-mono-num font-bold bg-indigo-600 text-white rounded">
                              اولویت {iss.priority}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {iss.title}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          <span>{getMemberName(iss.ownerId)}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>{DEPT_LABELS[iss.department]}</span>
                          {iss.linkedSource?.label && (
                            <>
                              <span className="mx-1.5" aria-hidden="true">·</span>
                              <span>{iss.linkedSource.label}</span>
                            </>
                          )}
                        </div>
                      </button>

                      {iss.status === 'open' && (
                        <div className="flex items-center gap-1 shrink-0">
                          {([1, 2, 3] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() =>
                                handleSetPriority(iss.id, iss.priority === p ? null : p)
                              }
                              aria-label={`اولویت ${p} برای ${iss.title}`}
                              className={`w-7 h-7 rounded text-xs font-mono-num font-bold border ${
                                iss.priority === p
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {iss.status === 'solved' && iss.resolutionSummary && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{iss.resolutionSummary}</span>
                      </div>
                    )}

                    {iss.status === 'open' && (
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleSelectForIDS(iss)}
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          حل با متد IDS ←
                        </button>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <ArrowLeftRight className="w-3 h-3" />
                          <select
                            aria-label={`انتقال لیست ${iss.title}`}
                            value={iss.listType}
                            onChange={(e) =>
                              handleMoveList(iss.id, e.target.value as IssueListType)
                            }
                            className="bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px]"
                          >
                            <option value="l10">انتقال به L10</option>
                            <option value="departmental">انتقال به دپارتمانی</option>
                            <option value="long_term">انتقال به بلندمدت V/TO</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3-Step IDS Solver Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              میز حل مسئله ۳ گامه (IDS™)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              خیر اعظم = هر کلمه V/TO × مراقبت صادقانه (Greater Good)
            </p>
          </div>

          {activeIssue ? (
            <form onSubmit={handleCompleteIDS} className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  مسئله انتخاب‌شده برای حل:
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeIssue.title}
                </div>
                {activeIssue.enterTheDangerNote && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 pt-1">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeIssue.enterTheDangerNote}</span>
                  </div>
                )}
              </div>

              {/* Step 1: Identify */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  گام ۱: شناسایی ریشه واقعی (Identify — Who, What, 1 Sentence)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  معلول‌ها را حل نکنید؛ ریشه دقیق مسئله را در یک جمله شفاف بنویسید.
                </p>
                <textarea
                  rows={2}
                  required
                  placeholder="ریشه واقعی این مسئله چیست؟"
                  value={rootCauseDraft}
                  onChange={(e) => setRootCauseDraft(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Step 2: Discuss */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  گام ۲: بحث سازنده بدون تکرار (Discuss)
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discussedOnceAck}
                    onChange={(e) => setDiscussedOnceAck(e.target.checked)}
                  />
                  <span>هر فرد نظر خود را فقط یک‌بار با رویکرد خیر اعظم سازمان بیان کرد.</span>
                </label>
              </div>

              {/* Step 3: Solve -> 7-Day To-Do */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  گام ۳: حل قطعی و خروجی اقدام ۷ روزه (Solve → 7-Day To-Do)
                </div>
                <input
                  type="text"
                  required
                  placeholder="اقدام دقیق ۷ روزه برای حل دائمی مسئله..."
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">مالک To-Do</label>
                    <select
                      value={todoOwnerId}
                      onChange={(e) => setTodoOwnerId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">سررسید (۷ روزه)</label>
                    <input
                      type="date"
                      value={todoDueDate}
                      onChange={(e) => setTodoDueDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {solveError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{solveError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                تکمیل IDS و افزودن به لیست اقدامات ۷ روزه
              </button>
            </form>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              یک مسئله باز از لیست سمت راست انتخاب کنید تا فرآیند ۳ گامه IDS آغاز شود.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
