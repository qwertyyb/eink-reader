import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { createRouter, createWebHashHistory } from 'https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js'
import VirtualList from 'https://unpkg.com/vue-virtual-list-v3@1.5.1/dist/index.js'
import IndexPage from './js/pages/index.js'
import BookPage from './js/pages/book.js'
import { env } from './js/utils/env.js'

const routes = [
  { path: '/', name: 'home', component: IndexPage, meta: { transitionName: 'slide-right' } },
  { path: '/book/:server/:id', name: 'book', component: BookPage, props: true, meta: { transitionName: 'slide-left' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const app = createApp({})

app.config.unwrapInjectedRef = true

app.use(router)
app.use(VirtualList)

app.mount('#app')

if (!env.isBooxLeaf()) {
  document.body.classList.add('enable-anim')
}
