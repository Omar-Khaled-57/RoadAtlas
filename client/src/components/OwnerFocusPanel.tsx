import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Compass, LoaderCircle, Plus, Star, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FocusItem, FocusItemKind } from '@shared/index';
import { roadmapsApi } from '../data/api';
import { ITEM_COPY } from '../data/focus';
import { useFocus, useOwnerRoadmaps, useSetFocus, useSession } from '../data/queries';
import { localize } from '../lib/localize';

type DraftItem = Omit<FocusItem, 'targetId'> & {
  targetId: string;
  titleEn?: string;
  titleAr?: string;
  href?: string;
};
const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2.5 text-start text-sm text-fg-primary outline-none transition focus:border-border-focus focus:ring-2 focus:ring-primary-soft';
const KINDS: FocusItemKind[] = ['technology', 'project', 'milestone', 'custom'];

interface OwnerFocusPanelProps {
  open: boolean;
  focusItemId?: string;
  addRowOnOpen?: boolean;
  onClose: () => void;
}

export function OwnerFocusPanel({
  open,
  focusItemId,
  addRowOnOpen = false,
  onClose,
}: OwnerFocusPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const focus = useFocus(authenticated);
  const roadmaps = useOwnerRoadmaps(authenticated);
  const saveFocus = useSetFocus();
  const roadmapItems = useMemo(() => roadmaps.data ?? [], [roadmaps.data]);
  const stepQueries = useQueries({
    queries: roadmapItems.map((roadmap) => ({
      queryKey: ['roadmaps', roadmap.id, 'steps'],
      queryFn: () => roadmapsApi.steps(roadmap.id),
      enabled: authenticated,
    })),
  });
  const steps = useMemo(() => stepQueries.flatMap((query) => query.data ?? []), [stepQueries]);
  const [draft, setDraft] = useState<DraftItem[] | null>(null);

  const existingItems: DraftItem[] = useMemo(() => {
    if (focus.isError) return [];
    const stored = focus.data?.items ?? [];
    if (stored.length) return stored;
    const legacy: DraftItem[] = [];
    const tech = roadmapItems.find(
      (roadmap) => roadmap.kind === 'tech' && roadmap.techId === focus.data?.currentTechId,
    );
    if (tech) {
      legacy.push({ id: 'legacy-tech', kind: 'technology', targetId: tech.id, highlighted: true });
    }
    const project = roadmapItems.find((roadmap) => roadmap.id === focus.data?.currentProjectId);
    if (project) {
      legacy.push({
        id: 'legacy-project',
        kind: 'project',
        targetId: project.id,
        highlighted: legacy.length === 0,
      });
    }
    const milestone = steps.find((step) => step.id === focus.data?.lastVisited?.stepId);
    if (milestone) {
      legacy.push({
        id: 'legacy-milestone',
        kind: 'milestone',
        targetId: milestone.id,
        highlighted: legacy.length === 0,
      });
    }
    return legacy;
  }, [focus.data, focus.isError, roadmapItems, steps]);
  const pendingAddRow: DraftItem = {
    id: `pending-focus-row-${existingItems.length}`,
    kind: 'technology',
    targetId: '',
    highlighted: existingItems.length === 0,
  };
  const slotKind = focusItemId?.startsWith('slot:')
    ? KINDS.find((kind) => kind === focusItemId.slice('slot:'.length))
    : undefined;
  const slotEditRow: DraftItem | undefined =
    open && slotKind && !existingItems.some((item) => item.kind === slotKind)
      ? {
          id: focusItemId as string,
          kind: slotKind,
          targetId: '',
          highlighted: existingItems.length === 0,
        }
      : undefined;
  const items =
    draft ??
    (slotEditRow
      ? [...existingItems, slotEditRow]
      : open && addRowOnOpen
        ? [...existingItems, pendingAddRow]
        : existingItems);
  const editingItem = slotKind
    ? items.find((item) => item.kind === slotKind)
    : focusItemId
      ? items.find((item) => item.id === focusItemId)
      : undefined;
  const visibleItems = editingItem ? [editingItem] : items;
  const initialRowId = addRowOnOpen ? items.at(-1)?.id : (editingItem?.id ?? focusItemId);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      const target = initialRowId
        ? document.getElementById(`focus-row-${initialRowId}`)
        : addRowOnOpen
          ? null
          : document.getElementById('focus-add-row');
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      (target?.querySelector<HTMLElement>('select, input, button') ?? target)?.focus();
    });
  }, [addRowOnOpen, initialRowId, open]);

  const closeEditor = () => {
    setDraft(null);
    onClose();
  };

  if (!authenticated || !open) return null;

  const addRow = () =>
    setDraft([
      ...items,
      {
        id: crypto.randomUUID(),
        kind: 'technology',
        targetId: '',
        highlighted: items.length === 0,
      },
    ]);
  const editRow = (id: string, updates: Partial<DraftItem>) =>
    setDraft(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  const highlightRow = (id: string) => {
    const selected = items.find((item) => item.id === id);
    if (!selected) return;
    const highlightCount = items.filter((item) => item.highlighted).length;
    if (
      (!selected.highlighted && highlightCount >= 2) ||
      (selected.highlighted && highlightCount === 1)
    )
      return;
    setDraft(
      items.map((item) => (item.id === id ? { ...item, highlighted: !item.highlighted } : item)),
    );
  };
  const removeRow = (id: string) => {
    const remaining = items.filter((item) => item.id !== id);
    if (remaining.length && !remaining.some((item) => item.highlighted)) {
      remaining[0] = { ...remaining[0], highlighted: true };
    }
    setDraft(remaining);
  };
  const moveRow = (id: string, direction: -1 | 1) => {
    const index = items.findIndex((item) => item.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setDraft(next);
  };
  const save = () => {
    const payload = items
      .filter((item) => {
        if (item.kind === 'custom') return (item as DraftItem).titleEn?.trim();
        return item.targetId && item.targetId.trim();
      })
      .map((item) => {
        if (item.kind === 'custom') {
          const customItem = item as DraftItem;
          return {
            id: customItem.id,
            kind: 'custom',
            targetId: customItem.targetId?.trim() || customItem.id,
            highlighted: customItem.highlighted,
            title: customItem.titleAr?.trim()
              ? { en: customItem.titleEn?.trim() || '', ar: customItem.titleAr.trim() }
              : { en: customItem.titleEn?.trim() || '' },
            href: customItem.href?.trim() || undefined,
          };
        }
        return {
          id: item.id,
          kind: item.kind,
          targetId: item.targetId,
          highlighted: item.highlighted,
        };
      });
    saveFocus.mutate(
      {
        items: payload as unknown as FocusItem[],
      },
      {
        onSuccess: () => {
          setDraft(null);
          onClose();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeEditor();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-focus-title"
        className="surface-card max-h-[90dvh] w-full max-w-4xl space-y-4 overflow-y-auto p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="icon-tile bg-accent-soft text-accent">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="owner-focus-title" className="text-lg font-bold">
                {editingItem
                  ? `${t('common.edit')} ${t(ITEM_COPY[editingItem.kind].label)}`
                  : addRowOnOpen
                    ? t('focusPanel.addRow')
                    : t('focusPanel.title')}
              </h2>
              <p className="text-sm text-fg-muted">{t('focusPanel.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button !px-2"
            aria-label={t('common.close')}
            onClick={closeEditor}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {focus.isPending || roadmaps.isPending ? (
          <p role="status" className="text-sm text-fg-muted">
            {t('common.loading')}
          </p>
        ) : null}
        {focus.isError || roadmaps.isError ? (
          <p role="alert" className="text-sm text-error">
            {t('focusPanel.loadError')}
          </p>
        ) : null}

        {!editingItem ? (
          <button id="focus-add-row" type="button" className="secondary-button" onClick={addRow}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('focusPanel.addRow')}
          </button>
        ) : null}

        <div className="grid gap-3">
          {visibleItems.map((item) => {
            const targetRoadmaps = roadmapItems.filter((roadmap) =>
              item.kind === 'technology'
                ? roadmap.kind === 'tech'
                : item.kind === 'project'
                  ? roadmap.kind === 'pipeline'
                  : roadmap.kind === 'pipeline',
            );
            const targetOptions =
              item.kind === 'milestone'
                ? steps
                    .filter((step) =>
                      targetRoadmaps.some((roadmap) => roadmap.id === step.roadmapId),
                    )
                    .map((step) => {
                      const parent = roadmapItems.find((roadmap) => roadmap.id === step.roadmapId);
                      return {
                        id: step.id,
                        title: `${parent ? localize(parent.title, lang) : ''} · ${localize(step.title, lang)}`,
                      };
                    })
                : targetRoadmaps.map((roadmap) => ({
                    id: roadmap.id,
                    title: localize(roadmap.title, lang),
                  }));
            const highlightCount = items.filter((row) => row.highlighted).length;

            return (
              <div
                key={item.id}
                id={`focus-row-${item.id}`}
                className="grid gap-2 rounded-xl border border-border-subtle p-3 sm:grid-cols-[minmax(10rem,.65fr)_minmax(12rem,1.35fr)_auto_auto_auto] sm:items-center"
              >
                <select
                  name={`focus-${item.id}-kind`}
                  aria-label={t('focusPanel.rowType')}
                  value={item.kind}
                  onChange={(event) =>
                    editRow(item.id, { kind: event.target.value as FocusItemKind, targetId: '' })
                  }
                  className={INPUT_CLASS}
                >
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind === 'custom'
                        ? t('focusPanel.custom')
                        : t((ITEM_COPY as Record<string, { label: string }>)[kind]?.label ?? kind)}
                    </option>
                  ))}
                </select>
                {item.kind === 'custom' ? (
                  <div className="grid gap-1 sm:col-span-2">
                    <input
                      name={`focus-${item.id}-title-en`}
                      aria-label={t('focusPanel.customTitleEn') || 'Title (EN)'}
                      value={(item as DraftItem).titleEn ?? ''}
                      onChange={(event) =>
                        editRow(item.id, { titleEn: event.target.value } as Partial<DraftItem>)
                      }
                      className={INPUT_CLASS}
                      placeholder={t('focusPanel.customTitleEn') || 'Title (EN)'}
                    />
                    <input
                      name={`focus-${item.id}-title-ar`}
                      aria-label={t('focusPanel.customTitleAr') || 'Title (AR)'}
                      dir="rtl"
                      value={(item as DraftItem).titleAr ?? ''}
                      onChange={(event) =>
                        editRow(item.id, { titleAr: event.target.value } as Partial<DraftItem>)
                      }
                      className={INPUT_CLASS}
                      placeholder={t('focusPanel.customTitleAr') || 'Title (AR)'}
                    />
                    <input
                      name={`focus-${item.id}-href`}
                      aria-label={t('focusPanel.customHref') || 'Link (optional)'}
                      value={(item as DraftItem).href ?? ''}
                      onChange={(event) =>
                        editRow(item.id, { href: event.target.value } as Partial<DraftItem>)
                      }
                      className={INPUT_CLASS}
                      placeholder={t('focusPanel.customHref') || 'Link to roadmap/step or URL'}
                    />
                  </div>
                ) : (
                  <select
                    name={`focus-${item.id}-target`}
                    aria-label={t('focusPanel.rowTarget')}
                    value={item.targetId}
                    onChange={(event) => editRow(item.id, { targetId: event.target.value })}
                    className={INPUT_CLASS}
                  >
                    <option value="">{t('focusPanel.chooseTarget')}</option>
                    {targetOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  className={`secondary-button ${item.highlighted ? 'text-primary' : ''}`}
                  aria-pressed={item.highlighted}
                  disabled={
                    (!item.highlighted && highlightCount >= 2) ||
                    (item.highlighted && highlightCount === 1)
                  }
                  onClick={() => highlightRow(item.id)}
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                  {item.highlighted ? t('focusPanel.highlighted') : t('focusPanel.highlight')}
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="secondary-button !px-2"
                    aria-label={t('focusPanel.moveUp')}
                    disabled={items[0]?.id === item.id}
                    onClick={() => moveRow(item.id, -1)}
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="secondary-button !px-2"
                    aria-label={t('focusPanel.moveDown')}
                    disabled={items.at(-1)?.id === item.id}
                    onClick={() => moveRow(item.id, 1)}
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  aria-label={t('focusPanel.removeRow')}
                  onClick={() => removeRow(item.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-fg-muted">{t('focusPanel.highlightLimit')}</span>
          <button
            type="button"
            className="primary-button"
            disabled={
              saveFocus.isPending ||
              items.filter((item) => {
                if (item.kind === 'custom') return (item as DraftItem).titleEn?.trim();
                return item.targetId?.trim();
              }).length === 0
            }
            onClick={save}
          >
            {saveFocus.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {t('focusPanel.save')}
          </button>
          {saveFocus.isError ? (
            <p role="alert" className="text-sm text-error">
              {t('focusPanel.error')}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
