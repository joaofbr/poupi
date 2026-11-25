async function ping(url) {
  const started = Date.now()
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'poupi-keepalive' } })
    console.log(`health ${response.status} em ${Date.now() - started} ms`)
  } catch (error) {
    console.error(`health falhou depois de ${Date.now() - started} ms: ${error}`)
  }
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(ping(env.HEALTH_URL))
  },
}
