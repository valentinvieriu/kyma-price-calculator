// How much of the running hours a pool spends at its maximum node count.
// Billing is linear in node-hours, so any load pattern reduces to this one
// share: the pool averages min + (max − min) × share nodes.
export interface LoadProfile {
  label: string;
  percent: number;
  description: string;
}

export const LOAD_PROFILES: LoadProfile[] = [
  {
    label: 'Daily peaks',
    percent: 12,
    description: 'About 4 hours a day at maximum on weekdays',
  },
  {
    label: 'Business hours',
    percent: 30,
    description: 'About 10 hours a day at maximum on weekdays',
  },
  {
    label: 'Heavy use',
    percent: 60,
    description: 'About 14 hours a day at maximum, every day',
  },
];

export const loadProfile = (percent: number) =>
  LOAD_PROFILES.find((profile) => profile.percent === percent);

// "Daily peaks" for a profile, "20 % at maximum" for a custom share.
export function loadProfileLabel(percent: number): string {
  return loadProfile(percent)?.label ?? `${percent} % at maximum`;
}

export function averageNodes(min: number, max: number, percent: number) {
  return min + ((Math.max(min, max) - min) * percent) / 100;
}

// One label for the pools that can scale: their shared profile, or a hint
// that it differs per pool.
export function poolsLoadLabel(
  pools: {
    minAutoscaler: number;
    maxAutoscaler: number;
    loadPercent: number;
  }[],
): string {
  const labels = new Set(
    pools
      .filter(
        ({ minAutoscaler, maxAutoscaler }) => maxAutoscaler > minAutoscaler,
      )
      .map(({ loadPercent }) => loadProfileLabel(loadPercent)),
  );
  return labels.size === 1 ? [...labels][0] : 'Set per pool';
}
