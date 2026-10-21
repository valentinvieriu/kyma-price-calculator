import { useAtomValue } from 'jotai';
import {
  Button,
  Option,
  Panel,
  SegmentedButton,
  SegmentedButtonItem,
  Select,
  Tag,
  Text,
  Title,
} from '@ui5/webcomponents-react';
import config from '../../config.json';
import { MachineSetup, MachineType } from '../../state/nodes/machineSetupState';
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
import PoolResources, { resourceSummary } from './PoolResources';
import { poolResources } from '../../calculatorFunctions/resources/calculateResources';
import './PoolPanel.css';

const machineTypes: MachineType[] = config.nodeConfig.MachineTypes;
const { AutoScalerMin, AdditionalNodeVolume } = config.nodeConfig;

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

export default function PoolPanel({
  id,
  title,
  pool,
  updateMachine,
  onRemove,
}: Props) {
  const { machine, computeCosts, volumeCosts } = pool;
  const isBase = !onRemove;
  const hours = useAtomValue(timeConsumptionState);
  const update = (changes: Partial<MachineSetup>) =>
    updateMachine({ ...machine, ...changes });

  const rate = nodeHourlyRate(
    machine.VMSize.computeUnits,
    machine.machineType.multiple,
  );
  const includedVolume = calculateDefaultVolumeSize(
    machine.VMSize.vcpus,
    machine.VMSize.memoryGib,
  );
  const extraBlocks = toBillableBlocks(machine.additionalVolumeGib);
  const nodes = plural(machine.minAutoscaler, 'node');

  const formula: FormulaLine[] = [
    {
      label: 'Nodes',
      expression: `${nodes} × ${formatNumber(rate)} CU/h × ${hours} h`,
      result: computeCosts,
    },
  ];
  if (extraBlocks > 0) {
    formula.push({
      label: 'Extra disk',
      expression: `${nodes} × ${plural(extraBlocks, 'block')} (${extraBlocks * STORAGE_BLOCK_SIZE_GIB} GiB) × ${formatNumber(NODE_VOLUME_BLOCK_HOURLY_RATE)} CU/h × ${hours} h`,
      result: volumeCosts,
      note: 'billed as storage',
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
            </span>
          </div>
          <span className="pool-header-cost">{formatCU(computeCosts)}</span>
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
        <div className="pool-fields">
          <Field
            label="Machine type"
            wide
            hint={
              isBase ? (
                'The base pool always runs General Purpose machines. Add a worker node pool to use another type.'
              ) : (
                <>
                  Types other than General Purpose are not available in every
                  region, cloud provider or zone.{' '}
                  <HelpLink docKey="machine-types">
                    Machine types and availability
                  </HelpLink>
                </>
              )
            }
          >
            {isBase ? (
              <Text className="pool-machine-type-fixed">
                {machine.machineType.value}
              </Text>
            ) : (
              <SegmentedButton
                id={`${id}-machine-type`}
                className="pool-machine-type"
                accessibleName="Machine type"
                onSelectionChange={(event) => {
                  const value = event.detail.selectedItems[0]?.dataset.value;
                  const selected = machineTypes.find((t) => t.value === value);
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
            )}
          </Field>

          <Field
            label="VM size"
            htmlFor={`${id}-vm-size`}
            hint={
              <>
                Kyma modules also run on these nodes and use part of their
                capacity.{' '}
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
            label="Minimum nodes"
            htmlFor={`${id}-nodes`}
            hint={
              <>
                Autoscaler minimum: you pay for at least this many nodes.
                Scaling above it adds node-hours.{' '}
                <HelpLink docKey="autoscaler-min">
                  How the minimum works
                </HelpLink>
              </>
            }
          >
            <NumberInput
              id={`${id}-nodes`}
              value={machine.minAutoscaler}
              setValue={(minAutoscaler) => update({ minAutoscaler })}
              min={isBase ? AutoScalerMin.Min : AutoScalerMin.MinWorkerNodes}
              max={AutoScalerMin.Max}
              step={AutoScalerMin.Step}
              unit="nodes"
            />
          </Field>

          <Field
            label="Extra disk per node"
            htmlFor={`${id}-volume`}
            hint={
              <>
                Each node&apos;s disk holds container images and logs. Add space
                if they need more than the included {includedVolume} GiB; for
                application data, use Storage.{' '}
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
        <PoolResources pool={machine} />
        <div>
          <div className="section-subheading">What you pay</div>
          <Formula lines={formula} />
        </div>
      </div>
    </Panel>
  );
}
