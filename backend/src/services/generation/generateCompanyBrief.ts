import { generateJson } from './llm.js'
import type { FetchedPage } from '../crawler/fetchPage.js'
import type { SearchResult } from '../research/publicSearch.js'

export async function generateCompanyBrief(company:string, pages:FetchedPage[], publicResults:SearchResult[]) {
  const sources = pages.map(p=>p.url)
  const context = pages.slice(0,6).map(p=>`SOURCE ${p.url}\nTITLE: ${p.title}\nTEXT: ${p.text.slice(0,7000)}`).join('\n\n')
  const searchContext = publicResults.slice(0,8).map(r=>`${r.title}\n${r.url}\n${r.snippet}`).join('\n\n')
  return generateJson(
    'Summarize company research honestly. Do not fabricate facts. Public interview results are unverified discussion, so frame them as reported public discussion, not company policy.',
    `COMPANY: ${company}\nWEBSITE SOURCES:\n${context}\nPUBLIC INTERVIEW DISCUSSION:\n${searchContext}\nReturn {"summary":"","what_they_do":""}.`,
    {
      summary: context ? `${company} research was gathered from ${sources.length} company pages.` : `Limited public company information was available for ${company}.`,
      what_they_do: context ? 'Use the retrieved company sources above to describe what the company does.' : 'No reliable company description could be retrieved.'
    }
  )
}
