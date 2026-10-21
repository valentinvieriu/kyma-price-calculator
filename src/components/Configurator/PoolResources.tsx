import {
  nodeResources,
  PoolInput,
  Resources,
} from '../../calculatorFunctions/resources/calculateResources';
import { formatNumber, plural } from '../../utils/format';
import Formula from '../common/Formula';

const gib = (value: number) => `${formatNumber(value)} GiB`;

// One-line summary, e.g. "3 nodes · 6 vCPU · 24 GiB RAM · 360 GiB disk".
export const resourceSummary = (resources: Resources) =>
  [
    plural(resources.nodes, 'node'),
    `${formatNumber(resources.vcpus)} vCPU`,
    `${gib(resources.memoryGib)} RAM`,
    `${gib(resources.diskGib)} disk`,
  ].join(' · ');

// What each node provides; the pool totals are in the pool header.
export default function PoolResources({ pool }: { pool: PoolInput }) {
  const node = nodeResources(pool);
  const disk =
    node.extraDiskGib > 0
      ? `${gib(node.diskGib)} disk (${gib(node.includedDiskGib)} included + ${gib(node.extraDiskGib)} extra)`
      : `${gib(node.diskGib)} disk (included)`;

  return (
    <div>
      <div className="section-subheading">What you get</div>
      <Formula
        lines={[
          {
            label: 'Each node',
            expression: `${formatNumber(node.vcpus)} vCPU · ${gib(node.memoryGib)} RAM · ${disk}`,
          },
        ]}
      />
    </div>
  );
}
