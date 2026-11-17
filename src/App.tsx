import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Compass,
  Database,
  LayoutDashboard,
  Menu,
  Moon,
  Play,
  RotateCcw,
  Sun,
  Target,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { useEOSStore } from './hooks/useEOSStore';
import { OverviewAndCheckup, type NavSection } from './components/OverviewAndCheckup';
import { VisionVTOView } from './components/VisionVTOView';
import { PeopleView } from './components/PeopleView';
import { DataScorecardView } from './components/DataScorecardView';
import { IssuesIDSView } from './components/IssuesIDSView';
import { ProcessView } from './components/ProcessView';
import { TractionView } from './components/TractionView';
import { LeadershipAndBooksView } from './components/LeadershipAndBooksView';
import type { IssueListType } from './types/eos';

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'داشبورد و Checkup', subtitle: 'نمای کلی ۶ مؤلفه', icon: LayoutDashboard },
  { id: 'vision', label: '۱. چشم‌انداز (Vision)', subtitle: 'سند V/TO و نطق شرکت', icon: Compass },
  { id: 'people', label: '۲. افراد (People)', subtitle: 'چارت پاسخگویی و GWC', icon: Users },
  { id: 'data', label: '۳. داده‌ها (Data)', subtitle: 'کارت امتیاز ۱۳ هفته‌ای', icon: Database },
  { id: 'issues', label: '۴. مسائل (Issues)', subtitle: 'لیست‌های سه‌گانه و IDS', icon: AlertTriangle },
  { id: 'process', label: '۵. فرآیند (Process)', subtitle: '۲۰/۸۰، The Way و FBA', icon: Workflow },
  { id: 'traction', label: '۶. اجرا (Traction)', subtitle: 'راک‌های ۹۰ روزه و L10', icon: Target },
  { id: 'leadership', label: 'رهبری، EOS Life و کتب', subtitle: 'Rocket Fuel و ۱۳ منبع', icon: BookOpen },
];

export default function App() {
  const {
    state,
    loading,
    saving,
    error,
    updateState,
    resetToSeed,
    dropScorecardToIssues,
    dropRockToIssues,
    solveIssueWithToDo,
  } = useEOSStore();

  const [section, setSection] = useState<NavSection>('overview');
  const [tractionSubTab, setTractionSubTab] = useState<'rocks' | 'l10' | 'todos'>('rocks');
  const [issuesInitialList, setIssuesInitialList] = useState<IssueListType>('l10');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const navigateTo = (target: NavSection) => {
    setSection(target);
    setMobileMenuOpen(false);
  };

  const handleStartL10 = () => {
    setTractionSubTab('l10');
    setSection('traction');
    setMobileMenuOpen(false);
  };

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === section) ?? NAV_ITEMS[0];

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-sm">
        در حال بارگذاری پلتفرم سیستم عامل کارآفرینی (EOS)...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[268px] lg:shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            EOS® Command
          </span>
        </div>

        <nav aria-label="منوی اصلی ماژول‌های EOS" className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full text-right px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{item.label}</div>
                  <div
                    className={`text-[11px] truncate ${
                      active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            سازمان فعال: <span className="font-semibold text-slate-800 dark:text-slate-200">{state.vto.companyName}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {saving ? 'در حال ذخیره‌سازی تغییرات...' : 'تمامی داده‌ها همگام‌سازی شدند'}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col border-l border-slate-200 dark:border-slate-800">
            <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                EOS® Command
              </span>
              <button
                type="button"
                aria-label="بستن منو"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full text-right px-3 py-2.5 rounded-lg flex items-center gap-3 text-xs font-semibold ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar (Contextual Breadcrumb + 1 Primary Action) */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="باز کردن منوی ناوبری"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {state.vto.companyName}
              </span>
              <span aria-hidden="true">/</span>
              <span className="truncate">{activeNavMeta.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={resetToSeed}
              title="بازنشانی داده‌های نمونه"
              aria-label="بازنشانی داده‌های نمونه"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleStartL10}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>جلسه سطح ۱۰</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-4 sm:mx-8 mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            {error}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto">
          {section === 'overview' && (
            <OverviewAndCheckup
              state={state}
              onNavigate={navigateTo}
              onUpdateCheckupScore={(qId, score) =>
                updateState((prev) => ({
                  ...prev,
                  checkupQuestions: prev.checkupQuestions.map((q) =>
                    q.id === qId ? { ...q, score } : q
                  ),
                }))
              }
              onStartL10={handleStartL10}
            />
          )}

          {section === 'vision' && (
            <VisionVTOView
              state={state}
              onUpdateVTO={(nextVto) => updateState((prev) => ({ ...prev, vto: nextVto }))}
              onNavigateToRocks={() => {
                setTractionSubTab('rocks');
                navigateTo('traction');
              }}
              onNavigateToLongTermIssues={() => {
                setIssuesInitialList('long_term');
                navigateTo('issues');
              }}
            />
          )}

          {section === 'people' && (
            <PeopleView
              state={state}
              onUpdateSeats={(seats) => updateState((prev) => ({ ...prev, seats }))}
              onUpdateMembers={(members) => updateState((prev) => ({ ...prev, members }))}
              onUpdateBar={(peopleBar) => updateState((prev) => ({ ...prev, peopleBar }))}
              onUpdateLMAAudit={(lmaAudit) => updateState((prev) => ({ ...prev, lmaAudit }))}
            />
          )}

          {section === 'data' && (
            <DataScorecardView
              state={state}
              onUpdateScorecard={(scorecard) => updateState((prev) => ({ ...prev, scorecard }))}
              onDropToIssues={dropScorecardToIssues}
              onNavigateToIssues={() => {
                setIssuesInitialList('l10');
                navigateTo('issues');
              }}
            />
          )}

          {section === 'issues' && (
            <IssuesIDSView
              state={state}
              initialListType={issuesInitialList}
              onUpdateIssues={(issues) => updateState((prev) => ({ ...prev, issues }))}
              onSolveIssueWithToDo={solveIssueWithToDo}
            />
          )}

          {section === 'process' && (
            <ProcessView
              state={state}
              onUpdateProcesses={(processes) => updateState((prev) => ({ ...prev, processes }))}
            />
          )}

          {section === 'traction' && (
            <TractionView
              state={state}
              initialSubTab={tractionSubTab}
              onUpdateRocks={(rocks) => updateState((prev) => ({ ...prev, rocks }))}
              onUpdateTodos={(todos) => updateState((prev) => ({ ...prev, todos }))}
              onUpdateHeadlines={(headlines) => updateState((prev) => ({ ...prev, headlines }))}
              onSaveMeeting={(meeting) =>
                updateState((prev) => ({
                  ...prev,
                  meetings: [meeting, ...prev.meetings],
                }))
              }
              onDropRockToIssues={dropRockToIssues}
              onDropScorecardToIssues={(scId) => {
                const sc = state.scorecard.find((s) => s.id === scId);
                if (!sc) return;
                const latest = [...sc.weeks].reverse().find((w) => w.value !== null);
                dropScorecardToIssues(sc, latest?.value ?? null);
              }}
              onDropHeadlineToIssues={(headlineId, text, ownerId) => {
                updateState((prev) => ({
                  ...prev,
                  issues: [
                    {
                      id: `iss-${Date.now()}`,
                      title: `تیتر L10: ${text}`,
                      listType: 'l10',
                      department: 'leadership',
                      ownerId,
                      priority: null,
                      status: 'open',
                      rootCauseSentence: '',
                      enterTheDangerNote: '',
                      linkedSource: {
                        type: 'headline',
                        sourceId: headlineId,
                        label: 'تیتر مشتریان/پرسنل',
                      },
                      createdAt: new Date().toISOString().slice(0, 10),
                    },
                    ...prev.issues,
                  ],
                }));
              }}
              onSolveIssueWithToDo={solveIssueWithToDo}
            />
          )}

          {section === 'leadership' && (
            <LeadershipAndBooksView
              state={state}
              onUpdateDelegateTasks={(delegateTasks) =>
                updateState((prev) => ({ ...prev, delegateTasks }))
              }
              onDelegateTaskToTodo={(task, targetMemberId) => {
                updateState((prev) => ({
                  ...prev,
                  delegateTasks: prev.delegateTasks.map((t) =>
                    t.id === task.id
                      ? { ...t, delegatedToId: targetMemberId, status: 'delegated' }
                      : t
                  ),
                  todos: [
                    {
                      id: `td-${Date.now()}`,
                      title: `تفویض‌شده (Delegate & Elevate): ${task.title}`,
                      ownerId: targetMemberId,
                      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                      done: false,
                      createdAt: new Date().toISOString().slice(0, 10),
                    },
                    ...prev.todos,
                  ],
                }));
              }}
              onUpdateClarityBreaks={(clarityBreaks) =>
                updateState((prev) => ({ ...prev, clarityBreaks }))
              }
              onUpdateSamePage={(samePageEntries) =>
                updateState((prev) => ({ ...prev, samePageEntries }))
              }
              onUpdateEOSLife={(eosLifeScores) =>
                updateState((prev) => ({ ...prev, eosLifeScores }))
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
