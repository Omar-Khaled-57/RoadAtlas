import { useState } from 'react';
import { Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LocalizedString, WeeklyFocusItem } from '@shared/index';
import { useFocus, useSetFocus, useSession } from '../data/queries';
import { localize } from '../lib/localize';

const STARTER_KEYS = [
  ['weekly-nasa', 'home.demands.nasa'],
  ['weekly-graduation', 'home.demands.graduation'],
  ['weekly-mockup', 'home.demands.mockup'],
  ['weekly-side-projects', 'home.demands.sideProjects'],
  ['weekly-project-updates', 'home.demands.projectsUpdates'],
] as const;

function starterItems(getEnglish: (key: string) => string, getArabic: (key: string) => string) {
  return STARTER_KEYS.map(([id, key], index) => ({
    id,
    title: { en: getEnglish(key), ar: getArabic(key) },
    highlighted: index === 0,
  }));
}

export function WeeklyFocusBoard() {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const focus = useFocus(authenticated);
  const saveFocus = useSetFocus();
  const savedItems = focus.data?.weeklyFocus;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LocalizedString>({ en: '', ar: '' });
  const items = savedItems ?? starterItems(i18n.getFixedT('en'), i18n.getFixedT('ar'));
  const editingItem = items.find((item) => item.id === editingId);

  function edit(item?: WeeklyFocusItem) {
    setEditingId(item?.id ?? '');
    setDraft(item ? { en: item.title.en, ar: item.title.ar ?? '' } : { en: '', ar: '' });
  }

  function closeEditor() {
    setEditingId(null);
    setDraft({ en: '', ar: '' });
  }

  function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title: LocalizedString = {
      en: draft.en.trim(),
      ...(draft.ar?.trim() ? { ar: draft.ar.trim() } : {}),
    };
    const next = editingItem
      ? items.map((item) => (item.id === editingItem.id ? { ...item, title } : item))
      : [
          ...items,
          {
            id: crypto.randomUUID(),
            title,
            highlighted: items.length === 0,
          },
        ];
    saveFocus.mutate({ weeklyFocus: next }, { onSuccess: closeEditor });
  }

  function toggleHighlight(item: WeeklyFocusItem) {
    const highlightCount = items.filter((entry) => entry.highlighted).length;
    if (
      (!item.highlighted && highlightCount >= 2) ||
      (item.highlighted && highlightCount === 1 && items.length > 0)
    ) {
      return;
    }
    saveFocus.mutate({
      weeklyFocus: items.map((entry) =>
        entry.id === item.id ? { ...entry, highlighted: !entry.highlighted } : entry,
      ),
    });
  }

  function remove(item: WeeklyFocusItem) {
    const next = items.filter((entry) => entry.id !== item.id);
    if (next.length && !next.some((entry) => entry.highlighted)) {
      next[0] = { ...next[0], highlighted: true };
    }
    saveFocus.mutate({ weeklyFocus: next });
  }

  return (
    <article className="surface-card p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="section-eyebrow">{t('home.activity')}</p>
          <h2 className="mt-1 text-xl font-bold">{t('home.weeklyFocus')}</h2>
        </div>
        <div className="flex items-center gap-2">
          {authenticated ? (
            <button
              type="button"
              className="secondary-button !min-h-8 !px-2"
              aria-label={t('home.weeklyFocusAdd')}
              onClick={() => edit()}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
          <span className="rounded-lg bg-surface-active px-2.5 py-1 text-xs text-fg-muted">
            {t('home.currentFocus') || t('home.thisWeek')}
          </span>
        </div>
      </div>

      {items.length ? (
        <div
          className={`weekly-focus-chart flex items-end justify-between gap-3 ${authenticated ? 'mt-7 h-40' : 'mt-4 h-44'} ${items.length > 5 ? 'weekly-focus-chart--scroll' : ''}`}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex h-full min-w-[3.5rem] flex-1 flex-col items-center justify-end ${authenticated ? 'gap-1' : 'gap-3'}`}
            >
              {authenticated ? (
                <div className="flex h-7 items-center justify-center gap-0.5">
                  <button
                    type="button"
                    className={`secondary-button !min-h-[1.375rem] !w-[1.375rem] !px-0 !py-0 ${item.highlighted ? 'text-primary' : ''}`}
                    aria-label={`${t(item.highlighted ? 'home.weeklyFocusUnhighlight' : 'home.weeklyFocusHighlight')} ${localize(item.title, i18n.language)}`}
                    aria-pressed={item.highlighted}
                    disabled={
                      saveFocus.isPending ||
                      (!item.highlighted &&
                        items.filter((entry) => entry.highlighted).length >= 2) ||
                      (item.highlighted &&
                        items.filter((entry) => entry.highlighted).length === 1 &&
                        items.length > 0)
                    }
                    onClick={() => toggleHighlight(item)}
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="secondary-button !min-h-[1.375rem] !w-[1.375rem] !px-0 !py-0"
                    aria-label={`${t('common.edit')} ${localize(item.title, i18n.language)}`}
                    onClick={() => edit(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="secondary-button !min-h-[1.375rem] !w-[1.375rem] !px-0 !py-0"
                    aria-label={`${t('common.delete')} ${localize(item.title, i18n.language)}`}
                    disabled={saveFocus.isPending}
                    onClick={() => remove(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
              <div className="flex min-h-0 w-full flex-1 items-end justify-center">
                <div
                  className={`activity-bar weekly-focus-bar ${!authenticated ? 'weekly-focus-bar--visitor' : ''} ${item.highlighted ? 'activity-today activity-bar--focus-highlight' : ''}`}
                  style={{
                    height: item.highlighted
                      ? authenticated
                        ? '88%'
                        : '94%'
                      : authenticated
                        ? '66%'
                        : '74%',
                  }}
                  aria-hidden="true"
                />
              </div>
              {authenticated ? (
                <button
                  type="button"
                  className="weekly-focus-label h-9 w-full overflow-hidden text-center text-[10px] font-medium leading-[1.15] text-fg-muted line-clamp-2 hover:text-fg-primary"
                  aria-label={`${t('common.edit')} ${localize(item.title, i18n.language)}`}
                  title={localize(item.title, i18n.language)}
                  onClick={() => edit(item)}
                >
                  {localize(item.title, i18n.language)}
                </button>
              ) : (
                <span
                  className="weekly-focus-label h-9 w-full overflow-hidden text-center text-[10px] font-medium leading-[1.15] text-fg-muted line-clamp-2"
                  title={localize(item.title, i18n.language)}
                >
                  {localize(item.title, i18n.language)}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-fg-muted">{t('home.weeklyFocusEmpty')}</p>
      )}

      {authenticated ? (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <span className="text-sm text-fg-muted">{t('home.weeklyFocusCount')}</span>
          <strong className="text-lg">{items.length}</strong>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
          <span className="text-sm text-fg-muted">{t('home.weeklyFocusCount')}</span>
          <strong className="text-lg">{items.length}</strong>
        </div>
      )}
      {saveFocus.isError ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {t('home.weeklyFocusSaveError')}
        </p>
      ) : null}

      {editingId !== null ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="weekly-focus-editor-title"
            className="surface-card w-full max-w-lg space-y-4 p-5 sm:p-6"
            onSubmit={saveItem}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="weekly-focus-editor-title" className="text-lg font-bold">
                {t(editingItem ? 'home.weeklyFocusEdit' : 'home.weeklyFocusAdd')}
              </h2>
              <button
                type="button"
                className="secondary-button !px-2"
                aria-label={t('common.close')}
                onClick={closeEditor}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('home.weeklyFocusTitleEn')}
              <input
                name="weekly-focus-title-en"
                autoFocus
                required
                maxLength={120}
                value={draft.en}
                onChange={(event) => setDraft({ ...draft, en: event.target.value })}
                className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2.5 text-start text-sm text-fg-primary outline-none focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('home.weeklyFocusTitleAr')}
              <input
                name="weekly-focus-title-ar"
                dir="rtl"
                maxLength={120}
                value={draft.ar ?? ''}
                onChange={(event) => setDraft({ ...draft, ar: event.target.value })}
                className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2.5 text-start text-sm text-fg-primary outline-none focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="secondary-button" onClick={closeEditor}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary-button" disabled={saveFocus.isPending}>
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </article>
  );
}
