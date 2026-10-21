import { useAtomValue } from 'jotai';
import config from '../../config.json';
import { machineSetupsAtom } from '../../state/costState';
import { clusterResources } from '../../calculatorFunctions/resources/calculateResources';
import { formatNumber } from '../../utils/format';
import './ClusterResources.css';

interface StatProps {
  value: string;
  label: string;
  detail?: string;
  critical?: boolean;
}

function Stat({ value, label, detail, critical }: StatProps) {
  return (
    <div className={`cluster-stat${critical ? ' cluster-stat--critical' : ''}`}>
      <dt>{label}</dt>
      <dd className="cluster-stat-value">{value}</dd>
      {detail && <dd className="cluster-stat-detail">{detail}</dd>}
    </div>
  );
}

// Totals across all worker node pools: what the whole cluster provides.
export default function ClusterResources() {
  const resources = clusterResources(useAtomValue(machineSetupsAtom));
  const maxNodes = config.nodeConfig.AutoScalerMin.Max;

  return (
    <section id="cluster-resources" className="cluster-resources">
      <h4 className="section-subheading">Your cluster</h4>
      <dl>
        <Stat
          label="Nodes"
          value={formatNumber(resources.nodes)}
          detail={`of ${maxNodes} max`}
          critical={resources.nodes > maxNodes}
        />
        <Stat label="vCPU" value={formatNumber(resources.vcpus)} />
        <Stat label="RAM" value={`${formatNumber(resources.memoryGib)} GiB`} />
        <Stat
          label="Disk"
          value={`${formatNumber(resources.diskGib)} GiB`}
          detail={
            resources.extraDiskGib > 0
              ? `incl. ${formatNumber(resources.extraDiskGib)} GiB extra`
              : 'included with the nodes'
          }
        />
      </dl>
    </section>
  );
}
