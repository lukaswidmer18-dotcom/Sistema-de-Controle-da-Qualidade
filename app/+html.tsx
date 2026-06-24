import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

// react-native-web renders TextInput as a raw <input>, which the browser
// defaults to content-box. That makes paddingHorizontal/borderWidth add to
// (instead of fit inside) any flex/percentage width — force border-box to
// match RN's box model.
// Separately, browsers give <input>/<textarea> an intrinsic min-width:auto,
// which blocks flex:1 siblings from shrinking below their content size —
// e.g. two flex:1 inputs ("Lote"/"Qtd.") refusing to fit a narrow card and
// overflowing the screen. min-width:0 lets them actually share the row.
const webResetCss = `
  *, *::before, *::after { box-sizing: border-box; }
  input, textarea, select { min-width: 0; }
  input, textarea, select, button { -webkit-tap-highlight-color: transparent; }
`

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#16413a" />
        <title>Controle de Qualidade</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Qualidade" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webResetCss }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
