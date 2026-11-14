// Nearest NASA tests to a point on the pressure and oxygen map, and how well that point is covered.
// Spec: ROADMAP.md, Phase 4 step 3. Plain arithmetic with named constants, no AI call, so every
// result can be explained. Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md.

export type Outcome = "burned" | "self_extinguished" | "suppressed" | "unknown";

// One row of data/tests.web.json (shape frozen in ROADMAP.md, plus the added context fields).
export interface TestRow {
  accession: string;
  test_id: string | null;
  fuel: string | null;
  fuel_phase: "gas" | "liquid" | "solid" | string;
  o2_pct: number | null;
  pressure_psi: number | null;
  pressure_from: "test" | "investigation" | null;
  flow_cm_s: number | null;
  gravity: string;
  outcome: Outcome;
  source: string;
  investigation?: string;
  flame_type?: string;
  oxygen_from?: "chamber" | "burner" | null;
  ignited?: boolean | null;
  source_line?: number;
}

export interface Probe {
  o2_pct: number;
  pressure_psi: number;
}

// One unit of distance is 10 points of oxygen or 2 psi. Tune against the real data, keep them named.
export const O2_SCALE = 10;
export const P_SCALE = 2;
// A test counts as evidence for a point when it lies within this distance.
export const NEAR_DISTANCE = 1;
// Rating: "lit" with at least this many tests near the point, "dim" with at least one, "dark" with none.
export const LIT_MIN_TESTS = 10;

export type Rating = "lit" | "dim" | "dark";

export interface Neighbour {
  row: TestRow;
  distance: number;
}

export interface Evidence {
  rating: Rating;
  nearCount: number;
  nearest: Neighbour[];
}

export interface EvidenceOptions {
  k?: number;
  fuelPhase?: string;
  // Inverse flames take oxygen from the burner, not the surrounding air, so they are left out by default.
  includeBurnerOxygen?: boolean;
}

export function distance(p: Probe, row: TestRow): number {
  if (row.o2_pct == null || row.pressure_psi == null) return Infinity;
  const dO2 = (p.o2_pct - row.o2_pct) / O2_SCALE;
  const dP = (p.pressure_psi - row.pressure_psi) / P_SCALE;
  return Math.sqrt(dO2 * dO2 + dP * dP);
}

// Rows that can sit on the map: both values known and, unless asked, oxygen from the surrounding air.
export function mappable(rows: TestRow[], opts: EvidenceOptions = {}): TestRow[] {
  return rows.filter(
    (r) =>
      r.o2_pct != null &&
      r.pressure_psi != null &&
      (opts.includeBurnerOxygen || r.oxygen_from !== "burner") &&
      (!opts.fuelPhase || r.fuel_phase === opts.fuelPhase),
  );
}

export function rate(nearCount: number): Rating {
  if (nearCount >= LIT_MIN_TESTS) return "lit";
  if (nearCount >= 1) return "dim";
  return "dark";
}

export function evidenceAt(rows: TestRow[], probe: Probe, opts: EvidenceOptions = {}): Evidence {
  const k = opts.k ?? 5;
  const scored = mappable(rows, opts)
    .map((row) => ({ row, distance: distance(probe, row) }))
    .sort((a, b) => a.distance - b.distance);
  const nearCount = scored.filter((n) => n.distance <= NEAR_DISTANCE).length;
  return { rating: rate(nearCount), nearCount, nearest: scored.slice(0, k) };
}

// Self-check from the roadmap: a probe on top of a row returns that row first at distance 0,
// and a probe far from all rows rates dark. Returns the list of failures (empty means it passed).
export function selfCheck(): string[] {
  const base: Omit<TestRow, "test_id" | "o2_pct" | "pressure_psi"> = {
    accession: "CHECK", fuel: null, fuel_phase: "gas", pressure_from: "test", flow_cm_s: null,
    gravity: "0g", outcome: "unknown", source: "selfCheck", oxygen_from: "chamber",
  };
  const rows: TestRow[] = [
    { ...base, test_id: "a", o2_pct: 21, pressure_psi: 14.7 },
    { ...base, test_id: "b", o2_pct: 30, pressure_psi: 10.2 },
    { ...base, test_id: "c", o2_pct: 50, pressure_psi: 5 },
  ];
  const failures: string[] = [];
  const onTop = evidenceAt(rows, { o2_pct: 30, pressure_psi: 10.2 });
  if (onTop.nearest[0]?.row.test_id !== "b" || onTop.nearest[0].distance !== 0) {
    failures.push("a probe on top of row b should return b first at distance 0");
  }
  const far = evidenceAt(rows, { o2_pct: 95, pressure_psi: 60 });
  if (far.rating !== "dark") failures.push("a probe far from all rows should rate dark");
  return failures;
}
