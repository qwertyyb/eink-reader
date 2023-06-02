import { books } from './js/storage.js'
import { parseTxtFile } from './js/txt-file.js'
import { dataService as localDataService } from './js/local-server.js'
import { dataService as onlineDataService } from './js/online-server.js'

export const parseAndStoreFile = async (file) => {
  const info = await parseTxtFile(file)
  await books.add(info)
  return info
}

export const services = {
  local: localDataService,
  online: onlineDataService
}