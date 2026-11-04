import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Info, Plus } from 'lucide-react';
import type { RoadmapSummary } from '../data/roadmaps';
import { localize } from '../lib/localize';
import { KIND_ICON } from '../lib/roadmapMeta';
import type { ID } from '@shared/index';

export type RoadmapNodeData = {
  roadmap: RoadmapSummary;
  lang: 'en' | 'ar';
  kindLabel: string;
  progressLabel: string;
  stepsLabel: string;
  /** Owner-only: mount the “add child roadmap” affordance on the node. */
  canAdd?: boolean;
  addLabel?: string;
  onAddChild?: (id: ID) => void;
  /** Open the in-map detail panel without leaving the map. */
  detailsLabel?: string;
  onOpenPanel?: (id: ID) => void;
};

export type RoadmapFlowNode = Node<RoadmapNodeData, 'roadmap'>;

export function RoadmapNode({ data, selected }: NodeProps<RoadmapFlowNode>) {
  const {
    roadmap,
    lang,
    kindLabel,
    progressLabel,
    stepsLabel,
    canAdd,
    addLabel,
    onAddChild,
    detailsLabel,
    onOpenPanel,
  } = data;
  const title = localize(roadmap.title, lang);
  const Icon = KIND_ICON[roadmap.kind];

  return (
    <div
      className={`roadmap-node roadmap-node--${roadmap.kind}${selected ? ' is-selected' : ''}`}
      title={progressLabel.includes('%') ? `${title} — ${roadmap.progress}%` : title}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="roadmap-node__handle"
        isConnectable={false}
      />
      <div className="roadmap-node__head">
        <span className="roadmap-node__icon">
          <Icon aria-hidden="true" />
        </span>
        <div className="roadmap-node__meta">
          <span className="roadmap-node__kind">{kindLabel}</span>
          <span className="roadmap-node__title">{title}</span>
        </div>
        {onOpenPanel || (canAdd && onAddChild) ? (
          <div className="roadmap-node__actions">
            {onOpenPanel ? (
              <button
                type="button"
                className="roadmap-node__add"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenPanel(roadmap.id);
                }}
                aria-label={detailsLabel}
              >
                <Info aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {canAdd && onAddChild ? (
              <button
                type="button"
                className="roadmap-node__add"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddChild(roadmap.id);
                }}
                aria-label={addLabel}
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {progressLabel.includes('%') ? (
        <div className="roadmap-node__progress" aria-hidden="true">
          <span style={{ width: `${roadmap.progress}%` }} />
        </div>
      ) : (
        <div className="roadmap-node__progress" aria-hidden="true" />
      )}
      <div className="roadmap-node__foot">
        <span>{progressLabel}</span>
        <span>{stepsLabel}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="roadmap-node__handle"
        isConnectable={false}
      />
    </div>
  );
}
