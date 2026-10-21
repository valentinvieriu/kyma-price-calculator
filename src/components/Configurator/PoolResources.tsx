import {
  nodeResources,
  PoolInput,
  Resources,
} from '../../calculatorFunctions/resources/calculateResources';
import { formatNumber, plural } from '../../utils/format';
import { FormulaLine } from '../common/Formula';

const gib = (value: number) => `${formatNumber(value)} GiB`;

// One-line summary, e.g. "3 nodes · 6 vCPU · 24 GiB RAM · 360 GiB disk".
export const resourceSummary = (resources: Resources) =>
  [
    plural(resources.nodes, 'node'),
    `${formatNumber(resources.vcpus)} vCPU`,
    `${gib(resources.memoryGib)} RAM`,
    `${gib(resources.diskGib)} disk`,
  ].join(' · ');

// What each node provides, as the first line of the pool's formula; the pool
// totals are in the pool header.
export function nodeResourcesLine(pool: PoolInput): FormulaLine {
  const node = nodeResources(pool);
  const disk =
    node.extraDiskGib > 0
      ? `${gib(node.diskGib)} disk (${gib(node.includedDiskGib)} included + ${gib(node.extraDiskGib)} extra)`
      : `${gib(node.diskGib)} disk (included)`;

  return {
    label: 'Each node',
    expression: `${formatNumber(node.vcpus)} vCPU · ${gib(node.memoryGib)} RAM · ${disk}`,
  };
}
