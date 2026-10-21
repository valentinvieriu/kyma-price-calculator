import { FlexBox, Title } from '@ui5/webcomponents-react';
import HelpLink, { DocumentationKey } from './HelpLink';

interface Props {
  title: string;
  docKey?: DocumentationKey;
}

export default function SubHeader({ title, docKey }: Props) {
  const header = (
    <Title className="wizard-subheader" level="H5" size="H5">
      {title}
    </Title>
  );
  if (!docKey) return header;

  return (
    <FlexBox
      wrap="NoWrap"
      alignItems="Center"
      fitContainer
      displayInline
      justifyContent="Start"
    >
      {header}
      <HelpLink docKey={docKey} />
    </FlexBox>
  );
}
