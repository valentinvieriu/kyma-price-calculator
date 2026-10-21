import { PrimitiveAtom, useAtom } from 'jotai';
import RangeInput, { RangeSettings } from '../common/RangeInput';
import SubHeader from '../../common/SubHeader';
import { DocumentationKey } from '../../common/HelpLink';

interface Props {
  id: string;
  title: string;
  quantityAtom: PrimitiveAtom<number>;
  settings: RangeSettings;
  docKey?: DocumentationKey;
}

export default function StorageQuantityInput({
  id,
  title,
  quantityAtom,
  settings,
  docKey,
}: Props) {
  const [quantity, setQuantity] = useAtom(quantityAtom);

  return (
    <RangeInput
      id={id}
      header={<SubHeader title={title} docKey={docKey} />}
      value={quantity}
      setValue={setQuantity}
      settings={settings}
      unit="GiB"
    />
  );
}
