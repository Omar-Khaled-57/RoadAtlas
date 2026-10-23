import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
} from '@xyflow/react';
import { Minimize2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { RoadmapNode, type RoadmapFlowNode } from '../components/RoadmapNode';
import { seedRoadmaps, roadmapProgress, roadmapStatus, roadmapSummary } from '../data/roadmaps';
import { layoutRoadmaps } from '../lib/graphLayout';
import { KIND_ICON } from '../lib/roadmapMeta';
import { localize } from '../lib/localize';
import { formatDate } from '../lib/format';
import { useTheme } from '../theme/theme-context';
import { KindBadge, StatusBadge } from '../components/RoadmapBadges';

const nodeTypes = { roadmap: RoadmapNode };

export default function MapPage() {
  usePageMeta({ titleKey: 'seo.map.title', descriptionKey: 'seo.map.description' });
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const lang: 'en' | 'ar' = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const positions = layoutRoadmaps(seedRoadmaps);
    const nodes: RoadmapFlowNode[] = seedRoadmaps.map((roadmap) => {
      const summary = roadmapSummary(roadmap);
      return {
        id: roadmap.id,
        type: 'roadmap',
        position: positions[roadmap.id] ?? { x: 0, y: 0 },
        data: {
          roadmap: summary,
          lang,
          kindLabel: t(`map.kind.${roadmap.kind}`),
          progressLabel: t('map.progress', { value: summary.progress }),
          stepsLabel: t('map.steps', { value: summary.stepCount }),
        },
      };
    });
    const edges: Edge[] = seedRoadmaps
      .filter((r) => r.parentId)
      .map((r) => ({
        id: `e-${r.parentId}-${r.id}`,
        source: r.parentId as string,
        target: r.id,
        type: 'smoothstep',
        animated: r.kind === 'pipeline',
      }));
    return { nodes, edges };
  }, [lang, t]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RoadmapFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  const closeDetails = useCallback(() => {
    setSelectedId(null);
    setNodes((currentNodes) =>
      currentNodes.map((node) => (node.selected ? { ...node, selected: false } : node)),
    );
  }, [setNodes]);
  const selected = seedRoadmaps.find((r) => r.id === selectedId) ?? null;
  const selectedProgress = selected ? roadmapProgress(selected) : 0;
  const selectedChildren = selected
    ? seedRoadmaps.filter((roadmap) => roadmap.parentId === selected.id)
    : [];
  const selectedParent = selected?.parentId
    ? seedRoadmaps.find((roadmap) => roadmap.id === selected.parentId)
    : null;
  const isEmpty = seedRoadmaps.length === 0;

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDetails();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeDetails, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !detailRef.current?.contains(event.target)) {
        closeDetails();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [closeDetails, selectedId]);

  return (
    <div className="map-page page-enter">
      <header className="map-page__header">
        <div>
          <p className="section-eyebrow">{t('map.eyebrow')}</p>
          <h1 className="map-page__title">{t('map.title')}</h1>
          <p className="map-page__subtitle">{t('map.subtitle')}</p>
        </div>
        <ul className="map-legend" aria-label={t('map.legend')}>
          {(['hub', 'tech', 'pipeline'] as const).map((kind) => {
            const Icon = KIND_ICON[kind];
            return (
              <li key={kind} className={`map-legend__item map-legend__item--${kind}`}>
                <span className="map-legend__dot" aria-hidden="true" />
                <Icon aria-hidden="true" />
                {t(`map.kind.${kind}`)}
              </li>
            );
          })}
        </ul>
      </header>

      {isEmpty ? (
        <section className="surface-card map-empty">
          <h2 className="text-xl font-bold">{t('map.empty.title')}</h2>
          <p className="mt-2 text-sm text-fg-muted">{t('map.empty.body')}</p>
          <Link to="/roadmaps" className="primary-button mt-5">
            {t('map.empty.cta')}
          </Link>
        </section>
      ) : (
        <div className="map-canvas surface-card">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            colorMode={theme === 'light' ? 'light' : 'dark'}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.25}
            maxZoom={1.75}
            nodesConnectable={false}
            nodesFocusable
            ariaLabelConfig={{
              'controls.ariaLabel': t('map.controls.label'),
              'controls.zoomIn.ariaLabel': t('map.controls.zoomIn'),
              'controls.zoomOut.ariaLabel': t('map.controls.zoomOut'),
              'controls.fitView.ariaLabel': t('map.controls.fitView'),
            }}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={closeDetails}
            onSelectionChange={({ nodes: selectedNodes }) =>
              setSelectedId(selectedNodes[0]?.id ?? null)
            }
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeStrokeWidth={3} ariaLabel={t('map.minimap')} />
          </ReactFlow>
        </div>
      )}

      <aside
        ref={detailRef}
        className={`map-detail${selected ? ' is-open' : ''}`}
        aria-label={t('map.detail')}
        aria-hidden={!selected}
        inert={!selected}
      >
        {selected && (
          <div>
            <div className="map-detail__head">
              <KindBadge kind={selected.kind} />
              <button
                type="button"
                className="map-detail__close"
                onClick={closeDetails}
                aria-label={t('map.close')}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <h2 className="map-detail__title">{localize(selected.title, lang)}</h2>
            <div className="map-detail__status">
              <StatusBadge status={roadmapStatus(selected)} />
            </div>
            <p className="map-detail__desc">
              {localize(selected.description ?? selected.title, lang)}
            </p>
            <div className="map-detail__bar" aria-hidden="true">
              <span style={{ width: `${selectedProgress}%` }} />
            </div>
            <p className="map-detail__meta">
              {t('map.progress', { value: selectedProgress })} ·{' '}
              {t('map.steps', { value: selected.steps.length })}
            </p>
            <div className="map-detail__stats">
              <div>
                <strong>{selected.steps.filter((step) => step.done).length}</strong>
                <span>{t('map.completedSteps')}</span>
              </div>
              <div>
                <strong>{selectedChildren.length}</strong>
                <span>{t('map.childRoadmaps')}</span>
              </div>
            </div>
            {selectedParent && (
              <div className="map-detail__section">
                <p className="map-detail__label">{t('map.parentRoadmap')}</p>
                <Link className="map-detail__related" to={`/roadmaps/${selectedParent.id}`}>
                  {localize(selectedParent.title, lang)}
                </Link>
              </div>
            )}
            {selectedChildren.length > 0 && (
              <div className="map-detail__section">
                <p className="map-detail__label">{t('map.childRoadmaps')}</p>
                <ul className="map-detail__list">
                  {selectedChildren.map((roadmap) => (
                    <li key={roadmap.id}>
                      <Link className="map-detail__related" to={`/roadmaps/${roadmap.id}`}>
                        {localize(roadmap.title, lang)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.topics.length > 0 && (
              <div className="map-detail__section">
                <p className="map-detail__label">{t('map.topics')}</p>
                <div className="map-detail__topics">
                  {selected.topics.map((topic, index) => (
                    <span key={`${selected.id}-topic-${index}`}>{localize(topic, lang)}</span>
                  ))}
                </div>
              </div>
            )}
            <p className="map-detail__updated">
              {t('roadmaps.updated', { date: formatDate(selected.updatedAt, lang) })}
            </p>
            <Link to={`/roadmaps/${selected.id}`} className="secondary-button mt-4">
              <Minimize2 aria-hidden="true" className="h-4 w-4" />
              {t('map.open')}
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
