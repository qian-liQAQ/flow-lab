import { FLOW_EDGES, FlowGraph } from './flow-graph';

type Arc = { from: string; to: string; cap: number; index: number; reverse: boolean };
type Strategy = 'dfs' | 'bfs';
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
  let view: 'original' | 'residual' = 'residual';
  let pending: Arc[] | null = null;
  let rounds = 0;
  let manual = 0;
  let completed = false;
  let codeTab: Strategy = 'dfs';

  app.innerHTML = `
    <main class="screen lesson"><div class="lesson-content ff-content">
      <button id="ff-back" class="text-button">← 返回第七节</button>
      <div class="lesson-meta">第三章 · 最大流算法 / 08</div>
      <h1>能否让计算机反复寻找增广路？</h1>
      <p class="question">每次只需要寻找一条增广路、计算瓶颈并更新残量网络。尝试手动执行两轮，再让算法继续运行。</p>
      <div class="graph-workspace ff-workspace">
        <section class="graph-panel ff-graph">
          <div class="ff-graph-header"><strong id="ff-graph-title">残量网络</strong><button id="ff-toggle" class="secondary-button">切换到原网络</button></div>
          <svg id="ff-svg" class="flow-graph" viewBox="0 0 650 360" aria-label="Ford–Fulkerson 算法网络图"></svg>
          <p class="ff-legend">蓝色实线：正向残量边　黄色虚线：反向残量边　白色：本次增广路</p>
        </section>
        <aside class="graph-info ff-console">
          <h2>算法控制台</h2>
          <label for="ff-strategy">寻找增广路的方法</label>
          <select id="ff-strategy"><option value="dfs">DFS · 任意增广路</option><option value="bfs">BFS · 边数最少</option></select>
          <p class="ff-metric">当前流量 <strong id="ff-total">0</strong></p>
          <p>增广次数：<strong id="ff-rounds">0</strong></p>
          <p>当前路径：<span id="ff-path">尚未寻找</span></p>
          <p>瓶颈容量：<strong id="ff-bottleneck">—</strong></p>
          <div class="ff-console-buttons">
            <button id="ff-find" class="primary-button">寻找增广路</button>
            <button id="ff-apply" class="primary-button" disabled>执行本次增广</button>
            <button id="ff-auto" class="secondary-button" hidden>自动运行至结束</button>
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
  const graph = new FlowGraph(svg);
  const message = get<HTMLElement>('ff-message');
  const findButton = get<HTMLButtonElement>('ff-find');
  const applyButton = get<HTMLButtonElement>('ff-apply');
  const autoButton = get<HTMLButtonElement>('ff-auto');
  const history = get<HTMLOListElement>('ff-history');

  function arcs(): Arc[] {
    const result: Arc[] = [];
    FLOW_EDGES.forEach((edge, index) => {
      if (edge.cap - flows[index] > 0) result.push({ from: edge.from, to: edge.to, cap: edge.cap - flows[index], index, reverse: false });
      if (flows[index] > 0) result.push({ from: edge.to, to: edge.from, cap: flows[index], index, reverse: true });
    });
    return result;
  }
  function search(): Arc[] | null {
    const edges = arcs();
    const seen = new Set<string>(['S']);
    const parent = new Map<string, Arc>();
    const frontier = ['S'];
    while (frontier.length) {
      const u = strategy === 'bfs' ? frontier.shift()! : frontier.pop()!;
      if (u === 'T') break;
      for (const e of edges) {
        if (e.from !== u || seen.has(e.to)) continue;
        seen.add(e.to);
        parent.set(e.to, e);
        frontier.push(e.to);
        if (strategy === 'dfs' && e.to === 'T') break;
      }
    }
    if (!parent.has('T')) return null;
    const path: Arc[] = [];
    for (let at = 'T'; at !== 'S';) {
      const e = parent.get(at)!;
      path.push(e);
      at = e.from;
    }
    return path.reverse();
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
    for (const [id, color] of [['ff-arrow-f', '#38bdf8'], ['ff-arrow-r', '#fbbf24'], ['ff-arrow-selected', '#f8fafc']]) {
      const marker = svgEl('marker', { id, markerWidth: '10', markerHeight: '10', refX: '8', refY: '3', orient: 'auto' });
      marker.append(svgEl('path', { d: 'M0,0 L0,6 L9,3 z', fill: color }));
      defs.append(marker);
    }
    svg.append(defs);
    for (const edge of arcs()) {
      const [x1, y1] = positions[edge.from], [x2, y2] = positions[edge.to];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * 31, sy = y1 + uy * 31;
      const ex = x2 - ux * 36, ey = y2 - uy * 36;
      const bend = 17;
      const cx = (sx + ex) / 2 - uy * bend, cy = (sy + ey) / 2 + ux * bend;
      const active = pending?.some(p => p.index === edge.index && p.reverse === edge.reverse) ?? false;
      const path = svgEl('path', {
        d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
        fill: 'none', stroke: active ? '#f8fafc' : edge.reverse ? '#fbbf24' : '#38bdf8',
        'stroke-width': active ? '5' : '3',
        ...(edge.reverse ? { 'stroke-dasharray': '8 6' } : {}),
        'marker-end': `url(#ff-arrow-${active ? 'selected' : edge.reverse ? 'r' : 'f'})`,
      });
      svg.append(path);
      svg.append(svgEl('text', {
        x: String((sx + 2 * cx + ex) / 4 - uy * 12),
        y: String((sy + 2 * cy + ey) / 4 + ux * 12),
        'text-anchor': 'middle', class: 'edge-label',
      }, String(edge.cap)));
    }
    for (const [id, [x, y]] of Object.entries(positions)) {
      svg.append(svgEl('circle', { cx: String(x), cy: String(y), r: '27', fill: '#1e293b', stroke: '#38bdf8', 'stroke-width': '2' }));
      svg.append(svgEl('text', { x: String(x), y: String(y + 8), 'text-anchor': 'middle', class: 'node-label' }, id));
    }
  }
  function render() {
    if (view === 'original') {
      graph.setEdges(FLOW_EDGES.map((e, i) => ({ ...e, flow: flows[i] })));
      get<HTMLElement>('ff-graph-title').textContent = '原网络';
      get<HTMLButtonElement>('ff-toggle').textContent = '切换到残量网络';
    } else {
      drawResidual();
      get<HTMLElement>('ff-graph-title').textContent = '残量网络';
      get<HTMLButtonElement>('ff-toggle').textContent = '切换到原网络';
    }
    get<HTMLElement>('ff-total').textContent = String(total());
    get<HTMLElement>('ff-rounds').textContent = String(rounds);
    get<HTMLElement>('ff-path').textContent = pending ? route(pending) : completed ? '无增广路' : '尚未寻找';
    get<HTMLElement>('ff-bottleneck').textContent = pending ? String(amount(pending)) : '—';
    findButton.disabled = pending !== null || completed;
    applyButton.disabled = pending === null;
    autoButton.hidden = manual < 2 || completed;
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
    rounds = 0;
    manual = 0;
    completed = false;
    history.replaceChildren();
    message.textContent = '已从零流重新开始。先寻找一条增广路。';
    render();
  }
  findButton.addEventListener('click', () => {
    pending = search();
    if (!pending) { finish(); return; }
    message.textContent = `找到路径 ${route(pending)}，瓶颈为 ${amount(pending)}。下一步应该怎样更新正反向残量容量？`;
    render();
  });
  applyButton.addEventListener('click', () => {
    if (!pending) return;
    apply();
    manual++;
    message.textContent = manual >= 2
      ? '你已经手动完成两次增广。现在可以继续单步操作，也可以自动运行至结束。'
      : '一次增广完成。请再次寻找增广路，观察为什么需要循环。';
    render();
  });
  autoButton.addEventListener('click', () => {
    let guard = 0;
    while (guard++ < 100) {
      pending = search();
      if (!pending) break;
      apply();
    }
    finish();
  });
  get<HTMLButtonElement>('ff-reset').addEventListener('click', reset);
  get<HTMLSelectElement>('ff-strategy').addEventListener('change', event => {
    strategy = (event.target as HTMLSelectElement).value as Strategy;
    reset();
  });
  get<HTMLButtonElement>('ff-toggle').addEventListener('click', () => {
    view = view === 'original' ? 'residual' : 'original';
    render();
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
