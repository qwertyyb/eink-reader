const bookUrl = (bookName) => new URL(`./${bookName}.txt`, import.meta.url).href
const coverUrl = (name) => new URL(`../assets/covers/${name}.jpeg`, import.meta.url).href

export const remoteBooks = [
  {
    id: 1,
    cover: coverUrl('wzzj'),
    title: '万族之劫',
    downloadUrl: bookUrl('万族之劫')
  },
  {
    id: 2,
    cover: coverUrl('qqgw'),
    title: '全球高武',
    downloadUrl: bookUrl('全球高武')
  },
  {
    id: 3,
    cover: coverUrl('zt'),
    title: '遮天',
    downloadUrl: bookUrl('遮天')
  },
  {
    id: 4,
    cover: coverUrl('wmsj'),
    title: '完美世界',
    downloadUrl: bookUrl('完美世界')
  },
  {
    id: 5,
    cover: coverUrl('dfdgr'),
    title: '大奉打更人',
    downloadUrl: bookUrl('大奉打更人')
  },
  {
    id: 6,
    cover: coverUrl('gmzz'),
    title: '诡秘之主',
    downloadUrl: bookUrl('诡秘之主')
  },
  {
    id: 7,
    cover: coverUrl('sm'),
    title: '神墓',
    downloadUrl: bookUrl('神墓')
  },
  {
    id: 8,
    cover: coverUrl('xm'),
    title: '星门',
    downloadUrl: bookUrl('星门')
  },
  {
    id: 9,
    cover: coverUrl('nocover'),
    title: '佛本是道',
    downloadUrl: bookUrl('佛本是道')
  },
  {
    id: 10,
    cover: coverUrl('wsxsztwjl'),
    title: '我师兄实在太稳健了',
    downloadUrl: bookUrl('我师兄实在太稳健了')
  },
  {
    id: 11,
    cover: coverUrl('xzltq'),
    title: '修真聊天群',
    downloadUrl: bookUrl('修真聊天群')
  },
  {
    id: 12,
    cover: coverUrl('msj'),
    title: '牧神记',
    downloadUrl: bookUrl('牧神记')
  },
  {
    id: 13,
    cover: coverUrl('wxkb'),
    title: '无限恐怖',
    downloadUrl: bookUrl('无限恐怖')
  }
]