import StepButton from '../Buttons/StepButton';
import DownloadButton from '../Buttons/DownloadButton';
import { ExportFormat } from '../Functions/exportToFile';
import ConversionRateInput from '../UserInputs/additionalConfig/ConversionRateInput';
import Redis from '../UserInputs/additionalConfig/RedisSelect';
import InfoField from '../common/InfoField';
import { WizardStep, Title } from '@ui5/webcomponents-react';
import config from '../../../config.json';

export default function AdditionalConfigStep() {
  const conversionRateInfo = (
    <>
      <div>
        With the <strong>conversion rate</strong>, you can change the amount of{' '}
        <strong>{config.CurrencyCode}</strong> you pay for{' '}
        <strong>1 Capacity Unit</strong>. This helps you calculate possible
        discounts.
      </div>
      <div>
        If you are unsure about how to change the default value (
        {config.ConversionRate.Default.toFixed(2)}), ask your SAP Sales
        Specialist.
      </div>
    </>
  );

  return (
    <WizardStep disabled titleText="Additional Services">
      <Title wrappingType="Normal" level="H2" size="H2">
        4. Add services and set the conversion rate
      </Title>
      <InfoField info={conversionRateInfo} />
      <div className="StepContent">
        <ConversionRateInput />
        <Redis />
      </div>
      <div className="ButtonContainer">
        <StepButton direction="previous" />
        <div className="DownloadButtonContainer">
          <DownloadButton format={ExportFormat.CSV} />
          <DownloadButton format={ExportFormat.XLSX} />
        </div>
      </div>
    </WizardStep>
  );
}
