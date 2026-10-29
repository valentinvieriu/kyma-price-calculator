import { useAtomValue } from 'jotai';
import {
  List,
  ListItemGroup,
  ListItemStandard,
} from '@ui5/webcomponents-react';
import { formatCU } from '../../utils/format';
import { costLineGroupsAtom } from './costLines';

// Every billed item, grouped like the configuration sections.
export default function CostBreakdown() {
  const groups = useAtomValue(costLineGroupsAtom);

  return (
    <List accessibleName="Cost breakdown" separators="Inner">
      {groups
        .filter(({ lines }) => lines.length > 0)
        .map(({ header, lines }) => (
          <ListItemGroup key={header} headerText={header}>
            {lines.map(({ text, description, cu }) => (
              <ListItemStandard
                key={text}
                type="Inactive"
                text={text}
                description={description}
                additionalText={formatCU(cu)}
              />
            ))}
          </ListItemGroup>
        ))}
    </List>
  );
}
