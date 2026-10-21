import { ReactNode } from 'react';
import { PrimitiveAtom, useAtom, useAtomValue } from 'jotai';
import { Label, Tag } from '@ui5/webcomponents-react';
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
import billedSizeNote from '../common/billedSizeNote';
import Formula from '../common/Formula';
import HelpLink from '../common/HelpLink';
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
  // How workloads can use this storage, e.g. "Shared across workloads".
  access: string;
  description: ReactNode;
  quantityAtom: PrimitiveAtom<number>;
  settings: RangeSettings;
  multiplier: number;
  freeBlocks: number;
  cost: number;
}

// One storage type: what it is on the left, how much and what it costs on the
// right.
function StorageRow({
  id,
  label,
  access,
  description,
  quantityAtom,
  settings,
  multiplier,
  freeBlocks,
  cost,
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
  const note = billedSizeNote(gib);

  return (
    <div className="storage-row">
      <div className="storage-row-about">
        <div className="storage-row-title">
          <Label for={id} wrappingType="Normal">
            {label}
          </Label>
          <Tag design="Neutral" hideStateIcon>
            {access}
          </Tag>
        </div>
        <div className="storage-row-description">{description}</div>
      </div>
      <div className="storage-row-amount">
        <NumberInput
          id={id}
          value={gib}
          setValue={setGib}
          min={settings.Min}
          max={settings.Max}
          step={settings.Step}
          snapStep={REQUESTED_SIZE_STEP_GIB}
          unit="GiB"
          accessibleName={label}
        />
        {note && <div className="field-note">{note}</div>}
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
      subtitle={`Volumes your applications keep their data on, billed in ${STORAGE_BLOCK_SIZE_GIB} GiB blocks at ${blockRate} per block.`}
      subtotal={subtotal}
      optional
    >
      <div className="storage-rows">
        <StorageRow
          id="gib-quantity-input"
          label="Standard storage"
          access="One workload per volume"
          description={
            <>
              Persistent disk volumes for application data, requested with
              persistent volume claims (PVCs). Each volume is used by a single
              workload. The first {FREE_GIB} GiB are included for the
              cluster&apos;s operational data.{' '}
              <HelpLink docKey="persistent-storage">
                Managing persistent storage
              </HelpLink>
            </>
          }
          quantityAtom={GiBQuantityState}
          settings={config.Storage}
          multiplier={1}
          freeBlocks={FREE_BLOCKS}
          cost={breakdown.standard}
        />
        <StorageRow
          id="nfs-gib-quantity-input"
          label="NFS storage"
          access="Shared across workloads"
          description={
            <>
              Network file storage that several workloads, on any node, can use
              at the same time. Provided by the Cloud Manager module and billed
              at {config.NFSStorage.multiplier}× the block price.{' '}
              <HelpLink docKey="nfs">About NFS storage</HelpLink>
            </>
          }
          quantityAtom={nfsGiBQuantityState}
          settings={config.NFSStorage}
          multiplier={config.NFSStorage.multiplier}
          freeBlocks={0}
          cost={breakdown.nfs}
        />
        <StorageRow
          id="snapshot-gib-quantity-input"
          label="Snapshot storage"
          access="Copies of volumes"
          description={
            <>
              Point-in-time copies of your volumes, for example as backups.
              Billed at the block price, without a free block.{' '}
              <HelpLink docKey="volume-snapshots">
                About volume snapshots
              </HelpLink>
            </>
          }
          quantityAtom={snapshotGiBQuantityState}
          settings={config.SnapshotStorage}
          multiplier={config.SnapshotStorage.multiplier}
          freeBlocks={0}
          cost={breakdown.snapshot}
        />
      </div>
      {breakdown.nodeVolume > 0 && (
        <div className="storage-node-volume">
          Also counted here: <strong>{formatCU(breakdown.nodeVolume)}</strong>{' '}
          for extra node disk set in the worker node pools. Node disks hold
          container images and logs, not application data.
        </div>
      )}
    </Section>
  );
}
