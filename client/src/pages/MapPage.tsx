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
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';
import type { RoadmapKind } from '@shared/index';

import { RoadmapNode, type RoadmapFlowNode } from '../components/RoadmapNode';
import { roadmapProgress, roadmapStatus, roadmapSummary } from '../data/roadmaps';
import { useRoadmapGraph } from '../data/roadmapGraph';
import { techProfiles } from '../data/techCatalogue';
import { layoutRoadmaps } from '../lib/graphLayout';
import { KIND_ICON, canContain, childKindsFor } from '../lib/roadmapMeta';
import { localize } from '../lib/localize';
import { formatDate } from '../lib/format';
import { useTheme } from '../theme/theme-context';
import { KindBadge, StatusBadge } from '../components/RoadmapBadges';
import { Dialog } from '../components/Dialog';
import { useCreateRoadmap, useSession, useUpdateRoadmap } from '../data/queries';

const nodeTypes = { roadmap: RoadmapNode };

const MAP_INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

export default function MapPage() {
  usePageMeta({ titleKey: 'seo.map.title', descriptionKey: 'seo.map.description' });
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const lang: 'en' | 'ar' = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const { roadmaps, isLoading: graphLoading } = useRoadmapGraph();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  const openDetails = useCallback((id: string) => {
    setSelectedId(id);
    setOpenId(id);
  }, []);

  const selected = roadmaps.find((r) => r.id === selectedId) ?? null;
  const openSelected = roadmaps.find((r) => r.id === openId) ?? null;
  const addChildKinds = openSelected ? childKindsFor(openSelected.kind) : [];

  const canOwn = useCallback(
    (ownerId?: string) => {
      if (!session?.authenticated || !session.user) return false;
      return Boolean(ownerId) && ownerId === session.user.id;
    },
    [session],
  );

  const createRoadmap = useCreateRoadmap();
  const updateRoadmap = useUpdateRoadmap();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState({
    title: '',
    titleAr: '',
    description: '',
    kind: 'tech' as RoadmapKind,
    techId: '',
    topics: '',
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkChildId, setLinkChildId] = useState('');

  /** Owner “+”: select the parent and jump straight to the add-child dialog. */
  const openAddChild = useCallback(
    (id: string) => {
      const parent = roadmaps.find((roadmap) => roadmap.id === id);
      setSelectedId(id);
      setOpenId(id);
      setAddDraft({
        title: '',
        titleAr: '',
        description: '',
        kind: parent ? (childKindsFor(parent.kind)[0] ?? parent.kind) : 'tech',
        techId: '',
        topics: '',
      });
      setAddOpen(true);
      setLinkOpen(false);
    },
    [roadmaps],
  );

  const isDescendant = useCallback(
    (candidateId: string, ancestorId: string) => {
      const seen = new Set<string>();
      let cursor = roadmaps.find((roadmap) => roadmap.id === candidateId)?.parentId;
      while (cursor && !seen.has(cursor)) {
        if (cursor === ancestorId) return true;
        seen.add(cursor);
        cursor = roadmaps.find((roadmap) => roadmap.id === cursor)?.parentId;
      }
      return false;
    },
    [roadmaps],
  );

  const openCandidateId = openSelected?.id ?? null;
  const openCandidateKind = openSelected?.kind;
  const ownerCandidates =
    openCandidateId && openCandidateKind
      ? roadmaps.filter(
          (roadmap) =>
            roadmap.id !== openCandidateId &&
            canOwn(roadmap.ownerId) &&
            canContain(openCandidateKind, roadmap.kind) &&
            // Linking into your own descendant would create a cycle (the API rejects it too).
            !isDescendant(roadmap.id, openCandidateId),
        )
      : [];

  const nextChildOrder = useCallback(
    (parentId: string) => {
      const siblings = roadmaps.filter((roadmap) => roadmap.parentId === parentId);
      const maxOrder = siblings.reduce((max, roadmap) => Math.max(max, roadmap.order), -1);
      return maxOrder + 1;
    },
    [roadmaps],
  );

  function submitAddRoadmap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!openSelected || !addDraft.title.trim()) return;
    createRoadmap.mutate(
      {
        title: addDraft.titleAr.trim()
          ? { en: addDraft.title.trim(), ar: addDraft.titleAr.trim() }
          : { en: addDraft.title.trim() },
        description: addDraft.description.trim() ? { en: addDraft.description.trim() } : undefined,
        kind: addDraft.kind,
        visibility: 'private',
        parentId: openSelected.id,
        order: nextChildOrder(openSelected.id),
        ...(addDraft.kind === 'tech' && addDraft.techId ? { techId: addDraft.techId } : {}),
        topics: addDraft.topics
          .split(',')
          .map((topic) => topic.trim())
          .filter(Boolean),
      },
      {
        onSuccess: (created) => {
          setAddOpen(false);
          navigate(`/roadmaps/${created.id}`);
        },
      },
    );
  }

  function submitLinkRoadmap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!openSelected || !linkChildId) return;
    const child = roadmaps.find((roadmap) => roadmap.id === linkChildId);
    if (!child) return;
    updateRoadmap.mutate(
      {
        id: child.id,
        input: { parentId: openSelected.id, revision: child.revision ?? 0 },
      },
      {
        onSuccess: () => {
          setLinkOpen(false);
          setLinkChildId('');
        },
      },
    );
  }

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const positions = layoutRoadmaps(roadmaps);
    const nodes: RoadmapFlowNode[] = roadmaps.map((roadmap) => {
      const summary = roadmapSummary(roadmap);
      return {
        id: roadmap.id,
        type: 'roadmap',
        position: positions[roadmap.id] ?? { x: 0, y: 0 },
        data: {
          roadmap: summary,
          lang,
          kindLabel: t(`map.kind.${roadmap.kind}`),
          progressLabel: authenticated
            ? t('map.progress', { value: summary.progress })
            : t('map.steps', { value: summary.stepCount }),
          stepsLabel: t('map.steps', { value: summary.stepCount }),
          canAdd: Boolean(
            authenticated && roadmap.ownerId && roadmap.ownerId === session?.user?.id,
          ),
          addLabel: t('map.owner.addRoadmap'),
          onAddChild: openAddChild,
          detailsLabel: t('map.detail'),
          onOpenPanel: openDetails,
        },
      };
    });
    const edges: Edge[] = roadmaps
      .filter((r): r is typeof r & { parentId: string } => Boolean(r.parentId))
      .map((r) => ({
        id: `e-${r.parentId}-${r.id}`,
        source: r.parentId,
        target: r.id,
        type: 'smoothstep',
        animated: r.kind === 'pipeline',
      }));
    return { nodes, edges };
  }, [lang, t, authenticated, session, openAddChild, openDetails, roadmaps]);
  const [nodes, setNodes, onNodesChange] = useNodesState<RoadmapFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const closeDetails = useCallback(() => {
    setOpenId(null);
    setSelectedId(null);
    setNodes((currentNodes) =>
      currentNodes.map((node) => (node.selected ? { ...node, selected: false } : node)),
    );
  }, [setNodes]);

  useEffect(() => {
    if (!openId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDetails();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeDetails, openId]);

  useEffect(() => {
    if (!openId) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !detailRef.current?.contains(event.target)) {
        closeDetails();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [closeDetails, openId]);

  const selectedProgress = selected ? roadmapProgress(selected) : 0;
  const selectedChildren = selected
    ? roadmaps.filter((roadmap) => roadmap.parentId === selected.id)
    : [];
  const selectedParent = selected?.parentId
    ? roadmaps.find((roadmap) => roadmap.id === selected.parentId)
    : null;
  const isEmpty = roadmaps.length === 0;

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

      {graphLoading ? (
        <section className="surface-card map-empty" role="status">
          <p className="text-sm text-fg-muted">{t('map.loading')}</p>
        </section>
      ) : isEmpty ? (
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
            onNodeClick={(_, node) => {
              // Every node leads to its own roadmap; the small info button opens
              // the in-map panel, and the owner “+” adds a child inline.
              navigate(`/roadmaps/${node.id}`);
            }}
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
        className={`map-detail${openId ? ' is-open' : ''}`}
        aria-label={t('map.detail')}
        aria-hidden={!openId}
        inert={!openId}
      >
        {selected && openId ? (
          <div>
            {openSelected && canOwn(openSelected.ownerId) ? (
              <section className="map-detail__owner" aria-label={t('map.owner.actions')}>
                <div className="map-detail__owner-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setAddDraft({
                        title: '',
                        titleAr: '',
                        description: '',
                        kind: childKindsFor(openSelected.kind)[0] ?? openSelected.kind,
                        techId: '',
                        topics: '',
                      });
                      setAddOpen(true);
                      setLinkOpen(false);
                    }}
                  >
                    {t('map.owner.addRoadmap')}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setLinkOpen(true);
                      setAddOpen(false);
                    }}
                  >
                    {t('map.owner.linkRoadmap')}
                  </button>
                </div>
                <Dialog
                  open={addOpen}
                  onClose={() => setAddOpen(false)}
                  titleKey="map.owner.addRoadmap"
                >
                  <form onSubmit={submitAddRoadmap} className="map-detail__owner-form grid gap-3">
                    <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                      {t('map.owner.addTitleEn')}
                      <input
                        name="map-roadmap-title-en"
                        required
                        maxLength={300}
                        value={addDraft.title}
                        onChange={(event) =>
                          setAddDraft({ ...addDraft, title: event.target.value })
                        }
                        className={MAP_INPUT_CLASS}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                      {t('map.owner.addTitleAr')}
                      <input
                        name="map-roadmap-title-ar"
                        dir="rtl"
                        maxLength={300}
                        value={addDraft.titleAr}
                        onChange={(event) =>
                          setAddDraft({ ...addDraft, titleAr: event.target.value })
                        }
                        className={MAP_INPUT_CLASS}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                      {t('map.owner.addDescription')}
                      <textarea
                        name="map-roadmap-description"
                        rows={3}
                        maxLength={1000}
                        value={addDraft.description}
                        onChange={(event) =>
                          setAddDraft({ ...addDraft, description: event.target.value })
                        }
                        className={MAP_INPUT_CLASS}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                      {t('map.owner.addKind')}
                      <select
                        name="map-roadmap-kind"
                        value={addDraft.kind}
                        disabled={addChildKinds.length <= 1}
                        onChange={(event) =>
                          setAddDraft({ ...addDraft, kind: event.target.value as RoadmapKind })
                        }
                        className={MAP_INPUT_CLASS}
                      >
                        {addChildKinds.map((kind) => (
                          <option key={kind} value={kind}>
                            {t(`roadmaps.kind.${kind}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {addDraft.kind === 'tech' ? (
                      <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                        {t('map.owner.addTech')}
                        <select
                          name="map-roadmap-tech"
                          value={addDraft.techId}
                          onChange={(event) =>
                            setAddDraft({ ...addDraft, techId: event.target.value })
                          }
                          className={MAP_INPUT_CLASS}
                        >
                          <option value="">{t('workspace.form.techNone')}</option>
                          {techProfiles.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {localize(tech.name, lang)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                      {t('map.owner.addTopics')}
                      <input
                        name="map-roadmap-topics"
                        value={addDraft.topics}
                        onChange={(event) =>
                          setAddDraft({ ...addDraft, topics: event.target.value })
                        }
                        className={MAP_INPUT_CLASS}
                        placeholder={t('workspace.form.topicsHint')}
                      />
                    </label>
                    {createRoadmap.isError ? (
                      <p role="alert" className="text-sm text-error">
                        {t('workspace.createError')}
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={createRoadmap.isPending || !addDraft.title.trim()}
                        className="primary-button"
                      >
                        {createRoadmap.isPending
                          ? t('workspace.form.creating')
                          : t('workspace.form.create')}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setAddOpen(false)}
                      >
                        {t('workspace.form.cancel')}
                      </button>
                    </div>
                  </form>
                </Dialog>
                <Dialog
                  open={linkOpen}
                  onClose={() => {
                    setLinkOpen(false);
                    setLinkChildId('');
                  }}
                  titleKey="map.owner.linkRoadmap"
                >
                  <form onSubmit={submitLinkRoadmap} className="map-detail__owner-form grid gap-3">
                    <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                      {t('map.owner.linkExisting')}
                      <select
                        name="map-roadmap-parent"
                        value={linkChildId}
                        onChange={(event) => setLinkChildId(event.target.value)}
                        className={MAP_INPUT_CLASS}
                      >
                        <option value="">{t('map.owner.chooseExisting')}</option>
                        {ownerCandidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {localize(candidate.title, lang)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {updateRoadmap.isError ? (
                      <p role="alert" className="text-sm text-error">
                        {t('workspace.detail.updateError')}
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateRoadmap.isPending || !linkChildId}
                        className="primary-button"
                      >
                        {t('map.owner.linkSubmit')}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setLinkOpen(false);
                          setLinkChildId('');
                        }}
                      >
                        {t('workspace.form.cancel')}
                      </button>
                    </div>
                  </form>
                </Dialog>
              </section>
            ) : null}
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
            {authenticated && (
              <div className="map-detail__bar" aria-hidden="true">
                <span style={{ width: `${selectedProgress}%` }} />
              </div>
            )}
            <p className="map-detail__meta">
              {authenticated ? `${t('map.progress', { value: selectedProgress })} · ` : ''}
              {t('map.steps', { value: selected.steps.length })}
            </p>
            <div className="map-detail__stats">
              {authenticated && (
                <div>
                  <strong>{selected.steps.filter((step) => step.done).length}</strong>
                  <span>{t('map.completedSteps')}</span>
                </div>
              )}
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
        ) : null}
      </aside>
    </div>
  );
}
