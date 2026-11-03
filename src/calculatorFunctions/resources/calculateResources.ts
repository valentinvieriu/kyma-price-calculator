import calculateDefaultVolumeSize from '../defaultVolumeSize/calculateDefaultVolumeSize';

// What a configuration provides, as opposed to what it costs. Disk counts the
// GiB requested; billing rounds extra disk up to whole blocks separately.

export interface PoolInput {
  minAutoscaler: number;
  // Defaults to the minimum: a pool of fixed size.
  maxAutoscaler?: number;
  VMSize: { vcpus: number; memoryGib: number };
  additionalVolumeGib: number;
}

export interface Resources {
  nodes: number;
  vcpus: number;
  memoryGib: number;
  includedDiskGib: number;
  extraDiskGib: number;
  diskGib: number;
}

export function nodeResources(pool: PoolInput): Resources {
  const { vcpus, memoryGib } = pool.VMSize;
  const includedDiskGib = calculateDefaultVolumeSize(vcpus, memoryGib);
  return {
    nodes: 1,
    vcpus,
    memoryGib,
    includedDiskGib,
    extraDiskGib: pool.additionalVolumeGib,
    diskGib: includedDiskGib + pool.additionalVolumeGib,
  };
}

const NO_RESOURCES: Resources = {
  nodes: 0,
  vcpus: 0,
  memoryGib: 0,
  includedDiskGib: 0,
  extraDiskGib: 0,
  diskGib: 0,
};

const scale = (resources: Resources, factor: number): Resources => ({
  nodes: resources.nodes * factor,
  vcpus: resources.vcpus * factor,
  memoryGib: resources.memoryGib * factor,
  includedDiskGib: resources.includedDiskGib * factor,
  extraDiskGib: resources.extraDiskGib * factor,
  diskGib: resources.diskGib * factor,
});

// The autoscaler keeps a pool between its minimum and maximum node count.
export type PoolSize = 'min' | 'max';

export const poolNodes = (pool: PoolInput, size: PoolSize = 'min') =>
  size === 'max'
    ? Math.max(pool.minAutoscaler, pool.maxAutoscaler ?? pool.minAutoscaler)
    : pool.minAutoscaler;

export function poolResources(
  pool: PoolInput,
  size: PoolSize = 'min',
): Resources {
  return scale(nodeResources(pool), poolNodes(pool, size));
}

export function clusterResources(
  pools: PoolInput[],
  size: PoolSize = 'min',
): Resources {
  return pools
    .map((pool) => poolResources(pool, size))
    .reduce(
      (total, pool) => ({
        nodes: total.nodes + pool.nodes,
        vcpus: total.vcpus + pool.vcpus,
        memoryGib: total.memoryGib + pool.memoryGib,
        includedDiskGib: total.includedDiskGib + pool.includedDiskGib,
        extraDiskGib: total.extraDiskGib + pool.extraDiskGib,
        diskGib: total.diskGib + pool.diskGib,
      }),
      NO_RESOURCES,
    );
}
