import { Icon } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/inspect.js';
import './HelpLink.css';
import config from '../../../config.json';

export type DocumentationKey = keyof typeof config.documentationUrls;

interface Props {
  docKey: DocumentationKey;
}

export default function HelpLink({ docKey }: Props) {
  return (
    <Icon
      className="help-portal-link"
      design="Information"
      mode="Interactive"
      name="inspect"
      accessibleName="Open documentation"
      onClick={() =>
        window.open(
          config.documentationUrls[docKey],
          '_blank',
          'noopener,noreferrer',
        )
      }
    />
  );
}
