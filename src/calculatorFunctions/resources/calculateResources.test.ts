import { describe, expect, test } from 'vitest';
import {
  clusterResources,
  nodeResources,
  poolResources,
} from './calculateResources';

// 2 vCPU / 8 GiB includes 80 GiB disk; 64 vCPU / 128 GiB includes 250 GiB
// (see calculateDefaultVolumeSize).
const small = {
  minAutoscaler: 3,
  VMSize: { vcpus: 2, memoryGib: 8 },
  additionalVolumeGib: 40,
};
const large = {
  minAutoscaler: 1,
  VMSize: { vcpus: 64, memoryGib: 128 },
  additionalVolumeGib: 0,
};

describe('resources', () => {
  test('a node gets its included disk plus the requested extra', () => {
    expect(nodeResources(small)).toEqual({
      nodes: 1,
      vcpus: 2,
      memoryGib: 8,
      includedDiskGib: 80,
      extraDiskGib: 40,
      diskGib: 120,
    });
  });

  test('a pool multiplies one node by its node count', () => {
    expect(poolResources(small)).toEqual({
      nodes: 3,
      vcpus: 6,
      memoryGib: 24,
      includedDiskGib: 240,
      extraDiskGib: 120,
      diskGib: 360,
    });
  });

  test('an empty cluster has no resources', () => {
    expect(clusterResources([]).nodes).toBe(0);
  });

  test('the cluster sums all pools', () => {
    expect(clusterResources([small, large])).toEqual({
      nodes: 4,
      vcpus: 70,
      memoryGib: 152,
      includedDiskGib: 490,
      extraDiskGib: 120,
      diskGib: 610,
    });
  });
});
