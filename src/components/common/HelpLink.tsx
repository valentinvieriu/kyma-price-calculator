import { Link } from '@ui5/webcomponents-react';
import config from '../../config.json';

export type DocumentationKey = keyof typeof config.documentationUrls;

interface Props {
  docKey: DocumentationKey;
  // Says what the page explains, e.g. "About NFS storage".
  children: string;
  // For links standing on their own, e.g. next to a button: quieter than the
  // controls around them. Links inside a sentence keep the default design.
  subtle?: boolean;
}

// Opens SAP Help in a new tab, so the configuration stays in place.
export default function HelpLink({ docKey, children, subtle }: Props) {
  return (
    <Link
      design={subtle ? 'Subtle' : 'Default'}
      href={config.documentationUrls[docKey]}
      target="_blank"
      endIcon="action"
      wrappingType="Normal"
    >
      {children}
    </Link>
  );
}
