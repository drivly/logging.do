 export default {
  fetch: (req, env) => env.LOGGER.get(env.LOGGER.idFromName(new URL(req.url).hostname)).fetch(req)
}

export class Logger {
  constructor(state, env) {
    this.state = state
    this.env = env
  }
  async fetch(req) {
    const { user, redirect, body } = await this.env.CTX.fetch(req).then(res => res.json())
    if (redirect) return Response.redirect(redirect)

    const { origin, hostname, pathname, search, searchParams } = new URL(req.url)
    const api = {
      icon: '📕',
      name: 'Logging.do',
      description: 'Logging-as-a-Service API',
      url: 'https://logging.do',
      endpoints: {
        getLogs: origin + '/api',
        getEvent: origin + '/api/:eventId',
        logEvent: origin + '/:level/:message',
      },
      memberOf: 'https://primitives.do',
    }
    if (pathname == '/api') {
      // const list = await this.state.storage.list({reverse: true, limit: 10}).then(list => Object.fromEntries(list))
      const list = await this.state.storage.list({reverse: true, limit: 10}).then(list => Object.values(Object.fromEntries(list)))
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
    const [_,level = null, message = null] = pathname.split('/')
    const params = Object.fromEntries(searchParams)
    const data = body
    const ts = Date.now()
    const time = new Date(ts).toISOString()
    const id = req.headers.get('cf-ray')
    const url = origin + '/api/' + id
    const logged =  { id, url, hostname, level, message, params, data, ts, time }
    await this.state.storage.put(id, logged)
    return new Response(JSON.stringify({ 
      api,
      logged,
      user,
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
  }
}
