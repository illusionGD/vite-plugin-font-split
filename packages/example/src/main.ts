import './assets/style/main.css'
// 插件生成的样式：构建/启动时由 vite-plugin-font-split 写入
import './assets/style/fonts.scss'
import './assets/style/fonts-split.scss'

import content from './data/chars.json'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
    <main class="page">
        <h1 class="title subset">${content.title}</h1>
        <p class="subtitle subset">${content.subtitle}</p>

        <ul class="features split">
            ${content.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>

        <p class="demo split">欢迎使用字体分包按需加载的演示文案</p>

        <footer class="footer subset">${content.footer}</footer>
    </main>
`
