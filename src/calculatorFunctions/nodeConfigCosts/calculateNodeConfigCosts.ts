import config from '../../config.json';

export interface NodeConfigProps {
  timeConsumption: number;
  computeUnits: number;
  // May be fractional: the average node count of an autoscaling pool.
  nodes: number;
  machineTypeFactor: number;
}

export default function calculateNodeConfigCosts(
  props: NodeConfigProps,
): number {
  const { timeConsumption, nodes, computeUnits, machineTypeFactor } = props;

  const PPU: number = config.nodeConfig.PricePerUnit;

  return nodes * computeUnits * PPU * machineTypeFactor * timeConsumption;
}
