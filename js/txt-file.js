export const parseTxtFile = async (file, { tocReg = /^第.+章/ } = {}) => {

  const load = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', async () => {
        const result = reader.result

        let text = null
        const encodingList = ['utf-8', 'gbk', 'big5', 'utf-16le', 'utf-16be', 'utf-8']
        for(let i = 0; i < encodingList.length; i += 1) {
          const decoder = new TextDecoder(encodingList[i], { fatal: true })
          try {
            text = decoder.decode(result)
          } catch(e) {
            continue
          }
        }
        if (text) return resolve(text.replace(/\r\n/g, '\n'))
        reject(new Error('文件加载失败'))
      })
      reader.addEventListener('error', () => reject(reader.error))
      reader.readAsArrayBuffer(file)
    })
  }

  const getTitle = (fileName) => fileName.replace(/\.[^.]+$/, '')

  const getCatalog = (text, { reg = /^第.+章/ } = {}) => {
    const toc = []
    text.split('\n').forEach((line, index) => {
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

  const content = await load(file)
  const title = getTitle(file.name)
  const catalog = getCatalog(content, { reg: tocReg })

  return {
    title,
    content,
    catalog
  }
}

export const render = (content, startCursor, endCursor) => {
  return '<article>' + content.split('\n')
    .slice(startCursor, endCursor)
    .map((line, i) => `<p data-cursor=${JSON.stringify(startCursor + i)}>${line}</p>`)
    .join('\n') + '</article>'
}