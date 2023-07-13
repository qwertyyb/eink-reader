
const decodeText = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer.slice(0, 10000));
  let binary = ''
  bytes.forEach(item => {
    binary += String.fromCharCode(item)
  })
  const { encoding } = jschardet.detect(binary)
  console.log('encoding', encoding)
  const decoder = new TextDecoder(encoding, { fatal: true })
  try {
    return decoder.decode(arrayBuffer).replace(/\r\n/g, '\n')
  } catch(e) {
    throw new Error('解码失败')
  }
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

const downloadWithProgress = async (url, onUpdate) => {
  const response = await fetch(url)
  const total = +response.headers.get('Content-Length')
  const result = []
  let progress = 0
  const reader = response.body.getReader()
  while(true) {
    const { done, value } = await reader.read()
    if (done) {
      break;
    }
    result.push(value)
    progress += value.length
    onUpdate && onUpdate(progress, total)
  }

  let data = new Uint8Array(progress)

  let position = 0
  result.forEach(item => {
    data.set(item, position)
    position += item.length
  })

  return data
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