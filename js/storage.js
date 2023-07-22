const databaseName = 'books'
// 数据库迁移脚本，只可增加，不可修改，不可删除
const migrations = [
  ({ database }) => {
    const objectStore = database.createObjectStore('books', { keyPath: 'id', autoIncrement: true })
    objectStore.createIndex('title', 'title', { unique: true })
  },
  ({ database }) => {
    const objectStore = database.createObjectStore('marks', { keyPath: 'id', autoIncrement: true })
    objectStore.createIndex('bookId', 'bookId', { unique: false })
    objectStore.createIndex('chapter', ['bookId', 'chapterId'], { unique: false })
  }
]
const version = migrations.length

let db = null

const getDatabase = () => {
  if (db) return db
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, version);

    request.onerror = () => {
      console.error('open indexedDB error')
    }

    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      console.log('onUpgrade', event)
      db = event.target.result
      const { oldVersion } = event
      for(let i = oldVersion; i < migrations.length; i += 1) {
        migrations[i]({ database: db, transaction: event.target.transaction })
      }
    }
  })
}

const wrap = async (func) => {
  await getDatabase()
  return new Promise((resolve, reject) => {
    const request = func(db)
    request.onsuccess = event => resolve(event.target.result)
    request.onerror = event => reject(event.target.error)
  })
}

const createStore = (storeName) => {
  return {
    add(info) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .add(info)
      )
    },
    getList () {
      return wrap(db => 
        db.transaction(storeName)
          .objectStore(storeName)
          .getAll()
      )
        .then(list => list.map(({ content, ...rest }) => rest))
    
    },
    get (id) {
      return wrap(db => 
        db.transaction(storeName)
          .objectStore(storeName)
          .get(id)
      )
    },
    remove (id) {
      return wrap(db => 
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .delete(id)
      )
    },
    update (id, updatedData) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .put({ ...updatedData, id })
      )
    }
  }
}

export const books = createStore('books')

const marks = createStore('marks')

marks.getListByChapterAndBook = async (bookId, chapterId) => {
  const list = await marks.getList()
  return list.filter(item => {
    return item.bookId === bookId && item.chapterId === chapterId
  })
}

export { marks }