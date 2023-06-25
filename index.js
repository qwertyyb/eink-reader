import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { createRouter, createWebHashHistory } from 'https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js'
import VirtualList from 'https://unpkg.com/vue-virtual-list-v3@1.5.1/dist/index.js'
import PageIndex from './js/pages/index.js'
import PageBook from './js/pages/book.js'
import BookCoverAnimation from './js/components/book-cover-animation.js'
import { env } from './js/utils/env.js'

const routes = [
  {
    path: '/',
    name: 'home',
    component: PageIndex,
    children: [
      {
        path: 'book/:server/:id',
        name: 'transition',
        component: BookCoverAnimation,
        props: true,
        children: [
          {
            path: 'read',
            name: 'book',
            component: PageBook,
            props: true,
          }
        ]
      }
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const App = {
  template: document.getElementById('app').outerHTML,
}

const app = createApp(App)

app.config.unwrapInjectedRef = true

app.use(router)
app.use(VirtualList)

app.mount('#app')

if (!env.isBooxLeaf()) {
  document.body.classList.add('enable-anim')
}
