import { FLOW_EDGES } from './flow-graph';

type Arc = { from: string; to: string; cap: number; index: number; reverse: boolean };
type Strategy = 'dfs' | 'bfs';
type SearchStep = { current: string; explored: Arc | null; visited: string[]; frontier: string[]; path: Arc[]; description: string };
const positions: Record<string, [number, number]> = {
  S: [70, 180], A: [230, 80], B: [230, 280],
  C: [420, 80], D: [420, 280], T: [575, 180],
};
const ns = 'http://www.w3.org/2000/svg';

const common = `#include <bits/stdc++.h>
using namespace std;
using i64 = long long;

struct Edge {
  int to, rev;
  i64 cap;
};
`;

const dfsCode = common + `
class FordFulkerson {
  vector<vector<Edge>> g;
  vector<int> vis;

  i64 dfs(int u, int t, i64 f) {
    if (u == t) return f;
    vis[u] = 1;
    for (auto &e : g[u]) {
      if (e.cap == 0 || vis[e.to]) continue;
      i64 d = dfs(e.to, t, min(f, e.cap));
      if (d == 0) continue;
      e.cap -= d;
      g[e.to][e.rev].cap += d;
      return d;
    }
    return 0;
  }

 public:
  FordFulkerson(int n) : g(n), vis(n) {}

  void add_edge(int u, int v, i64 cap) {
    int a = (int)g[u].size();
    int b = (int)g[v].size();
    // 自环时反向边的下标需要额外偏移。
    g[u].push_back({v, b + (u == v), cap});
    g[v].push_back({u, a, 0});
  }

  i64 max_flow(int s, int t) {
    if (s == t) return 0;
    i64 ans = 0;
    while (true) {
      fill(vis.begin(), vis.end(), 0);
      i64 f = dfs(s, t, LLONG_MAX);
      if (f == 0) break;
      ans += f;
    }
    return ans;
  }
};
`;

const bfsCode = common + `
class EdmondsKarp {
  vector<vector<Edge>> g;

 public:
  EdmondsKarp(int n) : g(n) {}

  void add_edge(int u, int v, i64 cap) {
    int a = (int)g[u].size();
    int b = (int)g[v].size();
    g[u].push_back({v, b + (u == v), cap});
    g[v].push_back({u, a, 0});
  }

  i64 max_flow(int s, int t) {
    if (s == t) return 0;
    i64 ans = 0;
    while (true) {
      vector<int> prev(g.size(), -1), via(g.size(), -1);
      queue<int> q;
      q.push(s);
      prev[s] = s;
      while (!q.empty() && prev[t] == -1) {
        int u = q.front();
        q.pop();
        for (int i = 0; i < (int)g[u].size(); i++) {
          const auto &e = g[u][i];
          if (e.cap == 0 || prev[e.to] != -1) continue;
          prev[e.to] = u;
          via[e.to] = i;
          q.push(e.to);
        }
      }
      if (prev[t] == -1) break;
      i64 f = LLONG_MAX;
      for (int v = t; v != s; v = prev[v])
        f = min(f, g[prev[v]][via[v]].cap);
      for (int v = t; v != s; v = prev[v]) {
        auto &e = g[prev[v]][via[v]];
        e.cap -= f;
        g[v][e.rev].cap += f;
      }
      ans += f;
    }
    return ans;
  }
};
`;

function svgEl(tag: string, attrs: Record<string, string>, label?: string): SVGElement {
  const e = document.createElementNS(ns, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (label !== undefined) e.textContent = label;
  return e;
}

export function showFordFulkersonLesson(app: HTMLDivElement, back: () => void) {
  let flows = FLOW_EDGES.map(() => 0);
  let strategy: Strategy = 'dfs';
  let pending: Arc[] | null = null;
  let rounds = 0;
  let completed = false;
  let codeTab: Strategy = 'dfs';
  let trace: SearchStep[] = [];
  let traceIndex = -1;
  let searching = false;

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content ff-content">
      <button id="ff-back" class="text-button">← 返回第七节</button>
      <div class="lesson-meta">第三章 · 最大流算法 / 08</div>
      <h1>能否让计算机反复寻找增广路？</h1>
      <p class="question">每次只需要寻找一条增广路、计算瓶颈并更新残量网络。尝试反复寻找增广路并执行增广，直到残量网络中再也找不到路径。</p>
      <div class="graph-workspace ff-workspace">
        <section class="graph-panel ff-graph">
          <div class="ff-graph-header"><strong>残量网络</strong></div>
          <svg id="ff-svg" class="flow-graph" viewBox="0 0 650 360" aria-label="Ford–Fulkerson 算法网络图"></svg>
          <p class="ff-legend">蓝色实线：正向残量边　黄色虚线：反向残量边　橙色：正在探索　白色：已找到的增广路</p>
        </section>
        <aside class="graph-info ff-console">
          <h2>算法控制台</h2>
          <label for="ff-strategy">寻找增广路的方法</label>
          <select id="ff-strategy"><option value="dfs">DFS · 任意增广路</option><option value="bfs">BFS · 边数最少</option></select>
          <p class="ff-metric">当前流量 <strong id="ff-total">0</strong></p>
          <p>增广次数：<strong id="ff-rounds">0</strong></p>
          <p>当前路径：<span id="ff-path">尚未寻找</span></p>
          <p>搜索位置：<strong id="ff-current">—</strong></p>
          <p>待处理节点：<span id="ff-frontier">—</span></p>
          <p>已访问：<span id="ff-visited">—</span></p>
          <p>瓶颈容量：<strong id="ff-bottleneck">—</strong></p>
          <div class="ff-console-buttons">
            <button id="ff-find" class="primary-button">开始寻找增广路</button>
            <button id="ff-step" class="secondary-button" disabled>下一步搜索 →</button>
            <button id="ff-apply" class="primary-button" disabled>执行本次增广</button>
            <button id="ff-reset" class="secondary-button">重置并比较</button>
          </div>
          <p class="graph-keyboard-tip">切换 DFS/BFS 将重置网络，便于公平比较两种寻路策略。</p>
        </aside>
      </div>
      <section class="discovery greedy-prompt" aria-live="polite">
        <strong>探索问题</strong>
        <p id="ff-message">你已经知道如何手动沿残量路径增广。现在尝试让程序替你寻找第一条路径。</p>
      </section>
      <section class="history-panel"><h2>增广记录</h2><ol id="ff-history" aria-live="polite"></ol></section>
      <section id="ff-summary" class="discovery" hidden>
        <strong>为什么算法能够结束？</strong>
        <p>当前残量网络中已经不存在 S 到 T 的增广路，所以当前流量就是最大流。对于本节的整数容量网络，每次增广至少增加 1，算法必定终止。</p>
        <p>DFS 和 BFS 都遵循相同的增广框架；区别仅在于选择哪一条路径。为什么 BFS 有更好的复杂度保证，将在下一节讨论。</p>
      </section>
      <section id="ff-code-section" class="history-panel" hidden>
        <h2>从交互到 C++ 参考实现</h2>
        <p>两套代码都维护残量边与反向边。DFS 寻找任意增广路；BFS 寻找边数最少的增广路，即 Edmonds–Karp。</p>
        <div class="lesson-actions">
          <button id="ff-code-dfs" class="secondary-button" aria-pressed="true">DFS 实现</button>
          <button id="ff-code-bfs" class="secondary-button" aria-pressed="false">BFS 实现</button>
          <button id="ff-copy" class="secondary-button">复制代码</button>
        </div>
        <div class="ff-code-map">寻路 → 计算瓶颈 → 更新正反向残量 → 累加答案 → 重复</div>
        <pre class="ff-code"><code id="ff-code"></code></pre>
        <p class="ff-code-tip">代码为可复用的算法类；调用时先构造对象、添加边，再调用 max_flow(s, t)。顶点编号从 0 开始。</p>
      </section>
      <div class="lesson-actions"><button id="ff-next" class="secondary-button">下一节：Edmonds–Karp（即将开放）→</button></div>
    </div></main>
  `;

  const get = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
  const svg = get<SVGSVGElement>('ff-svg');
  const message = get<HTMLElement>('ff-message');
  const findButton = get<HTMLButtonElement>('ff-find');
  const applyButton = get<HTMLButtonElement>('ff-apply');
  const history = get<HTMLOListElement>('ff-history');

  function arcs(): Arc[] {
    const result: Arc[] = [];
    FLOW_EDGES.forEach((edge, index) => {
      if (edge.cap - flows[index] > 0) result.push({ from: edge.from, to: edge.to, cap: edge.cap - flows[index], index, reverse: false });
      if (flows[index] > 0) result.push({ from: edge.to, to: edge.from, cap: flows[index], index, reverse: true });
    });
    return result;
  }
  function buildTrace(): SearchStep[] {
    const edges = arcs();
    const steps: SearchStep[] = [];
    const seen = new Set<string>(['S']);
    const parent = new Map<string, Arc>();
    const snapshot = (current: string, explored: Arc | null, frontier: string[], description: string) => {
      const path: Arc[] = [];
      for (let at = current; at !== 'S' && parent.has(at);) {
        const edge = parent.get(at)!;
        path.unshift(edge);
        at = edge.from;
      }
      steps.push({ current, explored, visited: [...seen], frontier: [...frontier], path, description });
    };
    if (strategy === 'bfs') {
      const queue = ['S'];
      snapshot('S', null, queue, 'BFS 从 S 开始。队列先进先出，逐层扩展。');
      let reached = false;
      while (queue.length && !reached) {
        const u = queue.shift()!;
        snapshot(u, null, queue, `取出队首 ${u}，检查它的出边。`);
        for (const edge of edges) {
          if (edge.from !== u || seen.has(edge.to)) continue;
          seen.add(edge.to);
          parent.set(edge.to, edge);
          queue.push(edge.to);
          snapshot(edge.to, edge, queue, `发现 ${edge.from} → ${edge.to}，加入队尾。`);
          if (edge.to === 'T') {
            reached = true;
            break;
          }
        }
      }
    } else {
      const stack: string[] = [];
      const dfs = (u: string): boolean => {
        stack.push(u);
        snapshot(u, null, stack, `DFS 进入 ${u}，沿一条分支继续深入。`);
        if (u === 'T') return true;
        for (const edge of edges) {
          if (edge.from !== u || seen.has(edge.to)) continue;
          seen.add(edge.to);
          parent.set(edge.to, edge);
          snapshot(edge.to, edge, [...stack, edge.to], `沿 ${edge.from} → ${edge.to} 深入搜索。`);
          if (dfs(edge.to)) return true;
        }
        stack.pop();
        snapshot(u, null, stack, `从 ${u} 回溯，尝试其他分支。`);
        return false;
      };
      dfs('S');
    }
    if (!parent.has('T')) {
      snapshot('S', null, [], '所有可达节点已搜索完毕，仍无法到达 T。');
    }
    return steps;
  }
  function foundPath(): Arc[] | null {
    const final = trace[trace.length - 1];
    if (!final || !final.visited.includes('T')) return null;
    // DFS 的最后一步位于 T；BFS 最后一次发现的边也指向 T。
    const parent = new Map<string, Arc>();
    for (const step of trace) {
      if (step.explored) parent.set(step.explored.to, step.explored);
    }
    const result: Arc[] = [];
    for (let at = 'T'; at !== 'S';) {
      const edge = parent.get(at);
      if (!edge) return null;
      result.unshift(edge);
      at = edge.from;
    }
    return result;
  }
  function amount(path: Arc[]) {
    return Math.min(...path.map(e => e.cap));
  }
  function route(path: Arc[]) {
    return ['S', ...path.map(e => e.to)].join(' → ');
  }
  function total() {
    return flows[0] + flows[1];
  }
  function drawResidual() {
    svg.replaceChildren();
    const defs = svgEl('defs', {});
    for (const [id, color] of [['ff-arrow-f', '#38bdf8'], ['ff-arrow-r', '#fbbf24'], ['ff-arrow-selected', '#f8fafc'], ['ff-arrow-explore', '#fb923c']]) {
      const marker = svgEl('marker', { id, markerWidth: '10', markerHeight: '10', refX: '8', refY: '3', orient: 'auto' });
      marker.append(svgEl('path', { d: 'M0,0 L0,6 L9,3 z', fill: color }));
      defs.append(marker);
    }
    svg.append(defs);
    const step = traceIndex >= 0 && (searching || pending !== null) ? trace[traceIndex] : null;
    for (const edge of arcs()) {
      const [x1, y1] = positions[edge.from], [x2, y2] = positions[edge.to];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * 31, sy = y1 + uy * 31;
      const ex = x2 - ux * 36, ey = y2 - uy * 36;
      const bend = 17;
      const cx = (sx + ex) / 2 - uy * bend, cy = (sy + ey) / 2 + ux * bend;
      const active = pending?.some(p => p.index === edge.index && p.reverse === edge.reverse) ?? false;
      const exploring = step?.explored?.index === edge.index && step.explored.reverse === edge.reverse;
      const path = svgEl('path', {
        d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
        fill: 'none', stroke: exploring ? '#fb923c' : active ? '#f8fafc' : edge.reverse ? '#fbbf24' : '#38bdf8',
        'stroke-width': active || exploring ? '5' : '3',
        ...(edge.reverse ? { 'stroke-dasharray': '8 6' } : {}),
        'marker-end': `url(#ff-arrow-${exploring ? 'explore' : active ? 'selected' : edge.reverse ? 'r' : 'f'})`,
      });
      svg.append(path);
      svg.append(svgEl('text', {
        x: String((sx + 2 * cx + ex) / 4 - uy * 12),
        y: String((sy + 2 * cy + ey) / 4 + ux * 12),
        'text-anchor': 'middle', class: 'edge-label',
      }, String(edge.cap)));
    }
    for (const [id, [x, y]] of Object.entries(positions)) {
      const current = step?.current === id;
      const visited = step?.visited.includes(id);
      svg.append(svgEl('circle', { cx: String(x), cy: String(y), r: '27', fill: current ? '#9a3412' : visited ? '#164e63' : '#1e293b', stroke: current ? '#fb923c' : '#38bdf8', 'stroke-width': current ? '4' : '2' }));
      svg.append(svgEl('text', { x: String(x), y: String(y + 8), 'text-anchor': 'middle', class: 'node-label' }, id));
    }
  }
  function render() {
    drawResidual();
    get<HTMLElement>('ff-total').textContent = String(total());
    get<HTMLElement>('ff-rounds').textContent = String(rounds);
    get<HTMLElement>('ff-path').textContent = pending ? route(pending) : completed ? '无增广路' : '尚未寻找';
    get<HTMLElement>('ff-bottleneck').textContent = pending ? String(amount(pending)) : '—';
    const step = traceIndex >= 0 && (searching || pending !== null) ? trace[traceIndex] : null;
    get<HTMLElement>('ff-current').textContent = step?.current ?? '—';
    get<HTMLElement>('ff-frontier').textContent = step ? (step.frontier.join(' → ') || '空') : '—';
    get<HTMLElement>('ff-visited').textContent = step ? step.visited.join('、') : '—';
    get<HTMLElement>('ff-path').textContent = pending ? route(pending) : searching ? '搜索中…' : completed ? '无增广路' : '尚未寻找';
    findButton.disabled = searching || pending !== null || completed;
    get<HTMLButtonElement>('ff-step').disabled = !searching;
    applyButton.disabled = pending === null;
    get<HTMLElement>('ff-summary').hidden = !completed;
    get<HTMLElement>('ff-code-section').hidden = !completed;
  }
  function addHistory(path: Arc[], delta: number) {
    const li = document.createElement('li');
    li.textContent = `第 ${rounds} 次：${route(path)}，瓶颈 ${delta}，总流量 ${total()}。`;
    history.append(li);
  }
  function apply() {
    if (!pending) return;
    const path = pending, delta = amount(path);
    for (const e of path) flows[e.index] += e.reverse ? -delta : delta;
    rounds++;
    addHistory(path, delta);
    pending = null;
    trace = [];
    traceIndex = -1;
    render();
  }
  function finish() {
    completed = true;
    pending = null;
    message.textContent = `残量网络中找不到 S → T 的增广路。最大流为 ${total()}，共增广 ${rounds} 次。现在可以对照两套 C++ 代码。`;
    render();
  }
  function reset() {
    flows = FLOW_EDGES.map(() => 0);
    pending = null;
    searching = false;
    trace = [];
    traceIndex = -1;
    rounds = 0;
    completed = false;
    history.replaceChildren();
    message.textContent = '已从零流重新开始。先寻找一条增广路。';
    render();
  }
  findButton.addEventListener('click', () => {
    trace = buildTrace();
    traceIndex = -1;
    searching = true;
    message.textContent = strategy === 'dfs'
      ? 'DFS 会先沿当前分支深入，走不通时回溯。逐步观察橙色边与当前节点。'
      : 'BFS 使用队列，先访问距离 S 较近的节点。逐步观察待处理队列。';
    render();
  });
  get<HTMLButtonElement>('ff-step').addEventListener('click', () => {
    if (!searching) return;
    traceIndex++;
    const step = trace[traceIndex];
    message.textContent = step.description;
    if (traceIndex === trace.length - 1) {
      pending = foundPath();
      searching = false;
      if (!pending) {
        finish();
        return;
      }
      message.textContent = `搜索结束：${route(pending)}，瓶颈为 ${amount(pending)}。现在执行增广。`;
    }
    render();
  });
  applyButton.addEventListener('click', () => {
    if (!pending) return;
    apply();
    message.textContent = '本次增广完成。继续寻找增广路；如果已经找不到路径，算法就会结束。';
    render();
  });
  get<HTMLButtonElement>('ff-reset').addEventListener('click', reset);
  get<HTMLSelectElement>('ff-strategy').addEventListener('change', event => {
    strategy = (event.target as HTMLSelectElement).value as Strategy;
    reset();
  });
  function renderCode() {
    get<HTMLElement>('ff-code').textContent = codeTab === 'dfs' ? dfsCode : bfsCode;
    get<HTMLButtonElement>('ff-code-dfs').setAttribute('aria-pressed', String(codeTab === 'dfs'));
    get<HTMLButtonElement>('ff-code-bfs').setAttribute('aria-pressed', String(codeTab === 'bfs'));
  }
  get<HTMLButtonElement>('ff-code-dfs').addEventListener('click', () => { codeTab = 'dfs'; renderCode(); });
  get<HTMLButtonElement>('ff-code-bfs').addEventListener('click', () => { codeTab = 'bfs'; renderCode(); });
  get<HTMLButtonElement>('ff-copy').addEventListener('click', async () => {
    const button = get<HTMLButtonElement>('ff-copy');
    try {
      await navigator.clipboard.writeText(codeTab === 'dfs' ? dfsCode : bfsCode);
      button.textContent = '已复制';
      window.setTimeout(() => { button.textContent = '复制代码'; }, 1600);
    } catch {
      button.textContent = '复制失败，请手动选择';
    }
  });
  get<HTMLButtonElement>('ff-next').addEventListener('click', () => {
    message.textContent = '下一节将讨论 Edmonds–Karp 为什么能保证多项式时间复杂度。';
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  get<HTMLButtonElement>('ff-back').addEventListener('click', back);
  renderCode();
  render();
}
