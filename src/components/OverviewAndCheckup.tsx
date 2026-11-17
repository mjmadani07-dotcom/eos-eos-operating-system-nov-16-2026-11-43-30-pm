import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpLeft,
  CheckCircle2,
  Compass,
  Database,
  Layers,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import type { EOSState, OrgCheckupQuestion } from '../types/eos';
import {
  auditEveryoneHasANumber,
  calculateOrganizationalCheckup,
  calculateProcessFBACompliance,
  calculateRocksHealth,
  calculateScorecardHealth,
  calculateToDoCompletionRate,
  evaluatePerson,
} from '../utils/eosLogic';

export type NavSection =
  | 'overview'
  | 'vision'
  | 'people'
  | 'data'
  | 'issues'
  | 'process'
  | 'traction'
  | 'leadership';

interface OverviewAndCheckupProps {
  state: EOSState;
  onNavigate: (section: NavSection) => void;
  onUpdateCheckupScore: (questionId: string, score: number) => void;
  onStartL10: () => void;
}

const COMPONENT_META: Record<
  OrgCheckupQuestion['component'],
  { labelFa: string; labelEn: string; section: NavSection; toolHint: string }
> = {
  vision: {
    labelFa: 'چشم‌انداز',
    labelEn: 'Vision',
    section: 'vision',
    toolHint: 'سند V/TO · ارزش‌های محوری و تصویر ۳ ساله',
  },
  people: {
    labelFa: 'افراد',
    labelEn: 'People',
    section: 'people',
    toolHint: 'چارت پاسخگویی · People Analyzer و GWC',
  },
  data: {
    labelFa: 'داده‌ها',
    labelEn: 'Data',
    section: 'data',
    toolHint: 'کارت امتیاز ۱۳ هفته‌ای · هر فرد یک عدد',
  },
  issues: {
    labelFa: 'مسائل',
    labelEn: 'Issues',
    section: 'issues',
    toolHint: 'لیست‌های سه‌گانه · فرآیند ۳ گامه IDS',
  },
  process: {
    labelFa: 'فرآیند',
    labelEn: 'Process',
    section: 'process',
    toolHint: 'مستندسازی ۲۰/۸۰ · چک‌لیست FBA',
  },
  traction: {
    labelFa: 'اجرا',
    labelEn: 'Traction',
    section: 'traction',
    toolHint: 'راک‌های ۹۰ روزه · جلسات هفتگی L10',
  },
};

export const OverviewAndCheckup: React.FC<OverviewAndCheckupProps> = ({
  state,
  onNavigate,
  onUpdateCheckupScore,
  onStartL10,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checkup'>('dashboard');
  const [componentFilter, setComponentFilter] = useState<
    'all' | OrgCheckupQuestion['component']
  >('all');

  const checkup = calculateOrganizationalCheckup(state.checkupQuestions);
  const scorecardHealth = calculateScorecardHealth(state.scorecard);
  const rocksHealth = calculateRocksHealth(state.rocks);
  const todoStats = calculateToDoCompletionRate(state.todos);
  const processFBA = calculateProcessFBACompliance(state.processes);
  const numberAudit = auditEveryoneHasANumber(state.members, state.seats, state.scorecard);

  const rightPeopleRightSeatCount = state.members.filter(
    (m) => evaluatePerson(m, state.vto.coreValues, state.peopleBar).classification === 'right_person_right_seat'
  ).length;

  const openL10Issues = state.issues.filter((i) => i.status === 'open' && i.listType === 'l10');
  const lastMeeting = state.meetings[0];
  const lastMeetingAvg = lastMeeting
    ? (
        lastMeeting.ratings.reduce((acc, r) => acc + r.score, 0) /
        Math.max(1, lastMeeting.ratings.length)
      ).toFixed(1)
    : '—';

  const filteredQuestions =
    componentFilter === 'all'
      ? state.checkupQuestions
      : state.checkupQuestions.filter((q) => q.component === componentFilter);

  return (
    <div className="space-y-8">
      {/* Top Executive Banner */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{state.vto.companyName}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>فصل فعال: {state.activeQuarter}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>هدف سلامت EOS: ۸۰٪ به بالا</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            نمای کلی سیستم عامل کارآفرینی و عارضه‌یابی ۶ مؤلفه
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            تمام چالش‌های سازمانی ریشه در ضعف یک یا چند مورد از ۶ مؤلفه اصلی EOS دارند. وضعیت لحظه‌ای اجرا، داده‌ها و سلامت سازمان را از اینجا پایش کنید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              داشبورد ۶ مؤلفه
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checkup')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'checkup'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              پرسشنامه ۲۰ سؤالی Checkup
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Full-Width 4-Column Operational Pulse Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>امتیاز کل Checkup سازمان</span>
                <span className="font-mono-num">حد نصاب ≥ ۸۰٪</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {checkup.overallPercentage}٪
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    checkup.meets80Threshold
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{checkup.meets80Threshold ? 'بالای حد نصاب ۸۰٪' : 'نیازمند ارتقا'}</span>
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                {checkup.overallScore} از {checkup.maxScore} امتیاز
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>سلامت کارت امتیاز هفتگی</span>
                <span className="font-mono-num">{scorecardHealth.totalWithData} شاخص</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {scorecardHealth.percentage}٪
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    scorecardHealth.offTrackCount === 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {scorecardHealth.offTrackCount > 0 ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{scorecardHealth.offTrackCount} شاخص قرمز</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>همه در مسیر</span>
                    </>
                  )}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                پوشش «هر فرد یک عدد»: <span className="font-mono-num font-semibold">{numberAudit.coveragePercent}٪</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>راک‌های ۹۰ روزه فصل</span>
                <span className="font-mono-num">هدف ≥ ۸۰٪</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {rocksHealth.healthyPercentage}٪
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono-num">
                  {rocksHealth.onTrack + rocksHealth.done} / {rocksHealth.total} در مسیر
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                نرخ تکمیل To-Do هفتگی: <span className="font-mono-num font-semibold">{todoStats.percentage}٪</span> (هدف ۹۰٪)
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                <span className="truncate">مسائل باز L10</span>
                <span className="font-mono-num shrink-0">میانگین جلسه: {lastMeetingAvg}/10</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {openL10Issues.length}
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  مسئله آماده IDS
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                افراد مناسب در صندلی مناسب: <span className="font-mono-num font-semibold">{rightPeopleRightSeatCount}/{state.members.length}</span>
              </div>
            </div>
          </div>

          {/* EOS Six Key Components Interactive Model + Live Component Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left/Right Interactive EOS Wheel SVG */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  مدل شش مؤلفه اصلی EOS®
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  روی هر مؤلفه کلیک کنید تا مستقیماً وارد ابزارهای عملیاتی آن شوید.
                </p>
              </div>

              <div className="my-6 flex items-center justify-center">
                <svg
                  viewBox="0 0 360 360"
                  className="w-full max-w-[320px] h-auto select-none"
                  role="img"
                  aria-label="نمودار شش مؤلفه اصلی سیستم EOS"
                >
                  {/* Outer Ring */}
                  <circle
                    cx="180"
                    cy="180"
                    r="142"
                    fill="none"
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* Connector spokes */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const x2 = 180 + Math.cos(rad) * 116;
                    const y2 = 180 + Math.sin(rad) * 116;
                    return (
                      <line
                        key={deg}
                        x1="180"
                        y1="180"
                        x2={x2}
                        y2={y2}
                        className="stroke-slate-200 dark:stroke-slate-700"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Center Hub: Your Business */}
                  <circle
                    cx="180"
                    cy="180"
                    r="50"
                    className="fill-slate-900 dark:fill-indigo-600"
                  />
                  <text
                    x="180"
                    y="174"
                    textAnchor="middle"
                    className="fill-white text-[13px] font-bold"
                  >
                    کسب‌وکار شما
                  </text>
                  <text
                    x="180"
                    y="196"
                    textAnchor="middle"
                    className="fill-slate-300 text-[12px] font-mono"
                  >
                    {checkup.overallPercentage}%
                  </text>

                  {/* 6 Component Nodes */}
                  {checkup.byComponent.map((comp, idx) => {
                    const deg = idx * 60;
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const cx = 180 + Math.cos(rad) * 120;
                    const cy = 180 + Math.sin(rad) * 120;
                    const meta = COMPONENT_META[comp.component];
                    const healthy = comp.percentage >= 80;
                    return (
                      <g
                        key={comp.component}
                        className="cursor-pointer group"
                        onClick={() => onNavigate(meta.section)}
                        role="button"
                        tabIndex={0}
                        aria-label={`ورود به بخش ${meta.labelFa}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') onNavigate(meta.section);
                        }}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r="38"
                          className={`transition-colors stroke-2 ${
                            healthy
                              ? 'fill-white dark:fill-slate-800 stroke-emerald-500 group-hover:fill-emerald-50 dark:group-hover:fill-emerald-950/40'
                              : 'fill-white dark:fill-slate-800 stroke-amber-500 group-hover:fill-amber-50 dark:group-hover:fill-amber-950/40'
                          }`}
                        />
                        <text
                          x={cx}
                          y={cy - 4}
                          textAnchor="middle"
                          className="fill-slate-900 dark:fill-slate-100 text-[11px] font-bold"
                        >
                          {meta.labelFa}
                        </text>
                        <text
                          x={cx}
                          y={cy + 14}
                          textAnchor="middle"
                          className={`text-[11px] font-mono font-semibold ${
                            healthy
                              ? 'fill-emerald-600 dark:fill-emerald-400'
                              : 'fill-amber-600 dark:fill-amber-400'
                          }`}
                        >
                          {comp.percentage}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>رنگ سبز: بالای ۸۰٪ (قدرت سازمانی)</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('checkup')}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  به‌روزرسانی امتیازات Checkup
                </button>
              </div>
            </div>

            {/* 6 Components Action Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {checkup.byComponent.map((comp) => {
                const meta = COMPONENT_META[comp.component];
                const Icon =
                  comp.component === 'vision'
                    ? Compass
                    : comp.component === 'people'
                      ? Users
                      : comp.component === 'data'
                        ? Database
                        : comp.component === 'issues'
                          ? AlertTriangle
                          : comp.component === 'process'
                            ? Workflow
                            : Target;

                let liveSummary = '';
                if (comp.component === 'vision') {
                  liveSummary = `${state.vto.coreValues.length} ارزش محوری · برنامه ۱ ساله و تصویر ۳ ساله فعال`;
                } else if (comp.component === 'people') {
                  liveSummary = `${rightPeopleRightSeatCount} از ${state.members.length} نفر بالای حد نصاب (Right/Right)`;
                } else if (comp.component === 'data') {
                  liveSummary = `${scorecardHealth.onTrackCount} از ${scorecardHealth.totalWithData} شاخص در مسیر`;
                } else if (comp.component === 'issues') {
                  liveSummary = `${openL10Issues.length} مسئله باز L10 · ${state.issues.filter((i) => i.status === 'solved').length} حل‌شده با IDS`;
                } else if (comp.component === 'process') {
                  liveSummary = `${state.processes.length} فرآیند اصلی · پایبندی FBA: ${processFBA.compliancePercentage}٪`;
                } else {
                  liveSummary = `${rocksHealth.onTrack + rocksHealth.done}/${rocksHealth.total} راک سالم · انجام To-Do: ${todoStats.percentage}٪`;
                }

                return (
                  <button
                    key={comp.component}
                    type="button"
                    onClick={() => onNavigate(meta.section)}
                    className="text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-5 transition-colors flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-400 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {meta.labelFa} ({meta.labelEn})
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {meta.toolHint}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-bold font-mono-num ${
                          comp.meetsThreshold
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {comp.percentage}٪
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            comp.meetsThreshold ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${comp.percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{liveSummary}</span>
                        <ArrowUpLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Data Flow Integration Map (§9 of spec) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  جریان یکپارچه داده‌ها بین ماژول‌های EOS (ماتریس یکپارچه‌سازی)
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                اتصال زنده داده‌ها بدون جزیره‌سازی
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  ۱. V/TO ← People Analyzer
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {state.vto.coreValues.length} ارزش محوری ثبت‌شده در چشم‌انداز، مستقیماً ستون‌های ارزیابی رفتاری پرسنل را می‌سازند.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  ۲. چارت پاسخگویی ← GWC و ۵-۵-۵
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  ۵ مسئولیت هر صندلی مستقیماً مبنای ارزیابی GWC و محور گفتگوی فصلی ۵-۵-۵ قرار می‌گیرد.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  ۳. اسکورکارد / راک قرمز ← IDS
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  هر شاخص خارج از مسیر یا راک عقب‌افتاده با یک کلیک به لیست مسائل جلسه L10 منتقل می‌شود.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  ۴. خروجی IDS ← اقدامات ۷ روزه
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  هیچ مسئله‌ای بدون ثبت اقدام ۷ روزه (To-Do) با مالک مشخص بسته نمی‌شود و هفته بعد ممیزی می‌گردد.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Organizational Checkup 20-Question Interactive View */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                ارزیابی سلامت سازمان (Organizational Checkup®)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                به هر گزاره از ۱ (ضعیف / هرگز) تا ۵ (عالی / همیشه) نمره دهید. حد نصاب سلامت در سیستم EOS امتیاز ۸۰٪ به بالاست.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-left">
                <div className="text-xs text-slate-500 dark:text-slate-400">امتیاز کل</div>
                <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {checkup.overallPercentage}٪ ({checkup.overallScore}/{checkup.maxScore})
                </div>
              </div>
              {checkup.meets80Threshold ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>سالم (≥ ۸۰٪)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>زیر ۸۰٪</span>
                </div>
              )}
            </div>
          </div>

          {/* Component Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
            <button
              type="button"
              onClick={() => setComponentFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                componentFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              همه ۲۰ سؤال
            </button>
            {(Object.keys(COMPONENT_META) as OrgCheckupQuestion['component'][]).map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => setComponentFilter(comp)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  componentFilter === comp
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {COMPONENT_META[comp].labelFa}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
            {filteredQuestions.map((q) => {
              const meta = COMPONENT_META[q.component];
              return (
                <div
                  key={q.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span>{meta.labelFa}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{meta.labelEn}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {q.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onUpdateCheckupScore(q.id, val)}
                        aria-label={`امتیاز ${val} برای ${q.text}`}
                        className={`w-9 h-9 rounded-lg text-xs font-mono-num font-bold border transition-colors ${
                          q.score === val
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
