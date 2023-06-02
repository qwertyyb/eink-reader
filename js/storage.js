const databaseName = 'books'
const version = 1;


let db = null;

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
      console.log('upgrade', event)
      db = event.target.result
      const objectStore = db.createObjectStore('books', { keyPath: 'id',  autoIncrement: true })
      objectStore.createIndex('title', 'title', { unique: true });
      resolve(db)
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
    add(book = { title }) {
      return wrap(db =>
        db.transaction([storeName], 'readwrite')
          .objectStore(storeName)
          .add(book)
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
    }
  }
}

export const books = createStore('books')
