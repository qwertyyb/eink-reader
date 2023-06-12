import { dataService as localDataService } from './local-server.js'
import { dataService as onlineDataService } from './online-server.js'

export const services = {
  local: localDataService,
  online: onlineDataService
}