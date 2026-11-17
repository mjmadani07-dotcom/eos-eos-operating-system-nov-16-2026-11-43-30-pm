import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  UserCheck,
} from 'lucide-react';
import type { EOSState, ScorecardMeasurable, TargetOperator } from '../types/eos';
import {
  auditEveryoneHasANumber,
  calculateScorecardHealth,
  getConsecutiveRedWeeks,
  isScorecardValueOnTrack,
} from '../utils/eosLogic';

interface DataScorecardViewProps {
  state: EOSState;
  onUpdateScorecard: (next: ScorecardMeasurable[]) => void;
  onDropToIssues: (measurable: ScorecardMeasurable, latestValue: number | null) => void;
  onNavigateToIssues: () => void;
}

export const DataScorecardView: React.FC<DataScorecardViewProps> = ({
  state,
  onUpdateScorecard,
  onDropToIssues,
  onNavigateToIssues,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState(state.members[0]?.id ?? '');
  const [operator, setOperator] = useState<TargetOperator>('>=');
  const [goal, setGoal] = useState<string>('10');
  const [unit, setUnit] = useState('عدد');
  const [droppedFeedbackId, setDroppedFeedbackId] = useState<string | null>(null);

  const health = calculateScorecardHealth(state.scorecard);
  const coverageAudit = auditEveryoneHasANumber(state.members, state.seats, state.scorecard);

  const getMemberName = (id: string) =>
    state.members.find((m) => m.id === id)?.name ?? 'نامشخص';

  const handleCellChange = (measurableId: string, weekIndex: number, raw: string) => {
    const parsed = raw.trim() === '' ? null : Number(raw);
    if (parsed !== null && Number.isNaN(parsed)) return;

    const next = state.scorecard.map((sc) => {
      if (sc.id !== measurableId) return sc;
      const weeks = sc.weeks.map((w, idx) =>
        idx === weekIndex ? { ...w, value: parsed } : w
      );
      return { ...sc, weeks };
    });
    onUpdateScorecard(next);
  };

  const handleAddMeasurable = (e: React.FormEvent, prefillOwnerId?: string) => {
    e.preventDefault();
    if (!name.trim()) return;
    const weekTemplate = state.scorecard[0]?.weeks.map((w) => ({
      weekLabel: w.weekLabel,
      value: null,
    })) ??
      Array.from({ length: 13 }, (_, i) => ({
        weekLabel: `هـ${i + 1}`,
        value: null,
      }));

    const newItem: ScorecardMeasurable = {
      id: `sc-${Date.now()}`,
      name: name.trim(),
      ownerId: prefillOwnerId || ownerId || state.members[0]?.id || '',
      unit: unit.trim() || 'عدد',
      operator,
      goal: Number(goal) || 0,
      weeks: weekTemplate,
    };
    onUpdateScorecard([...state.scorecard, newItem]);
    setName('');
    setShowAddForm(false);
  };

  const handleQuickAssignForUncovered = (memberId: string) => {
    setOwnerId(memberId);
    setName(`شاخص عملکرد هفتگی ${getMemberName(memberId)}`);
    setShowAddForm(true);
  };

  const handleDrop = (sc: ScorecardMeasurable, latestVal: number | null) => {
    onDropToIssues(sc, latestVal);
    setDroppedFeedbackId(sc.id);
    window.setTimeout(() => setDroppedFeedbackId(null), 2500);
  };

  const weekHeaders = state.scorecard[0]?.weeks.map((w) => w.weekLabel) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            مؤلفه سوم: داده‌ها (Data) · مدیریت بر پایه شاخص‌های پیش‌رو (Leading Indicators)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            کارت امتیاز هفتگی ۱۳ هفته‌ای <span dir="ltr" className="inline-block">(Weekly Scorecard™)</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-mono-num text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg">
            سلامت هفته جاری: <span className="font-bold">{health.percentage}٪</span> ({health.onTrackCount} سبز · {health.offTrackCount} قرمز)
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن شاخص جدید</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={(e) => handleAddMeasurable(e)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">نام شاخص سنجش‌پذیر</label>
            <input
              type="text"
              required
              placeholder="مثلاً: سرنخ‌های واجد شرایط هفتگی"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">مالک (تنها ۱ نفر)</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">شرط و تارگت هفتگی</label>
            <div className="flex gap-1">
              <select
                aria-label="اپراتور هدف"
                value={operator}
                onChange={(e) => setOperator(e.target.value as TargetOperator)}
                className="w-16 px-2 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value=">=">&ge;</option>
                <option value="<=">&le;</option>
                <option value="=">=</option>
              </select>
              <input
                type="number"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">واحد</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg"
          >
            ثبت شاخص
          </button>
        </form>
      )}

      {/* 13-Week Scorecard Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
              <th className="py-3 px-3 font-semibold min-w-[165px]">شاخص سنجش‌پذیر</th>
              <th className="py-3 px-2 font-semibold whitespace-nowrap">مالک</th>
              <th className="py-3 px-2 font-semibold whitespace-nowrap">تارگت</th>
              {weekHeaders.map((label, idx) => (
                <th
                  key={idx}
                  className="py-3 px-1 font-semibold text-center font-mono-num whitespace-nowrap min-w-[46px]"
                >
                  {label}
                </th>
              ))}
              <th className="py-3 px-3 font-semibold whitespace-nowrap">اقدام IDS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {state.scorecard.map((sc) => {
              const latestEntry = [...sc.weeks].reverse().find((w) => w.value !== null);
              const latestVal = latestEntry?.value ?? null;
              const latestOk = isScorecardValueOnTrack(latestVal, sc.operator, sc.goal);
              const redStreak = getConsecutiveRedWeeks(sc);
              const alreadyInIssues = state.issues.some(
                (i) => i.status === 'open' && i.linkedSource?.sourceId === sc.id
              );

              return (
                <tr key={sc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {sc.name}
                    </div>
                    {redStreak >= 2 && (
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-0.5">
                        هشدار: {redStreak} هفته متوالی خارج از مسیر
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {getMemberName(sc.ownerId)}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    <span dir="ltr" className="inline-block">
                      {sc.operator} {sc.goal}
                    </span>{' '}
                    <span className="text-[11px] font-normal text-slate-500">{sc.unit}</span>
                  </td>

                  {sc.weeks.map((wk, wIdx) => {
                    const ok = isScorecardValueOnTrack(wk.value, sc.operator, sc.goal);
                    return (
                      <td key={wIdx} className="py-1.5 px-0.5 text-center">
                        <input
                          type="number"
                          aria-label={`${sc.name} - ${wk.weekLabel}`}
                          value={wk.value ?? ''}
                          onChange={(e) => handleCellChange(sc.id, wIdx, e.target.value)}
                          className={`w-13 px-1 py-1.5 text-center font-mono-num text-[11px] rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            ok === true
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : ok === false
                                ? 'bg-red-50 text-red-800 border-red-300 font-bold dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                                : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        />
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {latestOk === false ? (
                      alreadyInIssues || droppedFeedbackId === sc.id ? (
                        <button
                          type="button"
                          onClick={onNavigateToIssues}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded-md hover:underline"
                        >
                          <span>در لیست IDS</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDrop(sc, latestVal)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>انتقال به IDS</span>
                        </button>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>در مسیر</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Everyone Has a Number Audit (§4.2) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ممیزی اصل «هر فرد یک عدد دارد» (Everyone Has a Number)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              هر فرد در تمام سطوح چارت پاسخگویی باید حداقل یک عدد هفتگی مشخص برای سنجش موفقیت خود داشته باشد.
            </p>
          </div>
          <div className="text-sm font-bold font-mono-num text-slate-900 dark:text-slate-100">
            پوشش فعلی: {coverageAudit.coveragePercent}٪
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.members.map((m) => {
            const ownedMeasurables = state.scorecard.filter((s) => s.ownerId === m.id);
            const hasNumber = ownedMeasurables.length > 0;
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {hasNumber
                      ? `${ownedMeasurables.length} شاخص (${ownedMeasurables[0].name})`
                      : 'فاقد شاخص هفتگی اختصاصی'}
                  </div>
                </div>
                {hasNumber ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>تأمین</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickAssignForUncovered(m.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md"
                  >
                    اختصاص عدد
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
