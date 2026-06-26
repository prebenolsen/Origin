/**
 * Label de-collision for the context maps.
 *
 * Map text (place-name pills *and* connection labels) would pile up on top of
 * each other in dense maps. This runs a small greedy placement pass: each label
 * prefers its natural spot (a marker label just above its dot; a connection
 * label centred on its arc) but, when that spot is taken, is pushed to the
 * nearest free position — and flagged so the map can draw a subtle leader line
 * back to where it belongs.
 *
 * Everything is computed in the SVG's viewBox units (MAP_W × MAP_H). Because the
 * map card is locked to the viewBox's 8:5 aspect, those units map linearly to
 * the HTML labels' percentage positions, so SVG leader lines and HTML pills line
 * up exactly — at any zoom level (the whole layer scales together).
 */
import { MAP_W, MAP_H, type Pt } from './mapParts';

/** A point that needs a marker label placed near it. */
export interface LabelInput {
  id: string;
  x: number;
  y: number;
  label: string;
  primary: boolean;
}

/** A connection label anchored at its arc's apex. */
export interface ArcLabelInput {
  id: string;
  apex: Pt;
  label: string;
}

/** A rectangle obstacle (centre + size). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Placement {
  id: string;
  label: string;
  primary: boolean;
  kind: 'marker' | 'arc';
  cx: number; // label centre (viewBox units)
  cy: number;
  w: number;
  h: number;
  anchor: Pt; // the dot / apex the label belongs to
  leader: boolean; // true when displaced → draw a connector
}

// Marker-pill geometry in viewBox units. The map renders ~340–390px wide (it
// lives in a ≤430px phone frame), so 1 label char ≈ these many units. Tuned to
// slightly over-estimate, keeping a safe gap rather than risking touching text.
const CHAR_W = 16.5;
const PAD_X = 52; // pill horizontal padding + border, both sides
const LABEL_H = 62;
const DOT_R = 12;

// Connection labels are SVG text in native viewBox units (fontSize ~21).
const ARC_CHAR_W = 11;
const ARC_PAD = 16;
const ARC_H = 26;

export function estimateLabelBox(text: string): { w: number; h: number } {
  return { w: text.length * CHAR_W + PAD_X, h: LABEL_H };
}

export function arcLabelBox(text: string, apex: Pt): Box {
  return { x: apex.x, y: apex.y, w: text.length * ARC_CHAR_W + ARC_PAD, h: ARC_H };
}

function overlapArea(a: Box, b: Box): number {
  const ox = (a.w + b.w) / 2 - Math.abs(a.x - b.x);
  const oy = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

// Candidate directions around the anchor. Tier 0 sits snug; higher tiers push
// further out (and need a leader).
const DIRS: { dx: number; dy: number }[] = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: -1 },
  { dx: -1, dy: -1 },
  { dx: 1, dy: 1 },
  { dx: -1, dy: 1 },
];
const TIERS = [0, 1, 2, 3];

interface Item {
  id: string;
  label: string;
  primary: boolean;
  kind: 'marker' | 'arc';
  anchor: Pt;
  w: number;
  h: number;
  /** Markers sit above the dot; arc labels sit centred on the apex. */
  centerFirst: boolean;
}

/** Core greedy placement. `fixed` boxes and `dots` are never moved. */
function place(items: Item[], fixed: Box[], dots: Box[], width: number, height: number): Placement[] {
  const placed: Box[] = [];
  const out: Placement[] = [];

  for (const it of items) {
    const { w, h } = it;

    // Build candidate centre positions for this item.
    const candidates: { cx: number; cy: number; leader: boolean }[] = [];
    if (it.centerFirst) candidates.push({ cx: it.anchor.x, cy: it.anchor.y, leader: false });
    for (const tier of TIERS) {
      for (const dir of DIRS) {
        const offX = dir.dx * (w / 2 + DOT_R + 8 + tier * 60);
        const offY = dir.dy * (h / 2 + DOT_R + 8 + tier * 60);
        candidates.push({
          cx: it.anchor.x + offX,
          cy: it.anchor.y + offY,
          leader: tier > 0 || dir.dx !== 0,
        });
      }
    }

    let best = candidates[0];
    let bestPenalty = Infinity;
    for (const c of candidates) {
      const box: Box = { x: c.cx, y: c.cy, w, h };
      // Off-frame violation (heavily penalised — labels must stay on screen).
      const off =
        Math.max(0, 4 - (c.cx - w / 2)) +
        Math.max(0, c.cx + w / 2 - (width - 4)) +
        Math.max(0, 4 - (c.cy - h / 2)) +
        Math.max(0, c.cy + h / 2 - (height - 4));
      let penalty = off * 200;
      for (const o of placed) penalty += overlapArea(box, o) * 1.5;
      for (const o of fixed) penalty += overlapArea(box, o) * 1.5;
      for (let i = 0; i < dots.length; i++) {
        if (it.kind === 'marker' && dots[i].x === it.anchor.x && dots[i].y === it.anchor.y) continue;
        penalty += overlapArea(box, dots[i]);
      }
      // Prefer the snug spot and short leaders.
      penalty += Math.hypot(c.cx - it.anchor.x, c.cy - it.anchor.y) * 0.5 + (c.leader ? 70 : 0);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        best = c;
        if (penalty === 0) break;
      }
    }

    placed.push({ x: best.cx, y: best.cy, w, h });
    out.push({
      id: it.id,
      label: it.label,
      primary: it.primary,
      kind: it.kind,
      cx: best.cx,
      cy: best.cy,
      w,
      h,
      anchor: it.anchor,
      leader: best.leader,
    });
  }

  return out;
}

/**
 * Place every label on the map without overlaps. Marker labels are placed first
 * (they name the places, so they win the prime spots); connection labels are
 * placed afterwards and route around them.
 */
export function layoutLabels(
  markers: LabelInput[],
  arcs: ArcLabelInput[] = [],
  width = MAP_W,
  height = MAP_H,
): Placement[] {
  const dots: Box[] = markers.map((m) => ({ x: m.x, y: m.y, w: DOT_R * 2, h: DOT_R * 2 }));

  const markerItems: Item[] = markers
    .map((m) => {
      const { w, h } = estimateLabelBox(m.label);
      return {
        id: m.id,
        label: m.label,
        primary: m.primary,
        kind: 'marker' as const,
        anchor: { x: m.x, y: m.y },
        w,
        h,
        centerFirst: false,
      };
    })
    // Most prominent / highest first → they win the directly-above spots.
    .sort((a, b) => Number(b.primary) - Number(a.primary) || a.anchor.y - b.anchor.y);

  const markerPlacements = place(markerItems, [], dots, width, height);

  const arcItems: Item[] = arcs.map((a) => {
    const box = arcLabelBox(a.label, a.apex);
    return {
      id: a.id,
      label: a.label,
      primary: true, // amber, matching the arcs
      kind: 'arc' as const,
      anchor: a.apex,
      w: box.w,
      h: box.h,
      centerFirst: true,
    };
  });

  // Connection labels avoid the already-placed marker labels and the dots.
  const markerBoxes: Box[] = markerPlacements.map((p) => ({ x: p.cx, y: p.cy, w: p.w, h: p.h }));
  const arcPlacements = place(arcItems, markerBoxes, dots, width, height);

  return [...markerPlacements, ...arcPlacements];
}
