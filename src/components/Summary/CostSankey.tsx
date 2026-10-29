import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { totalCostsAtom } from '../../state/costState';
import { applyConversionRateState } from '../../state/additionalConfig/applyConversionRateState';
import { costLineGroupsAtom } from './costLines';
import { buildCostFlow } from './costFlow';
import {
  layoutSankey,
  SankeyGraph,
  SankeyLayoutOptions,
  SankeyNode,
} from './sankeyLayout';
import './CostSankey.css';

type Detail = 'compact' | 'full';

const LINE_HEIGHT = { compact: 14, full: 18 };
const FONT_SIZE = { compact: 12, full: 14 };
// Average glyph width relative to the font size, for digits and lowercase.
const GLYPH_WIDTH = 0.55;
const LABEL_GAP = 8;

// Shading happens in CSS (see CostSankey.css), where browsers without
// relative colour syntax fall back to the plain colour.
const fillStyle = (color: string, shade = 0) =>
  ({ '--sankey-color': color, '--sankey-shade': shade }) as CSSProperties;

// Room for the outer captions, estimated from their longest line so long pool
// descriptions are not cut off, but never more than a share of the width.
function captionMargin(
  graph: SankeyGraph,
  column: number,
  detail: Detail,
  maxShare: number,
  width: number,
) {
  const longest = Math.max(
    0,
    ...graph.nodes
      .filter((node) => node.column === column)
      .flatMap(({ caption }) => caption.map((line) => line.length)),
  );
  const needed = longest * FONT_SIZE[detail] * GLYPH_WIDTH + LABEL_GAP * 2;
  return Math.round(Math.min(needed, width * maxShare));
}

function layoutOptions(
  graph: SankeyGraph,
  detail: Detail,
  width: number,
): SankeyLayoutOptions {
  const lastColumn = Math.max(0, ...graph.nodes.map(({ column }) => column));
  const margins = (left: number, right: number) => ({
    marginLeft: captionMargin(graph, 0, detail, left, width),
    marginRight: captionMargin(graph, lastColumn, detail, right, width),
  });
  return detail === 'compact'
    ? {
        width,
        valueHeight: 150,
        nodeWidth: 8,
        // Two caption lines of 14 px plus a little air.
        nodePadding: 32,
        groupPadding: 12,
        ...margins(0.45, 0.35),
      }
    : {
        width,
        valueHeight: 300,
        nodeWidth: 12,
        nodePadding: 42,
        groupPadding: 20,
        ...margins(0.38, 0.22),
      };
}

// SVG has no layout of its own, so track the container width to keep text at
// its normal size instead of scaling the whole drawing.
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function NodeLabel({
  node,
  columns,
  lineHeight,
}: {
  node: SankeyNode;
  columns: number;
  lineHeight: number;
}) {
  const first = node.column === 0;
  const x = first ? node.x0 - LABEL_GAP : node.x1 + LABEL_GAP;
  const middle = node.column > 0 && node.column < columns - 1;
  const top =
    (node.y0 + node.y1) / 2 - ((node.caption.length - 1) * lineHeight) / 2;
  return (
    <text
      className={`cost-sankey-label${middle ? ' cost-sankey-label--over' : ''}`}
      x={x}
      y={top}
      textAnchor={first ? 'end' : 'start'}
      dominantBaseline="middle"
    >
      {node.caption.map((line, index) => (
        <tspan
          key={index}
          x={x}
          dy={index === 0 ? 0 : lineHeight}
          className={index === 0 ? 'cost-sankey-name' : undefined}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}

// Where the cost comes from: each charge as a band whose width is its share
// of the total, flowing into its category (and in full detail on to the total
// and what you pay).
export default function CostSankey({ detail }: { detail: Detail }) {
  const groups = useAtomValue(costLineGroupsAtom);
  const totalCosts = useAtomValue(totalCostsAtom);
  const conversionRate = useAtomValue(applyConversionRateState);
  const [ref, width] = useWidth(detail === 'compact' ? 360 : 900);
  const [active, setActive] = useState<string | null>(null);

  const layout = useMemo(() => {
    const graph = buildCostFlow({ groups, totalCosts, conversionRate }, detail);
    return layoutSankey(graph, layoutOptions(graph, detail, width));
  }, [groups, totalCosts, conversionRate, detail, width]);

  // Captions are centred on their node and can reach past the drawing.
  const lineHeight = LINE_HEIGHT[detail];
  const inset = lineHeight;
  const height = layout.height + 2 * inset;

  const charges = layout.nodes.filter(({ column }) => column === 0);
  const description = `Cost flow: ${charges
    .map(({ caption }) => caption.join(' '))
    .join(', ')}.`;

  const isLit = (source: string, target: string, key: string) =>
    active === null || active === key || active === source || active === target;

  return (
    <div ref={ref} className={`cost-sankey cost-sankey--${detail}`}>
      {layout.nodes.length === 0 ? (
        <p className="cost-sankey-empty">No costs to show.</p>
      ) : (
        <svg
          role="img"
          aria-label={description}
          width={layout.width}
          height={height}
          viewBox={`0 ${-inset} ${layout.width} ${height}`}
          onMouseLeave={() => setActive(null)}
        >
          <g className="cost-sankey-links">
            {layout.links.map(
              ({ source, target, path, color, shade, value }) => {
                const key = `${source}->${target}`;
                return (
                  <path
                    key={key}
                    d={path}
                    style={fillStyle(color, shade)}
                    className={
                      isLit(source, target, key) ? undefined : 'cost-sankey-dim'
                    }
                    onMouseEnter={() => setActive(key)}
                  >
                    <title>{`${value.toFixed(2)} CU`}</title>
                  </path>
                );
              },
            )}
          </g>
          <g className="cost-sankey-nodes">
            {layout.nodes.map((node) => (
              <rect
                key={node.id}
                x={node.x0}
                y={node.y0}
                width={node.x1 - node.x0}
                height={node.y1 - node.y0}
                rx={2}
                style={fillStyle(node.color, node.shade)}
                onMouseEnter={() => setActive(node.id)}
              >
                <title>{node.caption.join('\n')}</title>
              </rect>
            ))}
          </g>
          <g aria-hidden="true">
            {layout.nodes.map((node) => (
              <NodeLabel
                key={node.id}
                node={node}
                columns={layout.columns}
                lineHeight={lineHeight}
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}
