import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main>
  <h1>Flow Lab</h1>
  <p>从零推导网络流算法</p>
  <button id="start-button">开始探索</button>
</main>
`;

const button = document.querySelector<HTMLButtonElement>('#start-button');

button?.addEventListener('click', () => {
  console.log('开始探索按钮被点击了！');
});
