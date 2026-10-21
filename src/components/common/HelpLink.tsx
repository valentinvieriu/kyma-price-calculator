import { Link } from '@ui5/webcomponents-react';
import config from '../../config.json';

export type DocumentationKey = keyof typeof config.documentationUrls;

interface Props {
  docKey: DocumentationKey;
  slot?: string;
}

export default function HelpLink({ docKey, slot }: Props) {
  return (
    <Link
      slot={slot}
      href={config.documentationUrls[docKey]}
      target="_blank"
      endIcon="action"
    >
      Documentation
    </Link>
  );
}
