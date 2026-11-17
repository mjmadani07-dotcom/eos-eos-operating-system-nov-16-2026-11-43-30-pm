import { useCallback, useEffect, useRef, useState } from 'react';
import { createSeedEOSState } from '../data/seedData';
import type { EOSState, IssueItem, RockItem, ScorecardMeasurable, ToDoItem } from '../types/eos';

const STORAGE_KEY = 'eos_platform_state_v1';

export function useEOSStore() {
  const [state, setState] = useState<EOSState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/eos');
        if (!res.ok) throw new Error('خطا در دریافت داده‌های سازمان');
        const data = (await res.json()) as EOSState;
        if (active) {
          setState(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          setLoading(false);
        }
      } catch {
        // Fallback to localStorage or deterministic seed if server is momentarily unavailable
        const cached = localStorage.getItem(STORAGE_KEY);
        if (active) {
          if (cached) {
            setState(JSON.parse(cached) as EOSState);
          } else {
            setState(createSeedEOSState());
          }
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const persistState = useCallback((next: EOSState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    setSaving(true);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/eos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          setError('ذخیره‌سازی در سرور با خطا مواجه شد.');
        } else {
          setError(null);
        }
      } catch {
        setError('ارتباط با سرور موقتاً برقرار نشد (تغییرات محلی ذخیره شد).');
      } finally {
        setSaving(false);
      }
    }, 250);
  }, []);

  const updateState = useCallback(
    (updater: (prev: EOSState) => EOSState) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const resetToSeed = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/eos/reset', { method: 'POST' });
      const fresh = res.ok ? ((await res.json()) as EOSState) : createSeedEOSState();
      setState(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setError(null);
    } catch {
      const fresh = createSeedEOSState();
      setState(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } finally {
      setSaving(false);
    }
  }, []);

  const dropScorecardToIssues = useCallback(
    (measurable: ScorecardMeasurable, latestValue: number | null) => {
      updateState((prev) => {
        const alreadyOpen = prev.issues.some(
          (i) => i.status === 'open' && i.linkedSource?.sourceId === measurable.id
        );
        if (alreadyOpen) return prev;
        const ownerSeat = prev.seats.find((s) => s.ownerId === measurable.ownerId);
        const newIssue: IssueItem = {
          id: `iss-${Date.now()}`,
          title: `انحراف اسکورکارد: ${measurable.name} (عدد ثبت‌شده: ${latestValue ?? '—'} در برابر هدف ${measurable.operator} ${measurable.goal})`,
          listType: 'l10',
          department: ownerSeat?.department ?? 'leadership',
          ownerId: measurable.ownerId,
          priority: null,
          status: 'open',
          rootCauseSentence: '',
          enterTheDangerNote: '',
          linkedSource: {
            type: 'scorecard',
            sourceId: measurable.id,
            label: `اسکورکارد · ${measurable.name}`,
          },
          createdAt: new Date().toISOString().slice(0, 10),
        };
        return { ...prev, issues: [newIssue, ...prev.issues] };
      });
    },
    [updateState]
  );

  const dropRockToIssues = useCallback(
    (rock: RockItem) => {
      updateState((prev) => {
        const alreadyOpen = prev.issues.some(
          (i) => i.status === 'open' && i.linkedSource?.sourceId === rock.id
        );
        if (alreadyOpen) return prev;
        const ownerSeat = prev.seats.find((s) => s.ownerId === rock.ownerId);
        const newIssue: IssueItem = {
          id: `iss-${Date.now()}`,
          title: `راک عقب‌افتاده: ${rock.title}`,
          listType: 'l10',
          department: ownerSeat?.department ?? 'leadership',
          ownerId: rock.ownerId,
          priority: null,
          status: 'open',
          rootCauseSentence: '',
          enterTheDangerNote: '',
          linkedSource: {
            type: 'rock',
            sourceId: rock.id,
            label: `راک ۹۰ روزه · ${rock.quarter}`,
          },
          createdAt: new Date().toISOString().slice(0, 10),
        };
        return { ...prev, issues: [newIssue, ...prev.issues] };
      });
    },
    [updateState]
  );

  const solveIssueWithToDo = useCallback(
    (
      issueId: string,
      rootCauseSentence: string,
      todoTitle: string,
      todoOwnerId: string,
      todoDueDate: string
    ) => {
      updateState((prev) => {
        const newTodo: ToDoItem = {
          id: `td-${Date.now()}`,
          title: todoTitle.trim(),
          ownerId: todoOwnerId,
          dueDate: todoDueDate,
          done: false,
          createdAt: new Date().toISOString().slice(0, 10),
          sourceIssueId: issueId,
        };
        const updatedIssues = prev.issues.map((iss) =>
          iss.id === issueId
            ? {
                ...iss,
                status: 'solved' as const,
                priority: null,
                rootCauseSentence: rootCauseSentence.trim() || iss.rootCauseSentence,
                solvedAt: new Date().toISOString().slice(0, 10),
                resolutionSummary: `اقدام ۷ روزه: ${todoTitle.trim()}`,
              }
            : iss
        );
        return {
          ...prev,
          issues: updatedIssues,
          todos: [newTodo, ...prev.todos],
        };
      });
    },
    [updateState]
  );

  return {
    state,
    loading,
    saving,
    error,
    updateState,
    resetToSeed,
    dropScorecardToIssues,
    dropRockToIssues,
    solveIssueWithToDo,
  };
}
