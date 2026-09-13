import dns from 'node:dns/promises'
import net from 'node:net'
import { env } from '../../config/env.js'
import { AppError } from '../../utils/errors.js'

function ipIsPrivate(ip: string) {
  if (net.isIPv4(ip)) {
    const [a,b] = ip.split('.').map(Number)
    return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)
  }
  return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')
}

export async function validateExternalUrl(raw: string) {
  let url: URL
  try { url = new URL(raw) } catch { throw new AppError(400, 'INVALID_URL', 'Company URL is invalid.') }
  if (!['http:','https:'].includes(url.protocol)) throw new AppError(400, 'INVALID_URL', 'Only HTTP(S) company URLs are supported.')
  if (!env.ALLOW_PRIVATE_FETCH && process.env.EVALUATE_MODE !== '1') {
    const host = url.hostname.toLowerCase()
    if (['localhost','localhost.localdomain'].includes(host) || net.isIP(host) && ipIsPrivate(host)) throw new AppError(400, 'PRIVATE_URL_BLOCKED', 'Private and loopback addresses are blocked in production.')
    try {
      const records = await dns.lookup(host, { all:true })
      if (records.some(r => ipIsPrivate(r.address))) throw new AppError(400, 'PRIVATE_URL_BLOCKED', 'The URL resolves to a private or loopback address.')
    } catch (err) { if (err instanceof AppError) throw err }
  }
  return url
}

export type FetchedPage = { url:string; status:number; contentType:string; title:string; text:string; links:string[]; skipped?:boolean; reason?:string }

export async function fetchPage(rawUrl: string): Promise<FetchedPage> {
  const url = await validateExternalUrl(rawUrl)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), env.FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { redirect:'follow', signal: controller.signal, headers: { 'user-agent':'TraoInterviewPrep/1.0 (+assessment crawler)' } })
    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok) throw new AppError(res.status === 404 ? 404 : 502, res.status === 404 ? 'COMPANY_NOT_FOUND' : 'COMPANY_UNREACHABLE', `Company page returned HTTP ${res.status}.`)
    if (!contentType.includes('text/html')) return { url:url.toString(), status:res.status, contentType, title:'', text:'', links:[], skipped:true, reason:'Unsupported content type.' }
    const reader = res.body?.getReader()
    if (!reader) throw new AppError(502,'COMPANY_UNREACHABLE','Company response had no readable body.')
    const chunks: Uint8Array[] = []; let total = 0
    while (true) {
      const {value, done} = await reader.read(); if (done) break
      total += value.length; if (total > env.MAX_FETCH_BYTES) { await reader.cancel(); throw new AppError(413,'PAGE_TOO_LARGE','Page exceeded the configured size limit.') }
      chunks.push(value)
    }
    const html = Buffer.concat(chunks).toString('utf8')
    const { load } = await import('cheerio')
    const $ = load(html)
    $('script, style, noscript, svg').remove()
    const title = $('title').first().text().trim()
    const text = $('body').text().replace(/\s+/g,' ').trim().slice(0, 25000)
    const links = $('a[href]').map((_, el) => ($(el).attr('href') || '').trim()).get().filter(Boolean)
    return { url:url.toString(), status:res.status, contentType, title, text, links }
  } finally { clearTimeout(timer) }
}
