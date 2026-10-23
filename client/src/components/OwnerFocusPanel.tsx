import { useState } from 'react';
import { Compass, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { seedTechProfiles } from '../data/comparisons';
import { useFocusView } from '../data/focus';
import { useOwnerRoadmaps, useSetFocus, useSession } from '../data/queries';
import { localize } from '../lib/localize';

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

/**
 * The owner's focus controls: what they are working on right now. The record is
 * stored per owner on the server, so it survives a device change.
 */
export function OwnerFocusPanel() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const view = useFocusView();
  const roadmaps = useOwnerRoadmaps(authenticated);
  const saveFocus = useSetFocus();

  // The selection starts from the stored focus and only diverges once the owner edits it.
  const [selection, setSelection] = useState<{ techId: string; projectId: string } | null>(null);
  const techId = selection?.techId ?? view.currentTechId ?? '';
  const projectId = selection?.projectId ?? view.currentProjectId ?? '';

  if (!authenticated) return null;

  const items = roadmaps.data ?? [];

  function save() {
    saveFocus.mutate(
      {
        currentTechId: techId || null,
        currentProjectId: projectId || null,
      },
      { onSuccess: () => setSelection(null) },
    );
  }

  return (
    <section className="surface-card space-y-4 p-5 sm:p-6" aria-labelledby="owner-focus-title">
      <div className="flex items-center gap-3">
        <span className="icon-tile bg-accent-soft text-accent">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="owner-focus-title" className="text-lg font-bold">
            {t('focusPanel.title')}
          </h2>
          <p className="text-sm text-fg-muted">{t('focusPanel.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="focus-tech" className="text-sm font-semibold text-fg-secondary">
            {t('focusPanel.currentTech')}
          </label>
          <select
            id="focus-tech"
            value={techId}
            onChange={(event) => setSelection({ techId: event.target.value, projectId })}
            className={INPUT_CLASS}
          >
            <option value="">{t('focusPanel.none')}</option>
            {seedTechProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {localize(profile.name, lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="focus-project" className="text-sm font-semibold text-fg-secondary">
            {t('focusPanel.currentProject')}
          </label>
          <select
            id="focus-project"
            value={projectId}
            onChange={(event) => setSelection({ techId, projectId: event.target.value })}
            className={INPUT_CLASS}
          >
            <option value="">{t('focusPanel.none')}</option>
            {items.map((roadmap) => (
              <option key={roadmap.id} value={roadmap.id}>
                {localize(roadmap.title, lang)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="primary-button"
          disabled={saveFocus.isPending}
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
  );
}
