import type { Browser } from 'puppeteer-core'

// Vercel Serverless não inclui o Chrome baixado pelo `puppeteer` no bundle da function
// (fica em cache fora de node_modules). Em produção usamos puppeteer-core + Chromium
// empacotado pelo @sparticuz/chromium, que vai dentro do node_modules e é rastreado no build.
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteerCore = await import('puppeteer-core')
    return puppeteerCore.launch({
      headless: true,
      args: chromium.args,
      executablePath: await chromium.executablePath(),
    })
  }

  const puppeteer = (await import('puppeteer')).default
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  return browser as unknown as Browser
}
