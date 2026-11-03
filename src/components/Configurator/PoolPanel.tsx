import { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import {
  Button,
  Option,
  Panel,
  SegmentedButton,
  SegmentedButtonItem,
  Select,
  Tag,
  Title,
} from '@ui5/webcomponents-react';
import config from '../../config.json';
import { MachineSetup, MachineType } from '../../state/nodes/machineSetupState';
import { loadProfile, loadProfileLabel } from '../../state/nodes/loadProfiles';
import { PoolCosts } from '../../state/costState';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import calculateDefaultVolumeSize from '../../calculatorFunctions/defaultVolumeSize/calculateDefaultVolumeSize';
import {
  NODE_VOLUME_BLOCK_HOURLY_RATE,
  nodeHourlyRate,
} from '../../calculatorFunctions/rates';
import {
  REQUESTED_SIZE_STEP_GIB,
  STORAGE_BLOCK_SIZE_GIB,
  toBillableBlocks,
} from '../../calculatorFunctions/storageCosts/storageBlocks';
import { formatCU, formatNumber, plural } from '../../utils/format';
import billedSizeNote from '../common/billedSizeNote';
import Field from '../common/Field';
import Formula, { FormulaLine } from '../common/Formula';
import HelpLink from '../common/HelpLink';
import NumberInput from '../common/NumberInput';
import LoadProfileField from './LoadProfileField';
import { nodeResourcesLine, resourceSummary } from './PoolResources';
import { poolResources } from '../../calculatorFunctions/resources/calculateResources';
import './PoolPanel.css';

const machineTypes: MachineType[] = config.nodeConfig.MachineTypes;
const { AutoScalerMin, AutoScalerMax, AdditionalNodeVolume } =
  config.nodeConfig;

interface Props {
  id: string;
  title: string;
  pool: PoolCosts;
  updateMachine: (machine: MachineSetup) => void;
  // Only additional pools can be removed or change machine type.
  onRemove?: () => void;
}

export const vmSizeLabel = ({ VMSize }: MachineSetup) =>
  `${VMSize.vcpus} vCPU · ${VMSize.memoryGib} GiB RAM`;

// Groups a pool's settings by what they decide: the node itself, or how many.
function PoolGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="pool-group" aria-label={title}>
      <span className="section-subheading pool-group-title">{title}</span>
      {children}
    </section>
  );
}

export default function PoolPanel({
  id,
  title,
  pool,
  updateMachine,
  onRemove,
}: Props) {
  const { machine, computeCosts, scenarios } = pool;
  const isBase = !onRemove;
  const hours = useAtomValue(timeConsumptionState);
  const percent = machine.loadPercent;
  const update = (changes: Partial<MachineSetup>) =>
    updateMachine({ ...machine, ...changes });
  // A higher minimum pulls the maximum along, it can never be below.
  const updateMin = (minAutoscaler: number) =>
    update({
      minAutoscaler,
      maxAutoscaler: Math.max(minAutoscaler, machine.maxAutoscaler),
    });

  const rate = nodeHourlyRate(
    machine.VMSize.computeUnits,
    machine.machineType.multiple,
  );
  const includedVolume = calculateDefaultVolumeSize(
    machine.VMSize.vcpus,
    machine.VMSize.memoryGib,
  );
  const extraBlocks = toBillableBlocks(machine.additionalVolumeGib);
  const canScale = machine.maxAutoscaler > machine.minAutoscaler;
  const nodes = plural(machine.minAutoscaler, 'node');
  const nodesLine = (count: string) =>
    `${count} × ${formatNumber(rate)} CU/h × ${hours} h`;

  const formula: FormulaLine[] = [nodeResourcesLine(machine)];
  if (!canScale) {
    formula.push({
      label: 'Nodes',
      expression: nodesLine(nodes),
      result: computeCosts,
    });
  } else {
    formula.push(
      {
        label: 'Minimum',
        expression: nodesLine(nodes),
        result: scenarios.min.compute,
        note: 'if load never scales it out',
      },
      {
        label: 'Maximum',
        expression: nodesLine(plural(machine.maxAutoscaler, 'node')),
        result: scenarios.max.compute,
        note: 'if load keeps it fully scaled',
      },
      {
        label: 'Estimated',
        expression: nodesLine(
          `${formatNumber(scenarios.estimated.nodes, 2)} nodes on average`,
        ),
        result: computeCosts,
        note: loadProfile(percent)
          ? `${loadProfileLabel(percent)}: ${percent} % of the time at maximum`
          : `${percent} % of the time at maximum`,
      },
    );
  }
  if (extraBlocks > 0) {
    formula.push({
      label: 'Extra disk',
      expression: `${nodes} × ${plural(extraBlocks, 'block')} (${extraBlocks * STORAGE_BLOCK_SIZE_GIB} GiB) × ${formatNumber(NODE_VOLUME_BLOCK_HOURLY_RATE)} CU/h × ${hours} h`,
      result: scenarios.min.volume,
      note: canScale
        ? `billed as storage, up to ${formatCU(scenarios.max.volume)} at maximum`
        : 'billed as storage',
    });
  }

  return (
    <Panel
      id={id}
      className="pool-panel"
      headerLevel="H4"
      header={
        <div className="pool-header">
          <div className="pool-header-text">
            <div className="pool-header-title">
              <Title level="H4" size="H5">
                {title}
              </Title>
              <Tag design="Neutral" hideStateIcon>
                {machine.machineType.value}
              </Tag>
            </div>
            <span className="pool-header-summary">
              {resourceSummary(poolResources(machine))}
              {canScale && ` · scales to ${machine.maxAutoscaler} nodes`}
            </span>
          </div>
          <span className="pool-header-cost">
            {formatCU(computeCosts)}
            {canScale && (
              <span className="pool-header-range">
                up to {formatCU(scenarios.max.compute)}
              </span>
            )}
          </span>
          {onRemove && (
            <Button
              icon="delete"
              design="Transparent"
              tooltip="Remove worker node pool"
              accessibleName="Remove worker node pool"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            />
          )}
        </div>
      }
    >
      <div className="pool-content">
        <PoolGroup title="Each node">
          <div className="pool-fields">
            {/* The base pool's type is fixed; its header tag shows it. */}
            {!isBase && (
              <Field
                label="Machine type"
                wide
                hint={
                  <>
                    Availability varies by cloud provider, region and zone.{' '}
                    <HelpLink docKey="machine-types">
                      Machine types and availability
                    </HelpLink>
                  </>
                }
              >
                <SegmentedButton
                  id={`${id}-machine-type`}
                  className="pool-machine-type"
                  accessibleName="Machine type"
                  onSelectionChange={(event) => {
                    const value = event.detail.selectedItems[0]?.dataset.value;
                    const selected = machineTypes.find(
                      (t) => t.value === value,
                    );
                    // VM sizes differ per machine type, so reset to the first one.
                    if (selected) {
                      update({
                        machineType: selected,
                        VMSize: selected.VMSizeOptions[0],
                      });
                    }
                  }}
                >
                  {machineTypes.map(({ value }) => (
                    <SegmentedButtonItem
                      key={value}
                      data-value={value}
                      selected={value === machine.machineType.value}
                      tooltip={value}
                      accessibleName={value}
                    >
                      {/* Full names don't fit three-up on phones. */}
                      <span className="machine-type-long">{value}</span>
                      <span className="machine-type-short">
                        {value.split(' ')[0]}
                      </span>
                    </SegmentedButtonItem>
                  ))}
                </SegmentedButton>
              </Field>
            )}

            <Field
              label="VM size"
              htmlFor={`${id}-vm-size`}
              hint={
                <>
                  Kyma modules use part of each node&apos;s capacity.{' '}
                  <HelpLink docKey="module-sizing">Module sizing</HelpLink>
                </>
              }
            >
              <Select
                id={`${id}-vm-size`}
                className="vm-size-select"
                value={machine.VMSize.value}
                onChange={(event) => {
                  const selected = machine.machineType.VMSizeOptions.find(
                    ({ value }) => value === event.detail.selectedOption.value,
                  );
                  if (selected) update({ VMSize: selected });
                }}
              >
                {machine.machineType.VMSizeOptions.map((size) => (
                  <Option
                    key={size.value}
                    value={size.value}
                    additionalText={`${calculateDefaultVolumeSize(size.vcpus, size.memoryGib)} GiB disk · ${formatNumber(nodeHourlyRate(size.computeUnits, machine.machineType.multiple))} CU/h`}
                  >
                    {`${size.vcpus} vCPU · ${size.memoryGib} GiB RAM`}
                  </Option>
                ))}
              </Select>
            </Field>

            <Field
              label="Extra disk per node"
              htmlFor={`${id}-volume`}
              hint={
                <>
                  For container images and logs beyond the included{' '}
                  {includedVolume} GiB. Application data goes in Storage.{' '}
                  <HelpLink docKey="additional-volume">
                    About additional node disk
                  </HelpLink>
                </>
              }
              note={billedSizeNote(machine.additionalVolumeGib)}
            >
              <NumberInput
                id={`${id}-volume`}
                value={machine.additionalVolumeGib}
                setValue={(additionalVolumeGib) =>
                  update({ additionalVolumeGib })
                }
                min={AdditionalNodeVolume.Min}
                max={AdditionalNodeVolume.Max}
                step={AdditionalNodeVolume.Step}
                snapStep={REQUESTED_SIZE_STEP_GIB}
                unit="GiB"
              />
            </Field>
          </div>
        </PoolGroup>

        <PoolGroup title="Scaling">
          <div className="pool-fields">
            <Field
              label="Minimum nodes"
              htmlFor={`${id}-nodes`}
              hint={
                <>
                  You always pay for at least this many; scaling up adds
                  node-hours.{' '}
                  <HelpLink docKey="autoscaler-min">
                    How the minimum works
                  </HelpLink>
                </>
              }
            >
              <NumberInput
                id={`${id}-nodes`}
                value={machine.minAutoscaler}
                setValue={updateMin}
                min={isBase ? AutoScalerMin.Min : AutoScalerMin.MinWorkerNodes}
                max={AutoScalerMin.Max}
                step={AutoScalerMin.Step}
                unit="nodes"
              />
            </Field>

            <Field
              label="Maximum nodes"
              htmlFor={`${id}-max-nodes`}
              hint={
                <>
                  The autoscaler adds nodes up to this limit when load grows;
                  each one is billed for the hours it runs.{' '}
                  <HelpLink docKey="autoscaler-max">
                    How the maximum works
                  </HelpLink>
                </>
              }
            >
              <NumberInput
                id={`${id}-max-nodes`}
                value={machine.maxAutoscaler}
                setValue={(maxAutoscaler) => update({ maxAutoscaler })}
                min={machine.minAutoscaler}
                max={AutoScalerMax.Max}
                step={AutoScalerMax.Step}
                unit="nodes"
              />
            </Field>

            {/* Without room to scale, the load does not change the bill. */}
            {canScale && (
              <LoadProfileField
                id={id}
                percent={percent}
                hours={hours}
                setPercent={(loadPercent) => update({ loadPercent })}
              />
            )}
          </div>
        </PoolGroup>
        <Formula lines={formula} />
      </div>
    </Panel>
  );
}
