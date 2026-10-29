import { describe, expect, test } from 'vitest';
import { layoutSankey, SankeyGraph, SankeyLayoutOptions } from './sankeyLayout';

const options: SankeyLayoutOptions = {
  width: 300,
  valueHeight: 100,
  nodeWidth: 10,
  nodePadding: 20,
  marginLeft: 50,
  marginRight: 40,
  minNodeHeight: 0,
};

const node = (id: string, column: number) => ({
  id,
  column,
  caption: [id],
  color: 'red',
});

const graph: SankeyGraph = {
  nodes: [node('a', 0), node('b', 0), node('c', 0), node('x', 1), node('y', 1)],
  links: [
    { source: 'a', target: 'x', value: 30 },
    { source: 'b', target: 'x', value: 20 },
    { source: 'c', target: 'y', value: 50 },
  ],
};

describe('layoutSankey', () => {
  const layout = layoutSankey(graph, options);
  const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

  test('sizes nodes by the larger of their in- and outflow', () => {
    expect(byId.x.value).toBe(50);
    expect(byId.a.y1 - byId.a.y0).toBe(30);
    expect(byId.y.y1 - byId.y.y0).toBe(50);
  });

  test('places columns between the margins', () => {
    expect(byId.a.x0).toBe(50);
    expect(byId.x.x1).toBe(300 - 40);
  });

  test('takes the height of the tallest column including padding', () => {
    // Three charges: 100 px of value plus two gaps.
    expect(layout.height).toBe(140);
    // Two categories are centred in that height.
    expect(byId.x.y0).toBe(10);
  });

  test('stacks bands at a node without overlap', () => {
    const [ax, bx] = layout.links;
    expect(ax.width).toBe(30);
    expect(bx.width).toBe(20);
    // Both enter x: a's band on top, b's right below it.
    expect(ax.path).toContain(`${byId.x.x0},${byId.x.y0}`);
    expect(bx.path).toContain(`${byId.x.x0},${byId.x.y0 + 30}`);
  });

  test('drops zero-value links and nodes left without flow', () => {
    const result = layoutSankey(
      {
        nodes: [...graph.nodes, node('z', 0)],
        links: [...graph.links, { source: 'z', target: 'y', value: 0 }],
      },
      options,
    );
    expect(result.nodes.map(({ id }) => id)).not.toContain('z');
    expect(result.links).toHaveLength(3);
  });

  test('returns an empty layout when nothing costs anything', () => {
    const result = layoutSankey({ nodes: graph.nodes, links: [] }, options);
    expect(result).toMatchObject({ height: 0, nodes: [], links: [] });
  });

  test('adds group padding between nodes of different groups', () => {
    const grouped = layoutSankey(
      {
        nodes: graph.nodes.map((n) =>
          n.id === 'c' ? { ...n, group: 'g2' } : { ...n, group: 'g1' },
        ),
        links: graph.links,
      },
      { ...options, groupPadding: 10 },
    );
    const at = Object.fromEntries(grouped.nodes.map((n) => [n.id, n]));
    expect(at.b.y0 - at.a.y1).toBe(20);
    expect(at.c.y0 - at.b.y1).toBe(30);
    expect(grouped.height).toBe(150);
  });

  test('links take the source shade unless they set their own colour', () => {
    const shaded = layoutSankey(
      {
        nodes: [{ ...node('s', 0), shade: -0.1 }, node('t', 1), node('u', 1)],
        links: [
          { source: 's', target: 't', value: 1 },
          { source: 's', target: 'u', value: 1, color: 'blue' },
        ],
      },
      options,
    );
    expect(shaded.links.map(({ shade }) => shade)).toEqual([-0.1, undefined]);
  });

  test('keeps tiny values visible with a minimum node height', () => {
    const result = layoutSankey(
      {
        nodes: [node('big', 0), node('tiny', 0), node('sum', 1)],
        links: [
          { source: 'big', target: 'sum', value: 1000 },
          { source: 'tiny', target: 'sum', value: 0.01 },
        ],
      },
      { ...options, minNodeHeight: 2 },
    );
    const tiny = result.nodes.find(({ id }) => id === 'tiny')!;
    expect(tiny.y1 - tiny.y0).toBe(2);
  });
});
