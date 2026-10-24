import { FlowGraph, FLOW_EDGES } from './flow-graph';
import { showFordFulkersonLesson } from './ford-fulkerson-lesson';

type ResidualEdge = {
  from: string;
  to: string;
  capacity: number;
  originalIndex: number;
  reverse: boolean;
};

const positions: Record<string, [number, number]> = {
  S: [70, 180], A: [230, 80], B: [230, 280],
  C: [420, 80], D: [420, 280], T: [575, 180],
};
const initial = [5, 2, 2, 2, 3, 2, 5];
const ns = 'http://www.w3.org/2000/svg';

function element(tag: string, attributes: Record<string, string>, text?: string): SVGElement {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function showResidualNetworkLesson(app: HTMLDivElement, back: () => void) {
  let flows = [...initial];
  let selectedOriginal: number | null = null;
  let fullView = false;
  let path: ResidualEdge[] = [];
  let finished = false;

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content">
      <button id="back-button" class="text-button">← 返回第六节</button>
      <div class="lesson-meta">第二章 · 残量网络 / 07</div>
      <h1>整张网络还允许怎样调整？</h1>
      <p class="question">左侧是流量为 7 的阻塞案例。点击一条原边，观察右侧对应的残量方向；然后尝试沿残量网络找到 S 到 T 的路径。</p>
      <div class="residual-dual">
        <section class="graph-panel residual-dual-panel">
          <h2>原网络 <span id="original-total">总流量 7</span></h2>
          <svg id="residual-original" class="flow-graph" viewBox="0 0 650 360" aria-label="原网络，点击边查看残量方向"></svg>
        </section>
        <section class="graph-panel residual-dual-panel">
          <h2>残量网络</h2>
          <svg id="residual-network" class="flow-graph" viewBox="0 0 650 360" aria-label="残量网络，点击边组成增广路径"></svg>
        </section>
      </div>
      <section class="discovery greedy-prompt" aria-live="polite">
        <strong>探索问题</strong>
        <p id="residual-message">先点击左图的 A → D，观察它对应的残量方向。</p>
        <p id="residual-selection">尚未选中原边。</p>
        <button id="residual-show-all" class="secondary-button">显示完整残量网络</button>
      </section>
      <div class="lesson-actions">
        <button id="residual-augment" class="primary-button" disabled>沿残量路径增广</button>
        <button id="residual-undo" class="secondary-button">撤销选边</button>
        <button id="residual-clear" class="secondary-button">清空路径</button>
        <button id="residual-reset" class="secondary-button">重置实验</button>
      </div>
      <div class="residual-status">
        <span id="residual-path">当前路径：S</span>
        <span id="residual-bottleneck">瓶颈容量：—</span>
      </div>
      <section class="history-panel"><h2>探索记录</h2><ol id="residual-history"><li>预设状态：S → A → D → T 增广 3，另外两条路径各增广 2，总流量为 7。</li></ol></section>
      <section id="residual-summary" class="discovery" hidden>
        <strong>完成：残量网络中的一次增广</strong>
        <p>你沿残量路径增加了 1 单位流量，总流量达到 8。正向残量边使原流量增加，反向残量边使原流量减少。</p>
        <p>接下来可以将「寻找残量路径 → 计算瓶颈 → 增广」反复执行，这正是 Ford–Fulkerson 方法的核心。</p>
      </section>
      <button id="residual-next" class="secondary-button">下一节：Ford–Fulkerson →</button>
    </div></main>
  `;

  const get = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
  const originalSvg = get<SVGSVGElement>('residual-original');
  const residualSvg = get<SVGSVGElement>('residual-network');
  const message = get<HTMLElement>('residual-message');
  const selection = get<HTMLElement>('residual-selection');
  const pathLabel = get<HTMLElement>('residual-path');
  const bottleneckLabel = get<HTMLElement>('residual-bottleneck');
  const augmentButton = get<HTMLButtonElement>('residual-augment');
  const allButton = get<HTMLButtonElement>('residual-show-all');
  const log = get<HTMLOListElement>('residual-history');

  const originalGraph = new FlowGraph(originalSvg, selected => {
    if (selected?.type !== 'edge') return;
    selectedOriginal = selected.index;
    const edge = FLOW_EDGES[selectedOriginal];
    const forward = edge.cap - flows[selectedOriginal];
    const reverse = flows[selectedOriginal];
    selection.textContent = `${edge.from} → ${edge.to}：正向剩余 ${forward}，反向可撤回 ${reverse}。`;
    message.textContent = '右侧高亮了这条原边对应的非零残量方向。也可以显示完整网络进行增广。';
    render();
  });

  function residualEdges(): ResidualEdge[] {
    const result: ResidualEdge[] = [];
    FLOW_EDGES.forEach((edge, index) => {
      if (edge.cap > flows[index]) result.push({
        from: edge.from, to: edge.to, capacity: edge.cap - flows[index],
        originalIndex: index, reverse: false,
      });
      if (flows[index] > 0) result.push({
        from: edge.to, to: edge.from, capacity: flows[index],
        originalIndex: index, reverse: true,
      });
    });
    return result;
  }

  function currentNode() {
    return path.length ? path[path.length - 1].to : 'S';
  }
  function bottleneck() {
    return path.length ? Math.min(...path.map(edge => edge.capacity)) : 0;
  }
  function note(text: string) {
    const li = document.createElement('li');
    li.textContent = text;
    log.append(li);
  }
  function choose(edge: ResidualEdge) {
    if (!fullView || finished) return;
    if (currentNode() === 'T') {
      message.textContent = '已经到达 T，可以点击增广。';
      return;
    }
    if (edge.from !== currentNode()) {
      message.textContent = `当前在 ${currentNode()}，请选择从该节点出发的残量边。`;
      return;
    }
    if (['S', ...path.map(item => item.to)].includes(edge.to)) {
      message.textContent = '这次先寻找不重复节点的简单路径。';
      return;
    }
    path.push(edge);
    message.textContent = edge.reverse
      ? `经过反向残量边 ${edge.from} → ${edge.to}，增广时将撤回对应原边的流量。`
      : `经过正向残量边 ${edge.from} → ${edge.to}。`;
    render();
  }

  function renderResidual() {
    residualSvg.replaceChildren();
    const defs = element('defs', {});
    for (const [id, color] of [['forward-arrow', '#38bdf8'], ['reverse-arrow', '#fbbf24']]) {
      const marker = element('marker', {
        id, markerWidth: '10', markerHeight: '10', refX: '8', refY: '3',
        orient: 'auto', markerUnits: 'strokeWidth',
      });
      marker.append(element('path', { d: 'M0,0 L0,6 L9,3 z', fill: color }));
      defs.append(marker);
    }
    residualSvg.append(defs);

    const edges = residualEdges().filter(edge => fullView || edge.originalIndex === selectedOriginal);
    // 同一原边的两个方向采用小幅度、对称弯曲，避免第五节的大曲率交叉。
    for (const edge of edges) {
      const [x1, y1] = positions[edge.from];
      const [x2, y2] = positions[edge.to];
      const dx = x2 - x1, dy = y2 - y1;
      const length = Math.hypot(dx, dy);
      const ux = dx / length, uy = dy / length;
      const sx = x1 + ux * 31, sy = y1 + uy * 31;
      const ex = x2 - ux * 36, ey = y2 - uy * 36;
      // 两个方向采用同一侧的法线，因方向相反而自动分开。
      const bend = 17;
      const mx = (sx + ex) / 2 - uy * bend;
      const my = (sy + ey) / 2 + ux * bend;
      const curve = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
      const chosen = path.some(item => item.originalIndex === edge.originalIndex && item.reverse === edge.reverse);
      const related = selectedOriginal === edge.originalIndex;
      const color = edge.reverse ? '#fbbf24' : '#38bdf8';
      const group = element('g', {
        class: 'residual-clickable', tabindex: '0', role: 'button',
        'aria-label': `${edge.from} 到 ${edge.to}，残量容量 ${edge.capacity}`,
      });
      group.append(element('path', {
        d: curve, fill: 'none', stroke: 'transparent', 'stroke-width': '19',
        'pointer-events': 'stroke',
      }));
      group.append(element('path', {
        d: curve, fill: 'none', stroke: chosen ? '#f8fafc' : color,
        'stroke-width': chosen ? '5' : related ? '4' : '3',
        ...(edge.reverse ? { 'stroke-dasharray': '8 6' } : {}),
        'marker-end': `url(#${edge.reverse ? 'reverse-arrow' : 'forward-arrow'})`,
        'pointer-events': 'none',
      }));
      const tx = (sx + 2 * mx + ex) / 4 - uy * 12;
      const ty = (sy + 2 * my + ey) / 4 + ux * 12;
      group.append(element('text', {
        x: String(tx), y: String(ty), class: 'edge-label',
        'text-anchor': 'middle', 'pointer-events': 'none',
      }, String(edge.capacity)));
      group.addEventListener('click', () => choose(edge));
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose(edge);
        }
      });
      residualSvg.append(group);
    }
    for (const [id, [x, y]] of Object.entries(positions)) {
      residualSvg.append(element('circle', {
        cx: String(x), cy: String(y), r: '27',
        fill: '#1e293b', stroke: '#38bdf8', 'stroke-width': '2',
        'pointer-events': 'none',
      }));
      residualSvg.append(element('text', {
        x: String(x), y: String(y + 8), class: 'node-label',
        'text-anchor': 'middle', 'pointer-events': 'none',
      }, id));
    }
  }

  function render() {
    originalGraph.setEdges(FLOW_EDGES.map((edge, index) => ({ ...edge, flow: flows[index] })));
    renderResidual();
    get<HTMLElement>('original-total').textContent = `总流量 ${flows[0] + flows[1]}`;
    pathLabel.textContent = `当前路径：${['S', ...path.map(edge => edge.to)].join(' → ')}`;
    bottleneckLabel.textContent = path.length ? `瓶颈容量：${bottleneck()}` : '瓶颈容量：—';
    augmentButton.disabled = currentNode() !== 'T' || finished;
    allButton.textContent = fullView ? '仅查看选中原边' : '显示完整残量网络';
    get<HTMLElement>('residual-summary').hidden = !finished;
  }

  allButton.addEventListener('click', () => {
    fullView = !fullView;
    path = [];
    message.textContent = fullView
      ? '现在只沿右侧非零残量边，从 S 寻找一条通向 T 的路径。'
      : '点击左侧原边，观察它在右侧对应的残量方向。';
    render();
  });
  augmentButton.addEventListener('click', () => {
    if (currentNode() !== 'T' || finished) return;
    const delta = bottleneck();
    const route = ['S', ...path.map(edge => edge.to)].join(' → ');
    for (const edge of path) {
      flows[edge.originalIndex] += edge.reverse ? -delta : delta;
    }
    note(`${route}，瓶颈 ${delta}，总流量 ${flows[0] + flows[1]}。`);
    path = [];
    finished = flows[0] + flows[1] === 8;
    message.textContent = finished
      ? '你找到了增广路，流量从 7 提升到 8。观察两张图中发生的变化。'
      : '增广成功，残量网络已同步更新。';
    render();
  });
  get<HTMLButtonElement>('residual-undo').addEventListener('click', () => {
    path.pop();
    render();
  });
  get<HTMLButtonElement>('residual-clear').addEventListener('click', () => {
    path = [];
    render();
  });
  get<HTMLButtonElement>('residual-reset').addEventListener('click', () => {
    flows = [...initial];
    path = [];
    finished = false;
    message.textContent = '已恢复流量 7 的案例。试着再次找到残量增广路径。';
    render();
  });
  get<HTMLButtonElement>('residual-next').addEventListener('click', () => showFordFulkersonLesson(app, () => showResidualNetworkLesson(app, back)));
  get<HTMLButtonElement>('back-button').addEventListener('click', back);
  render();
}
