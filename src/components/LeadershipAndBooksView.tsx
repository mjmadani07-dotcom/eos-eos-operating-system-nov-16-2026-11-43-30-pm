import React, { useState } from 'react';
import {
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  Compass,
  Plus,
  Sparkles,
} from 'lucide-react';
import type {
  ClarityBreakEntry,
  DelegateTask,
  EOSLifeScore,
  EOSState,
  SamePageEntry,
} from '../types/eos';

interface LeadershipAndBooksViewProps {
  state: EOSState;
  onUpdateDelegateTasks: (next: DelegateTask[]) => void;
  onDelegateTaskToTodo: (task: DelegateTask, targetMemberId: string) => void;
  onUpdateClarityBreaks: (next: ClarityBreakEntry[]) => void;
  onUpdateSamePage: (next: SamePageEntry[]) => void;
  onUpdateEOSLife: (next: EOSLifeScore[]) => void;
}

const EOS_13_BOOKS = [
  {
    num: 1,
    title: 'Traction: Get a Grip on Your Business',
    author: 'Gino Wickman',
    concept: 'پایه‌گذار ۶ مؤلفه اصلی، V/TO، کارت امتیاز، راک‌ها، L10 و IDS',
    module: 'همه ماژول‌های اصلی سامانه',
  },
  {
    num: 2,
    title: 'Get a Grip',
    author: 'Gino Wickman & Mike Paton',
    concept: 'داستان واقعی پیاده‌سازی گام‌به‌گام EOS در یک شرکت در حال بحران',
    module: 'پرسشنامه Checkup و چرخه اجرای ۹۰ روزه',
  },
  {
    num: 3,
    title: 'What the Heck Is EOS?',
    author: 'Gino Wickman & Tom Bouwer',
    concept: 'راهنمای همگانی کارکنان برای درک چرایی ابزارهای EOS در روزمره',
    module: 'بخش چشم‌انداز و هر فرد یک عدد',
  },
  {
    num: 4,
    title: 'Rocket Fuel',
    author: 'Gino Wickman & Mark C. Winters',
    concept: 'هم‌افزایی زوج ایده‌پرداز (Visionary) و مجرّی (Integrator) و جلسات Same Page',
    module: 'بخش ایده‌پرداز / مجرّی و قوانین ۵ گانه V/I',
  },
  {
    num: 5,
    title: 'How to Be a Great Boss',
    author: 'Gino Wickman & René Boer',
    concept: '۵ قابلیت رهبری + ۵ اقدام مدیریتی (LMA) و گفتگوی فصلی ۵-۵-۵',
    module: 'بخش افراد (گفتگوی ۵-۵-۵ و ممیزی LMA)',
  },
  {
    num: 6,
    title: 'The EOS Life',
    author: 'Gino Wickman',
    concept: 'کار کردن روی کاری که دوست دارید، با افرادی که دوست دارید، با اثر بزرگ و زمان آزاد',
    module: 'ماتریس Delegate & Elevate و ارزیابی ۵ ستون EOS Life',
  },
  {
    num: 7,
    title: 'Entrepreneurial Leap',
    author: 'Gino Wickman',
    concept: '۶ ویژگی ذاتی کارآفرینان واقعی و کشف مسیر پیش از جهش کسب‌وکار',
    module: 'بخش ارزیابی ویژگی‌های کارآفرینی',
  },
  {
    num: 8,
    title: 'Shine',
    author: 'Gino Wickman & Rob Dube',
    concept: '۱۰ انضباط درونی برای آرامش ذهن، وقفه شفافیت و رهبری از درون (Driven & Peaceful)',
    module: 'وقفه شفافیت (Clarity Breaks) و انضباط ۱۰ گانه',
  },
  {
    num: 9,
    title: 'People: Dare to Build an Intentional Culture',
    author: "Mark O'Donnell, Kelly Knight, CJ DuBe",
    concept: 'تضمین ۱۰۰٪ فرد مناسب در صندلی مناسب با People Analyzer، GWC و قانون ۳ ضربه',
    module: 'چارت پاسخگویی، People Analyzer و پروتکل ۳ ضربه',
  },
  {
    num: 10,
    title: 'Process: How Discipline and Consistency Will Set You and Your Business Free',
    author: 'Mike Paton & Lisa González',
    concept: 'مستندسازی ۲۰/۸۰ فرآیندهای محوری و چک‌لیست اجرای همگانی (FBA)',
    module: 'مستندکننده ۳ گامه فرآیند و کتابچه The Way',
  },
  {
    num: 11,
    title: 'Data: Harness Your Numbers to Go from Uncertain to Unstoppable',
    author: "Mark O'Donnell, Angela Kalemis, Mark Stanley",
    concept: 'تصمیم‌گیری مبتنی بر شاخص‌های پیش‌رو، اسکورکارد ۱۳ هفته‌ای و اصل هر فرد یک عدد',
    module: 'اسکورکارد ۱۳ هفته‌ای و ممیزی هر فرد یک عدد',
  },
  {
    num: 12,
    title: 'Issues',
    author: "Mark O'Donnell, Sue Hawkes, Jill Young",
    concept: 'فرهنگ ورود به خطر (Enter the Danger)، لیست‌های سه‌گانه و حل ریشه‌ای IDS',
    module: 'لیست‌های سه‌گانه مسائل و موتور IDS',
  },
  {
    num: 13,
    title: 'EOS Organizational Checkup® & Official Toolbox',
    author: 'EOS Worldwide',
    concept: 'سنجش مستمر ۶ مؤلفه برای عبور از حد نصاب ۸۰٪ و همگام‌سازی کامل سازمان',
    module: 'داشبورد ۶ مؤلفه و پرسشنامه ۲۰ سؤالی Checkup',
  },
];

const SHINE_10_DISCIPLINES = [
  '۱. پذیرش شفاف چشم‌انداز درونی و آرامش ذهنی (10-Year Thinking)',
  '۲. وقفه زمان و توقف منظم برای تفکر (Take Time Off / Clarity Break)',
  '۳. شناخت دقیق خود و سبک کارآفرینی',
  '۴. دیدن تصویر بزرگ‌تر و پرهیز از کنترل‌گری خرد',
  '۵. گفتن حقیقت با شجاعت و مهربانی',
  '۶. نه گفتن به فرصت‌های خارج از Core Focus',
  '۷. واگذاری کامل کارهای ربع ۳ و ۴ (Delegate & Elevate)',
  '۸. پرورش رهبران نسل بعد با LMA',
  '۹. تمرین قدردانی و تعادل زندگی واقعی (The EOS Life)',
  '۱۰. تعهد به رشد معنوی، جسمی و ذهنی روزانه',
];

const ENTREPRENEURIAL_LEAP_6_TRAITS = [
  { title: 'ایده‌پرداز (Visionary)', desc: 'دیدن فرصت‌ها و آینده‌ای که دیگران هنوز نمی‌بینند' },
  { title: 'پراشتیاق (Passionate)', desc: 'انرژی درونی عمیق برای حل مسئله مشتری' },
  { title: 'حل‌کننده مسئله (Problem Solver)', desc: 'تبدیل موانع پیچیده به فرصت‌های عملی' },
  { title: 'مصمم و تاب‌آور (Driven)', desc: 'حرکت رو به جلو حتی در مواجهه با شکست‌های موقت' },
  { title: 'ریسک‌پذیر حساب‌شده (Risk Taker)', desc: 'تصمیم‌گیری شجاعانه با مدیریت ریسک' },
  { title: 'مسئولیت‌پذیر (Responsible)', desc: 'پذیرش مالکیت ۱۰۰٪ نتایج بدون سرزنش شرایط' },
];

export const LeadershipAndBooksView: React.FC<LeadershipAndBooksViewProps> = ({
  state,
  onUpdateDelegateTasks,
  onDelegateTaskToTodo,
  onUpdateClarityBreaks,
  onUpdateSamePage,
  onUpdateEOSLife,
}) => {
  const [subTab, setSubTab] = useState<'rocket' | 'delegate' | 'clarity' | 'books'>('rocket');

  // Delegate & Elevate
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskQuad, setNewTaskQuad] = useState<1 | 2 | 3 | 4>(3);
  const [delegateTargetMap, setDelegateTargetMap] = useState<Record<string, string>>({});

  // Same Page Meeting
  const [spTopic, setSpTopic] = useState('');
  const [spVisView, setSpVisView] = useState('');
  const [spIntView, setSpIntView] = useState('');
  const [spDecision, setSpDecision] = useState('');

  // Clarity Break
  const [cbPrompt, setCbPrompt] = useState(
    'آیا کاری که این هفته وقت من را گرفته، واقعاً در راستای Core Focus و تصویر ۳ ساله ماست؟'
  );
  const [cbReflection, setCbReflection] = useState('');
  const [cbAction, setCbAction] = useState('');

  const getMemberName = (id: string) =>
    state.members.find((m) => m.id === id)?.name ?? 'تعیین‌نشده';

  const lifeScore = state.eosLifeScores[0] ?? {
    memberId: state.members[0]?.id ?? 'mem-1',
    doingWhatYouLove: 8,
    peopleYouLove: 8,
    hugeDifference: 8,
    compensatedAppropriately: 8,
    timeForPassions: 7,
    notes: '',
  };

  const handleAddDelegateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: DelegateTask = {
      id: `dt-${Date.now()}`,
      title: newTaskTitle.trim(),
      quadrant: newTaskQuad,
      ownerId: state.members[0]?.id ?? '',
      status: 'active',
    };
    onUpdateDelegateTasks([...state.delegateTasks, item]);
    setNewTaskTitle('');
  };

  const handleAddSamePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spTopic.trim()) return;
    const entry: SamePageEntry = {
      id: `sp-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      topic: spTopic.trim(),
      visionaryView: spVisView.trim(),
      integratorView: spIntView.trim(),
      agreedDecision: spDecision.trim(),
      resolved: Boolean(spDecision.trim()),
    };
    onUpdateSamePage([entry, ...state.samePageEntries]);
    setSpTopic('');
    setSpVisView('');
    setSpIntView('');
    setSpDecision('');
  };

  const handleAddClarityBreak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbReflection.trim()) return;
    const entry: ClarityBreakEntry = {
      id: `cb-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      authorId: state.members[0]?.id ?? '',
      prompt: cbPrompt,
      reflection: cbReflection.trim(),
      actionItem: cbAction.trim(),
    };
    onUpdateClarityBreaks([entry, ...state.clarityBreaks]);
    setCbReflection('');
    setCbAction('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ابزارهای رهبری، Rocket Fuel، زندگی EOS، Shine و کتابخانه ۱۳ منبع
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            پویایی ایده‌پرداز/مجرّی، تفویض و ارتقا و زندگی EOS
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('rocket')}
            className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap ${
              subTab === 'rocket'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ایده‌پرداز و مجرّی
          </button>
          <button
            type="button"
            onClick={() => setSubTab('delegate')}
            className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap ${
              subTab === 'delegate'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Delegate & Elevate
          </button>
          <button
            type="button"
            onClick={() => setSubTab('clarity')}
            className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap ${
              subTab === 'clarity'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            وقفه شفافیت و EOS Life
          </button>
          <button
            type="button"
            onClick={() => setSubTab('books')}
            className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap ${
              subTab === 'books'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            شاخص ۱۳ کتاب EOS
          </button>
        </div>
      </div>

      {subTab === 'rocket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* V/I 5 Golden Rules */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                پویایی ایده‌پرداز و مجرّی (Visionary & Integrator)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ۵ قانون طلایی تعامل V/I برگرفته از کتاب Rocket Fuel
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-indigo-600 dark:text-indigo-400">ایده‌پرداز (Visionary)</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {state.members.find((m) => m.isVisionary)?.name ?? 'سهراب فرهادی'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  ایده‌های بزرگ · فرهنگ · روابط کلان · حل مسائل استراتژیک
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-emerald-600 dark:text-emerald-400">مجرّی (Integrator)</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {state.members.find((m) => m.isIntegrator)?.name ?? 'نگار کریمی'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  انسجام تیم · P&L · اجرای روزمره · حذف موانع بین دپارتمان‌ها
                </div>
              </div>
            </div>

            <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
              <li>۱. برگزاری منظم جلسه ماهانه همسوکننده (Same Page Meeting) به مدت ۲ تا ۴ ساعت خارج از دفتر.</li>
              <li>۲. ارائه جبهه واحد (Two is One, One is Two) در برابر تمام بدنه سازمان.</li>
              <li>۳. توقف دخالت مستقیم ایده‌پرداز در صندلی مجرّی و مدیران زیرمجموعه (No Meddling).</li>
              <li>۴. حرف آخر در تصمیمات اجرایی روزمره با مجرّی است.</li>
              <li>۵. طرح تمام تعارضات زوج رهبری صرفاً در جلسه Same Page و پرهیز از بحث در راهروها.</li>
            </ol>
          </div>

          {/* Same Page Meeting Log */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ثبت و پیگیری جلسه ماهانه همسوکننده (Same Page Meeting)
            </h2>

            <form onSubmit={handleAddSamePage} className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                required
                placeholder="موضوع یا تعارض نیازمند همسویی..."
                value={spTopic}
                onChange={(e) => setSpTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="دیدگاه ایده‌پرداز (Visionary)..."
                  value={spVisView}
                  onChange={(e) => setSpVisView(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="دیدگاه مجرّی (Integrator)..."
                  value={spIntView}
                  onChange={(e) => setSpIntView(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="تصمیم واحد نهایی (Two is One)..."
                  value={spDecision}
                  onChange={(e) => setSpDecision(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                >
                  ثبت همسویی
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {state.samePageEntries.map((sp) => (
                <div key={sp.id} className="py-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{sp.topic}</span>
                    <span className="font-mono-num text-slate-500">{sp.date}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    ایده‌پرداز: {sp.visionaryView || '—'} · مجرّی: {sp.integratorView || '—'}
                  </div>
                  {sp.agreedDecision && (
                    <div className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>تصمیم واحد: {sp.agreedDecision}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'delegate' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddDelegateTask}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap gap-3 items-end"
          >
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs text-slate-500 mb-1">
                فعالیت روزانه یا ماهانه (ماتریس تفویض و ارتقا — Delegate & Elevate™)
              </label>
              <input
                type="text"
                required
                placeholder="فعالیتی که زمان و انرژی شما را می‌گیرد بنویسید..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">ربع ماتریس</label>
              <select
                value={newTaskQuad}
                onChange={(e) => setNewTaskQuad(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value={1}>۱. عاشقشم و عالی‌ام (Love & Great)</option>
                <option value={2}>۲. دوست دارم و خوبم (Like & Good)</option>
                <option value={3}>۳. دوست ندارم ولی خوبم (Don't Like & Good)</option>
                <option value={4}>۴. دوست ندارم و ضعیفم (Don't Like & Poor)</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن به ماتریس</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                { q: 1 as const, title: '۱. عاشقشم و عالی‌ام (Love it & Great at it)', hint: 'تمرکز محوری شخصی — حفظ و تقویت کنید' },
                { q: 2 as const, title: '۲. دوست دارم و خوبم (Like it & Good at it)', hint: 'مسیر ارتقا به ربع ۱' },
                { q: 3 as const, title: '۳. دوست ندارم ولی خوبم (Don’t Like & Good)', hint: 'کاندیدای اول تفویض در این فصل' },
                { q: 4 as const, title: '۴. دوست ندارم و ضعیفم (Don’t Like & Poor)', hint: 'فوراً تفویض، حذف یا خودکارسازی شود' },
              ]
            ).map((quad) => {
              const items = state.delegateTasks.filter((t) => t.quadrant === quad.q);
              return (
                <div
                  key={quad.q}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                >
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {quad.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{quad.hint}</p>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">موردی در این ربع ثبت نشده است.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((task) => {
                        const targetId =
                          delegateTargetMap[task.id] ??
                          task.delegatedToId ??
                          state.members[2]?.id ??
                          state.members[0]?.id ??
                          '';
                        return (
                          <div
                            key={task.id}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                          >
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {task.title}
                            </div>
                            {(quad.q === 3 || quad.q === 4) && (
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <select
                                  aria-label={`انتخاب فرد برای تفویض ${task.title}`}
                                  value={targetId}
                                  onChange={(e) =>
                                    setDelegateTargetMap((p) => ({
                                      ...p,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                >
                                  {state.members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                                {task.status === 'delegated' ? (
                                  <span className="text-[11px] text-emerald-600 font-semibold">
                                    تفویض‌شده به {getMemberName(task.delegatedToId ?? targetId)}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onDelegateTaskToTodo(task, targetId)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                                  >
                                    <span>تفویض و تبدیل به To-Do</span>
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'clarity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Clarity Breaks Journal */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                وقفه شفافیت و تفکر (Clarity Breaks™)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                خروج از آتش‌نشانی روزمره («درون» کسب‌وکار) برای تفکر عمیق «بر روی» آینده کسب‌وکار
              </p>
            </div>

            <form onSubmit={handleAddClarityBreak} className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={cbPrompt}
                onChange={(e) => setCbPrompt(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={3}
                required
                placeholder="تأملات و بینش‌های حاصل از وقفه شفافیت..."
                value={cbReflection}
                onChange={(e) => setCbReflection(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اقدام شفافیت بعدی..."
                  value={cbAction}
                  onChange={(e) => setCbAction(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                >
                  ثبت ژورنال
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {state.clarityBreaks.map((cb) => (
                <div key={cb.id} className="py-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {cb.prompt}
                    </span>
                    <span className="font-mono-num shrink-0">{cb.date}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {cb.reflection}
                  </p>
                  {cb.actionItem && (
                    <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                      اقدام: {cb.actionItem}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* The EOS Life 5 Pillars + Shine + Entrepreneurial Leap */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  سنجش ۵ ستون زندگی EOS (The EOS Life®)
                </h2>
              </div>
              {(
                [
                  { key: 'doingWhatYouLove', label: '۱. انجام کاری که عاشق آن هستید' },
                  { key: 'peopleYouLove', label: '۲. کار کردن با افرادی که دوستشان دارید' },
                  { key: 'hugeDifference', label: '۳. ایجاد تفاوت و اثر بزرگ' },
                  { key: 'compensatedAppropriately', label: '۴. دریافت پاداش مالی متناسب' },
                  { key: 'timeForPassions', label: '۵. داشتن زمان آزاد برای علایق دیگر و خانواده' },
                ] as const
              ).map((pillar) => (
                <div key={pillar.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{pillar.label}</span>
                    <span className="font-mono-num font-bold text-indigo-600">
                      {lifeScore[pillar.key]} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={lifeScore[pillar.key]}
                    onChange={(e) => {
                      const updated: EOSLifeScore = {
                        ...lifeScore,
                        [pillar.key]: Number(e.target.value),
                      };
                      onUpdateEOSLife([updated]);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ۶ ویژگی ذاتی کارآفرینان (Entrepreneurial Leap)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ENTREPRENEURIAL_LEAP_6_TRAITS.map((tr, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100">{tr.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tr.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'books' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  مرجع ۱۳ منبع رسمی سیستم عامل کارآفرینی (EOS Books & Toolbox)
                </h2>
                <p className="text-xs text-slate-500">
                  نقشه اتصال مستقیم کتاب‌های مرجع EOS به ابزارهای عملیاتی پیاده‌سازی‌شده در این سامانه
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EOS_13_BOOKS.map((book) => (
                <div
                  key={book.num}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="text-xs font-mono-num font-bold text-indigo-600 dark:text-indigo-400">
                    منبع {String(book.num).padStart(2, '0')}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                    {book.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    نویسنده: {book.author}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {book.concept}
                  </p>
                  <div className="pt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    پیاده‌سازی در سامانه: {book.module}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              ۱۰ انضباط درونی رهبر آرام و مصمم (کتاب Shine — Driven & Peaceful)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              {SHINE_10_DISCIPLINES.map((d, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
