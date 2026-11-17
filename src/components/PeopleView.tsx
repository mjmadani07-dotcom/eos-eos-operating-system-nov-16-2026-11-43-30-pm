import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  ShieldAlert,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type {
  AccountabilitySeat,
  CoreValueScore,
  DepartmentType,
  EOSState,
  LMAAuditItem,
  PeopleBarConfig,
  StrikeRecord,
  TeamMember,
} from '../types/eos';
import { evaluatePerson } from '../utils/eosLogic';

interface PeopleViewProps {
  state: EOSState;
  onUpdateSeats: (seats: AccountabilitySeat[]) => void;
  onUpdateMembers: (members: TeamMember[]) => void;
  onUpdateBar: (bar: PeopleBarConfig) => void;
  onUpdateLMAAudit: (audit: LMAAuditItem[]) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  state,
  onUpdateSeats,
  onUpdateMembers,
  onUpdateBar,
  onUpdateLMAAudit,
}) => {
  const [subTab, setSubTab] = useState<'chart' | 'analyzer' | 'conversations'>('chart');
  const [structureOnlyMode, setStructureOnlyMode] = useState(false);

  // New seat form
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [newSeatTitle, setNewSeatTitle] = useState('');
  const [newSeatDept, setNewSeatDept] = useState<DepartmentType>('operations');
  const [newSeatParentId, setNewSeatParentId] = useState<string>('seat-integrator');
  const [newSeatHasReports, setNewSeatHasReports] = useState(false);

  // New member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  // 5-5-5 Conversation selector
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    state.members[2]?.id ?? state.members[0]?.id ?? ''
  );

  // Three-Strike note input
  const [strikeNotes, setStrikeNotes] = useState<Record<string, string>>({});

  const getMember = (id: string | null) =>
    id ? state.members.find((m) => m.id === id) : undefined;

  const handleAssignSeatOwner = (seatId: string, ownerId: string) => {
    const next = state.seats.map((s) =>
      s.id === seatId ? { ...s, ownerId: ownerId || null } : s
    );
    onUpdateSeats(next);
  };

  const handleUpdateSeatRole = (seatId: string, roleIdx: number, val: string) => {
    const next = state.seats.map((s) => {
      if (s.id !== seatId) return s;
      const roles: [string, string, string, string, string] = [...s.roles] as [
        string,
        string,
        string,
        string,
        string,
      ];
      roles[roleIdx] = val;
      return { ...s, roles };
    });
    onUpdateSeats(next);
  };

  const handleAddSeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeatTitle.trim()) return;
    const seat: AccountabilitySeat = {
      id: `seat-${Date.now()}`,
      title: newSeatTitle.trim(),
      department: newSeatDept,
      parentId: newSeatParentId || null,
      ownerId: null,
      hasDirectReports: newSeatHasReports,
      roles: [
        newSeatHasReports
          ? 'LMA (رهبری، مدیریت، پاسخگویی) تیم زیرمجموعه'
          : 'تحقق شاخص هفتگی اختصاصی صندلی',
        'مسئولیت کلیدی ۲',
        'مسئولیت کلیدی ۳',
        'مسئولیت کلیدی ۴',
        'مسئولیت کلیدی ۵',
      ],
    };
    onUpdateSeats([...state.seats, seat]);
    setNewSeatTitle('');
    setShowAddSeat(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const parts = newMemberName.trim().split(/\s+/);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0])
      .join(' ');
    const defaultScores: Record<string, CoreValueScore> = {};
    state.vto.coreValues.forEach((cv) => {
      defaultScores[cv.id] = '+';
    });
    const member: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName.trim(),
      roleTitle: newMemberRole.trim() || 'همکار تیم',
      email: '',
      avatarInitials: initials || 'هـ',
      valueScores: defaultScores,
      gwc: { getIt: true, wantIt: true, capacity: true },
      strikes: [],
      last555Date: new Date().toISOString().slice(0, 10),
      annualReviewDate: new Date().toISOString().slice(0, 10),
      annualReviewSummary: '',
    };
    onUpdateMembers([...state.members, member]);
    setNewMemberName('');
    setNewMemberRole('');
    setShowAddMember(false);
  };

  const handleCycleValueScore = (memberId: string, cvId: string) => {
    const order: CoreValueScore[] = ['+', '+/-', '-'];
    const next = state.members.map((m) => {
      if (m.id !== memberId) return m;
      const cur = m.valueScores[cvId] ?? '+/-';
      const nextVal = order[(order.indexOf(cur) + 1) % order.length];
      return { ...m, valueScores: { ...m.valueScores, [cvId]: nextVal } };
    });
    onUpdateMembers(next);
  };

  const handleToggleGWC = (
    memberId: string,
    field: 'getIt' | 'wantIt' | 'capacity'
  ) => {
    const next = state.members.map((m) =>
      m.id === memberId
        ? { ...m, gwc: { ...m.gwc, [field]: !m.gwc[field] } }
        : m
    );
    onUpdateMembers(next);
  };

  const handleAddStrike = (memberId: string) => {
    const member = state.members.find((m) => m.id === memberId);
    if (!member) return;
    const activeCount = member.strikes.filter((s) => s.status === 'active').length;
    if (activeCount >= 3) return;
    const strikeNum = (activeCount + 1) as 1 | 2 | 3;
    const note =
      strikeNotes[memberId]?.trim() ||
      (strikeNum === 1
        ? 'جلسه صریح ۱ به ۱ و اعطای فرصت ۳۰ روزه اول برای اصلاح عملکرد.'
        : strikeNum === 2
          ? 'تذکر کتبی دوم و اعطای فرصت ۳۰ روزه دوم.'
          : 'پایان روز ۹۰: عدم احراز حد نصاب و شروع فرآیند خروج محترمانه (Offboarding).');

    const newStrike: StrikeRecord = {
      id: `str-${Date.now()}`,
      strikeNumber: strikeNum,
      date: new Date().toISOString().slice(0, 10),
      note,
      status: 'active',
    };
    onUpdateMembers(
      state.members.map((m) =>
        m.id === memberId ? { ...m, strikes: [...m.strikes, newStrike] } : m
      )
    );
    setStrikeNotes((prev) => ({ ...prev, [memberId]: '' }));
  };

  const handleResolveStrikes = (memberId: string) => {
    onUpdateMembers(
      state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              strikes: m.strikes.map((s) => ({ ...s, status: 'resolved' as const })),
            }
          : m
      )
    );
  };

  const selectedMember = state.members.find((m) => m.id === selectedMemberId) ?? state.members[0];
  const selectedMemberSeats = state.seats.filter((s) => s.ownerId === selectedMember?.id);
  const selectedMemberRocks = state.rocks.filter((r) => r.ownerId === selectedMember?.id);

  // Organize seats hierarchically by depth
  const rootSeats = state.seats.filter((s) => !s.parentId);
  const getChildren = (parentId: string) =>
    state.seats.filter((s) => s.parentId === parentId);

  const renderSeatCard = (seat: AccountabilitySeat, depth = 0) => {
    const owner = getMember(seat.ownerId);
    const children = getChildren(seat.id);

    return (
      <div key={seat.id} className="space-y-4">
        <div
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 ${
            depth === 0 ? 'max-w-xl mx-auto' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {seat.title}
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {seat.hasDirectReports ? 'دارای زیرمجموعه (LMA الزامی)' : 'صندلی تخصصی'}
              </div>
            </div>

            {!structureOnlyMode ? (
              <select
                aria-label={`مسئول صندلی ${seat.title}`}
                value={seat.ownerId ?? ''}
                onChange={(e) => handleAssignSeatOwner(seat.id, e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">صندلی خالی (Unassigned)</option>
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                حالت ساختار خالص (بدون نام)
              </span>
            )}
          </div>

          {!structureOnlyMode && owner && (
            <div className="py-2.5 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                {owner.avatarInitials}
              </span>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{owner.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  تک‌مسئول صندلی (قانون یک نام در هر صندلی)
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              ۵ مسئولیت کلیدی صندلی:
            </div>
            {seat.roles.map((role, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[11px] font-mono-num text-slate-400 w-4">{idx + 1}.</span>
                <input
                  type="text"
                  aria-label={`مسئولیت ${idx + 1} برای ${seat.title}`}
                  value={role}
                  disabled={idx === 0 && seat.hasDirectReports}
                  onChange={(e) => handleUpdateSeatRole(seat.id, idx, e.target.value)}
                  className="flex-1 text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none py-0.5 disabled:opacity-80"
                />
              </div>
            ))}
          </div>
        </div>

        {children.length > 0 && (
          <div
            className={`grid gap-4 ${
              children.length === 1
                ? 'grid-cols-1 max-w-xl mx-auto'
                : children.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {children.map((child) => renderSeatCard(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            مؤلفه دوم: افراد (People) · فرد مناسب در صندلی مناسب
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            چارت پاسخگویی، ارزیابی افراد (People Analyzer) و فرهنگ
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('chart')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'chart'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            چارت پاسخگویی
          </button>
          <button
            type="button"
            onClick={() => setSubTab('analyzer')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'analyzer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ارزیابی افراد (GWC)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('conversations')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'conversations'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            گفتگوی ۵-۵-۵ و LMA
          </button>
        </div>
      </div>

      {subTab === 'chart' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              قانون EOS: ابتدا ساختار صندلی‌ها بدون نام طراحی می‌شود، سپس به هر صندلی فقط یک نفر اختصاص می‌یابد.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStructureOnlyMode(!structureOnlyMode)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 whitespace-nowrap"
              >
                {structureOnlyMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{structureOnlyMode ? 'نمایش نام افراد' : 'حالت ساختار خالص (بدون نام)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddSeat(!showAddSeat)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن صندلی جدید</span>
              </button>
            </div>
          </div>

          {showAddSeat && (
            <form
              onSubmit={handleAddSeat}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-xs text-slate-500 mb-1">عنوان صندلی</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: بازاریابی دیجیتال"
                  value={newSeatTitle}
                  onChange={(e) => setNewSeatTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">دپارتمان</label>
                <select
                  value={newSeatDept}
                  onChange={(e) => setNewSeatDept(e.target.value as DepartmentType)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="sales">فروش و بازاریابی</option>
                  <option value="operations">عملیات</option>
                  <option value="finance">مالی و اداری</option>
                  <option value="leadership">رهبری</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">گزارش‌دهی به</label>
                <select
                  value={newSeatParentId}
                  onChange={(e) => setNewSeatParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {state.seats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newSeatHasReports}
                    onChange={(e) => setNewSeatHasReports(e.target.checked)}
                  />
                  <span>دارای زیرمجموعه (LMA)</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 rounded-lg whitespace-nowrap"
                >
                  ثبت صندلی
                </button>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {rootSeats.map((root) => renderSeatCard(root, 0))}
          </div>
        </div>
      )}

      {subTab === 'analyzer' && (
        <div className="space-y-6">
          {/* The Bar Config & Add Member */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تنظیمات حد نصاب (The Bar) و ماتریس ارزیابی
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ستون‌های ارزش محوری به‌صورت خودکار از V/TO بارگذاری می‌شوند. الگوی GWC باید ۱۰۰٪ Yes باشد.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <span>حداقل نمره `+`:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, state.vto.coreValues.length)}
                  value={state.peopleBar.minPlusCount}
                  onChange={(e) =>
                    onUpdateBar({
                      ...state.peopleBar,
                      minPlusCount: Number(e.target.value) || 1,
                    })
                  }
                  className="w-16 px-2 py-1 text-xs font-mono-num rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!state.peopleBar.allowMinus}
                  onChange={(e) =>
                    onUpdateBar({ ...state.peopleBar, allowMinus: !e.target.checked })
                  }
                />
                <span>عدم پذیرش نمره منفی (-)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowAddMember(!showAddMember)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>افزودن عضو تیم</span>
              </button>
            </div>
          </div>

          {showAddMember && (
            <form
              onSubmit={handleAddMember}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-end"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-slate-500 mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="مثلاً: کیانوش تهرانی"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-slate-500 mb-1">عنوان نقش</label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  placeholder="مثلاً: کارشناس فروش سازمانی"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 rounded-lg"
              >
                افزودن به ماتریس
              </button>
            </form>
          )}

          {/* People Analyzer Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">نام عضو</th>
                  {state.vto.coreValues.map((cv, idx) => (
                    <th key={cv.id} className="py-3 px-3 font-semibold text-center min-w-[110px]">
                      <div className="truncate max-w-[130px] mx-auto" title={cv.title}>
                        {idx + 1}. {cv.title.split('(')[0].trim()}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Get it</th>
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Want it</th>
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Capacity</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">وضعیت نهایی (The Bar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {state.members.map((member) => {
                  const evalResult = evaluatePerson(member, state.vto.coreValues, state.peopleBar);
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{member.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {member.roleTitle}
                        </div>
                      </td>

                      {state.vto.coreValues.map((cv) => {
                        const score = member.valueScores[cv.id] ?? '+/-';
                        return (
                          <td key={cv.id} className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleCycleValueScore(member.id, cv.id)}
                              aria-label={`تغییر نمره ${member.name} در ${cv.title}`}
                              className={`w-11 h-8 rounded-md font-mono-num font-bold border transition-colors ${
                                score === '+'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : score === '-'
                                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {score}
                            </button>
                          </td>
                        );
                      })}

                      {(['getIt', 'wantIt', 'capacity'] as const).map((field) => (
                        <td key={field} className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleGWC(member.id, field)}
                            aria-label={`تغییر ${field} برای ${member.name}`}
                            className={`px-2.5 py-1.5 rounded-md font-mono-num font-semibold border transition-colors ${
                              member.gwc[field]
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                            }`}
                          >
                            {member.gwc[field] ? 'Yes' : 'No'}
                          </button>
                        </td>
                      ))}

                      <td className="py-3 px-4 whitespace-nowrap">
                        {evalResult.classification === 'right_person_right_seat' && (
                          <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>بالای حد نصاب (Right / Right)</span>
                          </div>
                        )}
                        {evalResult.classification === 'wrong_person_right_seat' && (
                          <div className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-300 font-semibold">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>فرد نامناسب (Wrong Person)</span>
                          </div>
                        )}
                        {evalResult.classification === 'right_person_wrong_seat' && (
                          <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>صندلی نامناسب (Wrong Seat)</span>
                          </div>
                        )}
                        {evalResult.classification === 'wrong_person_wrong_seat' && (
                          <div className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-300 font-semibold">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>نامناسب در هر دو</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Three-Strike Rule (30-30-30) Protocol Tracker */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                پروتکل ۳ ضربه (Three-Strike Rule / 30-30-30)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                برای افرادی که زیر حد نصاب قرار دارند: ضربه ۱ (۳۰ روز فرصت اول) · ضربه ۲ (۳۰ روز دوم) · ضربه ۳ (روز ۹۰ خروج محترمانه)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.members
                .filter(
                  (m) =>
                    evaluatePerson(m, state.vto.coreValues, state.peopleBar).needsThreeStrike ||
                    m.strikes.length > 0
                )
                .map((m) => {
                  const evalRes = evaluatePerson(m, state.vto.coreValues, state.peopleBar);
                  const activeStrikes = m.strikes.filter((s) => s.status === 'active');
                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {m.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {m.roleTitle} ·{' '}
                            {evalRes.rightPerson ? 'ارزش‌ها OK' : 'نقص ارزش محوری'} ·{' '}
                            {evalRes.rightSeat ? 'GWC OK' : 'نقص GWC'}
                          </div>
                        </div>
                        <span className="text-xs font-mono-num font-bold text-red-600 dark:text-red-400">
                          {activeStrikes.length} / 3 ضربه فعال
                        </span>
                      </div>

                      {m.strikes.length > 0 && (
                        <ul className="space-y-1.5 text-xs">
                          {m.strikes.map((st) => (
                            <li
                              key={st.id}
                              className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  ضربه {st.strikeNumber} ({st.date}):
                                </span>{' '}
                                <span className="text-slate-600 dark:text-slate-300">{st.note}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 shrink-0">
                                {st.status === 'active' ? 'فعال' : 'حل‌شده'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          placeholder="توضیح جلسه ۱ به ۱ و تعهد ۳۰ روزه..."
                          value={strikeNotes[m.id] ?? ''}
                          onChange={(e) =>
                            setStrikeNotes((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          className="flex-1 min-w-[180px] px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          disabled={activeStrikes.length >= 3}
                          onClick={() => handleAddStrike(m.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg whitespace-nowrap"
                        >
                          ثبت ضربه بعدی
                        </button>
                        {activeStrikes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleResolveStrikes(m.id)}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg whitespace-nowrap"
                          >
                            اصلاح و بستن ضربه
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {subTab === 'conversations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 5-5-5 Quarterly Conversations & Annual Review */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  دستورالعمل گفتگوی فصلی ۵-۵-۵ (5-5-5 Conversation)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  طبق قانون EOS این گفتگوی ۳ ماه یک‌بار بدون فرم رسمی یا بایگانی در پرونده پرسنلی انجام می‌شود.
                </p>
              </div>
              <select
                aria-label="انتخاب عضو تیم برای گفتگوی ۵-۵-۵"
                value={selectedMember?.id ?? ''}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.roleTitle})
                  </option>
                ))}
              </select>
            </div>

            {selectedMember && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      محور ۱: ۵ ارزش محوری
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {state.vto.coreValues.map((cv) => (
                        <li key={cv.id} className="flex items-center justify-between">
                          <span className="truncate">{cv.title.split('(')[0]}</span>
                          <span className="font-mono-num font-bold">
                            {selectedMember.valueScores[cv.id] ?? '+/-'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      محور ۲: ۵ مسئولیت صندلی
                    </div>
                    {selectedMemberSeats.length > 0 ? (
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {selectedMemberSeats[0].roles.map((r, i) => (
                          <li key={i}>
                            {i + 1}. {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">صندلی مستقلی اختصاص نیافته است.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      محور ۳: راک‌های ۹۰ روزه
                    </div>
                    {selectedMemberRocks.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {selectedMemberRocks.map((rk) => (
                          <li key={rk.id}>• {rk.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">راک فعالی ثبت نشده است.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    آخرین تاریخ گفتگوی ۵-۵-۵: <span className="font-mono-num font-semibold">{selectedMember.last555Date}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().slice(0, 10);
                      onUpdateMembers(
                        state.members.map((m) =>
                          m.id === selectedMember.id ? { ...m, last555Date: today } : m
                        )
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>ثبت انجام گفتگوی فصلی امروز</span>
                  </button>
                </div>

                {/* Formal Annual Review */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      ارزیابی رسمی سالانه (Annual Review — ثبت و بایگانی)
                    </h3>
                    <span className="text-xs font-mono-num text-slate-500">
                      تاریخ: {selectedMember.annualReviewDate}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={selectedMember.annualReviewSummary}
                    onChange={(e) =>
                      onUpdateMembers(
                        state.members.map((m) =>
                          m.id === selectedMember.id
                            ? { ...m, annualReviewSummary: e.target.value }
                            : m
                        )
                      )
                    }
                    placeholder="جمع‌بندی رسمی ارزیابی سالانه، نقاط قوت و برنامه رشد..."
                    className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5 Leadership Abilities & 5 Management Practices (How to Be a Great Boss) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ممیزی LMA (How to Be a Great Boss)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ۵ قابلیت رهبری (Leadership) و ۵ اقدام مدیریتی (Management) از امتیاز ۱ تا ۵
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {state.lmaAudit.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.category === 'leadership' ? 'رهبری: ' : 'مدیریت: '}
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          onUpdateLMAAudit(
                            state.lmaAudit.map((a) =>
                              a.id === item.id ? { ...a, rating: r } : a
                            )
                          )
                        }
                        className={`w-7 h-7 rounded text-xs font-mono-num font-bold border ${
                          item.rating === r
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
