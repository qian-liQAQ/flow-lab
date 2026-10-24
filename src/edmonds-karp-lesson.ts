import { showDinicIntroLesson } from './dinic-intro-lesson';
import { FLOW_EDGES } from './flow-graph';

type Arc = { from: string; to: string; cap: number; index: number; reverse: boolean };
type Round = { level: Map<string, number>; path: Arc[]; delta: number };
const points: Record<string, [number, number]> = {
  S: [70, 180], A: [230, 80], B: [230, 280],
  C: [420, 80], D: [420, 280], T: [575, 180],
};
const ns = 'http://www.w3.org/2000/svg';
const nodeOrder = ['S', 'A', 'B', 'C', 'D', 'T'];

function element(tag: string, attrs: Record<string, string>, label?: string): SVGElement {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (label !== undefined) node.textContent = label;
  return node;
}

export function showEdmondsKarpLesson(app: HTMLDivElement, back: () => void) {
  let flows = FLOW_EDGES.map(() => 0);
  let pending: Round | null = null;
  let finished = false;
  let rounds = 0;
  let maxFlow = 0;
  let lastLevel: Map<string, number> | null = null;
  let sawExample = false;
  let proofStage = 0;
  let quizPassed = false;

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content ek-content">
      <button id="ek-back" class="text-button">← 返回第八节</button>
      <div class="lesson-meta">第三章 · 最大流算法 / 09</div>
      <h1>为什么 BFS 不会一直绕圈？</h1>
      <p class="question">Ford–Fulkerson 只要求找到任意增广路。Edmonds–Karp 固定使用 BFS：每次选择<strong>边数最少</strong>的增广路。它为什么能保证多项式时间？先观察 BFS 分层。</p>

      <div class="graph-workspace ek-workspace">
        <section class="graph-panel ek-graph">
          <div class="ek-graph-head"><strong>残量网络 · BFS 分层</strong><span id="ek-status">等待第一次 BFS</span></div>
          <svg id="ek-svg" class="flow-graph" viewBox="0 0 650 360" role="img" aria-label="随增广更新的残量网络和 BFS 距离标记"></svg>
          <p class="ff-legend">蓝色：正向残量边　黄色虚线：反向残量边　白色：本轮最短增广路　节点角标：距 S 的最少边数</p>
        </section>
        <aside class="graph-info ek-console">
          <h2>观察实验</h2>
          <p class="ff-metric">当前流量 <strong id="ek-total">0</strong></p>
          <p>已增广：<strong id="ek-rounds">0</strong> 次</p>
          <p>S 到 T 的最短边数：<strong id="ek-distance">尚未计算</strong></p>
          <p>本轮路径：<span id="ek-route">—</span></p>
          <p>瓶颈：<strong id="ek-bottleneck">—</strong></p>
          <div class="ff-console-buttons">
            <button id="ek-bfs" class="primary-button">运行一次 BFS</button>
            <button id="ek-augment" class="primary-button" disabled>沿路径增广</button>
            <button id="ek-reset" class="secondary-button">重新观察</button>
          </div>
          <p class="graph-keyboard-tip">先运行 BFS 展示分层与最短路径，再手动确认增广。每次增广都要重新分层。</p>
        </aside>
      </div>

      <section class="discovery greedy-prompt" aria-live="polite">
        <strong>先观察，再猜想</strong>
        <p id="ek-message">点击「运行一次 BFS」，看看每个节点需要走多少条边才能从 S 到达。</p>
      </section>
      <section class="history-panel">
        <h2>最短增广路长度记录</h2>
        <ol id="ek-history" aria-live="polite"></ol>
        <p class="ek-small">只记录每轮 BFS 找到的增广路；最后一次找不到路径时，T 的距离为 ∞。</p>
      </section>

      <section id="ek-question" class="discovery ek-question" hidden>
        <strong>思考：反向边会不会让下一次的最短距离变小？</strong>
        <p>请根据刚才观察到的 BFS 层数作出判断。</p>
        <div class="ek-answers" role="group" aria-label="最短路距离变化判断">
          <button type="button" class="secondary-button" data-answer="a">A. 可能变小，因为增加了反向边</button>
          <button type="button" class="secondary-button" data-answer="b">B. 不会变小，但可以保持不变</button>
          <button type="button" class="secondary-button" data-answer="c">C. 每次都必须严格变大</button>
        </div>
        <p id="ek-feedback" aria-live="polite"></p>
      </section>

      <section id="ek-proof" class="history-panel" hidden>
        <h2>从现象到复杂度证明</h2>
        <div class="ek-proof-card">
          <div id="ek-proof-index" class="lesson-meta">推导 1 / 3</div>
          <h3 id="ek-proof-title"></h3>
          <p id="ek-proof-text"></p>
        </div>
        <div class="lesson-actions">
          <button id="ek-proof-next" class="primary-button">继续推导 →</button>
        </div>
      </section>
      <section id="ek-result" class="discovery" hidden>
        <strong>Edmonds–Karp 的复杂度</strong>
        <p>每次 BFS 扫描残量网络需要 <strong>O(E)</strong>；由于最短距离不会下降，同一条有向残量边成为瓶颈（被饱和）最多 <strong>O(V)</strong> 次。共有 O(E) 条残量边，因此至多 <strong>O(VE)</strong> 次增广，总时间 <strong>O(VE²)</strong>。</p>
        <p>这里的界与容量数值大小无关。下一步学习 Dinic：既然 BFS 已经得到分层，能否一次分层后沿多条路径增广，而不是每条路径都重新 BFS？</p>
      </section>
      <div class="lesson-actions"><button id="ek-next" class="secondary-button">下一节：Dinic →</button></div>
    </div></main>
  `;

  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const svg = document.getElementById('ek-svg') as SVGSVGElement;
  const message = get<HTMLElement>('ek-message');
  const history = get<HTMLOListElement>('ek-history');
  const bfsButton = get<HTMLButtonElement>('ek-bfs');
  const augmentButton = get<HTMLButtonElement>('ek-augment');

  function arcs(): Arc[] {
    const result: Arc[] = [];
    FLOW_EDGES.forEach((edge, index) => {
      const forward = edge.cap - flows[index];
      if (forward > 0) result.push({ from: edge.from, to: edge.to, cap: forward, index, reverse: false });
      if (flows[index] > 0) result.push({ from: edge.to, to: edge.from, cap: flows[index], index, reverse: true });
    });
    return result;
  }

  function bfs(): Round | null {
    const edges = arcs();
    const level = new Map<string, number>([['S', 0]]);
    const parent = new Map<string, Arc>();
    const queue = ['S'];
    // 为教学展示完整的 BFS 层级；第一次发现 T 的前驱始终保留。
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const edge of edges) {
        if (edge.from !== u || level.has(edge.to)) continue;
        level.set(edge.to, level.get(u)! + 1);
        parent.set(edge.to, edge);
        queue.push(edge.to);
      }
    }
    lastLevel = level;
    if (!level.has('T')) return null;
    const path: Arc[] = [];
    for (let at = 'T'; at !== 'S';) {
      const edge = parent.get(at)!;
      path.unshift(edge);
      at = edge.from;
    }
    return { level, path, delta: Math.min(...path.map(edge => edge.cap)) };
  }

  function route(path: Arc[]) { return ['S', ...path.map(e => e.to)].join(' → '); }

  function draw() {
    svg.replaceChildren();
    const defs = element('defs', {});
    for (const [id, color] of [['forward', '#38bdf8'], ['reverse', '#fbbf24'], ['selected', '#f8fafc']]) {
      const marker = element('marker', { id: 'ek-' + id, markerWidth: '10', markerHeight: '10', refX: '8', refY: '3', orient: 'auto' });
      marker.append(element('path', { d: 'M0,0 L0,6 L9,3 z', fill: color }));
      defs.append(marker);
    }
    svg.append(defs);
    for (const edge of arcs()) {
      const [x1, y1] = points[edge.from], [x2, y2] = points[edge.to];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * 31, sy = y1 + uy * 31;
      const ex = x2 - ux * 36, ey = y2 - uy * 36;
      const cx = (sx + ex) / 2 - uy * 17, cy = (sy + ey) / 2 + ux * 17;
      const selected = pending?.path.some(p => p.index === edge.index && p.reverse === edge.reverse) ?? false;
      const kind = selected ? 'selected' : edge.reverse ? 'reverse' : 'forward';
      svg.append(element('path', {
        d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
        fill: 'none', stroke: selected ? '#f8fafc' : edge.reverse ? '#fbbf24' : '#38bdf8',
        'stroke-width': selected ? '5' : '3',
        ...(edge.reverse ? { 'stroke-dasharray': '8 6' } : {}),
        'marker-end': `url(#ek-${kind})`,
      }));
      svg.append(element('text', {
        x: String((sx + 2 * cx + ex) / 4 - uy * 12),
        y: String((sy + 2 * cy + ey) / 4 + ux * 12),
        'text-anchor': 'middle', class: 'edge-label',
      }, String(edge.cap)));
    }
    for (const id of nodeOrder) {
      const [x, y] = points[id];
      const reachable = lastLevel?.has(id) ?? false;
      svg.append(element('circle', { cx: String(x), cy: String(y), r: '27',
        fill: reachable ? '#164e63' : '#1e293b', stroke: reachable ? '#7dd3fc' : '#38bdf8', 'stroke-width': '2' }));
      svg.append(element('text', { x: String(x), y: String(y + 8), class: 'node-label', 'text-anchor': 'middle' }, id));
      if (lastLevel) {
        svg.append(element('circle', { cx: String(x + 24), cy: String(y - 25), r: '13', fill: '#0f172a', stroke: '#64748b' }));
        svg.append(element('text', { x: String(x + 24), y: String(y - 20), 'text-anchor': 'middle',
          fill: reachable ? '#7dd3fc' : '#94a3b8', 'font-size': '15', 'font-weight': '700' },
          reachable ? String(lastLevel.get(id)) : '∞'));
      }
    }
  }

  function render() {
    draw();
    get<HTMLElement>('ek-total').textContent = String(maxFlow);
    get<HTMLElement>('ek-rounds').textContent = String(rounds);
    get<HTMLElement>('ek-distance').textContent = lastLevel ? String(lastLevel.get('T') ?? '∞') : '尚未计算';
    get<HTMLElement>('ek-route').textContent = pending ? route(pending.path) : '—';
    get<HTMLElement>('ek-bottleneck').textContent = pending ? String(pending.delta) : '—';
    get<HTMLElement>('ek-status').textContent = finished ? '已无增广路' : pending ? '等待确认增广' : lastLevel ? '网络已变化 · 需要重新 BFS' : '等待第一次 BFS';
    bfsButton.disabled = pending !== null || finished;
    augmentButton.disabled = pending === null;
    get<HTMLElement>('ek-question').hidden = !sawExample;
  }

  bfsButton.addEventListener('click', () => {
    pending = bfs();
    if (!pending) {
      finished = true;
      sawExample = true;
      get<HTMLElement>('ek-status').textContent = '已无增广路';
      const li = document.createElement('li');
      li.textContent = `终止：T 不可达（距离 ∞）；最大流 ${maxFlow}。`;
      history.append(li);
      message.textContent = '当前残量网络里 T 已经不可达。回顾每轮最短增广路的长度：它们是否曾减小？';
    } else {
      message.textContent = `BFS 找到边数为 ${pending.path.length} 的最短增广路 ${route(pending.path)}。观察每个节点的距离标记，再执行增广。`;
    }
    render();
  });

  augmentButton.addEventListener('click', () => {
    if (!pending) return;
    const { path, delta } = pending;
    const length = path.length;
    for (const edge of path) flows[edge.index] += edge.reverse ? -delta : delta;
    maxFlow += delta;
    rounds++;
    const li = document.createElement('li');
    li.textContent = `第 ${rounds} 次：距离 ${length}，${route(path)}，增加 ${delta}，总流量 ${maxFlow}。`;
    history.append(li);
    pending = null;
    lastLevel = null;
    if (rounds >= 2) sawExample = true;
    message.textContent = `已增广 ${delta}。残量容量已改变；下一轮 BFS 必须重新计算距离。注意最短距离可能不变，而不一定严格增加。`;
    render();
  });

  function reset() {
    flows = FLOW_EDGES.map(() => 0);
    pending = null;
    finished = false;
    rounds = 0;
    maxFlow = 0;
    lastLevel = null;
    sawExample = false;
    quizPassed = false;
    proofStage = 0;
    history.replaceChildren();
    get<HTMLElement>('ek-feedback').textContent = '';
    get<HTMLElement>('ek-proof').hidden = true;
    get<HTMLElement>('ek-result').hidden = true;
    document.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b => { b.disabled = false; b.setAttribute('aria-pressed', 'false'); });
    get<HTMLButtonElement>('ek-proof-next').hidden = false;
    message.textContent = '重新开始：先运行 BFS，观察各节点到 S 的距离。';
    render();
  }
  get<HTMLButtonElement>('ek-reset').addEventListener('click', reset);

  const proof = [
    {
      title: '第一步：为什么距离不会减小？',
      text: '设增广前从 S 出发的最短距离为 d，增广后为 d′。正向残量边只会减少容量或消失；新出现的边只能是本次增广路径上的反向边 v → u。原路径沿 u → v 前进，所以 d(v) = d(u) + 1。新增反向边从更深一层指回更浅一层，不可能造成比原来更短的 S 出发路径。因此所有节点的最短距离都不会下降。',
    },
    {
      title: '第二步：一条边能被反复饱和多少次？',
      text: '如果 u → v 在某轮成为瓶颈，它必然是最短增广路上的边，因此 d(v) = d(u) + 1。这条正向残量边要重新出现并再次成为瓶颈，之间必须曾沿反向边 v → u 增广。反向边位于当时的最短路上，故当时 d(u) = d(v) + 1。结合距离单调不减，可得下一次 u → v 被饱和时，d(u) 至少比上次增加 2。',
    },
    {
      title: '第三步：把次数乘起来',
      text: '简单路径上的最短距离最多为 V − 1，因此一条有向残量边成为瓶颈的次数是 O(V)。每次增广至少饱和一条边，而残量边总数是 O(E)，故增广次数 O(VE)。每次 BFS 扫描边 O(E)，沿父指针更新路径 O(V)，对于相关顶点都与边相连的网络有 O(V) ⊆ O(E)，最终为 O(VE²)。',
    },
  ];

  function showProof() {
    const info = proof[proofStage];
    get<HTMLElement>('ek-proof-index').textContent = `推导 ${proofStage + 1} / ${proof.length}`;
    get<HTMLElement>('ek-proof-title').textContent = info.title;
    get<HTMLElement>('ek-proof-text').textContent = info.text;
    get<HTMLButtonElement>('ek-proof-next').textContent = proofStage === proof.length - 1 ? '查看最终结论 →' : '继续推导 →';
  }
  document.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(button => {
    button.addEventListener('click', () => {
      if (quizPassed) return;
      const right = button.dataset.answer === 'b';
      get<HTMLElement>('ek-feedback').textContent = right
        ? '正确。BFS 最短距离单调不减，但连续几次的最短增广路可以一样长。接下来证明这一点。'
        : '再想一想：反向边只能沿已经走过的边往回走；但不同的最短增广路也可能有相同长度。';
      if (!right) return;
      quizPassed = true;
      button.setAttribute('aria-pressed', 'true');
      document.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b => { b.disabled = true; });
      get<HTMLElement>('ek-proof').hidden = false;
      proofStage = 0;
      showProof();
    });
  });
  get<HTMLButtonElement>('ek-proof-next').addEventListener('click', () => {
    if (proofStage < proof.length - 1) {
      proofStage++;
      showProof();
    } else {
      get<HTMLButtonElement>('ek-proof-next').hidden = true;
      get<HTMLElement>('ek-result').hidden = false;
    }
  });
  get<HTMLButtonElement>('ek-back').addEventListener('click', back);
  get<HTMLButtonElement>('ek-next').addEventListener('click', () => showDinicIntroLesson(app, () => showEdmondsKarpLesson(app, back)));
  render();
}
