import { useAtom } from 'jotai';
import config from '../../../../config.json';
import { applyConversionRateState } from '../../../../state/additionalConfig/applyConversionRateState';
import RangeInput from '../common/RangeInput';
import SubHeader from '../../common/SubHeader';

export default function ConversionRateInput() {
  const [value, setValue] = useAtom(applyConversionRateState);

  return (
    <RangeInput
      header={
        <SubHeader
          title={`Conversion rate from Capacity Units to ${config.CurrencyCode}`}
        />
      }
      value={value}
      setValue={setValue}
      settings={config.ConversionRate}
      decimals={2}
      unit={`${config.CurrencyCode}/CU`}
    />
  );
}
