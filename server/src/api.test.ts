import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { createSessionToken, SESSION_COOKIE } from './middleware/auth';
import { UserModel } from './models/index';

const app = createApp();
const ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

/** A request that behaves like the browser app: same origin, session cookie attached. */
function call(
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  options: { token?: string; origin?: string } = {},
) {
  const req = request(app);
  const bound = req[method](path).set('Origin', options.origin ?? ORIGIN);
  return options.token ? bound.set('Cookie', `${SESSION_COOKIE}=${options.token}`) : bound;
}

async function createUser(email: string): Promise<{ id: string; email: string; token: string }> {
  const passwordHash = await import('bcryptjs').then((bcrypt) =>
    bcrypt.default.hash('second-account-password', 10),
  );
  const user = await UserModel.create({ email, passwordHash });
  const session = { id: String(user._id), email: user.email };
  return { ...session, token: createSessionToken(session) };
}

let owner: { id: string; email: string; token: string };
let other: { id: string; email: string; token: string };

beforeAll(async () => {
  owner = await createUser('owner@example.com');
  other = await createUser('other@example.com');
});

beforeEach(async () => {
  const models = await import('./models/index');
  await Promise.all([
    models.RoadmapModel.deleteMany({}),
    models.StepModel.deleteMany({}),
    models.ProgressModel.deleteMany({}),
    models.NoteModel.deleteMany({}),
    models.MetricModel.deleteMany({}),
    models.ComparisonModel.deleteMany({}),
    models.DecisionModel.deleteMany({}),
    models.FocusModel.deleteMany({}),
  ]);
});

describe('roadmap ownership', () => {
  it('rejects an unauthenticated create', async () => {
    const res = await call('post', '/api/roadmaps').send({
      kind: 'tech',
      title: { en: 'Private roadmap' },
    });

    expect(res.status).toBe(401);
  });

  it('rejects a mutation from another origin', async () => {
    const res = await call('post', '/api/roadmaps', { origin: 'https://evil.example' }).send({
      kind: 'tech',
      title: { en: 'Cross-site write' },
    });

    expect(res.status).toBe(403);
  });

  it('creates a roadmap privately by default and hides it from anonymous reads', async () => {
    const created = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Electron', ar: 'إلكترون' },
    });

    expect(created.status).toBe(201);
    expect(created.body.visibility).toBe('private');
    expect(created.body.title.en).toBe('Electron');
    expect(created.body.title.ar).toBe('إلكترون');
    expect(created.body.ownerId).toBe(owner.id);

    const anonymous = await call('get', '/api/roadmaps');
    expect(anonymous.status).toBe(200);
    expect(anonymous.body.items).toHaveLength(0);

    const direct = await call('get', `/api/roadmaps/${created.body.id}`);
    expect(direct.status).toBe(404);
  });

  it('lists the owner records for the owner only', async () => {
    await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'hub',
      title: { en: 'Journey' },
    });

    const mine = await call('get', '/api/roadmaps?scope=owner', { token: owner.token });
    expect(mine.status).toBe(200);
    expect(mine.body.items).toHaveLength(1);

    const theirs = await call('get', '/api/roadmaps?scope=owner', { token: other.token });
    expect(theirs.status).toBe(200);
    expect(theirs.body.items).toHaveLength(0);

    const anonymousScope = await call('get', '/api/roadmaps?scope=owner');
    expect(anonymousScope.status).toBe(401);
  });

  it('lets another account neither read nor change a private record', async () => {
    const created = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Private' },
    });
    const id = created.body.id as string;

    const read = await call('get', `/api/roadmaps/${id}`, { token: other.token });
    expect(read.status).toBe(404);

    const update = await call('patch', `/api/roadmaps/${id}`, { token: other.token }).send({
      title: { en: 'Hijacked' },
    });
    expect(update.status).toBe(404);

    const remove = await call('delete', `/api/roadmaps/${id}`, { token: other.token });
    expect(remove.status).toBe(404);

    const stillThere = await call('get', `/api/roadmaps/${id}`, { token: owner.token });
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.title.en).toBe('Private');
  });

  it('publishes a roadmap and serves it to anonymous readers', async () => {
    const created = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Public' },
    });

    const published = await call('patch', `/api/roadmaps/${created.body.id}`, {
      token: owner.token,
    }).send({ visibility: 'public' });
    expect(published.status).toBe(200);
    expect(published.body.visibility).toBe('public');

    const anonymous = await call('get', '/api/roadmaps');
    expect(anonymous.body.items).toHaveLength(1);
    expect(anonymous.body.items[0].title.en).toBe('Public');
  });

  it('deletes a roadmap with its steps', async () => {
    const created = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Doomed' },
      steps: [{ title: { en: 'Step one' } }],
    });

    const steps = await call('get', `/api/roadmaps/${created.body.id}/steps`, {
      token: owner.token,
    });
    expect(steps.body.items).toHaveLength(1);

    const removed = await call('delete', `/api/roadmaps/${created.body.id}`, {
      token: owner.token,
    });
    expect(removed.status).toBe(204);

    const gone = await call('get', `/api/roadmaps/${created.body.id}`, { token: owner.token });
    expect(gone.status).toBe(404);
  });
});

describe('validation at the API boundary', () => {
  it('rejects an unknown field instead of writing it', async () => {
    const res = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Mass assignment' },
      ownerId: other.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed.');
    expect(JSON.stringify(res.body.details)).toContain('ownerId');
  });

  it('rejects a missing title and an invalid kind', async () => {
    const missing = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
    });
    expect(missing.status).toBe(400);

    const invalid = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'not-a-kind',
      title: { en: 'x' },
    });
    expect(invalid.status).toBe(400);
  });

  it('rejects a malformed identifier', async () => {
    const res = await call('get', '/api/roadmaps/not-an-id', { token: owner.token });
    expect(res.status).toBe(400);
  });
});

describe('steps and progress', () => {
  it('stores steps and progress for the owner only', async () => {
    const created = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Trackable' },
    });
    const roadmapId = created.body.id as string;

    const step = await call('post', `/api/roadmaps/${roadmapId}/steps`, {
      token: owner.token,
    }).send({ title: { en: 'Learn the basics' }, stage: 'build' });
    expect(step.status).toBe(201);
    expect(step.body.stage).toBe('build');

    const otherStep = await call('post', `/api/roadmaps/${roadmapId}/steps`, {
      token: other.token,
    }).send({ title: { en: 'Not mine' } });
    expect(otherStep.status).toBe(404);

    const progress = await call('put', `/api/steps/${step.body.id}/progress`, {
      token: owner.token,
    }).send({ done: true });
    expect(progress.status).toBe(200);
    expect(progress.body.done).toBe(true);
    expect(typeof progress.body.completedAt).toBe('string');

    const read = await call('get', `/api/roadmaps/${roadmapId}/progress`, { token: owner.token });
    expect(read.body.items).toHaveLength(1);
    expect(read.body.items[0].done).toBe(true);

    const foreignProgress = await call('put', `/api/steps/${step.body.id}/progress`, {
      token: other.token,
    }).send({ done: false });
    expect(foreignProgress.status).toBe(404);
  });
});

describe('knowledge content', () => {
  it('stores comparisons, metrics, notes and decisions', async () => {
    const comparison = await call('post', '/api/comparisons', { token: owner.token }).send({
      title: { en: 'RN vs KMP' },
      candidateTechIds: ['react-native', 'kmp'],
      criteria: [
        {
          id: 'learning-curve',
          name: { en: 'Learning curve' },
          weight: 0.6,
          scores: { 'react-native': { value: 4, note: { en: 'JS only' } }, kmp: { value: 3 } },
        },
      ],
      conclusion: { en: 'React Native for this project' },
    });
    expect(comparison.status).toBe(201);
    expect(comparison.body.criteria[0].scores['react-native'].value).toBe(4);

    const metric = await call('post', '/api/metrics', { token: owner.token }).send({
      techId: 'react-native',
      key: 'learning-curve',
      axis: { key: 'weeks', label: { en: 'Weeks' }, unit: 'w' },
      points: [
        { x: 1, y: 2 },
        { x: 4, y: 8 },
      ],
      finding: { en: 'Gets steep after the basics' },
    });
    expect(metric.status).toBe(201);
    expect(metric.body.points).toHaveLength(2);

    const note = await call('post', '/api/notes', { token: owner.token }).send({
      targetType: 'tech',
      targetId: 'react-native',
      title: { en: 'Bridge caveats' },
      content: { en: 'The bridge is slow on lists.' },
      tags: ['performance'],
    });
    expect(note.status).toBe(201);
    expect(note.body.tags).toEqual(['performance']);

    const notes = await call('get', '/api/notes?scope=owner&targetType=tech', {
      token: owner.token,
    });
    expect(notes.body.items).toHaveLength(1);

    const decision = await call('post', '/api/decisions', { token: owner.token }).send({
      context: { en: 'Choosing the mobile stack' },
      alternatives: [{ en: 'KMP' }],
      decision: { en: 'React Native' },
      consequences: { en: 'One language across the stack' },
      revisitAt: '2027-01-01T00:00:00.000Z',
    });
    expect(decision.status).toBe(201);
    expect(decision.body.revisitAt).toBe('2027-01-01T00:00:00.000Z');
  });

  it('keeps private notes out of public reads', async () => {
    await call('post', '/api/notes', { token: owner.token }).send({
      targetType: 'tech',
      targetId: 'flutter',
      title: { en: 'Private note' },
      content: { en: 'Only mine' },
    });

    const anonymous = await call('get', '/api/notes');
    expect(anonymous.body.items).toHaveLength(0);

    const mine = await call('get', '/api/notes?scope=owner', { token: owner.token });
    expect(mine.body.items).toHaveLength(1);
  });
});

describe('focus', () => {
  it('stores the owner focus as a singleton', async () => {
    const roadmap = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Focus target' },
    });

    const saved = await call('put', '/api/focus', { token: owner.token }).send({
      currentTechId: 'flutter',
      lastVisited: { roadmapId: roadmap.body.id, at: '2026-02-02T10:00:00.000Z' },
    });
    expect(saved.status).toBe(200);
    expect(saved.body.currentTechId).toBe('flutter');

    const read = await call('get', '/api/focus', { token: owner.token });
    expect(read.body.lastVisited.roadmapId).toBe(roadmap.body.id);

    const foreign = await call('get', '/api/focus', { token: other.token });
    expect(foreign.body.ownerId).toBe(other.id);
    expect(foreign.body.lastVisited).toBeUndefined();
  });

  it('updates only the fields it receives and can clear the visit', async () => {
    const roadmap = await call('post', '/api/roadmaps', { token: owner.token }).send({
      kind: 'tech',
      title: { en: 'Focus target' },
    });

    await call('put', '/api/focus', { token: owner.token }).send({
      currentTechId: 'flutter',
      currentProjectId: roadmap.body.id,
    });

    const visit = await call('put', '/api/focus', { token: owner.token }).send({
      lastVisited: { roadmapId: roadmap.body.id, at: '2026-02-02T10:00:00.000Z' },
    });
    expect(visit.status).toBe(200);
    expect(visit.body.currentTechId).toBe('flutter');
    expect(visit.body.currentProjectId).toBe(roadmap.body.id);

    const cleared = await call('put', '/api/focus', { token: owner.token }).send({
      lastVisited: null,
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body.lastVisited).toBeUndefined();
    expect(cleared.body.currentTechId).toBe('flutter');
    expect(cleared.body.currentProjectId).toBe(roadmap.body.id);
  });
});
