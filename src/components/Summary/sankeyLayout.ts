// Minimal layout for a layered Sankey diagram: every node sits in a fixed
// column and links only go from one column to a later one. That is all the
// cost flow needs, so there is no iterative relaxation like in d3-sankey.

export interface SankeyNodeInput {
  id: string;
  column: number;
  // One entry per text line, the first one is the node's name.
  caption: string[];
  color: string;
  // OKLCH lightness offset from `color`, to tell apart nodes of one colour.
  shade?: number;
  // Neighbours from different groups get extra space between them.
  group?: string;
}

export interface SankeyLinkInput {
  source: string;
  target: string;
  value: number;
  // Defaults to the source node's colour and shade.
  color?: string;
  shade?: number;
}

export interface SankeyGraph {
  nodes: SankeyNodeInput[];
  links: SankeyLinkInput[];
}

export interface SankeyLayoutOptions {
  width: number;
  // Pixel height of the largest column's total value, without padding.
  valueHeight: number;
  nodeWidth: number;
  nodePadding: number;
  // Added to nodePadding between nodes of different groups.
  groupPadding?: number;
  // Room for the captions of the first and last column.
  marginLeft: number;
  marginRight: number;
  // Keeps tiny values visible; their links still use the true value.
  minNodeHeight?: number;
}

export interface SankeyNode extends SankeyNodeInput {
  value: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface SankeyLink extends SankeyLinkInput {
  color: string;
  shade?: number;
  width: number;
  path: string;
}

export interface SankeyLayout {
  width: number;
  height: number;
  columns: number;
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const round = (n: number) => Math.round(n * 100) / 100;

// A filled band between two vertical edges, with horizontal tangents at both
// ends so neighbouring bands never cross inside a node.
function ribbonPath(
  x0: number,
  x1: number,
  sy0: number,
  sy1: number,
  ty0: number,
  ty1: number,
) {
  const xm = (x0 + x1) / 2;
  const [a, b, c, d, e, f, m] = [x0, x1, sy0, sy1, ty0, ty1, xm].map(round);
  return (
    `M${a},${c}C${m},${c} ${m},${e} ${b},${e}` +
    `L${b},${f}C${m},${f} ${m},${d} ${a},${d}Z`
  );
}

export function layoutSankey(
  graph: SankeyGraph,
  options: SankeyLayoutOptions,
): SankeyLayout {
  const {
    width,
    valueHeight,
    nodeWidth,
    nodePadding,
    marginLeft,
    marginRight,
    minNodeHeight = 2,
    groupPadding = 0,
  } = options;

  const links = graph.links.filter(({ value }) => value > 0);
  const valueOf = (id: string) => {
    const sum = (key: 'source' | 'target') =>
      links
        .filter((link) => link[key] === id)
        .reduce((total, { value }) => total + value, 0);
    return Math.max(sum('source'), sum('target'));
  };

  const nodes: SankeyNode[] = graph.nodes
    .map((node) => ({
      ...node,
      value: valueOf(node.id),
      x0: 0,
      x1: 0,
      y0: 0,
      y1: 0,
    }))
    .filter(({ value }) => value > 0);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visibleLinks = links.filter(
    ({ source, target }) => byId.has(source) && byId.has(target),
  );

  if (nodes.length === 0) {
    return { width, height: 0, columns: 0, nodes: [], links: [] };
  }

  const columnCount = Math.max(...nodes.map(({ column }) => column)) + 1;
  const columns = Array.from({ length: columnCount }, (_, column) =>
    nodes.filter((node) => node.column === column),
  );

  const maxColumnValue = Math.max(
    ...columns.map((column) => column.reduce((t, { value }) => t + value, 0)),
  );
  const scale = valueHeight / maxColumnValue;
  const heightOf = (node: SankeyNode) =>
    Math.max(node.value * scale, minNodeHeight);
  const gapBefore = (column: SankeyNode[], index: number) => {
    if (index === 0) return 0;
    const [previous, node] = [column[index - 1], column[index]];
    return previous.group !== node.group
      ? nodePadding + groupPadding
      : nodePadding;
  };
  const columnHeight = (column: SankeyNode[]) =>
    column.reduce(
      (t, node, index) => t + gapBefore(column, index) + heightOf(node),
      0,
    );
  const height = Math.max(...columns.map(columnHeight));

  const span = width - marginLeft - marginRight - nodeWidth;
  columns.forEach((column, index) => {
    const x0 =
      marginLeft + (columnCount > 1 ? (span * index) / (columnCount - 1) : 0);
    let y = (height - columnHeight(column)) / 2;
    column.forEach((node, index) => {
      y += gapBefore(column, index);
      node.x0 = x0;
      node.x1 = x0 + nodeWidth;
      node.y0 = y;
      node.y1 = y + heightOf(node);
      y = node.y1;
    });
  });

  // Stack bands at each node in the order of the nodes at their other end, so
  // bands leave and enter without crossing each other.
  const sourceOffset = new Map(nodes.map((node) => [node.id, node.y0]));
  const targetOffset = new Map(nodes.map((node) => [node.id, node.y0]));
  const ends = visibleLinks.map((link) => {
    const source = byId.get(link.source)!;
    const target = byId.get(link.target)!;
    return { link, source, target, width: link.value * scale };
  });

  const sy = new Map<(typeof ends)[number], number>();
  [...ends]
    .sort((a, b) => a.target.y0 - b.target.y0)
    .forEach((end) => {
      const y = sourceOffset.get(end.source.id)!;
      sy.set(end, y);
      sourceOffset.set(end.source.id, y + end.width);
    });

  const ty = new Map<(typeof ends)[number], number>();
  [...ends]
    .sort((a, b) => a.source.y0 - b.source.y0)
    .forEach((end) => {
      const y = targetOffset.get(end.target.id)!;
      ty.set(end, y);
      targetOffset.set(end.target.id, y + end.width);
    });

  return {
    width,
    height,
    columns: columnCount,
    nodes,
    links: ends.map((end) => {
      const sy0 = sy.get(end)!;
      const ty0 = ty.get(end)!;
      return {
        ...end.link,
        color: end.link.color ?? end.source.color,
        shade: end.link.color ? end.link.shade : end.source.shade,
        width: end.width,
        path: ribbonPath(
          end.source.x1,
          end.target.x0,
          sy0,
          sy0 + end.width,
          ty0,
          ty0 + end.width,
        ),
      };
    }),
  };
}
