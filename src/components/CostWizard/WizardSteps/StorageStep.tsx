import { Title, WizardStep } from '@ui5/webcomponents-react';
import StepButton from '../Buttons/StepButton';
import StorageQuantityInput from '../UserInputs/storage/StorageQuantityInput';
import InfoField from '../common/InfoField';
import { GiBQuantityState } from '../../../state/storage/GiBQuantityState';
import { nfsGiBQuantityState } from '../../../state/storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from '../../../state/storage/snapshotGiBQuantityState';
import config from '../../../config.json';

export default function StorageStep() {
  const storageInfo = (
    <div>
      By default, the first{' '}
      <strong>
        {config.Storage.Step * config.Storage.FreeStorageBlocks} GiB
      </strong>{' '}
      of standard storage is included at no additional cost, covering the
      cluster's operational data. Storage beyond that amount is billed in blocks
      of <strong>{config.Storage.Step} GiB</strong>. NFS storage is billed at{' '}
      {config.NFSStorage.multiplier} times the standard storage price. Snapshot
      storage is the space used by volume snapshots and is billed at the
      standard price, without a free block.
    </div>
  );

  return (
    <WizardStep disabled titleText="Storage">
      <Title wrappingType="Normal" level="H2" size="H2">
        3. Add storage for the cluster
      </Title>
      <InfoField info={storageInfo} />
      <div className="StepContent">
        <StorageQuantityInput
          id="gib-quantity-input"
          title="Standard Storage: number of GiB"
          quantityAtom={GiBQuantityState}
          settings={config.Storage}
        />
        <StorageQuantityInput
          id="nfs-gib-quantity-input"
          title="NFS Storage: number of GiB"
          quantityAtom={nfsGiBQuantityState}
          settings={config.NFSStorage}
          docKey="nfs"
        />
        <StorageQuantityInput
          id="snapshot-gib-quantity-input"
          title="Snapshot Storage: number of GiB"
          quantityAtom={snapshotGiBQuantityState}
          settings={config.SnapshotStorage}
        />
      </div>

      <div className="ButtonContainer">
        <StepButton direction="previous" />
        <StepButton direction="next" />
      </div>
    </WizardStep>
  );
}
