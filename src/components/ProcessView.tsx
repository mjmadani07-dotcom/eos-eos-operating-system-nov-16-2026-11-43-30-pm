import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import type { CoreProcess, EOSState } from '../types/eos';
import { calculateProcessFBACompliance } from '../utils/eosLogic';

interface ProcessViewProps {
  state: EOSState;
  onUpdateProcesses: (next: CoreProcess[]) => void;
}

export const ProcessView: React.FC<ProcessViewProps> = ({
  state,
  onUpdateProcesses,
}) => {
  const [subTab, setSubTab] = useState<'documenter' | 'handbook'>('documenter');
  const [selectedId, setSelectedId] = useState<string>(state.processes[0]?.id ?? '');
  const [newProcessName, setNewProcessName] = useState('');
  const [newStepText, setNewStepText] = useState('');

  const fbaStats = calculateProcessFBACompliance(state.processes);
  const selected = state.processes.find((p) => p.id === selectedId) ?? state.processes[0];

  const getMemberName = (id: string) =>
    state.members.find((m) => m.id === id)?.name ?? 'تعیین‌نشده';

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessName.trim()) return;
    const item: CoreProcess = {
      id: `proc-${Date.now()}`,
      name: newProcessName.trim(),
      ownerId: state.members[0]?.id ?? '',
      summary: 'مستندسازی ۲۰٪ مراحل کلیدی که ۸۰٪ نتیجه را می‌سازند.',
      steps: ['۱. گام آغازین فرآیند'],
      fba: {
        trained: false,
        measured: false,
        managedLma: false,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    };
    onUpdateProcesses([...state.processes, item]);
    setSelectedId(item.id);
    setNewProcessName('');
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !newStepText.trim()) return;
    const updated = state.processes.map((p) =>
      p.id === selected.id
        ? { ...p, steps: [...p.steps, newStepText.trim()] }
        : p
    );
    onUpdateProcesses(updated);
    setNewStepText('');
  };

  const handleToggleFBA = (
    procId: string,
    field: 'trained' | 'measured' | 'managedLma'
  ) => {
    onUpdateProcesses(
      state.processes.map((p) =>
        p.id === procId
          ? {
              ...p,
              fba: {
                ...p.fba,
                [field]: !p.fba[field],
                updatedAt: new Date().toISOString().slice(0, 10),
              },
            }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            مؤلفه پنجم: فرآیند (Process) · قانون ۲۰/۸۰ و اجرای همگانی (FBA)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            مستندکننده ۳ گامه فرآیند و دفترچه «روش {state.vto.companyName}»
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-mono-num bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg">
            انطباق FBA: <span className="font-bold">{fbaStats.compliancePercentage}٪</span> ({fbaStats.fullyFollowedCount}/{fbaStats.totalProcesses} کامل)
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSubTab('documenter')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'documenter'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              مستندسازی و چک‌لیست FBA
            </button>
            <button
              type="button"
              onClick={() => setSubTab('handbook')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'handbook'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              بسته‌بندی The Way
            </button>
          </div>
        </div>
      </div>

      {subTab === 'documenter' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Step 1: Identify 5-12 Core Processes */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                گام ۱: شناسایی ۵ تا ۱۲ فرآیند اصلی
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فرآیندهای کلیدی بدون زونکن‌های سنگین و اداری
              </p>
            </div>

            <div className="space-y-1.5">
              {state.processes.map((proc) => {
                const isSelected = proc.id === selected?.id;
                const fbaDone =
                  proc.fba.trained && proc.fba.measured && proc.fba.managedLma;
                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => setSelectedId(proc.id)}
                    className={`w-full text-right p-3 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {proc.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        مالک: {getMemberName(proc.ownerId)} · {proc.steps.length} گام
                      </div>
                    </div>
                    {fbaDone && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddProcess} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="نام فرآیند اصلی جدید..."
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <button
                type="submit"
                aria-label="افزودن فرآیند جدید"
                className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Step 2 & FBA Checklist */}
          <div className="lg:col-span-8 space-y-6">
            {selected ? (
              <>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex-1 min-w-[220px]">
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        گام ۲: مستندسازی و ساده‌سازی (قانون ۲۰/۸۰ — خلاصه ۱ تا ۵ صفحه)
                      </div>
                      <input
                        type="text"
                        value={selected.name}
                        onChange={(e) =>
                          onUpdateProcesses(
                            state.processes.map((p) =>
                              p.id === selected.id ? { ...p, name: e.target.value } : p
                            )
                          )
                        }
                        className="w-full text-lg font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">مالک فرآیند</label>
                      <select
                        value={selected.ownerId}
                        onChange={(e) =>
                          onUpdateProcesses(
                            state.processes.map((p) =>
                              p.id === selected.id ? { ...p, ownerId: e.target.value } : p
                            )
                          )
                        }
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        {state.members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">هدف و خلاصه فرآیند</label>
                    <input
                      type="text"
                      value={selected.summary}
                      onChange={(e) =>
                        onUpdateProcesses(
                          state.processes.map((p) =>
                            p.id === selected.id ? { ...p, summary: e.target.value } : p
                          )
                        )
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      مراحل ۲۰٪ کلیدی سازنده ۸۰٪ نتیجه (چک‌لیست خطی):
                    </div>
                    {selected.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => {
                            const nextSteps = selected.steps.map((s, i) =>
                              i === idx ? e.target.value : s
                            );
                            onUpdateProcesses(
                              state.processes.map((p) =>
                                p.id === selected.id ? { ...p, steps: nextSteps } : p
                              )
                            );
                          }}
                          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextSteps = selected.steps.filter((_, i) => i !== idx);
                            onUpdateProcesses(
                              state.processes.map((p) =>
                                p.id === selected.id ? { ...p, steps: nextSteps } : p
                              )
                            );
                          }}
                          aria-label={`حذف گام ${idx + 1}`}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <form onSubmit={handleAddStep} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="افزودن گام کلیدی جدید..."
                        value={newStepText}
                        onChange={(e) => setNewStepText(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 rounded-lg"
                      >
                        افزودن گام
                      </button>
                    </form>
                  </div>
                </div>

                {/* FBA Checklist (§6.2) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        چک‌لیست اجرای همگانی (FBA Checklist — Followed By All)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        تضمین اجرای واقعی فرآیند توسط همه پرسنل به جای ماندن روی کاغذ
                      </p>
                    </div>
                    <span className="text-xs font-mono-num text-slate-500">
                      آخرین بازبینی: {selected.fba.updatedAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFBA(selected.id, 'trained')}
                      className={`p-3.5 rounded-lg border text-right transition-colors ${
                        selected.fba.trained
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">۱. آموزش (Train)</div>
                      <div className="text-[11px] mt-1">
                        {selected.fba.trained ? 'آموزش کامل به تیم داده شد' : 'نیازمند ثبت آموزش'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFBA(selected.id, 'measured')}
                      className={`p-3.5 rounded-lg border text-right transition-colors ${
                        selected.fba.measured
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">۲. سنجش (Measure)</div>
                      <div className="text-[11px] mt-1">
                        {selected.fba.measured ? 'متصل به شاخص اسکورکارد' : 'بدون شاخص اسکورکارد'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFBA(selected.id, 'managedLma')}
                      className={`p-3.5 rounded-lg border text-right transition-colors ${
                        selected.fba.managedLma
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">۳. مدیریت (Manage / LMA)</div>
                      <div className="text-[11px] mt-1">
                        {selected.fba.managedLma ? 'پایش منظم در ۵-۵-۵' : 'نیازمند ممیزی مدیریتی'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProcesses(
                          state.processes.map((p) =>
                            p.id === selected.id
                              ? {
                                  ...p,
                                  fba: {
                                    ...p.fba,
                                    updatedAt: new Date().toISOString().slice(0, 10),
                                  },
                                }
                              : p
                          )
                        )
                      }
                      className="p-3.5 rounded-lg border bg-indigo-50/60 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 text-right hover:bg-indigo-100/70"
                    >
                      <div className="text-xs font-bold">۴. به‌روزرسانی (Update)</div>
                      <div className="text-[11px] mt-1">ثبت تاریخ بازبینی سالانه امروز</div>
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        /* Step 3: Packaged Handbook "The [Company] Way" */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  گام ۳: کتابچه یکپارچه «روش {state.vto.companyName}» (The Way)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  مجموعه تمام فرآیندهای محوری شرکت در یک سند منسجم، ساده و قابل اجرا برای همگان
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white dark:bg-indigo-600 rounded-lg"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ کتابچه The Way</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.processes.map((proc, idx) => (
              <div
                key={proc.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono-num font-bold text-indigo-600 dark:text-indigo-400">
                      0{idx + 1}.
                    </span>{' '}
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {proc.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    مالک: {getMemberName(proc.ownerId)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{proc.summary}</p>
                <ul className="space-y-1 text-xs text-slate-800 dark:text-slate-200 pt-1">
                  {proc.steps.map((s, sIdx) => (
                    <li key={sIdx}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
