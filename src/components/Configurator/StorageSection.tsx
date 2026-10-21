import { PrimitiveAtom, useAtom, useAtomValue } from 'jotai';
import config from '../../config.json';
import {
  storageCostBreakdownAtom,
  storageCostsAtom,
} from '../../state/costState';
import { GiBQuantityState } from '../../state/storage/GiBQuantityState';
import { nfsGiBQuantityState } from '../../state/storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from '../../state/storage/snapshotGiBQuantityState';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { STORAGE_BLOCK_HOURLY_RATE } from '../../calculatorFunctions/rates';
import {
  REQUESTED_SIZE_STEP_GIB,
  STORAGE_BLOCK_SIZE_GIB,
  toBillableBlocks,
} from '../../calculatorFunctions/storageCosts/storageBlocks';
import { formatCU, formatNumber, plural } from '../../utils/format';
import provisionedNote from '../common/provisionedNote';
import Field from '../common/Field';
import Formula from '../common/Formula';
import HelpLink, { DocumentationKey } from '../common/HelpLink';
import NumberInput from '../common/NumberInput';
import Section from '../common/Section';
import './StorageSection.css';

const FREE_BLOCKS = config.Storage.FreeStorageBlocks;
const FREE_GIB = FREE_BLOCKS * STORAGE_BLOCK_SIZE_GIB;
const blockRate = `${formatNumber(STORAGE_BLOCK_HOURLY_RATE)} CU/h`;

interface RangeSettings {
  Min: number;
  Max: number;
  Step: number;
}

interface RowProps {
  id: string;
  label: string;
  hint: string;
  quantityAtom: PrimitiveAtom<number>;
  settings: RangeSettings;
  multiplier: number;
  freeBlocks: number;
  cost: number;
  docKey?: DocumentationKey;
}

function StorageRow({
  id,
  label,
  hint,
  quantityAtom,
  settings,
  multiplier,
  freeBlocks,
  cost,
  docKey,
}: RowProps) {
  const [gib, setGib] = useAtom(quantityAtom);
  const hours = useAtomValue(timeConsumptionState);
  const blocks = toBillableBlocks(gib);
  const billed = Math.max(0, blocks - freeBlocks);

  const blockCount =
    freeBlocks > 0 && blocks > 0
      ? `(${blocks} − ${freeBlocks} free) blocks`
      : plural(billed, 'block');
  const factor = multiplier !== 1 ? ` × ${multiplier}` : '';

  return (
    <div className="storage-row">
      <Field label={label} htmlFor={id} hint={hint} note={provisionedNote(gib)}>
        <div className="storage-row-control">
          <NumberInput
            id={id}
            value={gib}
            setValue={setGib}
            min={settings.Min}
            max={settings.Max}
            step={settings.Step}
            snapStep={REQUESTED_SIZE_STEP_GIB}
            unit="GiB"
          />
          {docKey && <HelpLink docKey={docKey} />}
        </div>
      </Field>
      {gib > 0 && (
        <Formula
          lines={[
            {
              expression: `${blockCount}${factor} × ${blockRate} × ${hours} h`,
              result: cost,
            },
          ]}
        />
      )}
    </div>
  );
}

export default function StorageSection() {
  const subtotal = useAtomValue(storageCostsAtom);
  const breakdown = useAtomValue(storageCostBreakdownAtom);

  return (
    <Section
      id="storage-section"
      title="Storage"
      subtitle={`Billed in ${STORAGE_BLOCK_SIZE_GIB} GiB blocks at ${blockRate} per block.`}
      subtotal={subtotal}
    >
      <div className="storage-rows">
        <StorageRow
          id="gib-quantity-input"
          label="Standard storage"
          hint={`Persistent volumes used by your workloads and modules. The first ${FREE_GIB} GiB are included for the cluster's operational data.`}
          quantityAtom={GiBQuantityState}
          settings={config.Storage}
          multiplier={1}
          freeBlocks={FREE_BLOCKS}
          cost={breakdown.standard}
        />
        <StorageRow
          id="nfs-gib-quantity-input"
          label="NFS storage"
          hint={`Shared file storage, billed at ${config.NFSStorage.multiplier}× the block price.`}
          quantityAtom={nfsGiBQuantityState}
          settings={config.NFSStorage}
          multiplier={config.NFSStorage.multiplier}
          freeBlocks={0}
          cost={breakdown.nfs}
          docKey="nfs"
        />
        <StorageRow
          id="snapshot-gib-quantity-input"
          label="Snapshot storage"
          hint="Space used by volume snapshots, billed at the block price without a free block."
          quantityAtom={snapshotGiBQuantityState}
          settings={config.SnapshotStorage}
          multiplier={config.SnapshotStorage.multiplier}
          freeBlocks={0}
          cost={breakdown.snapshot}
        />
      </div>
      {breakdown.nodeVolume > 0 && (
        <div className="storage-node-volume">
          Includes <strong>{formatCU(breakdown.nodeVolume)}</strong> for extra
          node disks configured in the worker node pools.
        </div>
      )}
    </Section>
  );
}
