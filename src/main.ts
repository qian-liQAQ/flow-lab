import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

function showWelcome() {
  app.innerHTML = `
    <main class="screen welcome">
      <span class="eyebrow">INTERACTIVE ALGORITHM LAB</span>
      <h1>Flow Lab</h1>
      <p>从零推导网络流算法</p>
      <button id="start-button" class="primary-button">开始探索 →</button>
    </main>
  `;

  document.querySelector<HTMLButtonElement>('#start-button')!
    .addEventListener('click', showCapacityLesson);
}

function showCapacityLesson() {
  const capacity = 5;
  let flow = 0;

  app.innerHTML = `
    <main class="screen lesson">
      <div class="lesson-content">
        <button id="back-button" class="text-button">← 返回首页</button>
        <div class="lesson-meta">第一章 · 什么是最大流？ / 01</div>
        <h1>一条边，能承载多少流量？</h1>
        <p class="question">假设 S 是起点，T 是终点。连接它们的管道容量为 5。试着向 T 发送流量。</p>

        <div class="graph-panel">
          <svg class="flow-graph" viewBox="0 0 600 230" role="img" aria-label="从 S 到 T 的有向边，容量为 5">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#64748b"></path>
              </marker>
            </defs>
            <line x1="145" y1="115" x2="455" y2="115" stroke="#334155" stroke-width="16" stroke-linecap="round"></line>
            <line id="flow-line" x1="145" y1="115" x2="145" y2="115" stroke="#38bdf8" stroke-width="12" stroke-linecap="round"></line>
            <line x1="145" y1="115" x2="455" y2="115" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"></line>
            <circle cx="120" cy="115" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="2"></circle>
            <circle cx="480" cy="115" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="2"></circle>
            <text x="120" y="122" text-anchor="middle" class="node-label">S</text>
            <text x="480" y="122" text-anchor="middle" class="node-label">T</text>
            <text id="flow-label" x="300" y="80" text-anchor="middle" class="edge-label">流量 0 / 容量 5</text>
          </svg>
        </div>

        <div class="lesson-actions">
          <button id="send-button" class="primary-button">发送 1 单位流量 →</button>
          <button id="reset-button" class="secondary-button">重置</button>
        </div>
        <p id="feedback" class="feedback" aria-live="polite">当前流量为 0。你觉得最多可以发送多少？</p>
      </div>
    </main>
  `;

  const sendButton = document.querySelector<HTMLButtonElement>('#send-button')!;
  const label = document.querySelector<SVGTextElement>('#flow-label')!;
  const line = document.querySelector<SVGLineElement>('#flow-line')!;
  const feedback = document.querySelector<HTMLParagraphElement>('#feedback')!;

  function render() {
    label.textContent = `流量 ${flow} / 容量 ${capacity}`;
    line.setAttribute('x2', String(145 + 310 * flow / capacity));
    sendButton.disabled = flow >= capacity;
    feedback.textContent = flow === capacity
      ? '已经达到容量上限！容量是允许通过的最大流量，流量不能超过容量。'
      : `已发送 ${flow} 单位流量，还可以再发送 ${capacity - flow} 单位。`;
  }

  sendButton.addEventListener('click', () => {
    if (flow < capacity) flow++;
    render();
  });
  document.querySelector<HTMLButtonElement>('#reset-button')!
    .addEventListener('click', () => {
      flow = 0;
      render();
    });
  document.querySelector<HTMLButtonElement>('#back-button')!
    .addEventListener('click', showWelcome);
}

showWelcome();
