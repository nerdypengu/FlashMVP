/** Read authenticated fetch SSE streams, including fragmented UTF-8 and CRLF. */
export async function* sseEvents(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n')
      let boundary
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const lines = event.split('\n').filter(line => line.startsWith('data:'))
        if (lines.length) yield lines.map(line => line.slice(5).replace(/^ /, '')).join('\n')
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
