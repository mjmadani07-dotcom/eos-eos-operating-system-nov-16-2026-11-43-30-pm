import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit3,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import type { CoreValue, EOSState, VTOData } from '../types/eos';

interface VisionVTOViewProps {
  state: EOSState;
  onUpdateVTO: (nextVto: VTOData) => void;
  onNavigateToRocks: () => void;
  onNavigateToLongTermIssues: () => void;
}

export const VisionVTOView: React.FC<VisionVTOViewProps> = ({
  state,
  onUpdateVTO,
  onNavigateToRocks,
  onNavigateToLongTermIssues,
}) => {
  const { vto } = state;
  const [page, setPage] = useState<'vision' | 'traction' | 'speech'>('vision');
  const [newValTitle, setNewValTitle] = useState('');
  const [newValDesc, setNewValDesc] = useState('');
  const [editingCoreFocus, setEditingCoreFocus] = useState(false);
  const [newLooksLike, setNewLooksLike] = useState('');
  const [newYearGoal, setNewYearGoal] = useState('');

  const companyRocks = state.rocks.filter((r) => r.scope === 'company');
  const longTermIssues = state.issues.filter(
    (i) => i.listType === 'long_term' && i.status === 'open'
  );

  const handleAddCoreValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValTitle.trim()) return;
    const item: CoreValue = {
      id: `cv-${Date.now()}`,
      title: newValTitle.trim(),
      description: newValDesc.trim() || 'توصیف رفتاری ارزش محوری',
      speechExample: '',
    };
    onUpdateVTO({ ...vto, coreValues: [...vto.coreValues, item] });
    setNewValTitle('');
    setNewValDesc('');
  };

  const handleDeleteCoreValue = (id: string) => {
    if (vto.coreValues.length <= 1) return;
    onUpdateVTO({
      ...vto,
      coreValues: vto.coreValues.filter((cv) => cv.id !== id),
    });
  };

  const handleAddLooksLike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLooksLike.trim()) return;
    onUpdateVTO({
      ...vto,
      threeYearPicture: {
        ...vto.threeYearPicture,
        looksLike: [...vto.threeYearPicture.looksLike, newLooksLike.trim()],
      },
    });
    setNewLooksLike('');
  };

  const handleAddYearGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearGoal.trim()) return;
    onUpdateVTO({
      ...vto,
      oneYearPlan: {
        ...vto.oneYearPlan,
        goals: [...vto.oneYearPlan.goals, newYearGoal.trim()],
      },
    });
    setNewYearGoal('');
  };

  const getMemberName = (id: string) =>
    state.members.find((m) => m.id === id)?.name ?? 'تعیین‌نشده';

  return (
    <div className="space-y-6">
      {/* Header & Page Switcher */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            مؤلفه اول: چشم‌انداز (Vision) · سند دو صفحه‌ای استراتژی
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            سند سازمان‌دهنده چشم‌انداز و اجرا (V/TO™)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPage('vision')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                page === 'vision'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              صفحه ۱: چشم‌انداز (Vision)
            </button>
            <button
              type="button"
              onClick={() => setPage('traction')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                page === 'traction'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              صفحه ۲: اجرا (Traction)
            </button>
            <button
              type="button"
              onClick={() => setPage('speech')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                page === 'speech'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              نطق شرکتی و ارائه
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>چاپ سند</span>
          </button>
        </div>
      </div>

      {page === 'vision' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Core Values */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ۱. ارزش‌های محوری (Core Values)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  بین ۳ تا ۷ ارزش رفتاری · مستقیماً در ماژول People Analyzer استفاده می‌شود
                </p>
              </div>
              <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                {vto.coreValues.length} ارزش
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {vto.coreValues.map((cv, idx) => (
                <div key={cv.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-num text-indigo-600 dark:text-indigo-400 font-bold">
                        0{idx + 1}.
                      </span>
                      <input
                        type="text"
                        aria-label={`عنوان ارزش محوری ${idx + 1}`}
                        value={cv.title}
                        onChange={(e) => {
                          const updated = vto.coreValues.map((item) =>
                            item.id === cv.id ? { ...item, title: e.target.value } : item
                          );
                          onUpdateVTO({ ...vto, coreValues: updated });
                        }}
                        className="w-full text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none py-0.5"
                      />
                    </div>
                    <input
                      type="text"
                      aria-label={`توصیف رفتاری ${cv.title}`}
                      value={cv.description}
                      onChange={(e) => {
                        const updated = vto.coreValues.map((item) =>
                          item.id === cv.id ? { ...item, description: e.target.value } : item
                        );
                        onUpdateVTO({ ...vto, coreValues: updated });
                      }}
                      className="w-full text-xs text-slate-600 dark:text-slate-400 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none py-0.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCoreValue(cv.id)}
                    aria-label={`حذف ارزش ${cv.title}`}
                    disabled={vto.coreValues.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCoreValue} className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="عنوان ارزش محوری جدید..."
                  aria-label="عنوان ارزش محوری جدید"
                  value={newValTitle}
                  onChange={(e) => setNewValTitle(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  placeholder="توصیف رفتاری ملموس..."
                  aria-label="توصیف رفتاری ارزش محوری جدید"
                  value={newValDesc}
                  onChange={(e) => setNewValDesc(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن ارزش محوری</span>
              </button>
            </form>
          </section>

          {/* 2. Core Focus & 3. 10-Year Target */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ۲. تمرکز محوری (Core Focus™)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    منطقه شیرین فعالیت شرکت برای پیشگیری از پراکنده‌کاری (Shiny Object Syndrome)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCoreFocus(!editingCoreFocus)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {editingCoreFocus ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{editingCoreFocus ? 'پایان ویرایش' : 'ویرایش'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    اشتیاق / علت / هدف وجودی (Purpose / Cause / Passion)
                  </label>
                  {editingCoreFocus ? (
                    <textarea
                      rows={2}
                      value={vto.coreFocus.purpose}
                      onChange={(e) =>
                        onUpdateVTO({
                          ...vto,
                          coreFocus: { ...vto.coreFocus, purpose: e.target.value },
                        })
                      }
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  ) : (
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {vto.coreFocus.purpose}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    نیچ و تخصص اصلی (Our Niche)
                  </label>
                  {editingCoreFocus ? (
                    <textarea
                      rows={2}
                      value={vto.coreFocus.niche}
                      onChange={(e) =>
                        onUpdateVTO({
                          ...vto,
                          coreFocus: { ...vto.coreFocus, niche: e.target.value },
                        })
                      }
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  ) : (
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {vto.coreFocus.niche}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 3. 10-Year Target */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ۳. هدف ۱۰ ساله (10-Year Target™)
                </h2>
                <span className="text-xs font-mono-num text-indigo-600 dark:text-indigo-400 font-semibold">
                  افق {vto.tenYearTarget.targetYear}
                </span>
              </div>

              <textarea
                rows={2}
                aria-label="بیانیه هدف ۱۰ ساله"
                value={vto.tenYearTarget.statement}
                onChange={(e) =>
                  onUpdateVTO({
                    ...vto,
                    tenYearTarget: { ...vto.tenYearTarget, statement: e.target.value },
                  })
                }
                className="w-full p-3 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    شاخص عددی هدف ۱۰ ساله
                  </label>
                  <input
                    type="text"
                    value={vto.tenYearTarget.metricLabel}
                    onChange={(e) =>
                      onUpdateVTO({
                        ...vto,
                        tenYearTarget: { ...vto.tenYearTarget, metricLabel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    سال هدف
                  </label>
                  <input
                    type="text"
                    value={vto.tenYearTarget.targetYear}
                    onChange={(e) =>
                      onUpdateVTO({
                        ...vto,
                        tenYearTarget: { ...vto.tenYearTarget, targetYear: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* 4. Marketing Strategy (Full Width) */}
          <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ۴. استراتژی بازاریابی (Marketing Strategy)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                جامعه هدف، ۳ ویژگی منحصر‌به‌فرد، فرآیند اثبات‌شده و گارانتی رفع ریسک مشتری
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  جمعیت‌شناختی هدف (Demographics)
                </label>
                <textarea
                  rows={3}
                  value={vto.marketingStrategy.demographics}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      marketingStrategy: {
                        ...vto.marketingStrategy,
                        demographics: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  روان‌شناختی هدف (Psychographics)
                </label>
                <textarea
                  rows={3}
                  value={vto.marketingStrategy.psychographics}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      marketingStrategy: {
                        ...vto.marketingStrategy,
                        psychographics: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  جغرافیای هدف (Geographic)
                </label>
                <textarea
                  rows={3}
                  value={vto.marketingStrategy.geographic}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      marketingStrategy: {
                        ...vto.marketingStrategy,
                        geographic: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* 3 Uniques & Guarantee */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ۳ ویژگی منحصر‌به‌فرد (3 Uniques™)
                </h3>
                {vto.marketingStrategy.threeUniques.map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-mono-num font-bold text-indigo-600 dark:text-indigo-400 w-5">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      aria-label={`ویژگی منحصر‌به‌فرد ${i + 1}`}
                      value={u}
                      onChange={(e) => {
                        const next: [string, string, string] = [
                          ...vto.marketingStrategy.threeUniques,
                        ] as [string, string, string];
                        next[i] = e.target.value;
                        onUpdateVTO({
                          ...vto,
                          marketingStrategy: {
                            ...vto.marketingStrategy,
                            threeUniques: next,
                          },
                        });
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  تضمین یا گارانتی (Guarantee)
                </h3>
                <textarea
                  rows={4}
                  aria-label="تضمین یا گارانتی مشتری"
                  value={vto.marketingStrategy.guarantee}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      marketingStrategy: {
                        ...vto.marketingStrategy,
                        guarantee: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 text-xs leading-relaxed rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Proven Process Visual Flow */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  فرآیند اثبات‌شده (Proven Process): {vto.marketingStrategy.provenProcessName}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  مسیر یک‌صفحه‌ای تجربه مشتری از اولین تماس تا پشتیبانی
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {vto.marketingStrategy.provenProcessSteps.map((step) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {step.title}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. 3-Year Picture */}
          <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ۵. تصویر ۳ ساله (3-Year Picture™)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاریخ آینده</label>
                <input
                  type="text"
                  value={vto.threeYearPicture.futureDate}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      threeYearPicture: { ...vto.threeYearPicture, futureDate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">درآمد هدف (Revenue)</label>
                <input
                  type="text"
                  value={vto.threeYearPicture.revenue}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      threeYearPicture: { ...vto.threeYearPicture, revenue: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">سود هدف (Profit)</label>
                <input
                  type="text"
                  value={vto.threeYearPicture.profit}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      threeYearPicture: { ...vto.threeYearPicture, profit: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">شاخص‌های کلیدی</label>
                <input
                  type="text"
                  value={vto.threeYearPicture.measurables}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      threeYearPicture: { ...vto.threeYearPicture, measurables: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                شرکت در ۳ سال آینده چه شکلی است؟ (What does it look like?)
              </div>
              <ul className="space-y-1.5">
                {vto.threeYearPicture.looksLike.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300 py-1">
                    <span>• {item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateVTO({
                          ...vto,
                          threeYearPicture: {
                            ...vto.threeYearPicture,
                            looksLike: vto.threeYearPicture.looksLike.filter((_, i) => i !== idx),
                          },
                        })
                      }
                      aria-label={`حذف بند تصویر ۳ ساله ${idx + 1}`}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddLooksLike} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="افزودن جمله توصیفی تصویر ۳ ساله..."
                  value={newLooksLike}
                  onChange={(e) => setNewLooksLike(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 rounded-lg whitespace-nowrap"
                >
                  افزودن
                </button>
              </form>
            </div>
          </section>
        </div>
      )}

      {page === 'traction' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 6. 1-Year Plan */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ۶. برنامه ۱ ساله (1-Year Plan)
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">پایان سال مالی</label>
                <input
                  type="text"
                  value={vto.oneYearPlan.futureDate}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      oneYearPlan: { ...vto.oneYearPlan, futureDate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تارگت درآمد</label>
                  <input
                    type="text"
                    value={vto.oneYearPlan.revenue}
                    onChange={(e) =>
                      onUpdateVTO({
                        ...vto,
                        oneYearPlan: { ...vto.oneYearPlan, revenue: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تارگت سود</label>
                  <input
                    type="text"
                    value={vto.oneYearPlan.profit}
                    onChange={(e) =>
                      onUpdateVTO({
                        ...vto,
                        oneYearPlan: { ...vto.oneYearPlan, profit: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">شاخص‌های کلیدی</label>
                <input
                  type="text"
                  value={vto.oneYearPlan.measurables}
                  onChange={(e) =>
                    onUpdateVTO({
                      ...vto,
                      oneYearPlan: { ...vto.oneYearPlan, measurables: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ۳ تا ۷ هدف اصلی سالانه (Goals for the Year)
              </div>
              <ul className="space-y-1.5">
                {vto.oneYearPlan.goals.map((g, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300 py-1">
                    <span>{idx + 1}. {g}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateVTO({
                          ...vto,
                          oneYearPlan: {
                            ...vto.oneYearPlan,
                            goals: vto.oneYearPlan.goals.filter((_, i) => i !== idx),
                          },
                        })
                      }
                      aria-label={`حذف هدف سالانه ${idx + 1}`}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddYearGoal} className="flex gap-2">
                <input
                  type="text"
                  placeholder="هدف سالانه جدید..."
                  value={newYearGoal}
                  onChange={(e) => setNewYearGoal(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 rounded-lg"
                >
                  افزودن
                </button>
              </form>
            </div>
          </section>

          {/* 7. Quarterly Corporate Rocks (Live Link) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ۷. راک‌های فصلی شرکت (Company Rocks)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  همگام‌سازی خودکار با ماژول اجرا
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToRocks}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>مدیریت راک‌ها</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {companyRocks.map((rock) => (
                <div key={rock.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {rock.title}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
                        rock.status === 'done'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : rock.status === 'off_track'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {rock.status === 'done'
                        ? 'تکمیل‌شده'
                        : rock.status === 'off_track'
                          ? 'عقب‌افتاده'
                          : 'در مسیر'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    مسئول: {getMemberName(rock.ownerId)} · سررسید: {rock.dueDate}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 8. Long-Term Issues List (Live Link) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ۸. لیست مسائل بلندمدت (&gt;۹۰ روز)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  همگام‌سازی با لیست مسائل بلندمدت
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToLongTermIssues}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>مدیریت مسائل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {longTermIssues.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                مسئله بلندمدتی ثبت نشده است.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {longTermIssues.map((iss) => (
                  <div key={iss.id} className="py-3 space-y-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {iss.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      مطرح‌کننده: {getMemberName(iss.ownerId)} · ثبت: {iss.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {page === 'speech' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              نطق وضعیت شرکت (State of the Company) و سخنرانی ارزش‌های محوری
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              این خلاصه برای همسوسازی ۱۰۰٪ تمام پرسنل در جلسات فصلی و سالانه طراحی شده است.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              یادداشت کلیدی ایده‌پرداز برای نطق فصل جاری
            </h3>
            <textarea
              rows={3}
              value={vto.stateOfCompanyNotes}
              onChange={(e) => onUpdateVTO({ ...vto, stateOfCompanyNotes: e.target.value })}
              className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              داستان‌های واقعی تجلی ارزش‌های محوری (Core Values Speech)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vto.coreValues.map((cv) => (
                <div
                  key={cv.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                >
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {cv.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{cv.description}</p>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-1">
                    مثال واقعی در شرکت:
                  </label>
                  <textarea
                    rows={2}
                    value={cv.speechExample}
                    onChange={(e) => {
                      const updated = vto.coreValues.map((c) =>
                        c.id === cv.id ? { ...c, speechExample: e.target.value } : c
                      );
                      onUpdateVTO({ ...vto, coreValues: updated });
                    }}
                    placeholder="داستان یا مثال واقعی از همکاران که این ارزش را تجلی داده‌اند..."
                    className="w-full p-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
