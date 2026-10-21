import { ReactNode } from 'react';
import { PrimitiveAtom, useAtom, useAtomValue } from 'jotai';
import { Label, Link } from '@ui5/webcomponents-react';
import config from '../../config.json';
import {
  machineSetupsAtom,
  storageCostBreakdownAtom,
  storageCostsAtom,
} from '../../state/costState';
import { GiBQuantityState } from '../../state/storage/GiBQuantityState';
import { nfsGiBQuantityState } from '../../state/storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from '../../state/storage/snapshotGiBQuantityState';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { STORAGE_BLOCK_HOURLY_RATE } from '../../calculatorFunctions/rates';
import { clusterResources } from '../../calculatorFunctions/resources/calculateResources';
import {
  REQUESTED_SIZE_STEP_GIB,
  STORAGE_BLOCK_SIZE_GIB,
  toBillableBlocks,
} from '../../calculatorFunctions/storageCosts/storageBlocks';
import { formatCU, formatNumber, plural } from '../../utils/format';
import scrollToElement from '../../utils/scrollTo';
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

// The storage kinds differ in how applications use them, so the section is
// split into groups, each showing its share of the storage subtotal.
function StorageGroup({
  title,
  subtotal,
  children,
}: {
  title: string;
  subtotal: number;
  children: ReactNode;
}) {
  return (
    <section className="storage-group" aria-label={title}>
      <div className="storage-group-header">
        <span className="section-subheading">{title}</span>
        <span className="storage-group-subtotal">{formatCU(subtotal)}</span>
      </div>
      {children}
    </section>
  );
}

interface AboutProps {
  id?: string;
  label: string;
  // How applications can use this storage, e.g. "Shared across nodes".
  usage: string;
  description: ReactNode;
}

function StorageAbout({ id, label, usage, description }: AboutProps) {
  return (
    <div className="storage-row-about">
      <div className="storage-row-title">
        <Label for={id} wrappingType="Normal">
          {label}
        </Label>
        <span className="storage-row-usage">{usage}</span>
      </div>
      <div className="storage-row-description">{description}</div>
    </div>
  );
}

interface RowProps extends AboutProps {
  id: string;
  // What to enter, e.g. "Total volume capacity".
  quantityLabel: string;
  quantityAtom: PrimitiveAtom<number>;
  settings: RangeSettings;
  multiplier: number;
  freeBlocks: number;
  cost: number;
}

// One storage kind: what it is on the left, how much and what it costs on the
// right.
function StorageRow({
  quantityLabel,
  quantityAtom,
  settings,
  multiplier,
  freeBlocks,
  cost,
  ...about
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
      <StorageAbout {...about} />
      <div className="storage-row-amount">
        <span className="storage-quantity-label">{quantityLabel}</span>
        <NumberInput
          id={about.id}
          value={gib}
          setValue={setGib}
          min={settings.Min}
          max={settings.Max}
          step={settings.Step}
          snapStep={REQUESTED_SIZE_STEP_GIB}
          unit="GiB"
          accessibleName={`${about.label}: ${quantityLabel}`}
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

// Extra node disk is billed as storage but configured per node pool; shown
// here read-only so the storage subtotal adds up.
function NodeDiskRow() {
  const resources = clusterResources(useAtomValue(machineSetupsAtom));

  return (
    <div className="storage-row">
      <StorageAbout
        label="Extra node disk"
        usage="Per node"
        description={
          <>
            Each node&apos;s own disk holds container images and logs, not
            application data. Only disk beyond what each VM size includes is
            billed.
          </>
        }
      />
      <div className="storage-row-amount">
        <span className="storage-quantity-label">From worker node pools</span>
        <span className="storage-node-disk-value">
          {formatNumber(resources.extraDiskGib)} GiB extra across{' '}
          {plural(resources.nodes, 'node')}
        </span>
        <Link
          onClick={() =>
            scrollToElement('node-pools-section', { block: 'start' })
          }
        >
          Edit in worker node pools
        </Link>
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
      subtitle={`Where your applications keep data, and copies of it. Billed in ${STORAGE_BLOCK_SIZE_GIB} GiB blocks at ${blockRate} per block.`}
      subtotal={subtotal}
      optional
    >
      <StorageGroup
        title="Application data"
        subtotal={breakdown.standard + breakdown.nfs}
      >
        <StorageRow
          id="gib-quantity-input"
          label="Persistent volumes"
          usage="Attached to one node at a time"
          description={
            <>
              Disk volumes your applications request with a persistent volume
              claim (PVC). Pods on the same node can share one. The first{' '}
              {FREE_GIB} GiB are free and used by the cluster for its own
              operational data.{' '}
              <HelpLink docKey="persistent-volumes">
                Persistent volumes (Kubernetes)
              </HelpLink>
            </>
          }
          quantityLabel={`Total volume capacity, including the cluster's ${FREE_GIB} GiB`}
          quantityAtom={GiBQuantityState}
          settings={config.Storage}
          multiplier={1}
          freeBlocks={FREE_BLOCKS}
          cost={breakdown.standard}
        />
        <StorageRow
          id="nfs-gib-quantity-input"
          label="Shared file storage (NFS)"
          usage="Shared across nodes"
          description={
            <>
              One volume that applications on any node can mount at the same
              time; count each shared volume once. Needs the Cloud Manager
              module and is available on AWS and Google Cloud. Billed at{' '}
              {config.NFSStorage.multiplier}× the block price.{' '}
              <HelpLink docKey="nfs">Create shared NFS storage</HelpLink>
            </>
          }
          quantityLabel="Total shared capacity"
          quantityAtom={nfsGiBQuantityState}
          settings={config.NFSStorage}
          multiplier={config.NFSStorage.multiplier}
          freeBlocks={0}
          cost={breakdown.nfs}
        />
      </StorageGroup>

      <StorageGroup title="Backups" subtotal={breakdown.snapshot}>
        <StorageRow
          id="snapshot-gib-quantity-input"
          label="Volume snapshots"
          usage="Copies, not live capacity"
          description={
            <>
              Kyma doesn&apos;t back up volume data automatically; snapshots are
              the recommended way. They are point-in-time copies of persistent
              volumes on AWS, Azure and Google Cloud; NFS storage isn&apos;t
              covered.{' '}
              <HelpLink docKey="volume-snapshots">
                Create a volume snapshot
              </HelpLink>
            </>
          }
          quantityLabel="Retained snapshot storage"
          quantityAtom={snapshotGiBQuantityState}
          settings={config.SnapshotStorage}
          multiplier={config.SnapshotStorage.multiplier}
          freeBlocks={0}
          cost={breakdown.snapshot}
        />
      </StorageGroup>

      <StorageGroup
        title="Node disks · set in worker node pools"
        subtotal={breakdown.nodeVolume}
      >
        <NodeDiskRow />
      </StorageGroup>
    </Section>
  );
}
