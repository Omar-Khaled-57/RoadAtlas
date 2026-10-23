import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Tone } from '../lib/roadmapMeta';

const MAX_STOPS = 6;

const TONE_CLASS: Record<Tone, string> = {
  primary: 'trail-tone-primary',
  secondary: 'trail-tone-secondary',
  accent: 'trail-tone-accent',
};

interface Point {
  x: number;
  y: number;
}

/** Stops alternate around the centre line so the road visibly winds. */
function trailPoints(count: number): Point[] {
  if (count === 1) return [{ x: 50, y: 50 }];

  return Array.from({ length: count }, (_, index) => ({
    x: 6 + (88 * index) / (count - 1),
    y: index % 2 === 0 ? 68 : 32,
  }));
}

/** Catmull-Rom control points expressed as cubic Béziers. */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const start = points[index];
    const end = points[index + 1];
    const next = points[index + 2] ?? end;

    d += ` C ${start.x + (end.x - previous.x) / 6} ${start.y + (end.y - previous.y) / 6}, ${
      end.x - (next.x - start.x) / 6
    } ${end.y - (next.y - start.y) / 6}, ${end.x} ${end.y}`;
  }
  return d;
}

interface RoadmapTrailProps {
  total: number;
  progress: number;
  tone: Tone;
}

/** A miniature winding road with stop points, used on catalogue cards. */
export function RoadmapTrail({ total, progress, tone }: RoadmapTrailProps) {
  const count = total === 0 ? 0 : Math.min(Math.max(total, 1), MAX_STOPS);
  const points = count === 0 ? [] : trailPoints(count);
  const clamped = Math.min(100, Math.max(0, progress));
  const done = Math.round((count * clamped) / 100);
  const path = smoothPath(points);
  const trackRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useLayoutEffect(() => {
    setPathLength(trackRef.current?.getTotalLength() ?? 0);
  }, [path]);

  return (
    <div className={`roadmap-trail ${TONE_CLASS[tone]}`} aria-hidden="true">
      <div className="roadmap-trail__canvas">
        {count === 0 ? <span className="roadmap-trail__empty" /> : null}
        {count > 0 ? (
          <svg
            className="roadmap-trail__path rtl:-scale-x-100"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path
              ref={trackRef}
              className="roadmap-trail__asphalt"
              d={path}
              vectorEffect="non-scaling-stroke"
            />
            <path className="roadmap-trail__center" d={path} vectorEffect="non-scaling-stroke" />
            <path
              className="roadmap-trail__done"
              d={path}
              strokeDasharray={`${(pathLength * clamped) / 100} ${pathLength || 100000}`}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
        {points.map((point, index) => (
          <span
            key={index}
            className={`roadmap-trail__stop${index < done ? ' is-done' : ''}${
              index === done && clamped < 100 ? ' is-current' : ''
            }`}
            style={
              {
                insetInlineStart: `${point.x}%`,
                top: `${point.y}%`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
