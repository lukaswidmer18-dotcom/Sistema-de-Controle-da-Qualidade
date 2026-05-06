import { formatDateTime, getStatusLabel } from './utils'

interface ReceiptData {
  formNumber: string
  receivedAt: Date | string
  evaluatorName: string
  unit: string
  operationResponsible: string
  qualityResponsible: string
  receivingOrder: string
  invoiceNumber: string
  vehicleType: string
  trailerPlate: string
  platePicture?: string | null
  generalStatus: string
  observations?: string | null
  products: Array<{
    productCode: string
    productDescription?: string | null
    lot: string
    quantity?: string | null
  }>
  checklistItems: Array<{
    section: string
    itemKey: string
    itemLabel: string
    status?: string | null
    observation?: string | null
    isNonConformity: boolean
    photos: Array<{ fileUrl: string; fileName: string }>
  }>
  temperatures: Array<{
    productCode?: string | null
    productName?: string | null
    lot?: string | null
    temperatureType: string
    temperature?: number | null
    unit: string
    status?: string | null
    observation?: string | null
    photoUrl?: string | null
  }>
  nonConformities: Array<{
    section: string
    description?: string | null
    photoUrl?: string | null
    status: string
  }>
}

function getStatusBadgeStyle(status: string): string {
  const styles: Record<string, string> = {
    CONFORME: 'background:#dcfce7;color:#166534;border:1px solid #86efac',
    NAO_CONFORME: 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5',
    APROVADO_RESSALVA: 'background:#fef9c3;color:#854d0e;border:1px solid #fde047',
    REPROVADO: 'background:#fee2e2;color:#7f1d1d;border:1px solid #ef4444',
    AGUARDANDO: 'background:#dbeafe;color:#1e40af;border:1px solid #93c5fd',
    NAO_APLICAVEL: 'background:#f3f4f6;color:#4b5563;border:1px solid #d1d5db',
  }
  return styles[status] || styles.NAO_APLICAVEL
}

function getAbsoluteUrl(fileUrl: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  if (fileUrl.startsWith('http')) return fileUrl
  return `${baseUrl}${fileUrl}`
}

export function generateReceiptHTML(data: ReceiptData): string {
  const vehicleItems = data.checklistItems.filter(i => i.section === 'VEICULO')
  const cargoItems = data.checklistItems.filter(i => i.section === 'CARGA')
  const products = data.products

  const checklistRow = (item: typeof vehicleItems[0]) => `
    <tr style="${item.isNonConformity ? 'background:#fff5f5' : ''}">
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${item.itemLabel}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">
        <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;${getStatusBadgeStyle(item.status || 'NAO_APLICAVEL')}">
          ${getStatusLabel(item.status || 'NAO_APLICAVEL')}
        </span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${item.observation || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">
        ${item.photos.map(p => `<img src="${getAbsoluteUrl(p.fileUrl)}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin:2px" alt="foto" />`).join('')}
      </td>
    </tr>
  `

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Recebimento ${data.formNumber}</title>
  <style>
    * { margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact }
    body { font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;background:#fff;font-size:13px }
    .header { background:linear-gradient(135deg,#1d4ed8,#2563eb);color:white;padding:24px 32px;display:flex;justify-content:space-between;align-items:center }
    .header-title { font-size:18px;font-weight:700 }
    .header-subtitle { font-size:12px;opacity:0.85;margin-top:4px }
    .header-meta { text-align:right;font-size:11px;opacity:0.85 }
    .section { margin:0 32px 20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden }
    .section-header { background:#f8fafc;padding:12px 16px;font-weight:700;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px }
    .section-header .dot { width:8px;height:8px;border-radius:50%;background:#2563eb;flex-shrink:0 }
    .info-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:0 }
    .info-item { padding:10px 16px;border-bottom:1px solid #f3f4f6}
    .info-item:nth-child(3n+1) { border-right:1px solid #f3f4f6 }
    .info-item:nth-child(3n+2) { border-right:1px solid #f3f4f6 }
    .info-label { font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;font-weight:600;margin-bottom:2px }
    .info-value { font-size:13px;color:#1f2937;font-weight:500 }
    table { width:100%;border-collapse:collapse }
    th { background:#f8fafc;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb }
    .status-badge { padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700 }
    .nc-item { background:#fff5f5;border-left:3px solid #ef4444;padding:10px 14px;margin-bottom:8px;border-radius:0 4px 4px 0 }
    .nc-label { font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#ef4444;font-weight:700;margin-bottom:3px }
    .footer { background:#f8fafc;border-top:2px solid #e5e7eb;padding:16px 32px;text-align:center;font-size:11px;color:#9ca3af;margin-top:20px }
    .status-geral { margin:0 32px 20px;padding:16px;border-radius:8px;display:flex;align-items:center;justify-content:space-between }
    .plate-img { width:100px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb }
    .photo-grid { display:flex;flex-wrap:wrap;gap:6px;padding:8px 16px 12px }
    .photo-grid img { width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb }
    @media print { .page-break { page-break-before: always } }
  </style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div>
    <div class="header-title">Monitoramento de Recebimento de Produtos</div>
    <div class="header-subtitle">Controle da Qualidade — Recebimento de Veículos</div>
  </div>
  <div class="header-meta">
    <div style="font-weight:700;font-size:16px">${data.formNumber}</div>
    <div>Gerado em: ${formatDateTime(new Date())}</div>
  </div>
</div>

<!-- Status Geral -->
<div style="margin:20px 32px 0">
  <div class="status-geral" style="${getStatusBadgeStyle(data.generalStatus)};border:2px solid transparent">
    <div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;opacity:0.7">Status Geral do Recebimento</div>
      <div style="font-size:20px;font-weight:800;margin-top:2px">${getStatusLabel(data.generalStatus)}</div>
    </div>
    ${data.platePicture ? `<img src="${getAbsoluteUrl(data.platePicture)}" class="plate-img" alt="Placa" />` : ''}
  </div>
</div>

<!-- Identificação -->
<div style="margin:16px 32px 0">
  <div class="section">
    <div class="section-header"><span class="dot"></span>Identificação</div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Nº do Formulário</div><div class="info-value">${data.formNumber}</div></div>
      <div class="info-item"><div class="info-label">Data e Hora</div><div class="info-value">${formatDateTime(data.receivedAt)}</div></div>
      <div class="info-item"><div class="info-label">Avaliador</div><div class="info-value">${data.evaluatorName}</div></div>
      <div class="info-item"><div class="info-label">Unidade / CD</div><div class="info-value">${data.unit}</div></div>
      <div class="info-item"><div class="info-label">Resp. Operação</div><div class="info-value">${data.operationResponsible}</div></div>
      <div class="info-item"><div class="info-label">Resp. Qualidade</div><div class="info-value">${data.qualityResponsible}</div></div>
      <div class="info-item"><div class="info-label">Ordem de Recebimento</div><div class="info-value">${data.receivingOrder}</div></div>
      <div class="info-item"><div class="info-label">Nota Fiscal</div><div class="info-value">${data.invoiceNumber}</div></div>
      <div class="info-item"><div class="info-label">Tipo de Veículo</div><div class="info-value">${data.vehicleType}</div></div>
      <div class="info-item" style="grid-column:span 3"><div class="info-label">Placa da Carreta</div><div class="info-value">${data.trailerPlate}</div></div>
    </div>
  </div>
</div>

<!-- Produtos -->
<div class="section">
  <div class="section-header"><span class="dot"></span>Produtos / Lotes</div>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descrição</th>
        <th>Lote</th>
        <th>Quantidade</th>
      </tr>
    </thead>
    <tbody>
      ${products.map(p => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600">${p.productCode}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${p.productDescription || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${p.lot}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${p.quantity || '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>

<!-- Condições do Veículo -->
<div class="section">
  <div class="section-header"><span class="dot"></span>Condições do Veículo</div>
  <table>
    <thead>
      <tr>
        <th style="width:30%">Item</th>
        <th style="width:20%;text-align:center">Status</th>
        <th style="width:30%">Observação</th>
        <th style="width:20%;text-align:center">Fotos</th>
      </tr>
    </thead>
    <tbody>
      ${vehicleItems.map(item => checklistRow(item)).join('')}
    </tbody>
  </table>
</div>

<!-- Condições da Carga -->
<div class="section">
  <div class="section-header"><span class="dot"></span>Condições da Carga</div>
  <table>
    <thead>
      <tr>
        <th style="width:30%">Item</th>
        <th style="width:20%;text-align:center">Status</th>
        <th style="width:30%">Observação</th>
        <th style="width:20%;text-align:center">Fotos</th>
      </tr>
    </thead>
    <tbody>
      ${cargoItems.map(item => checklistRow(item)).join('')}
    </tbody>
  </table>
</div>

<!-- Temperaturas -->
${data.temperatures.length > 0 ? `
<div class="section">
  <div class="section-header"><span class="dot"></span>Temperatura dos Produtos</div>
  <table>
    <thead>
      <tr>
        <th>Produto</th>
        <th>Lote</th>
        <th>Tipo</th>
        <th style="text-align:center">Temp.</th>
        <th style="text-align:center">Status</th>
        <th>Observação</th>
        <th style="text-align:center">Foto</th>
      </tr>
    </thead>
    <tbody>
      ${data.temperatures.map(t => `
        <tr style="${t.status === 'NAO_CONFORME' ? 'background:#fff5f5' : ''}">
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${t.productName || t.productCode || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${t.lot || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${t.temperatureType === 'RESFRIADO' ? 'Resfriado' : 'Congelado'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;font-weight:700">${t.temperature !== null && t.temperature !== undefined ? `${t.temperature}${t.unit}` : '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center">
            <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;${getStatusBadgeStyle(t.status || 'NAO_APLICAVEL')}">
              ${getStatusLabel(t.status || 'NAO_APLICAVEL')}
            </span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280">${t.observation || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center">
            ${t.photoUrl ? `<img src="${getAbsoluteUrl(t.photoUrl)}" style="width:50px;height:50px;object-fit:cover;border-radius:4px" alt="foto" />` : '—'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
` : ''}

<!-- Não Conformidades -->
${data.nonConformities.length > 0 ? `
<div class="section" style="border-color:#fca5a5">
  <div class="section-header" style="background:#fff5f5;color:#991b1b"><span class="dot" style="background:#ef4444"></span>Não Conformidades Registradas</div>
  <div style="padding:12px 16px">
    ${data.nonConformities.map((nc, i) => `
      <div class="nc-item">
        <div class="nc-label">NC ${String(i + 1).padStart(2, '0')} — ${nc.section === 'VEICULO' ? 'Condições do Veículo' : nc.section === 'CARGA' ? 'Condições da Carga' : nc.section}</div>
        <div style="font-size:13px;color:#374151">${nc.description || 'Sem descrição'}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
          <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;${getStatusBadgeStyle(nc.status)}">${getStatusLabel(nc.status)}</span>
          ${nc.photoUrl ? `<img src="${getAbsoluteUrl(nc.photoUrl)}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #fca5a5" alt="evidência" />` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

<!-- Observações -->
${data.observations ? `
<div class="section">
  <div class="section-header"><span class="dot"></span>Observações Gerais</div>
  <div style="padding:12px 16px;font-size:13px;color:#374151;line-height:1.6">${data.observations}</div>
</div>
` : ''}

<!-- Footer -->
<div class="footer">
  <p>Controle da Qualidade — Recebimento de Veículos &nbsp;|&nbsp; Formulário ${data.formNumber} &nbsp;|&nbsp; Gerado em ${formatDateTime(new Date())}</p>
</div>

</body>
</html>
`
}
