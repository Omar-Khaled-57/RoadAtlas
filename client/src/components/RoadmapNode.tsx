import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { RoadmapSummary } from '../data/roadmaps';
import { localize } from '../lib/localize';
import { KIND_ICON } from '../lib/roadmapMeta';

export type RoadmapNodeData = {
  roadmap: RoadmapSummary;
  lang: 'en' | 'ar';
  kindLabel: string;
  progressLabel: string;
  stepsLabel: string;
};

export type RoadmapFlowNode = Node<RoadmapNodeData, 'roadmap'>;

export function RoadmapNode({ data, selected }: NodeProps<RoadmapFlowNode>) {
  const { roadmap, lang, kindLabel, progressLabel, stepsLabel } = data;
  const title = localize(roadmap.title, lang);
  const Icon = KIND_ICON[roadmap.kind];

  return (
    <div
      className={`roadmap-node roadmap-node--${roadmap.kind}${selected ? ' is-selected' : ''}`}
      title={`${title} — ${roadmap.progress}%`}
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
      </div>
      <div className="roadmap-node__progress" aria-hidden="true">
        <span style={{ width: `${roadmap.progress}%` }} />
      </div>
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
