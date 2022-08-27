const api = {
  icon: '📕',
  name: 'Logging.do',
  description: 'Logging-as-a-Service API',
  url: 'https://logging.do',
  endpoints: {
    getLogs: 'https://logging.do/api',
    getEvent: 'https://logging.do/api/:eventId',
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
    const { origin, hostname, pathname, search, searchParams } = new URL(req.url)
    if (pathname == '/api') {
      const list = await this.state.storage.list().then(list => Object.fromEntries(list))
      return new Response(JSON.stringify({ 
        api,
        list,
      }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
    } else if (pathname.startsWith('/api/')) {
      const [_,id] = pathname.split('/api/')
      console.log({id})
      const event = await this.state.storage.get(id)
      return new Response(JSON.stringify({ 
        api,
        id,
        event,
      }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
    }
    const [level = null, message = null] = pathname.split('/')
    const params = Object.fromEntries(searchParams)
    const data = req.json().catch(ex => null)
    const ts = Date.now()
    const time = new Date(ts).toISOString()
    const id = req.headers.get('cf-ray')
    const url = origin + '/api/' + id
    const logged =  { id, url, hostname, level, message, params, data, ts, time }
    await this.state.storage.put(id, { id, url, hostname, level, message, params, data, ts, time })
    return new Response(JSON.stringify({ 
      api,
      logged,
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
  }
}
