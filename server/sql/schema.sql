-- RoadAtlas database schema (PostgreSQL)
-- Run with: psql -f sql/schema.sql

DROP TABLE IF EXISTS "Focus" CASCADE;
DROP TABLE IF EXISTS "Decision" CASCADE;
DROP TABLE IF EXISTS "Note" CASCADE;
DROP TABLE IF EXISTS "Metric" CASCADE;
DROP TABLE IF EXISTS "Comparison" CASCADE;
DROP TABLE IF EXISTS "Progress" CASCADE;
DROP TABLE IF EXISTS "Step" CASCADE;
DROP TABLE IF EXISTS "Roadmap" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE TABLE "User" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         TEXT UNIQUE NOT NULL,
  "passwordHash"  TEXT NOT NULL,
  "displayName"   TEXT,
  "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Roadmap" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"     UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "visibility"  TEXT NOT NULL DEFAULT 'public',
  "kind"        TEXT NOT NULL,
  "title"       JSONB NOT NULL,
  "description" JSONB,
  "parentId"    UUID REFERENCES "Roadmap"("id") ON DELETE SET NULL,
  "techId"      TEXT,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "legacyKey"   TEXT,
  "prerequisites" JSONB NOT NULL DEFAULT '[]',
  "topics"      JSONB NOT NULL DEFAULT '[]',
  "paused"      BOOLEAN NOT NULL DEFAULT false,
  "status"      TEXT,
  "icon"        TEXT,
  "image"       TEXT,
  "revision"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_roadmap_ownerId" ON "Roadmap"("ownerId");
CREATE INDEX "idx_roadmap_parentId" ON "Roadmap"("parentId");
CREATE INDEX "idx_roadmap_owner_legacykey" ON "Roadmap"("ownerId", "legacyKey");

CREATE TABLE "Step" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"        UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "roadmapId"      UUID NOT NULL REFERENCES "Roadmap"("id") ON DELETE CASCADE,
  "title"          JSONB NOT NULL,
  "description"    JSONB,
  "resources"      JSONB NOT NULL DEFAULT '[]',
  "order"          INTEGER NOT NULL DEFAULT 0,
  "legacyKey"      TEXT,
  "stage"          TEXT,
  "note"           JSONB,
  "done"           BOOLEAN,
  "revision"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "linkedRoadmapId" UUID,
  "linkedStepId"   UUID
);

CREATE INDEX "idx_step_ownerId" ON "Step"("ownerId");
CREATE INDEX "idx_step_roadmapId" ON "Step"("roadmapId");
CREATE INDEX "idx_step_owner_legacykey" ON "Step"("ownerId", "legacyKey");

CREATE TABLE "Progress" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"   UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stepId"    UUID NOT NULL REFERENCES "Step"("id") ON DELETE CASCADE,
  "done"      BOOLEAN NOT NULL DEFAULT false,
  "status"    TEXT,
  "percent"   INTEGER,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_progress_ownerId" ON "Progress"("ownerId");
CREATE INDEX "idx_progress_stepId" ON "Progress"("stepId");
CREATE INDEX "idx_progress_owner_step" ON "Progress"("ownerId", "stepId");

CREATE TABLE "Comparison" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"        UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "visibility"     TEXT NOT NULL DEFAULT 'public',
  "title"          JSONB NOT NULL,
  "candidateTechIds" JSONB NOT NULL DEFAULT '[]',
  "criteria"       JSONB NOT NULL DEFAULT '[]',
  "conclusion"     JSONB,
  "chosenTechId"   TEXT,
  "revisitAt"      TIMESTAMPTZ,
  "evidence"       JSONB NOT NULL DEFAULT '[]',
  "revision"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_comparison_ownerId" ON "Comparison"("ownerId");

CREATE TABLE "Metric" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"   UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "visibility" TEXT NOT NULL DEFAULT 'public',
  "techId"    TEXT NOT NULL,
  "key"       TEXT NOT NULL,
  "axis"      JSONB NOT NULL,
  "points"    JSONB NOT NULL DEFAULT '[]',
  "finding"   JSONB NOT NULL,
  "evidence"  JSONB NOT NULL DEFAULT '[]',
  "revision"  INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_metric_ownerId" ON "Metric"("ownerId");

CREATE TABLE "Note" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"   UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "visibility" TEXT NOT NULL DEFAULT 'public',
  "targetType" TEXT NOT NULL,
  "targetId"   TEXT NOT NULL,
  "title"      JSONB NOT NULL,
  "content"    JSONB NOT NULL,
  "tags"       JSONB NOT NULL DEFAULT '[]',
  "references" JSONB NOT NULL DEFAULT '[]',
  "revision"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_note_ownerId" ON "Note"("ownerId");
CREATE INDEX "idx_note_targetId" ON "Note"("targetId");

CREATE TABLE "Decision" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"     UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "visibility"  TEXT NOT NULL DEFAULT 'public',
  "context"     JSONB NOT NULL,
  "alternatives" JSONB NOT NULL DEFAULT '[]',
  "decision"    JSONB NOT NULL,
  "consequences" JSONB NOT NULL,
  "revisitAt"   TIMESTAMPTZ,
  "links"       JSONB NOT NULL DEFAULT '[]',
  "revision"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_decision_ownerId" ON "Decision"("ownerId");

CREATE TABLE "Focus" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"               UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "visibility"            TEXT NOT NULL DEFAULT 'public',
  "currentTechId"         TEXT,
  "currentProjectId"      UUID,
  "lastVisited"           JSONB,
  "items"                 JSONB NOT NULL DEFAULT '[]',
  "weeklyFocus"           JSONB NOT NULL DEFAULT '[]',
  "weeklyFocusConfigured" BOOLEAN NOT NULL DEFAULT false,
  "revision"              INTEGER NOT NULL DEFAULT 0,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);
