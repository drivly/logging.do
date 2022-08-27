const api = {
  icon: '📕',
  name: 'Logging.do',
  description: 'Logging-as-a-Service API',
  url: 'https://logging.do',
  endpoints: {
    getLoggedEvents: 'https://logging.do/api',
    logEvent: 'https://logging.do/:level/:message',
  },
  memberOf: 'https://primitives.do',
}
  
export default {
  fetch: (req, env) => env.LOGGER.get(env.LOGGER.idFromName(new URL(req.url).hostname)).fetch(req)
}

export class Logger {
  constructor(state, env) {
    this.state = state
  }
  async fetch(req) {
    const { origin, hostname, pathname, searchParams } = new URL(req.url)
    if (pathname == '/api/') {
      const list = this.state.storage.list()
      return new Response(JSON.stringify({ 
        api,
        list,
      }, null, 2), { headers: { 'content-type': 'application/json' } })
    }
    const [level, message] = pathname.split('/')
    const params = Object.fromEntries(searchParams)
    const data = req.json().catch(ex => undefined)
    const ts = Date.now()
    const time = new Date(ts).toISOString()
    const id = req.headers.get('cf-ray')
    const url = origin + '/api/' + id
    const logged =  { id, url, hostname, level, message, params, data, ts, time }
    await this.state.storage.put(id, {id, url, hostname})
    return new Response(JSON.stringify({ 
      api,
      logged,
    }, null, 2), { headers: { 'content-type': 'application/json' } })
  }
}
