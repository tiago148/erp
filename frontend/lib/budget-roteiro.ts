// Roteiro de orcamento em 9 etapas (secao V16 do prototipo). O template e
// estatico; o progresso e guardado por orcamento como lista de chaves
// marcadas ("fase.grupo.item"), grau de detalhamento e se houve visita.

export interface RoteiroGrupo {
  g: string;
  itens: string[];
}
export interface RoteiroFase {
  n: number;
  t: string;
  d: string;
  grupos: RoteiroGrupo[];
}

export const ROTEIRO: RoteiroFase[] = [
  {
    n: 1,
    t: 'Entender o escopo',
    d: 'Ler, visitar e perguntar antes de qualquer conta',
    grupos: [
      {
        g: 'Documentos analisados',
        itens: [
          'Memorial descritivo e especificações técnicas',
          'Projetos: isométricos, arranjo, detalhamento, P&ID',
          'Lista de materiais do cliente, se houver',
          'Normas aplicáveis e requisitos de qualidade',
          'Contrato-modelo ou condições comerciais',
          'Cronograma exigido e janelas de parada',
        ],
      },
      {
        g: 'Fontes complementares',
        itens: [
          'Consultei obra similar já executada (custo realizado, não orçado)',
          'Revisei as lições aprendidas registradas no sistema',
          'Conversei com o encarregado que vai executar',
          'Consultei especialista, se a técnica for nova',
        ],
      },
      {
        g: 'Perguntas — fornecimento',
        itens: [
          'É só montagem ou fornecimento de material mais montagem?',
          'O cliente fornece algum material? Qual, quando e sob qual responsabilidade?',
          'Quem faz o projeto e o detalhamento? Está incluso?',
          'Inclui desmontagem ou remoção do existente?',
          'Quem remove e destina resíduo e sucata?',
        ],
      },
      {
        g: 'Perguntas — produto e acabamento',
        itens: [
          'Liga confirmada por escrito: 304, 316L, duplex?',
          'Acabamento: escovado, polido, decapado, passivado? Qual rugosidade?',
          'Norma aplicável e critério de aceitação da solda',
          'Exige teste? Hidrostático, estanqueidade, líquido penetrante, radiografia?',
          'Exige dossiê de fabricação, as-built ou documentação técnica?',
        ],
      },
      {
        g: 'Perguntas — prazo e contrato',
        itens: [
          'Prazo exigido e existe multa por atraso?',
          'Forma de medição e de pagamento',
          'Existe retenção contratual? Percentual e liberação',
          'Garantia exigida e por quanto tempo',
          'Exige seguro, garantia de execução ou ART?',
        ],
      },
    ],
  },
  {
    n: 2,
    t: 'Visita técnica ao local',
    d: 'O que o projeto não mostra e sempre aparece na obra',
    grupos: [
      {
        g: 'Acesso e logística',
        itens: [
          'Distância da empresa até a obra, em km',
          'O caminhão encosta? Qual porte? Precisa transbordo?',
          'Restrição de horário para entrega ou trabalho',
          'Distância do fornecedor até a obra (afeta o frete)',
          'Local para container, ferramenta e material na obra',
        ],
      },
      {
        g: 'Condições de execução',
        itens: [
          'Pé-direito e altura de trabalho — andaime ou plataforma?',
          'Ponte rolante ou talha disponível? Ou precisa guindaste?',
          'Energia: tensão, potência, distância. Precisa gerador?',
          'Ar comprimido e água disponíveis',
          'Área classificada? Exige permissão de trabalho a quente?',
          'Fábrica opera durante a obra? Parada com janela fixa?',
          'Trabalho noturno, fim de semana ou feriado',
          'Espaço confinado ou trabalho em altura (NR-33, NR-35)',
          'Infraestrutura existente que interfere',
        ],
      },
      {
        g: 'Pessoas e permanência',
        itens: [
          'Equipe dorme fora? Alojamento e alimentação no custo?',
          'Integração de segurança do cliente: horas e quem paga',
          'Exige ASO, treinamento NR ou documentação de SST',
          'Uniforme ou EPI específico do cliente',
          'Fotografei o local e registrei as medidas conferidas',
        ],
      },
    ],
  },
  {
    n: 3,
    t: 'Decompor em EAP',
    d: 'Quebrar o escopo até chegar em atividades mediveis',
    grupos: [
      {
        g: 'Estrutura',
        itens: [
          'Obra dividida em frentes ou sistemas',
          'Cada frente dividida em serviços',
          'Cada serviço com atividade de unidade clara (m, m², kg, un)',
          'Cada pacote tem responsável possível e prazo estimável',
        ],
      },
      {
        g: 'Pacotes que sempre se esquecem',
        itens: [
          'Mobilização e desmobilização',
          'Canteiro e instalações provisórias',
          'Testes e comissionamento',
          'Acabamento, decapagem e passivação',
          'Documentação e dossiê de entrega',
          'Limpeza final e remoção de resíduo',
        ],
      },
    ],
  },
  {
    n: 4,
    t: 'Medir e quantificar',
    d: 'Quantidade errada é o erro que nenhuma margem cobre',
    grupos: [
      {
        g: 'Levantamento',
        itens: [
          'Levantei por pacote da EAP, não a obra inteira de uma vez',
          'Registrei o critério de medição usado',
          'Anotei a origem de cada quantidade (prancha, isométrico, campo)',
          'Conferi por duas vias os itens de maior valor',
          'Declarei a perda técnica separadamente da quantidade',
        ],
      },
      {
        g: 'Conferência',
        itens: [
          'O somatório dos pacotes bate com o total da obra',
          'As unidades batem com a base de preços',
          'A perda técnica é compatível com o tipo de peça',
          'Consultei o rack de retalhos antes de considerar compra',
          'Não falta consumível: gás, argônio, disco, escova, fita',
        ],
      },
    ],
  },
  {
    n: 5,
    t: 'Coletar preços',
    d: 'O preço do orçamento é o custo posto na obra',
    grupos: [
      {
        g: 'Cotação',
        itens: [
          'Cotei com no mínimo 3 fornecedores os itens de maior valor',
          'Registrei a validade de cada proposta',
          'Verifiquei FOB ou CIF e somei o frete quando FOB',
          'Conferi o prazo de entrega contra o cronograma',
          'Anotei a condição de pagamento',
          'Verifiquei ICMS se a compra for interestadual',
          'Lancei as cotações no sistema',
        ],
      },
    ],
  },
  {
    n: 6,
    t: 'Compor os custos diretos',
    d: 'Material, mão de obra, equipamento, terceiros, locação e deslocamento',
    grupos: [
      {
        g: 'Composição',
        itens: [
          'Material: quantidade × custo posto, com perda técnica',
          'Mão de obra: horas × custo REAL da hora (com encargos e adicionais)',
          'Equipamento: custo horário de propriedade e operação',
          'Serviços de terceiros: usinagem, jateamento, ensaio',
          'Locações: com unidade correta e mobilização',
          'Deslocamento: km real, ida e volta, mais pedágio',
        ],
      },
      {
        g: 'Verificações',
        itens: [
          'Usei o custo real da hora, não o salário base',
          'O prazo dos terceiros está no cronograma',
          'A unidade de cobrança da locação está correta',
        ],
      },
    ],
  },
  {
    n: 7,
    t: 'Aplicar os indiretos',
    d: 'Estrutura, contingência e custo financeiro',
    grupos: [
      {
        g: 'Indiretos',
        itens: [
          'Rateio da estrutura aplicado conforme configuração',
          'Contingência definida pelo grau de detalhamento',
          'Custo financeiro do prazo de recebimento considerado',
        ],
      },
    ],
  },
  {
    n: 8,
    t: 'Formar o preço',
    d: 'O lucro é decidido; o preço é calculado a partir dele',
    grupos: [
      {
        g: 'Formação',
        itens: [
          'Margem de lucro desejada definida como % do preço de venda',
          'Regime tributário correto selecionado',
          'Conferência bate: custo + imposto + lucro = preço',
          'BDI resultante comparado com obras anteriores',
        ],
      },
    ],
  },
  {
    n: 9,
    t: 'Revisar e propor',
    d: 'A conferência que separa orçamento bom de orçamento sortudo',
    grupos: [
      {
        g: 'Análise crítica',
        itens: [
          'Curva ABC analisada e itens de 80% conferidos',
          'Custo unitário comparado com obra similar executada',
          'Prazo compatível com as horas de mão de obra orçadas',
          'Quantidade de pessoas cabe fisicamente no local',
          'Cronograma considera prazo de material e de terceiros',
          'Margem acima do mínimo aceitável da empresa',
          'Capital de giro exigido é suportável',
          'Revisado por uma segunda pessoa',
        ],
      },
      {
        g: 'Conteúdo da proposta',
        itens: [
          'Descrição clara do escopo fornecido',
          'Lista do que NÃO está incluso',
          'Prazo e condicionantes (acesso, energia, liberação)',
          'Condições de pagamento e forma de medição',
          'Validade da proposta',
          'Garantia oferecida',
          'Premissas assumidas registradas',
        ],
      },
    ],
  },
];

export interface Grau {
  id: 'exec' | 'basico' | 'croqui';
  label: string;
  desc: string;
  min: number;
  max: number;
}

export const GRAUS: Grau[] = [
  { id: 'exec', label: 'Projeto executivo', desc: 'Isométricos, lista de material, detalhamento', min: 3, max: 5 },
  { id: 'basico', label: 'Projeto básico', desc: 'Arranjo geral, sem detalhamento', min: 7, max: 10 },
  { id: 'croqui', label: 'Croqui ou descrição', desc: 'Conversa, esboço, foto', min: 12, max: 20 },
];

export function itemKey(faseN: number, grupoIdx: number, itemIdx: number) {
  return `${faseN}.${grupoIdx}.${itemIdx}`;
}

export function totalRoteiroItems() {
  return ROTEIRO.reduce((a, f) => a + f.grupos.reduce((b, g) => b + g.itens.length, 0), 0);
}

export function phaseProgress(fase: RoteiroFase, checked: Set<string>) {
  let total = 0;
  let done = 0;
  fase.grupos.forEach((g, gi) => {
    g.itens.forEach((_, ii) => {
      total++;
      if (checked.has(itemKey(fase.n, gi, ii))) done++;
    });
  });
  return total ? (done / total) * 100 : 0;
}

export function calcRoteiro(checkedKeys: string[], infoLevel: string, siteVisitDone: boolean) {
  const total = totalRoteiroItems();
  const done = checkedKeys.length;
  const completionPct = total ? (done / total) * 100 : 0;
  const grau = GRAUS.find((g) => g.id === infoLevel) ?? GRAUS[1];
  let base = grau.max - (grau.max - grau.min) * (completionPct / 100);
  if (!siteVisitDone) base += 3;
  const suggestedContingencyPct = Math.round(base * 10) / 10;

  let diagnostic = '';
  if (completionPct >= 90) {
    diagnostic = `✓ Levantamento completo. A contingência pode ficar no piso da faixa de ${grau.label.toLowerCase()}.`;
  } else if (completionPct >= 60) {
    diagnostic = `Levantamento parcial. Ainda faltam ${total - done} verificações — cada uma reduz a incerteza e o preço.`;
  } else {
    diagnostic = '⚠ Levantamento inicial. Orçar agora significa carregar contingência alta. Vale completar antes de enviar a proposta.';
  }
  if (!siteVisitDone) diagnostic += ' Sem visita técnica: 3 pontos percentuais somados à contingência.';

  return { completionPct, suggestedContingencyPct, diagnostic, grau };
}
