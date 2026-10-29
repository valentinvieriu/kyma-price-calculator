import type { TotalCosts } from '../../calculatorFunctions/totalCosts/calculateTotalCosts';
import { formatCU, formatCurrency } from '../../utils/format';
import type { CostLineGroup } from './costLines';
import type {
  SankeyGraph,
  SankeyLinkInput,
  SankeyNodeInput,
} from './sankeyLayout';

export const TOTAL_COLOR = 'var(--sapNeutralColor, #788fa6)';
export const PAY_COLOR = 'var(--sapBrandColor, #0070f2)';
export const DISCOUNT_COLOR = 'var(--sapPositiveColor, #256f3a)';

export interface CostFlowInput {
  groups: CostLineGroup[];
  totalCosts: TotalCosts;
  conversionRate: number;
}

// Compact: each charge flowing into its category, sized for the summary card.
// Full: continues into the CU total and splits it into what you pay and the
// discount from a price per CU below 1, like docs/pricing-explained.md.
export function buildCostFlow(
  { groups, totalCosts, conversionRate }: CostFlowInput,
  detail: 'compact' | 'full',
): SankeyGraph {
  const full = detail === 'full';
  const nodes: SankeyNodeInput[] = [];
  const links: SankeyLinkInput[] = [];

  groups.forEach(({ id, header, color, lines }) => {
    const categoryCU = lines.reduce((total, { cu }) => total + cu, 0);
    nodes.push({
      id,
      column: 1,
      caption: full ? [header, formatCU(categoryCU)] : [header],
      color,
    });
    lines.forEach(({ text, shortText, description, cu, shade }, index) => {
      const lineId = `${id}/${index}`;
      nodes.push({
        id: lineId,
        column: 0,
        caption: full
          ? [text, `${description} · ${formatCU(cu)}`]
          : [shortText ?? text, formatCU(cu)],
        color,
        shade,
        group: id,
      });
      links.push({ source: lineId, target: id, value: cu });
    });
    if (full) links.push({ source: id, target: 'total', value: categoryCU });
  });

  if (!full) return { nodes, links };

  const { CU, CC } = totalCosts;
  const discounted = conversionRate < 1;
  nodes.push(
    {
      id: 'total',
      column: 2,
      caption: ['Total usage', formatCU(CU)],
      color: TOTAL_COLOR,
    },
    {
      id: 'pay',
      column: 3,
      caption: [
        'You pay',
        formatCurrency(CC),
        `at ${formatCurrency(conversionRate)} per CU`,
      ],
      color: PAY_COLOR,
    },
  );
  // A price per CU above 1 can't be shown as a split of the CU total, so the
  // whole total flows into what you pay and the caption carries the price.
  links.push({
    source: 'total',
    target: 'pay',
    value: discounted ? CC : CU,
    color: PAY_COLOR,
  });
  if (discounted) {
    nodes.push({
      id: 'discount',
      column: 3,
      caption: ['Discount', formatCurrency(CU - CC)],
      color: DISCOUNT_COLOR,
    });
    links.push({
      source: 'total',
      target: 'discount',
      value: CU - CC,
      color: DISCOUNT_COLOR,
    });
  }

  return { nodes, links };
}
