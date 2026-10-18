import { useTranslation } from 'react-i18next';
import type { RoadmapKind } from '@shared/index';
import type { RoadmapStatus } from '../data/roadmaps';

export function KindBadge({ kind }: { kind: RoadmapKind }) {
  const { t } = useTranslation();
  return (
    <span className={`kind-badge kind-badge--${kind}`}>
      <span className="kind-badge__dot" aria-hidden="true" />
      {t(`roadmaps.kind.${kind}`)}
    </span>
  );
}

export function StatusBadge({ status }: { status: RoadmapStatus }) {
  const { t } = useTranslation();
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {t(`roadmaps.status.${status}`)}
    </span>
  );
}
