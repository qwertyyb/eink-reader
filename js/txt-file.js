const decodeText = (arrayBuffer) => {
  let text = null
  const encodingList = ['utf-8', 'gbk', 'big5', 'utf-16le', 'utf-16be', 'utf-8']
  for(let i = 0; i < encodingList.length; i += 1) {
    const decoder = new TextDecoder(encodingList[i], { fatal: true })
    try {
      text = decoder.decode(arrayBuffer).replace(/\r\n/g, '\n')
    } catch(e) {
      continue
    }
  }
  if (!text) throw new Error('解码失败')
  return text
}

const parseCatalog = (content, { reg = /^第.+章/ } = {}) => {
  const toc = []
  content.split('\n').forEach((line, index) => {
    const isToc = reg.test(line.trim())
    if (isToc) {
      toc.push({
        title: line.trim(),
        cursor: index
      })
    }
  })
  return toc
}

export const parseTxtFile = async (file, { tocReg = /^第.+章/ } = {}) => {

  const load = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', async () => {
        const result = reader.result

        try {
          resolve(decodeText(result))
        } catch(err) {
          reject(err)
        }
      })
      reader.addEventListener('error', () => reject(reader.error))
      reader.readAsArrayBuffer(file)
    })
  }

  const getTitle = (fileName) => fileName.replace(/\.[^.]+$/, '')

  const content = await load(file)
  const title = getTitle(file.name)

  return {
    title,
    content,
    catalog: parseCatalog(content, { reg: tocReg })
  }
}

export const render = (content, startCursor, endCursor) => {
  return '<article>' + content.split('\n')
    .slice(startCursor, endCursor)
    .map((line, i) => `<p data-cursor=${JSON.stringify(startCursor + i)}${i === 0 ? ' data-is-title' : ' '}>${line.trim()}</p>`)
    .join('\n') + '</article>'
}

const downloadWithProgress = async (url, onUpdate) => {
  const response = await fetch(url)
  const total = +response.headers.get('Content-Length')
  const result = new Uint8Array(total)
  let progress = 0
  const reader = response.body.getReader()
  while(true) {
    const { done, value } = await reader.read()
    if (done) {
      break;
    }
    result.set(value, progress)
    progress += value.length
    onUpdate && onUpdate(progress, total)
  }
  return result
}

export const download = async (book, onUpdate) => {
  const arrayBuffer = await downloadWithProgress(book.downloadUrl, onUpdate)
  const content = await decodeText(arrayBuffer)
  const catalog = parseCatalog(content)
  return {
    ...book,
    content,
    catalog,
  }
}