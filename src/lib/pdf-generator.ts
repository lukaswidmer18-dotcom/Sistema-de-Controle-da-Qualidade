import { formatDateTime, getStatusLabel } from './utils'
import { logoBelloBase64 } from './logo-bello-base64'

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
    CONFORME: 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0',
    NAO_CONFORME: 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5',
    APROVADO_RESSALVA: 'background:#fef9c3;color:#854d0e;border:1px solid #fde047',
    REPROVADO: 'background:#fee2e2;color:#7f1d1d;border:1px solid #ef4444',
    AGUARDANDO: 'background:#f3f4f6;color:#4b5563;border:1px solid #e5e7eb',
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
  
  const primaryBlue = '#006eb7';

  const checklistRow = (item: typeof vehicleItems[0], index: number, prefix: string) => {
    const hasPhotos = item.photos && item.photos.length > 0;
    
    return `
    <tr style="${item.isNonConformity ? 'background-color:#fff5f5' : ''}">
      <td style="padding:12px;${!hasPhotos ? 'border-bottom:1px solid #e5e7eb;' : ''}font-size:12px;color:#374151;width:40%"><strong>${prefix}.${index + 1}</strong> - ${item.itemLabel}</td>
      <td style="padding:12px;${!hasPhotos ? 'border-bottom:1px solid #e5e7eb;' : ''}text-align:center;width:20%">
        <span style="padding:4px 10px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase;${getStatusBadgeStyle(item.status || 'NAO_APLICAVEL')}">
          ${getStatusLabel(item.status || 'NAO_APLICAVEL')}
        </span>
      </td>
      <td style="padding:12px;${!hasPhotos ? 'border-bottom:1px solid #e5e7eb;' : ''}font-size:11px;color:#6b7280;width:40%">${item.observation || '—'}</td>
    </tr>
    ${hasPhotos ? `
    <tr style="${item.isNonConformity ? 'background-color:#fff5f5' : ''}">
      <td colspan="3" style="padding:0 12px 16px 12px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;">
          ${item.photos.map(p => `<img src="${getAbsoluteUrl(p.fileUrl)}" class="photo-large" alt="foto" />`).join('')}
        </div>
      </td>
    </tr>
    ` : ''}
  `
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Recebimento ${data.formNumber}</title>
  <style>
    * { margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact }
    body { font-family:'Inter','Segoe UI',Arial,sans-serif;color:#1f2937;background:#ffffff;font-size:12px;line-height:1.5 }
    
    .container { padding: 32px 40px; min-height: 90vh; }
    
    /* Header */
    .header { display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px; }
    .header-title { font-size:22px;font-weight:800;color:${primaryBlue};text-transform:uppercase;max-width:60%;line-height:1.2;letter-spacing:-0.5px }
    .header-logo { height:56px;object-fit:contain; }
    .header-divider { border:none;border-bottom:2px solid #e5e7eb;margin-bottom:24px; }
    
    /* Meta Block */
    .meta-block { width:100%;max-width:400px;border-collapse:collapse;margin-bottom:24px; }
    .meta-block td { border:2px solid #ffffff;padding:6px 12px;font-size:12px; }
    .meta-label { background-color:${primaryBlue};color:#ffffff;font-weight:700;text-transform:uppercase;width:120px;letter-spacing:0.5px }
    .meta-value { background-color:#f3f4f6;color:#374151;font-weight:500; }
    
    /* Status Geral Highlight */
    .status-highlight { display:inline-flex;align-items:center;padding:6px 14px;border-radius:6px;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.5px; }
    
    /* Section Divider */
    .section-divider { display:flex;align-items:center;text-align:center;color:#4b5563;font-weight:800;font-size:16px;letter-spacing:1px;margin:32px 0 24px; }
    .section-divider::before, .section-divider::after { content:'';flex:1;border-bottom:1px solid #d1d5db; }
    .section-divider::before { margin-right:16px; }
    .section-divider::after { margin-left:16px; }
    
    /* Section Title */
    .section-title { display:flex;align-items:center;background-color:#f3f4f6;margin-bottom:16px; }
    .section-number { background-color:${primaryBlue};color:#ffffff;font-weight:800;font-size:14px;width:32px;height:32px;display:flex;align-items:center;justify-content:center; }
    .section-text { color:${primaryBlue};font-weight:700;font-size:14px;padding-left:12px;text-transform:none; }
    
    /* Tables */
    table { width:100%;border-collapse:collapse;margin-bottom:32px; }
    .kv-table td { padding:8px 12px;vertical-align:top;border-bottom:1px solid #f3f4f6; }
    .kv-key { font-weight:700;color:#4b5563;width:40%;font-size:12px; }
    .kv-value { color:#1f2937;font-weight:500;font-size:12px; }
    
    .data-table th { background-color:#f8fafc;color:#64748b;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:0.5px;padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0; }
    .data-table td { padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px; }
    .data-table tr:nth-child(even) { background-color:#f8fafc; }
    
    /* Helpers */
    .photo-large { width:100%;max-width:300px;height:auto;border-radius:8px;border:1px solid #e5e7eb;margin-top:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); }
    
    /* Footer */
    .footer { background-color:${primaryBlue};color:#ffffff;padding:16px 40px;display:flex;justify-content:space-between;align-items:center;font-size:10px;margin-top:auto;border-top:4px solid #005a96; }
    .footer-right { text-align:right;opacity:0.9;line-height:1.6; }
    
    @media print { .page-break { page-break-before: always } }
  </style>
</head>
<body>

<div class="container">
  <!-- Header -->
  <div class="header">
    <div class="header-title">Monitoramento de Recebimento de Produtos</div>
    <img src="data:image/png;base64,${logoBelloBase64}" class="header-logo" alt="Bello Alimentos" />
  </div>
  <hr class="header-divider" />

  <!-- Top Information -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <table class="meta-block">
      <tr>
        <td class="meta-label">DATA</td>
        <td class="meta-value">${formatDateTime(new Date())}</td>
      </tr>
      <tr>
        <td class="meta-label">AVALIADOR</td>
        <td class="meta-value">${data.evaluatorName}</td>
      </tr>
      <tr>
        <td class="meta-label">UNIDADE</td>
        <td class="meta-value">${data.unit}</td>
      </tr>
    </table>
    
    <div class="status-highlight" style="${getStatusBadgeStyle(data.generalStatus)}">
      STATUS GERAL: ${getStatusLabel(data.generalStatus)}
    </div>
  </div>

  <div class="section-divider">RESULTADOS</div>

  <!-- 1. Identificação -->
  <div class="section-title">
    <div class="section-number">1</div>
    <div class="section-text">Identificação</div>
  </div>
  
  <table class="kv-table">
    <tr><td class="kv-key">1.1 - Número do Formulário</td><td class="kv-value">${data.formNumber}</td></tr>
    <tr><td class="kv-key">1.2 - Data e hora de recebimento</td><td class="kv-value">${formatDateTime(data.receivedAt)}</td></tr>
    <tr><td class="kv-key">1.3 - Responsável da operação</td><td class="kv-value">${data.operationResponsible}</td></tr>
    <tr><td class="kv-key">1.4 - Responsável da qualidade</td><td class="kv-value">${data.qualityResponsible}</td></tr>
    <tr><td class="kv-key">1.5 - Ordem de recebimento</td><td class="kv-value">${data.receivingOrder}</td></tr>
    <tr><td class="kv-key">1.6 - Nota Fiscal</td><td class="kv-value">${data.invoiceNumber}</td></tr>
    <tr><td class="kv-key">1.7 - Tipo de Veículo</td><td class="kv-value">${data.vehicleType}</td></tr>
    <tr>
      <td class="kv-key">1.8 - Placa da Carreta</td>
      <td class="kv-value">
        <div style="font-weight:800;font-size:14px;color:${primaryBlue};text-transform:uppercase;letter-spacing:1px">${data.trailerPlate}</div>
        ${data.platePicture ? `<img src="${getAbsoluteUrl(data.platePicture)}" class="photo-large" alt="Placa da Carreta" />` : ''}
      </td>
    </tr>
  </table>

  <!-- 2. Produtos / Lotes -->
  <div class="section-title">
    <div class="section-number">2</div>
    <div class="section-text">Produtos e Lotes Recebidos</div>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:20%">Código</th>
        <th style="width:40%">Descrição</th>
        <th style="width:20%">Lote</th>
        <th style="width:20%;text-align:right">Quantidade</th>
      </tr>
    </thead>
    <tbody>
      ${products.map(p => `
        <tr>
          <td style="font-weight:600">${p.productCode}</td>
          <td>${p.productDescription || '—'}</td>
          <td>${p.lot}</td>
          <td style="text-align:right;font-weight:600">${p.quantity || '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- 3. Condições do Veículo -->
  <div class="section-title">
    <div class="section-number">3</div>
    <div class="section-text">Condições do Veículo</div>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:40%">Item</th>
        <th style="width:20%;text-align:center">Status</th>
        <th style="width:40%">Observação</th>
      </tr>
    </thead>
    <tbody>
      ${vehicleItems.map((item, index) => checklistRow(item, index, '3')).join('')}
    </tbody>
  </table>

  <!-- 4. Condições da Carga -->
  <div class="section-title">
    <div class="section-number">4</div>
    <div class="section-text">Condições da Carga</div>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:40%">Item</th>
        <th style="width:20%;text-align:center">Status</th>
        <th style="width:40%">Observação</th>
      </tr>
    </thead>
    <tbody>
      ${cargoItems.map((item, index) => checklistRow(item, index, '4')).join('')}
    </tbody>
  </table>

  <!-- 5. Temperaturas -->
  ${data.temperatures.length > 0 ? `
  <div class="section-title">
    <div class="section-number">5</div>
    <div class="section-text">Controle de Temperatura</div>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>Produto</th>
        <th>Lote</th>
        <th>Tipo</th>
        <th style="text-align:center">Temperatura</th>
        <th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.temperatures.map(t => `
        <tr style="${t.status === 'NAO_CONFORME' ? 'background-color:#fff5f5' : ''}">
          <td style="font-weight:500;${!t.photoUrl ? 'border-bottom:1px solid #f1f5f9;' : 'border-bottom:none;'}">${t.productName || t.productCode || '—'}</td>
          <td style="${!t.photoUrl ? 'border-bottom:1px solid #f1f5f9;' : 'border-bottom:none;'}">${t.lot || '—'}</td>
          <td style="${!t.photoUrl ? 'border-bottom:1px solid #f1f5f9;' : 'border-bottom:none;'}"><span style="font-size:10px;background:#e2e8f0;padding:2px 6px;border-radius:4px;font-weight:600">${t.temperatureType === 'RESFRIADO' ? 'Resfriado' : 'Congelado'}</span></td>
          <td style="text-align:center;font-weight:800;font-size:14px;color:${primaryBlue};${!t.photoUrl ? 'border-bottom:1px solid #f1f5f9;' : 'border-bottom:none;'}">${t.temperature !== null && t.temperature !== undefined ? `${t.temperature}${t.unit}` : '—'}</td>
          <td style="text-align:center;${!t.photoUrl ? 'border-bottom:1px solid #f1f5f9;' : 'border-bottom:none;'}">
            <span style="padding:4px 10px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase;${getStatusBadgeStyle(t.status || 'NAO_APLICAVEL')}">
              ${getStatusLabel(t.status || 'NAO_APLICAVEL')}
            </span>
          </td>
        </tr>
        ${t.photoUrl ? `
        <tr style="${t.status === 'NAO_CONFORME' ? 'background-color:#fff5f5' : ''}">
          <td colspan="5" style="padding:0 12px 16px 12px;border-bottom:1px solid #f1f5f9;">
            <img src="${getAbsoluteUrl(t.photoUrl)}" class="photo-large" alt="foto" />
          </td>
        </tr>
        ` : ''}
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- 6. Não Conformidades -->
  ${data.nonConformities.length > 0 ? `
  <div class="section-title" style="background-color:#fee2e2">
    <div class="section-number" style="background-color:#dc2626">6</div>
    <div class="section-text" style="color:#b91c1c">Registro de Não Conformidades</div>
  </div>
  <table class="data-table" style="border:1px solid #fca5a5">
    <thead>
      <tr>
        <th style="width:15%">ID</th>
        <th style="width:25%">Seção</th>
        <th style="width:40%">Descrição</th>
        <th style="width:20%;text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.nonConformities.map((nc, index) => `
        <tr style="background-color:#fff5f5">
          <td style="vertical-align:top;font-weight:800;color:#dc2626;${!nc.photoUrl ? 'border-bottom:1px solid #fca5a5;' : 'border-bottom:none;'}">NC 6.${index + 1}</td>
          <td style="vertical-align:top;font-size:11px;color:#7f1d1d;font-weight:600;text-transform:uppercase;${!nc.photoUrl ? 'border-bottom:1px solid #fca5a5;' : 'border-bottom:none;'}">${nc.section === 'VEICULO' ? 'Condições do Veículo' : nc.section === 'CARGA' ? 'Condições da Carga' : nc.section}</td>
          <td style="vertical-align:top;color:#450a0a;${!nc.photoUrl ? 'border-bottom:1px solid #fca5a5;' : 'border-bottom:none;'}">${nc.description || 'Sem descrição detalhada'}</td>
          <td style="vertical-align:top;text-align:center;${!nc.photoUrl ? 'border-bottom:1px solid #fca5a5;' : 'border-bottom:none;'}">
            <span style="padding:4px 10px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase;${getStatusBadgeStyle(nc.status)}">
              ${getStatusLabel(nc.status)}
            </span>
          </td>
        </tr>
        ${nc.photoUrl ? `
        <tr style="background-color:#fff5f5">
           <td colspan="4" style="padding:0 12px 16px 12px;border-bottom:1px solid #fca5a5;">
              <div style="font-weight:600;font-size:11px;color:#991b1b;margin-bottom:6px">Evidência Fotográfica:</div>
              <img src="${getAbsoluteUrl(nc.photoUrl)}" class="photo-large" alt="evidência" />
           </td>
        </tr>
        ` : ''}
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- 7. Observações Finais -->
  ${data.observations ? `
  <div class="section-title">
    <div class="section-number">7</div>
    <div class="section-text">Observações Finais</div>
  </div>
  <div style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:16px 20px;border-radius:6px;color:#334155;line-height:1.6;margin-bottom:32px">
    ${data.observations}
  </div>
  ` : ''}

</div>

<!-- Footer -->
<div class="footer">
  <div>
    <img src="data:image/png;base64,${logoBelloBase64}" style="height:24px;filter:brightness(0) invert(1);opacity:0.9" alt="Bello Alimentos" />
  </div>
  <div class="footer-right">
    <strong>Sistema de Controle da Qualidade</strong><br/>
    Formulário ID: ${data.formNumber} &nbsp;|&nbsp; Recebimento de Veículos<br/>
    <span style="opacity:0.7">Documento gerado eletronicamente em ${formatDateTime(new Date())}</span>
  </div>
</div>

</body>
</html>
`
}
