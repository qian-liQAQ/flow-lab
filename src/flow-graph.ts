export type FlowEdge = { from: string; to: string; cap: number; flow: number };
export type FlowSelection =
  | { type: 'node'; id: string }
  | { type: 'edge'; index: number }
  | null;

export const FLOW_EDGES: Omit<FlowEdge, 'flow'>[] = [
  { from: 'S', to: 'A', cap: 5 }, { from: 'S', to: 'B', cap: 4 },
  { from: 'A', to: 'C', cap: 3 }, { from: 'B', to: 'D', cap: 4 },
  { from: 'A', to: 'D', cap: 3 }, { from: 'C', to: 'T', cap: 3 },
  { from: 'D', to: 'T', cap: 5 },
];

const positions: Record<string, [number, number]> = {
  S: [70, 180], A: [230, 80], B: [230, 280],
  C: [420, 80], D: [420, 280], T: [575, 180],
};

export function nodeBalance(edges: FlowEdge[], node: string) {
  return {
    incoming: edges.filter(e => e.to === node).reduce((sum, e) => sum + e.flow, 0),
    outgoing: edges.filter(e => e.from === node).reduce((sum, e) => sum + e.flow, 0),
  };
}

export class FlowGraph {
  private edges: FlowEdge[] = [];
  private selected: FlowSelection = null;
  private svg: SVGSVGElement;
  private onSelect?: (selection: FlowSelection) => void;
  private onHover?: (selection: FlowSelection) => void;

  constructor(svg: SVGSVGElement, onSelect?: (selection: FlowSelection) => void, onHover?: (selection: FlowSelection) => void) {
    this.svg = svg;
    this.onSelect = onSelect;
    this.onHover = onHover;
  }

  setEdges(edges: FlowEdge[]) {
    this.edges = edges.map(e => ({ ...e }));
    this.selected = null;
    this.render();
  }

  private select(selection: FlowSelection) {
    this.selected = selection;
    this.render();
    this.onSelect?.(selection);
  }

  render() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg.replaceChildren();
    const make = (tag: string, attrs: Record<string, string>, label?: string) => {
      const el = document.createElementNS(ns, tag);
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
      if (label !== undefined) el.textContent = label;
      return el;
    };
    const defs = make('defs', {});
    const marker = make('marker', { id: 'flowgraph-arrow', markerWidth: '10', markerHeight: '10', refX: '8', refY: '3', orient: 'auto' });
    marker.append(make('path', { d: 'M0,0 L0,6 L9,3 z', fill: '#94a3b8' }));
    defs.append(marker);
    this.svg.append(defs);
    this.edges.forEach((e, i) => {
      const [x1, y1] = positions[e.from], [x2, y2] = positions[e.to];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * 29, sy = y1 + uy * 29;
      const ex = x2 - ux * 34, ey = y2 - uy * 34;
      const offset = e.from === 'A' && e.to === 'D' ? -17 : -14;
      const mx = (sx + ex) / 2 - uy * offset;
      const my = (sy + ey) / 2 + ux * offset;
      const active = this.selected?.type === 'edge' && this.selected.index === i;
      const group = make('g', { class: 'flowgraph-interactive', role: 'button', tabindex: '0', 'aria-label': `${e.from} 到 ${e.to}，流量 ${e.flow}，容量 ${e.cap}` });
      group.append(make('line', { x1: String(sx), y1: String(sy), x2: String(ex), y2: String(ey), stroke: 'transparent', 'stroke-width': '24' }));
      group.append(make('line', { x1: String(sx), y1: String(sy), x2: String(ex), y2: String(ey), stroke: active ? '#fbbf24' : '#64748b', 'stroke-width': active ? '5' : '3', 'marker-end': 'url(#flowgraph-arrow)', 'pointer-events': 'none' }));
      group.append(make('text', { x: String(mx), y: String(my), 'text-anchor': 'middle', class: 'edge-label', 'pointer-events': 'none' }, `${e.flow} / ${e.cap}`));
      group.addEventListener('mouseenter', () => this.onHover?.({ type: 'edge', index: i }));
      group.addEventListener('mouseleave', () => this.onHover?.(null));
      group.addEventListener('click', () => this.select({ type: 'edge', index: i }));
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.select({ type: 'edge', index: i }); }
      });
      this.svg.append(group);
    });
    Object.entries(positions).forEach(([id, [x, y]]) => {
      const active = this.selected?.type === 'node' && this.selected.id === id;
      const group = make('g', { class: 'flowgraph-interactive', role: 'button', tabindex: '0', 'aria-label': `查看节点 ${id}` });
      group.append(make('circle', { cx: String(x), cy: String(y), r: '27', fill: active ? '#334155' : '#1e293b', stroke: active ? '#fbbf24' : '#38bdf8', 'stroke-width': active ? '4' : '2' }));
      group.append(make('text', { x: String(x), y: String(y + 8), 'text-anchor': 'middle', class: 'node-label', 'pointer-events': 'none' }, id));
      group.addEventListener('mouseenter', () => this.onHover?.({ type: 'node', id }));
      group.addEventListener('mouseleave', () => this.onHover?.(null));
      group.addEventListener('click', () => this.select({ type: 'node', id }));
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.select({ type: 'node', id }); }
      });
      this.svg.append(group);
    });
  }
}
