import { FLOW_EDGES } from './flow-graph';

type Arc = { from: string; to: string; cap: number; index: number; reverse: boolean };
const points: Record<string, [number, number]> = {
  S: [70, 180], A: [230, 80], B: [230, 280],
  C: [420, 80], D: [420, 280], T: [575, 180],
};
const nodes = ['S', 'A', 'B', 'C', 'D', 'T'];
const ns = 'http://www.w3.org/2000/svg';

function svgEl(tag: string, attrs: Record<string, string>, label?: string): SVGElement {
  const el = document.createElementNS(ns, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (label !== undefined) el.textContent = label;
  return el;
}

export function showDinicIntroLesson(app: HTMLDivElement, back: () => void) {
  let flows = FLOW_EDGES.map(() => 0);
  let levels: Map<string, number> | null = null;
  let phase = 0;
  let phaseCount = 0;
  let route: Arc[] = [];
  let done = false;
  let blocking = false;
  let answered = false;
  let hint: Arc[] = [];

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content dn-content">
      <button id="dn-back" class="text-button">← 返回第九节</button>
      <div class="lesson-meta">第三章 · 最大流算法 / 10</div>
      <h1>一次 BFS，能不能增广不止一条路？</h1>
      <p class="question">Edmonds–Karp 找到一条路径就重新 BFS。Dinic 的想法是：先用 BFS 建立<strong>分层图</strong>，然后在同一张分层图里反复增广，直到形成<strong>阻塞流</strong>。</p>

      <div class="graph-workspace dn-workspace">
        <section class="graph-panel dn-graph">
          <div class="dn-graph-head"><strong id="dn-graph-title">残量网络</strong><span id="dn-phase-label">尚未分层</span></div>
          <svg id="dn-svg" class="flow-graph" viewBox="0 0 650 360" aria-label="可点击边构造分层图中的增广路"></svg>
          <p class="ff-legend">蓝色：可沿层数 +1 前进的边　黄色虚线：反向残量边　灰色：不属于本次分层图　白色：你已选中的路径</p>
        </section>
        <aside class="graph-info dn-console">
          <h2>Dinic 控制台</h2>
          <p class="ff-metric">当前流量 <strong id="dn-total">0</strong></p>
          <p>BFS 分层次数：<strong id="dn-phases">0</strong></p>
          <p>当前分层内已增广：<strong id="dn-phase-aug">0</strong> 次</p>
          <p>路径：<span id="dn-route">S</span></p>
          <p>瓶颈容量：<strong id="dn-bottle">—</strong></p>
          <div class="ff-console-buttons">
            <button id="dn-bfs" class="primary-button">第一步：BFS 建立分层图</button>
            <button id="dn-augment" class="primary-button" disabled>沿所选路径增广</button>
            <button id="dn-check" class="secondary-button" disabled>检查是否形成阻塞流</button>
            <button id="dn-undo" class="secondary-button" disabled>撤回上一步选边</button>
            <button id="dn-hint" class="secondary-button" disabled>提示下一条路径</button>
            <button id="dn-reset" class="secondary-button">重置实验</button>
          </div>
          <p class="graph-keyboard-tip">先 BFS 分层，然后点击图中从 S 出发的蓝色边，依次选择到 T 的路径。也可用 Tab、Enter 或空格选边。</p>
        </aside>
      </div>

      <section class="discovery greedy-prompt" aria-live="polite">
        <strong>探索问题</strong>
        <p id="dn-message">先建立一次 BFS 分层。你认为这次 BFS 后能连续增广几条路径？</p>
      </section>
      <section class="history-panel">
        <h2>同一次分层中的增广记录</h2>
        <ol id="dn-history" aria-live="polite"></ol>
      </section>
      <section id="dn-discovery" class="discovery" hidden>
        <strong>你发现了什么？</strong>
        <p>阻塞流不要求把整个网络的流量一次推到最大；它要求<strong>当前分层图中不再存在从 S 到 T 的路径</strong>。这时才重新 BFS，建立下一张分层图。</p>
        <p>注意：“阻塞流”不等于“最大流”。只有重新 BFS 后确认 T 不可达，才能宣布已经求出最大流。</p>
      </section>
      <section id="dn-question" class="discovery dn-question" hidden>
        <strong>理解检查</strong>
        <p>当前分层图已经找不到 S 到 T 的路径，但残量网络可能仍有其他增广路。下一步应该做什么？</p>
        <div class="ek-answers" role="group" aria-label="阻塞流之后的下一步">
          <button class="secondary-button" data-dn-answer="a">A. 直接宣布已经得到最大流</button>
          <button class="secondary-button" data-dn-answer="b">B. 重新 BFS，建立新的分层图</button>
        </div>
        <p id="dn-feedback" aria-live="polite"></p>
      </section>
      <section id="dn-summary" class="discovery" hidden>
        <strong>本节结论</strong>
        <p>Dinic = <strong>BFS 建立分层图 → 在分层图上连续增广得到阻塞流 → 重新 BFS</strong>，直到汇点不可达。</p>
        <p>这里先掌握算法的总体结构。当前弧优化、复杂度证明和其他工程优化将在后续独立章节展开。</p>
      </section>
      <div class="lesson-actions"><button id="dn-next" class="secondary-button" disabled>下一节：Dinic 优化（即将开放）→</button></div>
    </div></main>
  `;

  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const svg = document.getElementById('dn-svg') as SVGSVGElement;
  const message = get<HTMLElement>('dn-message');
  const history = get<HTMLOListElement>('dn-history');
  const bfsButton = get<HTMLButtonElement>('dn-bfs');
  const augmentButton = get<HTMLButtonElement>('dn-augment');
  const checkButton = get<HTMLButtonElement>('dn-check');
  const hintButton = get<HTMLButtonElement>('dn-hint');

  function arcs(): Arc[] {
    const result: Arc[] = [];
    FLOW_EDGES.forEach((edge, index) => {
      const forward = edge.cap - flows[index];
      if (forward > 0) result.push({ from: edge.from, to: edge.to, cap: forward, index, reverse: false });
      if (flows[index] > 0) result.push({ from: edge.to, to: edge.from, cap: flows[index], index, reverse: true });
    });
    return result;
  }
  function layered(edge: Arc) {
    return levels !== null && levels.has(edge.from) && levels.has(edge.to)
      && levels.get(edge.to)! === levels.get(edge.from)! + 1;
  }
  function current() { return route.length ? route[route.length - 1].to : 'S'; }
  function pathText(path: Arc[]) { return ['S', ...path.map(edge => edge.to)].join(' → '); }
  function bottle() { return Math.min(...route.map(edge => edge.cap)); }
  function total() { return flows[0] + flows[1]; }

  function bfs(): Map<string, number> {
    const level = new Map<string, number>([['S', 0]]);
    const queue = ['S'];
    const edges = arcs();
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const e of edges) {
        if (e.from !== u || level.has(e.to)) continue;
        level.set(e.to, level.get(u)! + 1);
        queue.push(e.to);
      }
    }
    return level;
  }

  function findLayerPath(): Arc[] | null {
    if (!levels) return null;
    const edges = arcs().filter(layered);
    const seen = new Set<string>();
    function dfs(u: string): Arc[] | null {
      if (u === 'T') return [];
      seen.add(u);
      for (const e of edges) {
        if (e.from !== u || seen.has(e.to)) continue;
        const rest = dfs(e.to);
        if (rest !== null) return [e, ...rest];
      }
      return null;
    }
    return dfs('S');
  }

  function draw() {
    svg.replaceChildren();
    const defs = svgEl('defs', {});
    for (const [id, color] of [['forward', '#38bdf8'], ['reverse', '#fbbf24'], ['chosen', '#f8fafc'], ['hint', '#a78bfa'], ['dim', '#475569']]) {
      const marker = svgEl('marker', { id: 'dn-' + id, markerWidth: '10', markerHeight: '10', refX: '8', refY: '3', orient: 'auto' });
      marker.append(svgEl('path', { d: 'M0,0 L0,6 L9,3 z', fill: color }));
      defs.append(marker);
    }
    svg.append(defs);

    for (const e of arcs()) {
      const [x1, y1] = points[e.from], [x2, y2] = points[e.to];
      const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
      const ux = dx / length, uy = dy / length;
      const sx = x1 + ux * 31, sy = y1 + uy * 31, ex = x2 - ux * 36, ey = y2 - uy * 36;
      const cx = (sx + ex) / 2 - uy * 17, cy = (sy + ey) / 2 + ux * 17;
      const available = layered(e);
      const selected = route.some(p => p.index === e.index && p.reverse === e.reverse);
      const suggested = hint.some(p => p.index === e.index && p.reverse === e.reverse);
      const kind = selected ? 'chosen' : suggested ? 'hint' : levels && !available ? 'dim' : e.reverse ? 'reverse' : 'forward';
      const label = `${e.from} 到 ${e.to}，残量容量 ${e.cap}${available ? '，分层图可用' : '，不属于当前分层图'}`;
      const group = svgEl('g', {
        ...(available && !done && !blocking ? { tabindex: '0', role: 'button', 'aria-label': label, class: 'dn-clickable' } : { 'aria-label': label }),
      });
      group.append(svgEl('path', {
        d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
        fill: 'none', stroke: 'transparent', 'stroke-width': '22',
      }));
      group.append(svgEl('path', {
        d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
        fill: 'none',
        stroke: kind === 'chosen' ? '#f8fafc' : kind === 'hint' ? '#a78bfa' : kind === 'dim' ? '#475569' : e.reverse ? '#fbbf24' : '#38bdf8',
        'stroke-width': selected ? '5' : '3',
        ...(e.reverse ? { 'stroke-dasharray': '8 6' } : {}),
        'marker-end': `url(#dn-${kind})`, 'pointer-events': 'none',
      }));
      group.append(svgEl('text', {
        x: String((sx + 2 * cx + ex) / 4 - uy * 12), y: String((sy + 2 * cy + ey) / 4 + ux * 12),
        'text-anchor': 'middle', class: 'edge-label', 'pointer-events': 'none',
      }, String(e.cap)));
      if (available && !done && !blocking) {
        group.addEventListener('click', () => choose(e));
        group.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(e); }
        });
      }
      svg.append(group);
    }

    for (const id of nodes) {
      const [x, y] = points[id];
      const reachable = levels?.has(id) ?? false;
      svg.append(svgEl('circle', {
        cx: String(x), cy: String(y), r: '27',
        fill: reachable ? '#164e63' : '#1e293b', stroke: '#38bdf8', 'stroke-width': '2',
        'pointer-events': 'none',
      }));
      svg.append(svgEl('text', { x: String(x), y: String(y + 8), 'text-anchor': 'middle', class: 'node-label', 'pointer-events': 'none' }, id));
      if (levels) {
        svg.append(svgEl('circle', { cx: String(x + 24), cy: String(y - 24), r: '13', fill: '#0f172a', stroke: '#64748b', 'pointer-events': 'none' }));
        svg.append(svgEl('text', { x: String(x + 24), y: String(y - 19), 'text-anchor': 'middle',
          fill: reachable ? '#7dd3fc' : '#94a3b8', 'font-size': '15', 'font-weight': '700', 'pointer-events': 'none' },
        reachable ? String(levels.get(id)) : '∞'));
      }
    }
  }

  function render() {
    draw();
    get<HTMLElement>('dn-total').textContent = String(total());
    get<HTMLElement>('dn-phases').textContent = String(phase);
    get<HTMLElement>('dn-phase-aug').textContent = String(phaseCount);
    get<HTMLElement>('dn-route').textContent = pathText(route);
    get<HTMLElement>('dn-bottle').textContent = route.length ? String(bottle()) : '—';
    get<HTMLElement>('dn-phase-label').textContent = done ? '已得到最大流' : blocking ? '本轮阻塞流已完成' : levels ? `第 ${phase} 次分层` : '尚未分层';
    get<HTMLElement>('dn-graph-title').textContent = levels ? '分层图 · 只沿层数 +1 前进' : '残量网络';
    bfsButton.disabled = done || (levels !== null && !blocking);
    bfsButton.textContent = levels ? '重新 BFS，建立新分层' : '第一步：BFS 建立分层图';
    augmentButton.disabled = blocking || done || current() !== 'T';
    checkButton.disabled = !levels || blocking || done || route.length > 0;
    get<HTMLButtonElement>('dn-undo').disabled = route.length === 0;
    hintButton.disabled = !levels || blocking || done || current() === 'T';
    get<HTMLElement>('dn-discovery').hidden = !blocking && !done;
    get<HTMLElement>('dn-question').hidden = !blocking && !done;
    get<HTMLElement>('dn-summary').hidden = !answered;
  }

  function choose(edge: Arc) {
    if (!levels || blocking || done || current() === 'T') return;
    const now = arcs().find(e => e.index === edge.index && e.reverse === edge.reverse);
    if (!now || !layered(now) || now.from !== current()) {
      message.textContent = `路径必须从 ${current()} 接着走，并且每条边都只能通往下一层。`;
      return;
    }
    route.push(now);
    hint = [];
    message.textContent = current() === 'T'
      ? `到达 T！这条路径的瓶颈为 ${bottle()}。点击「沿所选路径增广」。`
      : `已选 ${pathText(route)}，请从 ${current()} 继续沿下一层选择边。`;
    render();
  }

  bfsButton.addEventListener('click', () => {
    if (done || (levels && !blocking)) return;
    route = [];
    hint = [];
    blocking = false;
    levels = bfs();
    phase++;
    phaseCount = 0;
    const li = document.createElement('li');
    if (!levels.has('T')) {
      done = true;
      li.textContent = `第 ${phase} 次 BFS：T 不可达，最大流 ${total()}。`;
      message.textContent = `BFS 已无法到达 T，最大流为 ${total()}。请看本节的结论。`;
    } else {
      li.textContent = `第 ${phase} 次 BFS：T 位于第 ${levels.get('T')} 层，开始在分层图内增广。`;
      message.textContent = '灰色边不满足层数 +1，先不走它们。请从 S 开始点击蓝色边，构造第一条分层图增广路。';
    }
    history.append(li);
    render();
  });

  augmentButton.addEventListener('click', () => {
    if (current() !== 'T' || blocking || done) return;
    const delta = bottle();
    const selected = [...route];
    for (const e of selected) flows[e.index] += e.reverse ? -delta : delta;
    phaseCount++;
    const li = document.createElement('li');
    li.textContent = `第 ${phase} 次分层，增广 ${phaseCount}：${pathText(selected)}，瓶颈 ${delta}，总流量 ${total()}。`;
    history.append(li);
    route = [];
    hint = [];
    message.textContent = '这次增广后，分层图仍然沿用刚才的层数。尝试再找一条路；如果找不到，就检查是否已经形成阻塞流。';
    render();
  });

  checkButton.addEventListener('click', () => {
    if (!levels || blocking || route.length || done) return;
    const remaining = findLayerPath();
    if (remaining) {
      hint = remaining;
      message.textContent = `还没有阻塞！分层图内存在路径 ${pathText(remaining)}。紫色边给出了提示，请继续增广。`;
    } else {
      blocking = true;
      hint = [];
      message.textContent = `第 ${phase} 次分层已经形成阻塞流，本轮共增广 ${phaseCount} 次。注意：这还不意味着整个残量网络没有路径。请重新 BFS 检查。`;
      const li = document.createElement('li');
      li.textContent = `第 ${phase} 次分层：阻塞流形成（本轮增广 ${phaseCount} 次）。`;
      history.append(li);
    }
    render();
  });

  get<HTMLButtonElement>('dn-undo').addEventListener('click', () => {
    route.pop();
    hint = [];
    message.textContent = '已撤回上一步选边。';
    render();
  });
  hintButton.addEventListener('click', () => {
    if (!levels || blocking || done) return;
    if (route.length) {
      message.textContent = '提示从 S 出发的一条完整路径。请先撤回已选边，再查看提示。';
      return;
    }
    const full = findLayerPath();
    if (!full) {
      message.textContent = '分层图已经没有可增广的完整路径，点击「检查是否形成阻塞流」。';
      return;
    }
    // 只提示从起点出发的完整路径，不直接替用户选择。
    hint = full;
    message.textContent = `试着沿紫色边走：${pathText(full)}。提示不会直接执行增广。`;
    render();
  });
  get<HTMLButtonElement>('dn-reset').addEventListener('click', () => {
    flows = FLOW_EDGES.map(() => 0);
    levels = null;
    phase = 0;
    phaseCount = 0;
    route = [];
    done = false;
    blocking = false;
    answered = false;
    hint = [];
    history.replaceChildren();
    get<HTMLElement>('dn-feedback').textContent = '';
    document.querySelectorAll<HTMLButtonElement>('[data-dn-answer]').forEach(b => { b.disabled = false; b.setAttribute('aria-pressed', 'false'); });
    message.textContent = '已重置。先建立 BFS 分层图，再尝试在同一张分层图中连续增广。';
    render();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-dn-answer]').forEach(button => {
    button.addEventListener('click', () => {
      if (answered) return;
      if (button.dataset.dnAnswer !== 'b') {
        get<HTMLElement>('dn-feedback').textContent = '还不能直接宣布最大流。分层图没有路，不等于完整残量网络没有路。';
        return;
      }
      answered = true;
      button.setAttribute('aria-pressed', 'true');
      document.querySelectorAll<HTMLButtonElement>('[data-dn-answer]').forEach(b => { b.disabled = true; });
      get<HTMLElement>('dn-feedback').textContent = '正确。重新 BFS；如果还能到达 T，就建立新分层并继续寻找阻塞流。';
      render();
    });
  });
  get<HTMLButtonElement>('dn-back').addEventListener('click', back);
  render();
}
