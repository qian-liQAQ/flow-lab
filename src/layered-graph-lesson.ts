import { FLOW_EDGES } from './flow-graph';
import { showDinicIntroLesson } from './dinic-intro-lesson';

type Arc = { from: string; to: string; cap: number; index: number; reverse: boolean };
const ns = 'http://www.w3.org/2000/svg';
const points: Record<string, [number, number]> = {
  S: [70, 180], A: [230, 80], B: [230, 280],
  C: [420, 80], D: [420, 280], T: [575, 180],
};
const nodes = ['S', 'A', 'B', 'C', 'D', 'T'];
// 已知的流量为 7 的案例：残量图里既有正向边，也有反向边。
const initial = [5, 2, 2, 2, 3, 2, 5];
const trials: { from: string; to: string; reverse: boolean; correct: boolean; reason: string }[] = [
  { from: 'S', to: 'B', reverse: false, correct: true, reason: 'S 位于第 0 层，B 位于第 1 层，层数恰好增加 1。' },
  { from: 'A', to: 'S', reverse: true, correct: false, reason: 'A 位于第 3 层，S 位于第 0 层。虽然存在这条反向残量边，但它不是下一层的边。' },
  { from: 'D', to: 'A', reverse: true, correct: true, reason: 'D 位于第 2 层，A 位于第 3 层。即使是反向残量边，只要层数恰好增加 1，它也属于分层图。' },
  { from: 'C', to: 'A', reverse: true, correct: false, reason: 'C 位于第 4 层，A 位于第 3 层，这条残量边是向上一层返回。' },
];
function el(tag: string, attrs: Record<string, string>, label?: string): SVGElement {
  const node = document.createElementNS(ns, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (label !== undefined) node.textContent = label;
  return node;
}

export function showLayeredGraphLesson(app: HTMLDivElement, back: () => void) {
  let levels: Map<string, number> | null = null;
  let trialIndex = 0;
  let revealed = false;
  let selected: Arc | null = null;

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content lg-content">
      <button id="lg-back" class="text-button">← 返回第九节</button>
      <div class="lesson-meta">第三章 · 最大流算法 / 10</div>
      <h1>有了 BFS 的层数，还能做什么？</h1>
      <p class="question">刚才的 Edmonds–Karp 每增广一条路，都重新 BFS。可 BFS 还告诉了我们<strong>每个节点距离 S 有几条边</strong>。如果只想寻找同样短的路径，哪些残量边才值得保留？</p>
      <div class="graph-workspace lg-workspace">
        <section class="graph-panel lg-graph">
          <div class="lg-graph-head"><strong id="lg-title">流量为 7 时的残量网络</strong><span id="lg-subtitle">等待 BFS</span></div>
          <svg id="lg-svg" class="flow-graph" viewBox="0 0 650 360" aria-label="可以查看 BFS 层数及残量边的分层图"></svg>
          <p class="ff-legend">蓝色实线：正向残量边　黄色虚线：反向残量边　节点角标：BFS 层数　灰色：不属于分层图</p>
        </section>
        <aside class="graph-info lg-console">
          <h2>探索控制台</h2>
          <p>当前流量：<strong>7</strong></p>
          <p>从 S 到 T 的最少边数：<strong id="lg-distance">—</strong></p>
          <p>当前操作：<span id="lg-progress">先运行一次 BFS</span></p>
          <div class="ff-console-buttons">
            <button id="lg-bfs" class="primary-button">第一步：运行 BFS，显示层数</button>
            <button id="lg-filter" class="primary-button" disabled>显示分层图</button>
            <button id="lg-reset" class="secondary-button">重新探索</button>
          </div>
          <p class="graph-keyboard-tip">这是之前流量为 7 的案例。你可以点击图中的边，查看它跨越的层数。</p>
        </aside>
      </div>
      <section class="discovery greedy-prompt" aria-live="polite">
        <strong>探索问题</strong>
        <p id="lg-message">你已经认识残量网络。先运行 BFS，观察每个节点相对于 S 的层数。</p>
      </section>
      <section id="lg-quiz" class="history-panel lg-quiz" hidden>
        <h2>试着筛选残量边</h2>
        <p id="lg-trial"></p>
        <div class="lg-answers">
          <button id="lg-yes" class="secondary-button">保留这条边</button>
          <button id="lg-no" class="secondary-button">暂时忽略这条边</button>
        </div>
        <p id="lg-feedback" aria-live="polite"></p>
        <button id="lg-next-trial" class="secondary-button" hidden>判断下一条 →</button>
      </section>
      <section id="lg-summary" class="discovery" hidden>
        <strong>发现：分层图</strong>
        <p>BFS 从 S 计算层数 <strong>level</strong>。在当前残量网络中，只保留满足 <strong>level[v] = level[u] + 1</strong> 的正残量边 u → v，就得到分层图。</p>
        <p>这条规则不区分原来的正向边和反向边。分层图不是新建的原网络，而是<strong>当前残量网络的一部分</strong>。沿它从 S 到 T 走，每一步都恰好进入下一层，所以走出的路径一定是当前最短增广路。</p>
        <p>接下来要解决的问题是：在这张分层图里，能否连续找到不止一条增广路？</p>
      </section>
      <div class="lesson-actions"><button id="lg-next" class="secondary-button">下一节：在分层图中寻找阻塞流 →</button></div>
    </div></main>
  `;

  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const svg = document.querySelector<SVGSVGElement>('#lg-svg')!;
  const message = get<HTMLElement>('lg-message');

  function arcs(): Arc[] {
    const result: Arc[] = [];
    FLOW_EDGES.forEach((e, index) => {
      if (e.cap > initial[index]) result.push({ from: e.from, to: e.to, cap: e.cap - initial[index], index, reverse: false });
      if (initial[index] > 0) result.push({ from: e.to, to: e.from, cap: initial[index], index, reverse: true });
    });
    return result;
  }
  function bfs() {
    const distance = new Map<string, number>([['S', 0]]);
    const queue = ['S'];
    const edges = arcs();
    for (let i = 0; i < queue.length; i++) {
      const u = queue[i];
      for (const edge of edges) {
        if (edge.from !== u || distance.has(edge.to)) continue;
        distance.set(edge.to, distance.get(u)! + 1);
        queue.push(edge.to);
      }
    }
    return distance;
  }
  function allowed(edge: Arc) {
    return levels !== null && levels.has(edge.from) && levels.has(edge.to)
      && levels.get(edge.to) === levels.get(edge.from)! + 1;
  }
  function draw() {
    svg.replaceChildren();
    const defs = el('defs', {});
    for (const [id, color] of [['f', '#38bdf8'], ['r', '#fbbf24'], ['dim', '#475569'], ['picked', '#fb923c']]) {
      const marker = el('marker', { id: 'lg-' + id, markerWidth: '10', markerHeight: '10', refX: '8', refY: '3', orient: 'auto' });
      marker.append(el('path', { d: 'M0,0 L0,6 L9,3 z', fill: color }));
      defs.append(marker);
    }
    svg.append(defs);
    for (const edge of arcs()) {
      const [x1, y1] = points[edge.from], [x2, y2] = points[edge.to];
      const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
      const ux = dx / length, uy = dy / length;
      const sx = x1 + ux * 31, sy = y1 + uy * 31, ex = x2 - ux * 36, ey = y2 - uy * 36;
      const cx = (sx + ex) / 2 - uy * 17, cy = (sy + ey) / 2 + ux * 17;
      const dim = revealed && !allowed(edge);
      const picked = selected?.index === edge.index && selected.reverse === edge.reverse;
      const kind = picked ? 'picked' : dim ? 'dim' : edge.reverse ? 'r' : 'f';
      const group = el('g', { role: 'button', tabindex: '0', class: 'lg-edge', 'aria-label': `${edge.from} 到 ${edge.to}，残量容量 ${edge.cap}` });
      group.append(el('path', { d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`, fill: 'none', stroke: 'transparent', 'stroke-width': '23' }));
      group.append(el('path', { d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`, fill: 'none',
        stroke: picked ? '#fb923c' : dim ? '#475569' : edge.reverse ? '#fbbf24' : '#38bdf8',
        'stroke-width': picked ? '5' : '3', ...(edge.reverse ? { 'stroke-dasharray': '8 6' } : {}),
        'marker-end': `url(#lg-${kind})`, 'pointer-events': 'none' }));
      group.append(el('text', { x: String((sx + 2 * cx + ex) / 4 - uy * 12),
        y: String((sy + 2 * cy + ey) / 4 + ux * 12), 'text-anchor': 'middle', class: 'edge-label', 'pointer-events': 'none' }, String(edge.cap)));
      group.addEventListener('click', () => inspect(edge));
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(edge); }
      });
      svg.append(group);
    }
    for (const id of nodes) {
      const [x, y] = points[id];
      svg.append(el('circle', { cx: String(x), cy: String(y), r: '27', fill: levels?.has(id) ? '#164e63' : '#1e293b',
        stroke: '#38bdf8', 'stroke-width': '2', 'pointer-events': 'none' }));
      svg.append(el('text', { x: String(x), y: String(y + 8), 'text-anchor': 'middle', class: 'node-label', 'pointer-events': 'none' }, id));
      if (levels) {
        svg.append(el('circle', { cx: String(x + 24), cy: String(y - 24), r: '13', fill: '#0f172a', stroke: '#64748b', 'pointer-events': 'none' }));
        svg.append(el('text', { x: String(x + 24), y: String(y - 19), 'text-anchor': 'middle',
          fill: '#7dd3fc', 'font-size': '15', 'font-weight': '700', 'pointer-events': 'none' }, String(levels.get(id) ?? '∞')));
      }
    }
  }
  function inspect(edge: Arc) {
    if (!levels) {
      message.textContent = '这是一条残量容量为 ' + edge.cap + ' 的边。先运行 BFS，才能判断它是否属于分层图。';
      return;
    }
    selected = edge;
    const from = levels.get(edge.from), to = levels.get(edge.to);
    message.textContent = `${edge.from} → ${edge.to}：残量容量 ${edge.cap}，层数 ${from ?? '∞'} → ${to ?? '∞'}。`
      + (revealed ? (allowed(edge) ? ' 满足层数 +1，属于分层图。' : ' 不满足层数 +1，本轮忽略。') : ' 这条边该不该保留？');
    draw();
  }
  function showTrial() {
    const t = trials[trialIndex];
    get<HTMLElement>('lg-trial').textContent = `第 ${trialIndex + 1} / ${trials.length} 题：在残量网络中，${t.from} → ${t.to} 应当保留在分层图中吗？`;
    get<HTMLElement>('lg-feedback').textContent = '';
    get<HTMLButtonElement>('lg-yes').disabled = false;
    get<HTMLButtonElement>('lg-no').disabled = false;
    get<HTMLButtonElement>('lg-next-trial').hidden = true;
    selected = arcs().find(e => e.from === t.from && e.to === t.to && e.reverse === t.reverse) ?? null;
    draw();
  }
  function judge(keep: boolean) {
    if (!levels || revealed) return;
    const t = trials[trialIndex];
    if (keep !== t.correct) {
      get<HTMLElement>('lg-feedback').textContent = '再观察一下层数变化：只考虑从当前层走向下一层的残量边。';
      return;
    }
    get<HTMLElement>('lg-feedback').textContent = '正确。' + t.reason;
    get<HTMLButtonElement>('lg-yes').disabled = true;
    get<HTMLButtonElement>('lg-no').disabled = true;
    get<HTMLButtonElement>('lg-next-trial').hidden = false;
    get<HTMLButtonElement>('lg-next-trial').textContent = trialIndex === trials.length - 1 ? '完成判断 →' : '判断下一条 →';
  }

  get<HTMLButtonElement>('lg-bfs').addEventListener('click', () => {
    if (levels) return;
    levels = bfs();
    get<HTMLElement>('lg-distance').textContent = String(levels.get('T') ?? '∞');
    get<HTMLElement>('lg-progress').textContent = '判断哪些边只走向下一层';
    get<HTMLButtonElement>('lg-bfs').disabled = true;
    get<HTMLElement>('lg-quiz').hidden = false;
    message.textContent = 'BFS 已计算层数。现在不是直接沿路增广，而是从残量边中筛选出只走向下一层的边。';
    showTrial();
  });
  get<HTMLButtonElement>('lg-yes').addEventListener('click', () => judge(true));
  get<HTMLButtonElement>('lg-no').addEventListener('click', () => judge(false));
  get<HTMLButtonElement>('lg-next-trial').addEventListener('click', () => {
    if (trialIndex < trials.length - 1) {
      trialIndex++;
      showTrial();
      return;
    }
    selected = null;
    get<HTMLElement>('lg-quiz').hidden = true;
    get<HTMLButtonElement>('lg-filter').disabled = false;
    get<HTMLElement>('lg-progress').textContent = '已完成判断，准备生成分层图';
    message.textContent = '你已经判断了正向与反向残量边。点击「显示分层图」，观察刚才的规则如何应用到整张图。';
    draw();
  });
  get<HTMLButtonElement>('lg-filter').addEventListener('click', () => {
    if (!levels || revealed) return;
    revealed = true;
    selected = null;
    get<HTMLElement>('lg-progress').textContent = '已建立分层图';
    get<HTMLElement>('lg-title').textContent = '分层图 · 只保留向下一层的边';
    get<HTMLElement>('lg-subtitle').textContent = '不满足层数 +1 的边已变灰';
    get<HTMLButtonElement>('lg-filter').disabled = true;
    get<HTMLElement>('lg-summary').hidden = false;
    message.textContent = '看图中保留下来的彩色边：沿它们从 S 出发，每一步都会进入下一层，所以到 T 的路径长度固定为 5。';
    draw();
  });
  get<HTMLButtonElement>('lg-reset').addEventListener('click', () => showLayeredGraphLesson(app, back));
  get<HTMLButtonElement>('lg-back').addEventListener('click', back);
  get<HTMLButtonElement>('lg-next').addEventListener('click', () => showDinicIntroLesson(app, () => showLayeredGraphLesson(app, back)));
  draw();
}
