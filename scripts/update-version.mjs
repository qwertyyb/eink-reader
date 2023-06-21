import { readFileSync, writeFileSync } from 'node:fs'

const generateVersion = (date) => `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString()
  .padStart(2, '0')}${date.getHours().toString()
  .padStart(2, '0')}${date.getMinutes().toString()
  .padStart(2, '0')}`;

const updateVersion = () => {
  const versionFilePath = new URL('../constant.js', import.meta.url)
  const version = generateVersion(new Date())
  const content = readFileSync(versionFilePath, 'utf-8')
  const newContent = content.replace(/export\sconst\sversion\s=\s.*/, `export const version = '${version}'`)
  writeFileSync(versionFilePath, newContent, 'utf-8')
  return version
}

const version = updateVersion()

console.log('版本已更新, 最新版本:', version)