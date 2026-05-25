export function generateTeacherContractHTML(contract: any, teacher: any): string {
  const o = (tag: string, content: string, attr?: string) => {
    const open = attr ? '<' + tag + ' ' + attr + '>' : '<' + tag + '>';
    return open + content + '</' + tag + '>';
  };

  const gradeInfo = () => {
    const w = contract.weekly_lessons || 5;
    const monthly = w * 4;
    const value = contract.monthly_value || 650;
    return 'Grade de ' + w + ' (' + numberToWords(w) + ') aulas semanais totalizando ' + monthly + ' (' + numberToWords(monthly) + ') aulas mensais no valor total de R$ ' + Number(value).toFixed(2).replace('.', ',');
  };

  const numberToWords = (n: number): string => {
    const words: Record<number, string> = {
      5: 'cinco', 10: 'dez', 15: 'quinze', 20: 'vinte', 40: 'quarenta'
    };
    return words[n] || String(n);
  };

  return (
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">' +
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:11pt;margin:2cm;color:#000;line-height:1.6}' +
    '.header{text-align:right;margin-bottom:20px;font-size:10pt;color:#333}' +
    '.logo-area{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7C3AED;padding-bottom:15px;margin-bottom:20px}' +
    '.logo-text{font-size:20pt;font-weight:bold;color:#7C3AED}' +
    '.logo-sub{font-size:9pt;color:#555}' +
    '.cnpj-area{text-align:right;font-size:9pt;color:#555}' +
    'h1{text-align:center;font-size:13pt;font-weight:bold;margin:20px 0;text-transform:uppercase;color:#7C3AED}' +
    'h2{font-size:11pt;font-weight:bold;margin-top:15px;text-transform:uppercase;border-bottom:1px solid #7C3AED;padding-bottom:3px;color:#7C3AED}' +
    'p{margin:6px 0;text-align:justify}' +
    'ul{margin:5px 0;padding-left:20px}' +
    'li{margin-bottom:5px;text-align:justify}' +
    '.signature-area{display:flex;justify-content:space-between;margin-top:60px}' +
    '.signature-box{text-align:center;width:45%}' +
    '.signature-line{border-top:1px solid #000;margin-bottom:5px;margin-top:40px}' +
    '.bold{font-weight:bold}' +
    '@media print{body{margin:1.5cm}}' +
    '</style></head><body>' +

    '<div class="logo-area">' +
    '<div><div class="logo-text">Professora Descomplica</div><div class="logo-sub">Espaco Pedagogico</div></div>' +
    '<div class="cnpj-area">Rua Vicente Viana, 293<br>Novo Rio das Ostras - Rio das Ostras/RJ<br>CNPJ: 55.010.967/0001-46</div>' +
    '</div>' +

    o('h1', 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - 2026') +

    o('h2', 'CONTRATANTE') +
    o('p', o('span', 'DESCOMPLICA EDUCACIONAL LTDA', 'class="bold"') + ' - CNPJ: 55.010.967/0001-46') +
    o('p', 'Com sede no endereço: Rua Vicente Viana, 293 - Novo Rio das Ostras - Rio das Ostras/RJ.') +

    o('h2', 'CONTRATADA') +
    o('p', o('span', (teacher.name || '').toUpperCase(), 'class="bold"') + ', CPF no ' + (teacher.cpf || '___') + '  Carteira de Identidade no ' + (teacher.rg || '___')) +
    o('p', 'Logradouro: ' + (teacher.address || '___')) +
    o('p', 'As partes acima identificadas tem, entre si, justo e acertado o presente Contrato de Prestacao de Servicos Educacionais durante o periodo de ' + (contract.contract_start || '___') + ' a ' + (contract.contract_end || '___') + '.') +

    o('h2', 'PAGAMENTO') +
    '<ul>' +
    o('li', 'A CONTRATANTE pagara parcelas mensais, consecutivas, venciveis respectivamente no dia ' + (contract.payment_day || 10) + ' de cada mes, sempre referente ao mes retroativo.') +
    o('li', 'O pagamento da CONTRATADA sera efetuado via ' + (contract.payment_method || 'PIX') + '.') +
    o('li', 'A remuneracao da CONTRATADA se dara pelo seguinte modelo de pagamento de acordo com a sua grade de horarios prestados a empresa. A remuneracao seguira o modelo (Multiplos de 5) de forma crescente.') +
    o('li', gradeInfo() + '.') +
    o('li', 'Caso a professora realize atendimentos que excedam o limite de aulas, as horas-aulas adicionais serao remuneradas de forma proporcional, tomando como base o valor da hora-aula do salario minimo do professor atualizado para o ano de 2026.') +
    o('li', 'Caso a professora nao atinja a grade minima de 5 (cinco) aulas, a remuneracao sera calculada de forma proporcional, com base no valor da grade.') +
    o('li', 'No mes de julho, em razao do periodo de ferias escolares, o valor da remuneracao sera proporcional as semanas efetivamente trabalhadas.') +
    o('li', 'No mes de dezembro, a remuneracao sera calculada proporcionalmente ate a data do ultimo atendimento realizado.') +
    '</ul>' +

    o('h2', 'DO DIA E HORARIO DE ATENDIMENTO') +
    '<ul>' +
    o('li', 'Os dias e horarios poderao sofrer alteracoes e ajustes, desde que acordados previamente entre ambas as partes, nao havendo prejuizo.') +
    o('li', 'Fica estabelecido que os atendimentos que coincidirem com feriados nacionais, estaduais, municipais ou recessos escolares definidos pela gestao nao serao realizados.') +
    '</ul>' +

    o('h2', 'SAO OBRIGACOES DO CONTRATANTE') +
    '<ul>' +
    o('li', 'Acompanhar o progresso dos estudos do(a) educando(a), bem como tomar ciencia das atividades desenvolvidas no local.') +
    o('li', 'Efetuar os pagamentos, dentro do prazo, conforme nele disposto, para a continuidade da atividade educacional.') +
    o('li', 'Ofertar recursos necessarios para o desenvolvimento das aulas.') +
    o('li', 'Manter o espaco de atendimento limpo e organizado.') +
    o('li', 'Dar todo o suporte necessario a CONTRATADA.') +
    '</ul>' +

    o('h2', 'SAO OBRIGACOES DA CONTRATADA') +
    '<ul>' +
    o('li', 'Oferecer servico educacional de qualidade, buscando suprir as dificuldades do educando de diversas maneiras.') +
    o('li', 'Atender o educando com planejamento e pontualidade.') +
    o('li', 'A CONTRATADA compromete-se a informar com antecedencia qualquer alteracao em sua agenda de atendimentos.') +
    o('li', 'A CONTRATADA compromete-se a preencher corretamente e dentro do prazo todos os documentos disponibilizados pela empresa.') +
    o('li', 'Manter a sala sempre organizada para os proximos atendimentos.') +
    o('li', 'Participar das reunioes periodicas de alinhamento.') +
    '</ul>' +

    (contract.notes ? o('h2', 'OBSERVACOES') + o('p', contract.notes) : '') +

    o('p', 'Rio das Ostras, _____ de ' + (contract.contract_start ? new Date(contract.contract_start).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'}) : '_______________') + '.', 'style="margin-top:30px"') +

    '<div class="signature-area">' +
    '<div class="signature-box"><div class="signature-line"></div><p><strong>CONTRATANTE</strong></p><p>DESCOMPLICA EDUCACIONAL LTDA</p></div>' +
    '<div class="signature-box"><div class="signature-line"></div><p><strong>CONTRATADA</strong></p><p>' + (teacher.name || '').toUpperCase() + '</p></div>' +
    '</div>' +

    '</body></html>'
  );
}
