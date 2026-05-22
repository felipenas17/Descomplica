export function generateContractHTML(contract: any): string {
  const o = (tag: string, content: string, attr?: string) => {
    const open = attr ? '<' + tag + ' ' + attr + '>' : '<' + tag + '>';
    return open + content + '</' + tag + '>';
  };
  const sc = ('<' + 'div class="signature">');
  const sl = ('<' + 'div class="signature-line">');
  const hr = ('<' + 'hr/>');
  const closediv = ('<' + '/div>');
  return (
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contrato</title>' +
    '<style>body{font-family:Arial,sans-serif;font-size:12pt;margin:2cm}' +
    'h1{text-align:center}h2{text-transform:uppercase;margin-top:20px}' +
    '.signature{display:flex;justify-content:space-between;margin-top:60px}' +
    '.signature-line{text-align:center;width:45%}' +
    'ul{padding-left:20px}li{margin-bottom:5px}' +
    '</style></head><body>' +
    o('h1', 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS') +
    o('p', o('strong', 'CONTRATANTE:') + ' ' + (contract.responsible_name || '')) +
    o('p', 'CPF: ' + (contract.responsible_cpf || '___') + ' RG: ' + (contract.responsible_rg || '___')) +
    o('p', 'Endereço: ' + (contract.responsible_address || '___')) +
    o('p', o('strong', 'CONTRATADA:') + ' DESCOMPLICA EDUCACIONAL LTDA - CNPJ: 55.010.967/0001-46') +
    o('h2', 'Do Objeto') +
    o('p', 'Serviços educacionais ao(à): ' + o('strong', contract.student_name || '')) +
    o('h2', 'Do Valor') +
    '<ul>' +
    o('li', (contract.sessions_per_week || '') + ' atendimento(s)/semana - R$ ' + Number(contract.monthly_value || 0).toFixed(2).replace('.', ',') + '/mes') +
    o('li', 'Total: ' + (contract.total_months || '') + ' parcelas - vencimento dia ' + (contract.payment_day || '')) +
    o('li', 'Taxa materiais: R$ ' + Number(contract.materials_fee || 0).toFixed(2).replace('.', ',')) +
    '</ul>' +
    o('h2', 'Dos Atendimentos') +
    o('p', 'Dias: ' + (contract.days_of_week || '___') + ' - Horario: ' + (contract.schedule_time || '___')) +
    o('h2', 'Uso de Imagem') +
    o('p', (contract.image_authorized ? '[X] AUTORIZO' : '[X] NAO AUTORIZO') + ' uso de imagem de ' + (contract.student_name || '')) +
    o('h2', 'Das Obrigacoes') +
    '<ul>' +
    o('li', 'Acompanhar o progresso e efetuar pagamentos em dia.') +
    o('li', 'Desmarcar com 24h de antecedencia ou apresentar atestado.') +
    '</ul>' +
    o('p', 'Rio das Ostras, _____ de ' + (contract.start_month || '___') + ' de 2026.', 'style="margin-top:30px"') +
    sc +
    sl + hr + o('p', o('strong', 'CONTRATANTE')) + o('p', contract.responsible_name || '') + closediv +
    sl + hr + o('p', o('strong', 'CONTRATADA')) + o('p', 'DESCOMPLICA EDUCACIONAL LTDA') + closediv +
    closediv +
    '</body></html>'
  );
}
