import { describe, expect, test } from 'vitest';
import { buildCostFlow, CostFlowInput } from './costFlow';
import { spreadShade } from './costLines';

// The worked example from docs/pricing-explained.md ("Sam's team").
const sam: CostFlowInput = {
  groups: [
    {
      id: 'nodes-cost',
      header: 'Worker node pools',
      color: 'blue',
      lines: [
        { text: 'Base pool', description: '3 nodes', cu: 777.6, shade: 0 },
      ],
    },
    {
      id: 'storage-cost',
      header: 'Storage',
      color: 'orange',
      lines: [
        {
          text: 'Persistent volumes',
          description: '96 GiB',
          cu: 28.8,
          shade: 0,
        },
        {
          text: 'Shared file storage (NFS)',
          shortText: 'Shared files (NFS)',
          description: '40 GiB',
          cu: 86.4,
          shade: 0,
        },
        { text: 'Volume snapshots', description: '33 GiB', cu: 28.8, shade: 0 },
        { text: 'Extra node disk', description: 'pools', cu: 43.2, shade: 0 },
      ],
    },
    {
      id: 'additional-cost',
      header: 'Additional services',
      color: 'green',
      lines: [
        { text: 'Redis', description: 'S1 · 182 GiB', cu: 81.9, shade: 0 },
      ],
    },
  ],
  totalCosts: { CU: 1046.7, CC: 837.36 },
  conversionRate: 0.8,
};

const flowInto = (graph: ReturnType<typeof buildCostFlow>, target: string) =>
  graph.links
    .filter((link) => link.target === target)
    .reduce((sum, { value }) => sum + value, 0);

describe('buildCostFlow', () => {
  test('compact: every charge flows into its category only', () => {
    const graph = buildCostFlow(sam, 'compact');
    expect(Math.max(...graph.nodes.map(({ column }) => column))).toBe(1);
    expect(flowInto(graph, 'storage-cost')).toBeCloseTo(187.2);
    expect(
      graph.nodes.find(({ id }) => id === 'storage-cost/1')?.caption,
    ).toEqual(['Shared files (NFS)', '86,40 CU']);
  });

  test('full: categories add up to the CU total', () => {
    const graph = buildCostFlow(sam, 'full');
    expect(flowInto(graph, 'nodes-cost')).toBeCloseTo(777.6);
    expect(flowInto(graph, 'additional-cost')).toBeCloseTo(81.9);
    expect(flowInto(graph, 'total')).toBeCloseTo(1046.7);
  });

  test('full: a price per CU below 1 splits the total into pay and discount', () => {
    const graph = buildCostFlow(sam, 'full');
    expect(flowInto(graph, 'pay')).toBeCloseTo(837.36);
    expect(flowInto(graph, 'discount')).toBeCloseTo(209.34);
  });

  test('full: no discount band at or above 1 per CU', () => {
    const graph = buildCostFlow(
      { ...sam, totalCosts: { CU: 1046.7, CC: 1256.04 }, conversionRate: 1.2 },
      'full',
    );
    expect(graph.nodes.map(({ id }) => id)).not.toContain('discount');
    expect(flowInto(graph, 'pay')).toBeCloseTo(1046.7);
    expect(graph.nodes.find(({ id }) => id === 'pay')?.caption[1]).toBe(
      '1.256,04 €',
    );
  });
});

describe('spreadShade', () => {
  test('is neutral for a single item and spreads darkest first', () => {
    expect(spreadShade(0, 1)).toBe(0);
    expect(spreadShade(0, 3)).toBeCloseTo(-0.12);
    expect(spreadShade(1, 3)).toBeCloseTo(0);
    expect(spreadShade(2, 3)).toBeCloseTo(0.12);
  });
});
