import { Link } from '@ui5/webcomponents-react';
import config from '../../config.json';

export type DocumentationKey = keyof typeof config.documentationUrls;

interface Props {
  docKey: DocumentationKey;
  // Says what the page explains, e.g. "About NFS storage".
  children: string;
}

// Opens SAP Help in a new tab, so the configuration stays in place.
export default function HelpLink({ docKey, children }: Props) {
  return (
    <Link
      href={config.documentationUrls[docKey]}
      target="_blank"
      endIcon="action"
      wrappingType="Normal"
    >
      {children}
    </Link>
  );
}
