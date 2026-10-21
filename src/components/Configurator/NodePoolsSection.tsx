import { useAtom, useAtomValue } from 'jotai';
import { Button, MessageStrip } from '@ui5/webcomponents-react';
import config from '../../config.json';
import {
  additionalMachineSetupState,
  baseMachineSetupState,
  createMachineSetup,
  MachineSetup,
} from '../../state/nodes/machineSetupState';
import { nodeConfigCostsAtom, poolCostsAtom } from '../../state/costState';
import HelpLink from '../common/HelpLink';
import Section from '../common/Section';
import PoolPanel from './PoolPanel';
import './NodePoolsSection.css';

export default function NodePoolsSection() {
  const [, setBase] = useAtom(baseMachineSetupState);
  const [additional, setAdditional] = useAtom(additionalMachineSetupState);
  const [basePool, ...additionalPools] = useAtomValue(poolCostsAtom);
  const subtotal = useAtomValue(nodeConfigCostsAtom);
  const totalNodes = [basePool, ...additionalPools].reduce(
    (sum, { machine }) => sum + machine.minAutoscaler,
    0,
  );
  const maxNodes = config.nodeConfig.AutoScalerMin.Max;

  const add = () =>
    setAdditional((prev) =>
      prev.concat(
        createMachineSetup(
          crypto.randomUUID(),
          config.nodeConfig.AutoScalerMin.DefaultWorkerNodes,
        ),
      ),
    );
  const update = (id: string, updated: MachineSetup) =>
    setAdditional((prev) => prev.map((m) => (m.id === id ? updated : m)));
  const remove = (id: string) =>
    setAdditional((prev) => prev.filter((m) => m.id !== id));

  return (
    <Section
      id="node-pools-section"
      title="Worker node pools"
      subtitle="Billed per node and hour. The hourly rate depends on the VM size."
      subtotal={subtotal}
    >
      <PoolPanel
        id="base-pool"
        title="Base worker node pool"
        pool={basePool}
        updateMachine={setBase}
      />
      {additional.map((machine, index) => (
        <PoolPanel
          key={machine.id}
          id={`machine-setup-${index}`}
          title={`Worker node pool ${index + 1}`}
          pool={additionalPools[index]}
          updateMachine={(updated) => update(machine.id, updated)}
          onRemove={() => remove(machine.id)}
        />
      ))}
      {totalNodes > maxNodes && (
        <MessageStrip design="Critical" hideCloseButton>
          Your pools add up to {totalNodes} nodes, but a cluster runs at most{' '}
          {maxNodes} virtual machines across all pools.
        </MessageStrip>
      )}
      <div className="node-pools-actions">
        <Button icon="add" onClick={add}>
          Add worker node pool
        </Button>
        <HelpLink docKey="worker-node-pools" />
      </div>
    </Section>
  );
}
