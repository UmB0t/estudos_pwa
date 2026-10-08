export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticalScenario {
  id: string;
  label: string;
  code: string;
  outputPreview: string | { columns: string[]; rows: (string | number | boolean | null)[][] };
  explanation: string;
}

export interface GuidedLesson {
  id: string;
  exerciseId?: string;
  trackId: string;
  trackCode: 'DB-201' | 'AL-110' | 'NT-150' | 'LX-120' | 'SE-230' | 'CL-240';
  moduleTitle: string;
  title: string;
  order: number;
  readTimeMin: number;
  concept: {
    title: string;
    description: string;
    diagramType:
      | 'sql-projection'
      | 'sql-distinct'
      | 'sql-alias'
      | 'sql-where'
      | 'sql-in'
      | 'b-tree'
      | 'linux-fs'
      | 'docker-layers'
      | 'tcp-handshake'
      | 'algo-search'
      | 'sec-injection';
    summaryPoints: string[];
    quiz: QuizQuestion[];
  };
  examples: PracticalScenario[];
  lab: {
    task: string;
    criteria: string[];
    defaultCode?: string;
  };
}

export interface TrackDefinition {
  code: 'DB-201' | 'AL-110' | 'NT-150' | 'LX-120' | 'SE-230' | 'CL-240';
  trackKey: 'sql' | 'linux' | 'docker' | 'networks' | 'algorithms' | 'security';
  name: string;
  summary: string;
  badge: string;
  accentColor: string;
  totalHours: string;
  lessons: GuidedLesson[];
}

// -----------------------------------------------------------------------------
// 1. DB-201 — Banco de Dados (PostgreSQL)
// -----------------------------------------------------------------------------
const DB_201_LESSONS: GuidedLesson[] = [
  {
    id: 'sql-01-select-todos-alunos',
    exerciseId: 'sql-01-select-todos-alunos',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Consultas Básicas & Projeção Relacional',
    title: 'Projeção Completa com SELECT *',
    order: 1,
    readTimeMin: 4,
    concept: {
      title: 'A Álgebra da Projeção e a Tabela de Dados',
      description:
        'No modelo relacional, uma tabela é um conjunto de tuplas (linhas) com atributos (colunas). O comando SELECT é a operação elementar de projeção. Ao usar o curinga asterisco (*), o otimizador do PostgreSQL lê o catálogo de esquema e projeta todas as colunas declaradas na tabela informada na cláusula FROM.',
      diagramType: 'sql-projection',
      summaryPoints: [
        'A cláusula FROM determina o repositório de dados de origem.',
        'O símbolo * (asterisco) expande dinamicamente para todas as colunas físicas.',
        'A ordem das colunas projetadas segue a definição original do CREATE TABLE.',
        'Sempre termine comandos com ponto e vírgula (;) no padrão ANSI SQL.',
      ],
      quiz: [
        {
          id: 'q1-1',
          question: 'O que o símbolo asterisco (*) representa logo após o comando SELECT?',
          options: [
            'Multiplicação aritmética entre tabelas',
            'Projeção de todas as colunas disponíveis na tabela especificada no FROM',
            'Filtro para retornar apenas registros numéricos',
            'Criação de um novo índice secundário',
          ],
          correctIndex: 1,
          explanation:
            'Correto! O asterisco instrui a engine a incluir todos os atributos físicos declarados na tabela de origem sem necessidade de nomeá-los um a um.',
        },
        {
          id: 'q1-2',
          question: 'Qual cláusula SQL é responsável por apontar qual tabela será consultada?',
          options: ['WHERE', 'GROUP BY', 'FROM', 'ORDER BY'],
          correctIndex: 2,
          explanation:
            'Exato! A cláusula FROM indica a fonte de dados — seja uma tabela física, view ou subquery.',
        },
      ],
    },
    examples: [
      {
        id: 'ex1-all',
        label: 'Projeção Total',
        code: 'SELECT * FROM alunos;',
        outputPreview: {
          columns: ['id', 'nome', 'idade', 'curso', 'cidade'],
          rows: [
            [1, 'Ana Silva', 20, 'Engenharia de Software', 'São Paulo'],
            [2, 'Bruno Santos', 22, 'Ciência da Computação', 'Campinas'],
            [3, 'Carla Oliveira', 19, 'Sistemas de Informação', 'São Paulo'],
          ],
        },
        explanation:
          'Retorna todas as 5 colunas cadastradas para todas as tuplas da relação alunos.',
      },
      {
        id: 'ex1-limit',
        label: 'Amostragem Rápida',
        code: 'SELECT * FROM alunos LIMIT 2;',
        outputPreview: {
          columns: ['id', 'nome', 'idade', 'curso', 'cidade'],
          rows: [
            [1, 'Ana Silva', 20, 'Engenharia de Software', 'São Paulo'],
            [2, 'Bruno Santos', 22, 'Ciência da Computação', 'Campinas'],
          ],
        },
        explanation:
          'Utilizar LIMIT em bancos de produção evita tráfego excessivo de I/O em tabelas volumosas.',
      },
    ],
    lab: {
      task: 'Escreva uma consulta SQL para selecionar todas as colunas e todas as linhas da tabela alunos.',
      criteria: [
        'Utiliza a instrução SELECT *',
        'Especifica a tabela alunos na cláusula FROM',
        'Retorna todas as 6 linhas da tabela',
      ],
      defaultCode: 'SELECT * FROM alunos;',
    },
  },
  {
    id: 'sql-02-select-nome-curso',
    exerciseId: 'sql-02-select-nome-curso',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Consultas Básicas & Projeção Relacional',
    title: 'Projeção Específica de Colunas',
    order: 2,
    readTimeMin: 5,
    concept: {
      title: 'Otimização de Largura de Linha (Tuple Width)',
      description:
        'Projetar apenas as colunas estritamente necessárias (em vez de usar SELECT *) economiza memória de buffer pool e largura de banda de rede. As colunas devem ser separadas por vírgula e aparecem na saída exatamente na ordem em que foram declaradas.',
      diagramType: 'sql-projection',
      summaryPoints: [
        'Declare explicitamente cada coluna requerida separada por vírgula.',
        'A engine PostgreSQL não transfere os bytes das colunas não solicitadas.',
        'A ordem de exibição final segue a ordem descrita na consulta.',
      ],
      quiz: [
        {
          id: 'q2-1',
          question: 'Por que especificar colunas explícitas é uma boa prática em bancos de produção?',
          options: [
            'Porque obriga o PostgreSQL a recompilar o banco',
            'Porque reduz I/O de disco e tráfego de rede, ignorando dados desnecessários',
            'Porque garante que nenhuma tupla duplicada exista',
            'Porque desativa a verificação de integridade referencial',
          ],
          correctIndex: 1,
          explanation:
            'Exato! A transferência de colunas não utilizadas consome memória RAM na cache do SGBD e satura buffers de rede.',
        },
      ],
    },
    examples: [
      {
        id: 'ex2-specific',
        label: 'Colunas nome e curso',
        code: 'SELECT nome, curso FROM alunos;',
        outputPreview: {
          columns: ['nome', 'curso'],
          rows: [
            ['Ana Silva', 'Engenharia de Software'],
            ['Bruno Santos', 'Ciência da Computação'],
            ['Carla Oliveira', 'Sistemas de Informação'],
          ],
        },
        explanation: 'Note que id, idade e cidade foram descartadas da projeção final.',
      },
    ],
    lab: {
      task: 'Escreva uma consulta SQL para selecionar apenas as colunas nome e curso de todos os alunos.',
      criteria: [
        'Seleciona apenas nome e curso nesta ordem',
        'Sem projetar colunas extras',
        'Consome a tabela alunos',
      ],
      defaultCode: 'SELECT nome, curso FROM alunos;',
    },
  },
  {
    id: 'sql-03-select-distinct-cidades',
    exerciseId: 'sql-03-select-distinct-cidades',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Consultas Básicas & Projeção Relacional',
    title: 'Eliminação de Duplicatas com DISTINCT',
    order: 3,
    readTimeMin: 5,
    concept: {
      title: 'A Chave da Unicidade na Projeção: DISTINCT',
      description:
        'Por padrão, o SQL opera sobre multiconjuntos (bags), permitindo valores repetidos. Quando você precisa de uma lista de valores únicos, a cláusula DISTINCT aplica uma etapa de agrupamento ou ordenação (Unique Sort ou HashAggregate) para filtrar duplicatas.',
      diagramType: 'sql-distinct',
      summaryPoints: [
        'DISTINCT é posicionado imediatamente após o SELECT.',
        'Se aplicado a múltiplas colunas, a unicidade considera a combinação de todas elas.',
        'O PostgreSQL costuma usar uma Hash Table em memória para remover tuplas repetidas.',
      ],
      quiz: [
        {
          id: 'q3-1',
          question: 'Em que momento a cláusula DISTINCT deve ser inserida na instrução SQL?',
          options: [
            'No final do comando, após o FROM',
            'Diretamente após o SELECT e antes dos nomes das colunas',
            'Dentro da cláusula WHERE',
            'Apenas após o ORDER BY',
          ],
          correctIndex: 1,
          explanation:
            'Perfeito! O DISTINCT qualifica a projeção logo após o SELECT (ex.: SELECT DISTINCT coluna FROM tabela).',
        },
      ],
    },
    examples: [
      {
        id: 'ex3-distinct',
        label: 'Com DISTINCT',
        code: 'SELECT DISTINCT cidade FROM alunos;',
        outputPreview: {
          columns: ['cidade'],
          rows: [['Campinas'], ['Ribeirão Preto'], ['Santos'], ['São Paulo']],
        },
        explanation:
          'Cidades repetidas como "São Paulo" aparecem apenas uma única vez no resultado.',
      },
      {
        id: 'ex3-nodistinct',
        label: 'Sem DISTINCT',
        code: 'SELECT cidade FROM alunos;',
        outputPreview: {
          columns: ['cidade'],
          rows: [['São Paulo'], ['Campinas'], ['São Paulo'], ['Santos'], ['São Paulo']],
        },
        explanation:
          'Sem DISTINCT, a multiplicidade de cada linha é preservada integralmente.',
      },
    ],
    lab: {
      task: 'Escreva uma consulta SQL para selecionar todas as cidades únicas existentes na tabela alunos.',
      criteria: [
        'Utiliza a palavra-chave DISTINCT',
        'Projeta apenas a coluna cidade',
        'Retorna 4 linhas únicas',
      ],
      defaultCode: 'SELECT DISTINCT cidade FROM alunos;',
    },
  },
  {
    id: 'sql-04-alias-colunas',
    exerciseId: 'sql-04-alias-colunas',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Renomeação Semântica (AS)',
    title: 'Renomeação de Colunas com Alias (AS)',
    order: 4,
    readTimeMin: 5,
    concept: {
      title: 'Modelagem Semântica do Cabeçalho com AS',
      description:
        'A cláusula AS permite renomear temporariamente os identificadores de coluna no resultset. Isso melhora a clareza para a camada de frontend/API e permite expressar cálculos ou agregações com nomes intuitivos.',
      diagramType: 'sql-alias',
      summaryPoints: [
        'A sintaxe é: coluna AS novo_nome.',
        'O nome físico na tabela do banco permanece inalterado.',
        'Aliases facilitam o mapeamento automático para objetos JSON e DTOs.',
      ],
      quiz: [
        {
          id: 'q4-1',
          question: 'A palavra-chave AS altera a estrutura da tabela física no PostgreSQL?',
          options: [
            'Sim, renomeia permanentemente no disco',
            'Não, afeta apenas o rótulo da coluna no conjunto de dados retornado',
            'Sim, se o comando terminar com ponto e vírgula',
            'Altera apenas se a tabela estiver vazia',
          ],
          correctIndex: 1,
          explanation:
            'Exatamente! É apenas um apelido (alias) virtual válido para a duração daquela consulta.',
        },
      ],
    },
    examples: [
      {
        id: 'ex4-as',
        label: 'Renomeação Semântica',
        code: 'SELECT nome AS nome_completo, idade AS idade_anos FROM alunos;',
        outputPreview: {
          columns: ['nome_completo', 'idade_anos'],
          rows: [
            ['Ana Silva', 20],
            ['Bruno Santos', 22],
          ],
        },
        explanation: 'O cabeçalho do cliente recebe os novos nomes fornecidos.',
      },
    ],
    lab: {
      task: 'Selecione a coluna nome com o alias nome_completo e a coluna idade com o alias idade_anos da tabela alunos.',
      criteria: [
        'Aplica o alias nome_completo na coluna nome',
        'Aplica o alias idade_anos na coluna idade',
        'Ambas as colunas renomeadas corretamente',
      ],
      defaultCode: 'SELECT nome AS nome_completo, idade AS idade_anos FROM alunos;',
    },
  },
  {
    id: 'sql-05-alias-curso-e-local',
    exerciseId: 'sql-05-alias-curso-e-local',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Renomeação Semântica (AS)',
    title: 'Alias de Entidades: curso e cidade',
    order: 5,
    readTimeMin: 5,
    concept: {
      title: 'Mapeamento de Domínio no Resultado SQL',
      description:
        'Frequentemente, os nomes de coluna em tabelas legadas diferem das convenções da aplicação moderna. Criar aliases claros como graduacao e campus simplifica a integração sem exigir alterações na DDL do banco.',
      diagramType: 'sql-alias',
      summaryPoints: [
        'Evite espaços ou caracteres especiais nos nomes de alias.',
        'Aliases podem ser usados em múltiplos atributos no mesmo SELECT.',
        'Mantenha consistência de nomenclatura (ex: snake_case).',
      ],
      quiz: [
        {
          id: 'q5-1',
          question: 'Como renomear "curso" para "graduacao" e "cidade" para "campus"?',
          options: [
            'SELECT curso -> graduacao, cidade -> campus FROM alunos;',
            'SELECT curso AS graduacao, cidade AS campus FROM alunos;',
            'RENAME curso TO graduacao FROM alunos;',
            'SELECT ALIAS(graduacao, campus) FROM alunos;',
          ],
          correctIndex: 1,
          explanation: 'Correto! Utiliza-se a sintaxe padrão: campo AS alias.',
        },
      ],
    },
    examples: [
      {
        id: 'ex5-combo',
        label: 'Graduação e Campus',
        code: 'SELECT curso AS graduacao, cidade AS campus FROM alunos;',
        outputPreview: {
          columns: ['graduacao', 'campus'],
          rows: [
            ['Engenharia de Software', 'São Paulo'],
            ['Ciência da Computação', 'Campinas'],
          ],
        },
        explanation: 'Saída mapeada perfeitamente com os aliases de domínio.',
      },
    ],
    lab: {
      task: 'Escreva uma consulta que projete a coluna curso renomeada como graduacao e a coluna cidade renomeada como campus.',
      criteria: [
        'Projeta curso AS graduacao',
        'Projeta cidade AS campus',
        'Preserva todos os 6 registros',
      ],
      defaultCode: 'SELECT curso AS graduacao, cidade AS campus FROM alunos;',
    },
  },
  {
    id: 'sql-06-where-maiores-idade',
    exerciseId: 'sql-06-where-maiores-idade',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Filtros & Predicados Relacionais (WHERE)',
    title: 'Filtros Numéricos com WHERE (>= 18)',
    order: 6,
    readTimeMin: 6,
    concept: {
      title: 'A Operação de Seleção Relacional (σ - Sigma)',
      description:
        'A cláusula WHERE aplica uma função booleana sobre cada tupla candidata. Somente as linhas para as quais a condição avalia para TRUE passam para a próxima etapa do pipeline de execução. Valores que avaliam para FALSE ou NULL são filtrados.',
      diagramType: 'sql-where',
      summaryPoints: [
        'A avaliação do WHERE ocorre antes da projeção (SELECT) e do agrupamento.',
        'Operadores comuns: =, !=, <, <=, >, >=, BETWEEN.',
        'Predicados sargáveis (Search Argument Able) podem aproveitar índices B-Tree.',
      ],
      quiz: [
        {
          id: 'q6-1',
          question: 'Na ordem lógica de execução do SQL, quando a cláusula WHERE é processada?',
          options: [
            'Depois do ORDER BY',
            'Depois do SELECT',
            'Logo após o FROM e antes da projeção do SELECT',
            'Apenas após o retorno das linhas ao cliente',
          ],
          correctIndex: 2,
          explanation:
            'Exato! A ordem lógica de avaliação é: FROM ➔ WHERE ➔ GROUP BY ➔ HAVING ➔ SELECT ➔ ORDER BY.',
        },
      ],
    },
    examples: [
      {
        id: 'ex6-where',
        label: 'Filtro >= 18',
        code: 'SELECT * FROM alunos WHERE idade >= 18;',
        outputPreview: {
          columns: ['id', 'nome', 'idade', 'curso', 'cidade'],
          rows: [
            [1, 'Ana Silva', 20, 'Engenharia de Software', 'São Paulo'],
            [2, 'Bruno Santos', 22, 'Ciência da Computação', 'Campinas'],
            [3, 'Carla Oliveira', 19, 'Sistemas de Informação', 'São Paulo'],
          ],
        },
        explanation: 'Filtra e descarta qualquer aluno com menos de 18 anos.',
      },
    ],
    lab: {
      task: 'Selecione todos os alunos cuja idade seja maior ou igual a 18 anos.',
      criteria: [
        'Aplica a cláusula WHERE',
        'Utiliza a condição idade >= 18',
        'Retorna todos os alunos elegíveis',
      ],
      defaultCode: 'SELECT * FROM alunos WHERE idade >= 18;',
    },
  },
  {
    id: 'sql-07-where-curso-e-cidade',
    exerciseId: 'sql-07-where-curso-e-cidade',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Filtros & Predicados Relacionais (WHERE)',
    title: 'Predicados Compostos com Operador AND',
    order: 7,
    readTimeMin: 6,
    concept: {
      title: 'Álgebra Booleana em Consultas SQL',
      description:
        'Combinar predicados com o operador lógico AND exige que ambas as expressões booleanas sejam verdadeiras simultaneamente para que a tupla seja retornado. O otimizador pode usar índices compostos ou reordenar as avaliações para descartar linhas mais rápido.',
      diagramType: 'sql-where',
      summaryPoints: [
        'Strings literais no SQL são delimitadas por aspas simples (\'...\').',
        'O operador AND tem precedência sobre o operador OR.',
        'A comparação de strings no PostgreSQL por padrão diferencia maiúsculas de minúsculas.',
      ],
      quiz: [
        {
          id: 'q7-1',
          question: 'Como representar uma string literal no padrão ANSI SQL?',
          options: [
            'Com aspas duplas ("Engenharia")',
            'Com aspas simples (\'Engenharia\')',
            'Com crases (`Engenharia`)',
            'Sem aspas, apenas o texto solto',
          ],
          correctIndex: 1,
          explanation:
            'Correto! Aspas duplas servem para identificadores de tabelas/colunas; strings literais sempre usam aspas simples.',
        },
      ],
    },
    examples: [
      {
        id: 'ex7-and',
        label: 'Filtro Composto AND',
        code: "SELECT * FROM alunos WHERE curso = 'Engenharia de Software' AND cidade = 'São Paulo';",
        outputPreview: {
          columns: ['id', 'nome', 'idade', 'curso', 'cidade'],
          rows: [[1, 'Ana Silva', 20, 'Engenharia de Software', 'São Paulo']],
        },
        explanation: 'Apenas a aluna que satisfaz ambos os critérios simultaneamente é retornada.',
      },
    ],
    lab: {
      task: "Selecione todos os alunos que cursam 'Engenharia de Software' e residem em 'São Paulo'.",
      criteria: [
        "Aplica filtro curso = 'Engenharia de Software'",
        "Combina com AND cidade = 'São Paulo'",
        'Retorna apenas o registro correspondente',
      ],
      defaultCode: "SELECT * FROM alunos WHERE curso = 'Engenharia de Software' AND cidade = 'São Paulo';",
    },
  },
  {
    id: 'sql-08-where-in-cursos',
    exerciseId: 'sql-08-where-in-cursos',
    trackId: 'sql',
    trackCode: 'DB-201',
    moduleTitle: 'Filtros & Predicados Relacionais (WHERE)',
    title: 'Pertencimento a Conjuntos com Operador IN',
    order: 8,
    readTimeMin: 6,
    concept: {
      title: 'Filtragem por Lista com Cláusula IN',
      description:
        'Em vez de encadear múltiplos OR (ex: curso = A OR curso = B OR curso = C), o operador IN avalia a pertinência a um conjunto finito de valores. É mais legível, menos propenso a erros de precedência e otimizado internamente.',
      diagramType: 'sql-in',
      summaryPoints: [
        'A sintaxe é: coluna IN (\'valor1\', \'valor2\', ...).',
        'Equivale semanticamente a encadeamentos OR de igualdade.',
        'O PostgreSQL pode transformar IN em um Hash ou ScalarArrayOpExpr para busca rápida.',
      ],
      quiz: [
        {
          id: 'q8-1',
          question: 'A expressão "campo IN (\'A\', \'B\')" equivale logicamente a:',
          options: [
            "campo = 'A' AND campo = 'B'",
            "campo = 'A' OR campo = 'B'",
            "campo != 'A' AND campo != 'B'",
            "campo LIKE '%A%B%'",
          ],
          correctIndex: 1,
          explanation:
            'Exato! O operador IN testa se o valor do campo coincide com qualquer um dos elementos contidos na lista.',
        },
      ],
    },
    examples: [
      {
        id: 'ex8-in',
        label: 'Filtro com Lista IN',
        code: "SELECT nome, curso FROM alunos WHERE curso IN ('Ciência da Computação', 'Sistemas de Informação');",
        outputPreview: {
          columns: ['nome', 'curso'],
          rows: [
            ['Bruno Santos', 'Ciência da Computação'],
            ['Carla Oliveira', 'Sistemas de Informação'],
            ['Eduardo Costa', 'Ciência da Computação'],
          ],
        },
        explanation: 'Filtra eficientemente os alunos matriculados em qualquer um dos dois cursos.',
      },
    ],
    lab: {
      task: "Selecione todos os alunos cujo curso seja 'Ciência da Computação' ou 'Sistemas de Informação' utilizando o operador IN.",
      criteria: [
        'Utiliza a palavra-chave IN',
        "Especifica os dois cursos: 'Ciência da Computação' e 'Sistemas de Informação'",
        'Retorna 3 alunos correspondentes',
      ],
      defaultCode: "SELECT * FROM alunos WHERE curso IN ('Ciência da Computação', 'Sistemas de Informação');",
    },
  },
];

// -----------------------------------------------------------------------------
// 2. LX-120 — Linux e Shell
// -----------------------------------------------------------------------------
const LX_120_LESSONS: GuidedLesson[] = [
  {
    id: 'linux-01-pwd-ls',
    exerciseId: 'linux-01-pwd-ls',
    trackId: 'linux',
    trackCode: 'LX-120',
    moduleTitle: 'Navegação & Sistema de Arquivos',
    title: 'Localização e Listagem (pwd & ls)',
    order: 1,
    readTimeMin: 4,
    concept: {
      title: 'A Árvore de Diretórios Unix e o Shell',
      description:
        'No Linux, tudo é um arquivo organizado a partir de uma única raiz hierárquica (/ ). O comando pwd (Print Working Directory) reporta o caminho absoluto do diretório atual, enquanto ls (List) inspeciona as entradas contidas nele.',
      diagramType: 'linux-fs',
      summaryPoints: [
        'A barra / no início representa a raiz do sistema de arquivos.',
        'O comando pwd nunca altera o estado do sistema, apenas exibe a localização.',
        'O comando ls possui flags poderosas como -l (detalhes) e -a (ocultos).',
      ],
      quiz: [
        {
          id: 'qlx-1',
          question: 'O que a sigla do comando "pwd" significa?',
          options: [
            'Password user directory',
            'Print Working Directory',
            'Process Watch Daemon',
            'Path With Data',
          ],
          correctIndex: 1,
          explanation: 'Correto! Imprime o diretório de trabalho atual na saída padrão.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-pwd',
        label: 'Localização',
        code: 'pwd',
        outputPreview: '/home/estudante',
        explanation: 'Indica que o usuário está no seu diretório pessoal.',
      },
    ],
    lab: {
      task: 'Execute o comando para descobrir o diretório de trabalho atual.',
      criteria: ['Executa o comando pwd', 'Retorna o caminho do diretório'],
      defaultCode: 'pwd',
    },
  },
  {
    id: 'linux-02-cd-navegacao',
    exerciseId: 'linux-02-cd-navegacao',
    trackId: 'linux',
    trackCode: 'LX-120',
    moduleTitle: 'Navegação & Sistema de Arquivos',
    title: 'Mudança de Diretórios com cd',
    order: 2,
    readTimeMin: 4,
    concept: {
      title: 'Navegação Relativa vs Absoluta',
      description:
        'O comando cd (Change Directory) permite transitar entre ramos da árvore. Caminhos relativos partem do ponto atual (usando . para o mesmo diretório e .. para subir um nível). Caminhos absolutos começam pela raiz /.',
      diagramType: 'linux-fs',
      summaryPoints: [
        'cd .. sobe um nível na hierarquia.',
        'cd sem argumentos retorna para o diretório $HOME.',
        'cd - volta ao diretório de trabalho anterior.',
      ],
      quiz: [
        {
          id: 'qlx-2',
          question: 'Qual atalho leva para o diretório pai imediatamente superior?',
          options: ['cd .', 'cd ..', 'cd /', 'cd ~'],
          correctIndex: 1,
          explanation: 'Exato! O identificador ".." referencia o diretório pai na árvore POSIX.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-cd',
        label: 'Subir e Navegar',
        code: 'cd .. && pwd',
        outputPreview: '/home',
        explanation: 'Sobe para o diretório pai e exibe a nova localização.',
      },
    ],
    lab: {
      task: 'Navegue para o diretório /var/log e verifique seu conteúdo.',
      criteria: ['Utiliza comando cd', 'Especifica o destino correto'],
      defaultCode: 'cd /var/log',
    },
  },
  {
    id: 'linux-03-mkdir-pastas',
    exerciseId: 'linux-03-mkdir-pastas',
    trackId: 'linux',
    trackCode: 'LX-120',
    moduleTitle: 'Manipulação de Arquivos & Pastas',
    title: 'Criação de Pastas e Hierarquias (mkdir)',
    order: 3,
    readTimeMin: 5,
    concept: {
      title: 'Criação Recursiva de Diretórios com -p',
      description:
        'O utilitário mkdir cria novas pastas no disco. Ao utilizar o modificador -p (--parents), o comando cria toda a cadeia de subpastas intermediárias ausentes sem disparar erro se a pasta já existir.',
      diagramType: 'linux-fs',
      summaryPoints: [
        'mkdir nome_pasta cria um único diretório.',
        'mkdir -p a/b/c cria toda a árvore hierárquica em um único passo.',
      ],
      quiz: [
        {
          id: 'qlx-3',
          question: 'Qual flag do mkdir permite criar pastas pai intermediárias automaticamente?',
          options: ['-r', '-p', '-f', '-all'],
          correctIndex: 1,
          explanation: 'Correto! A flag -p (parents) cria toda a cadeia sem interromper o fluxo.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-mkdir',
        label: 'Criação com pais',
        code: 'mkdir -p projetos/backend/api',
        outputPreview: 'Diretórios criados com sucesso.',
        explanation: 'Gera as três pastas de forma aninhada.',
      },
    ],
    lab: {
      task: 'Crie um diretório chamado workspace.',
      criteria: ['Utiliza mkdir workspace', 'Diretório passa a existir'],
      defaultCode: 'mkdir workspace',
    },
  },
  {
    id: 'linux-04-touch-echo',
    exerciseId: 'linux-04-touch-echo',
    trackId: 'linux',
    trackCode: 'LX-120',
    moduleTitle: 'Manipulação de Arquivos & Pastas',
    title: 'Criação de Arquivos e Redirecionamento',
    order: 4,
    readTimeMin: 5,
    concept: {
      title: 'Descritores de I/O e Redirecionamentos (> e >>)',
      description:
        'O comando touch atualiza timestamps de arquivos ou cria um arquivo vazio se ele não existir. O comando echo aliado ao operador > sobrescreve o fluxo padrão (stdout) para um arquivo no disco, enquanto >> faz append (anexa ao final).',
      diagramType: 'linux-fs',
      summaryPoints: [
        '> sobrescreve o arquivo destino do zero.',
        '>> preserva dados antigos e anexa na última linha.',
        'touch arquivo.txt gera um arquivo vazio de 0 bytes se inexistente.',
      ],
      quiz: [
        {
          id: 'qlx-4',
          question: 'Qual a diferença entre ">" e ">>" ao redirecionar a saída?',
          options: [
            '> anexa e >> sobrescreve',
            '> sobrescreve o arquivo e >> anexa ao final',
            'Ambos executam a mesma ação',
            '> redireciona para a tela e >> para a impressora',
          ],
          correctIndex: 1,
          explanation:
            'Exato! O operador simples trunca o arquivo antes de gravar; o duplo anexa ao fim.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-echo',
        label: 'Gravação de texto',
        code: 'echo "servidor=ativo" > config.ini',
        outputPreview: 'config.ini criado com 1 linha.',
        explanation: 'Cria config.ini e grava o conteúdo informado.',
      },
    ],
    lab: {
      task: 'Crie um arquivo chamado notas.txt com o conteúdo "estudo".',
      criteria: ['Grava o texto solicitado', 'Redireciona para notas.txt'],
      defaultCode: 'echo "estudo" > notas.txt',
    },
  },
  {
    id: 'linux-05-cat-grep',
    exerciseId: 'linux-05-cat-grep',
    trackId: 'linux',
    trackCode: 'LX-120',
    moduleTitle: 'Inspeção & Busca Textual',
    title: 'Inspeção e Filtragem Textual com grep',
    order: 5,
    readTimeMin: 5,
    concept: {
      title: 'Pipelines e Expressões Regulares no Terminal',
      description:
        'O utilitário grep (Global Regular Expression Print) busca padrões de texto linha a linha. O operador pipe (|) conecta a saída padrão de um programa diretamente na entrada padrão do outro.',
      diagramType: 'linux-fs',
      summaryPoints: [
        'cat exibe o arquivo inteiro na saída padrão.',
        'grep "padrao" arquivo.txt filtra apenas as linhas correspondentes.',
        'A flag grep -i desativa a diferenciação entre maiúsculas e minúsculas.',
      ],
      quiz: [
        {
          id: 'qlx-5',
          question: 'Qual caractere representa o encadeamento de pipeline no Shell Unix?',
          options: ['&', '|', '>', '%'],
          correctIndex: 1,
          explanation: 'Correto! O pipe (|) liga o stdout do processo anterior ao stdin do próximo.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-grep',
        label: 'Filtragem de log',
        code: 'grep "ERROR" /var/log/app.log',
        outputPreview: '[2026-10-07 10:14] ERROR: Falha na conexão com banco',
        explanation: 'Isola somente as linhas contendo a palavra ERROR.',
      },
    ],
    lab: {
      task: 'Filtre as ocorrências de "sucesso" no arquivo log.txt.',
      criteria: ['Utiliza grep', 'Busca o termo correto'],
      defaultCode: 'grep "sucesso" log.txt',
    },
  },
];

// -----------------------------------------------------------------------------
// 3. NT-150 — Redes de Computadores
// -----------------------------------------------------------------------------
const NT_150_LESSONS: GuidedLesson[] = [
  {
    id: 'networks-01-ping-conectividade',
    exerciseId: 'networks-01-ping-conectividade',
    trackId: 'networks',
    trackCode: 'NT-150',
    moduleTitle: 'Diagnóstico de Conectividade',
    title: 'Teste de Alcance ICMP com ping',
    order: 1,
    readTimeMin: 4,
    concept: {
      title: 'O Protocolo ICMP e o Round-Trip Time',
      description:
        'O comando ping envia pacotes ICMP Echo Request para um host de destino na camada de rede. O receptor responde com ICMP Echo Reply, permitindo aferir a latência (RTT) e a perda de pacotes.',
      diagramType: 'tcp-handshake',
      summaryPoints: [
        'O ping opera na camada de rede (camada 3 do modelo OSI).',
        'Mede a latência média de ida e volta (Round-Trip Time) em milissegundos.',
        'Firewalls corporativos podem bloquear ICMP mesmo com o serviço HTTP ativo.',
      ],
      quiz: [
        {
          id: 'qnt-1',
          question: 'Qual protocolo de controle é utilizado pelo comando ping?',
          options: ['TCP', 'UDP', 'ICMP', 'DNS'],
          correctIndex: 2,
          explanation: 'Exato! O ping utiliza mensagens ICMP Echo Request e Echo Reply.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-ping',
        label: 'Ping com contagem',
        code: 'ping -c 3 8.8.8.8',
        outputPreview: '3 packets transmitted, 3 received, 0% packet loss, time 28ms',
        explanation: 'Envia 3 sondagens ao DNS público do Google.',
      },
    ],
    lab: {
      task: 'Dispare um teste de conectividade ICMP para o host 127.0.0.1.',
      criteria: ['Utiliza comando ping', 'Aponta para 127.0.0.1'],
      defaultCode: 'ping -c 4 127.0.0.1',
    },
  },
  {
    id: 'networks-02-curl-http',
    exerciseId: 'networks-02-curl-http',
    trackId: 'networks',
    trackCode: 'NT-150',
    moduleTitle: 'Protocolos de Aplicação (HTTP/REST)',
    title: 'Requisições HTTP no Terminal com cURL',
    order: 2,
    readTimeMin: 5,
    concept: {
      title: 'Transações HTTP na Camada de Aplicação',
      description:
        'O cURL (Client URL) é a ferramenta padrão para executar requisições em protocolos da web. O modificador -i inclui os cabeçalhos de resposta HTTP, como status code (200, 404, 500) e content-type.',
      diagramType: 'tcp-handshake',
      summaryPoints: [
        'HTTP opera sobre o protocolo de transporte TCP.',
        'cURL -i exibe os cabeçalhos HTTP retornados pelo servidor.',
        'Permite enviar verbos GET, POST, PUT, DELETE via terminal.',
      ],
      quiz: [
        {
          id: 'qnt-2',
          question: 'Qual status code HTTP indica sucesso absoluto na requisição?',
          options: ['404 Not Found', '500 Server Error', '200 OK', '301 Moved'],
          correctIndex: 2,
          explanation: 'Correto! 200 OK sinaliza que o recurso foi obtido com sucesso.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-curl',
        label: 'Headers HTTP',
        code: 'curl -i https://api.exemplo.com/saude',
        outputPreview: 'HTTP/2 200 OK\ncontent-type: application/json\n{"status":"online"}',
        explanation: 'Exibe a resposta completa incluindo status e corpo JSON.',
      },
    ],
    lab: {
      task: 'Execute uma requisição cURL para obter o status da API local.',
      criteria: ['Utiliza curl', 'Alvo local especificado'],
      defaultCode: 'curl -i http://localhost:8080/health',
    },
  },
  {
    id: 'networks-03-ss-portas',
    exerciseId: 'networks-03-ss-portas',
    trackId: 'networks',
    trackCode: 'NT-150',
    moduleTitle: 'Sockets & Portas do Sistema Operacional',
    title: 'Inspeção de Sockets Abertos com ss',
    order: 3,
    readTimeMin: 5,
    concept: {
      title: 'Sockets de Rede e o Estado LISTEN',
      description:
        'Um socket é o ponto final bidirecional de comunicação formado por IP + Porta. O utilitário moderno ss (Socket Statistics) substitui o antigo netstat para listar serviços em escuta (LISTEN).',
      diagramType: 'tcp-handshake',
      summaryPoints: [
        'ss -tulpn lista sockets TCP e UDP com números de porta e processos.',
        'Estado LISTEN significa que o processo está aguardando conexões de clientes.',
        'Portas abaixo de 1024 são privilegiadas (requerem root para bind).',
      ],
      quiz: [
        {
          id: 'qnt-3',
          question: 'Qual utilitário moderno do Linux substitui o comando netstat?',
          options: ['ss', 'ip', 'nmap', 'traceroute'],
          correctIndex: 0,
          explanation: 'Exato! O utilitário ss é muito mais performático ao ler diretamente do kernel.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-ss',
        label: 'Sockets em Escuta',
        code: 'ss -tulpn',
        outputPreview: 'Netid State  Local Address:Port\ntcp   LISTEN 0.0.0.0:5432 (postgres)\ntcp   LISTEN 0.0.0.0:80   (nginx)',
        explanation: 'Lista o PostgreSQL na porta 5432 e Nginx na porta 80.',
      },
    ],
    lab: {
      task: 'Liste todos os sockets TCP em escuta na máquina com o comando ss.',
      criteria: ['Utiliza comando ss com flags adequadas', 'Filtra sockets TCP'],
      defaultCode: 'ss -tlpn',
    },
  },
];

// -----------------------------------------------------------------------------
// 4. CL-240 — Cloud e Contêineres (Docker)
// -----------------------------------------------------------------------------
const CL_240_LESSONS: GuidedLesson[] = [
  {
    id: 'docker-01-docker-ps',
    exerciseId: 'docker-01-docker-ps',
    trackId: 'docker',
    trackCode: 'CL-240',
    moduleTitle: 'Gerenciamento de Containers',
    title: 'Listagem de Containers em Execução (docker ps)',
    order: 1,
    readTimeMin: 4,
    concept: {
      title: 'O Ciclo de Vida de Containers Docker',
      description:
        'Containers são processos isolados utilizando Namespaces e Cgroups do kernel Linux. O comando docker ps lista apenas instâncias ativas no momento, exibindo Container ID, imagem base e portas mapeadas.',
      diagramType: 'docker-layers',
      summaryPoints: [
        'Containers compartilham o mesmo kernel com o host, garantindo inicialização rápida.',
        'docker ps lista os containers atualmente em execução.',
        'docker ps -a lista todos os containers, incluindo os que foram finalizados.',
      ],
      quiz: [
        {
          id: 'qdk-1',
          question: 'Qual comando exibe TODOS os containers, inclusive os finalizados?',
          options: ['docker ps', 'docker ps -a', 'docker list --all', 'docker status'],
          correctIndex: 1,
          explanation: 'Correto! A flag -a (--all) inclui containers com status Exited.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-dkps',
        label: 'Listar ativos',
        code: 'docker ps',
        outputPreview: 'CONTAINER ID   IMAGE      STATUS         PORTS\na1b2c3d4e5f6   postgres   Up 2 hours     0.0.0.0:5432->5432/tcp',
        explanation: 'Mostra o container do banco PostgreSQL ativo há 2 horas.',
      },
    ],
    lab: {
      task: 'Execute o comando para listar os containers Docker atualmente em execução.',
      criteria: ['Utiliza docker ps', 'Comando executado com sucesso'],
      defaultCode: 'docker ps',
    },
  },
  {
    id: 'docker-02-docker-run-nginx',
    exerciseId: 'docker-02-docker-run-nginx',
    trackId: 'docker',
    trackCode: 'CL-240',
    moduleTitle: 'Gerenciamento de Containers',
    title: 'Execução de Serviços Isolados com Mapeamento de Portas',
    order: 2,
    readTimeMin: 5,
    concept: {
      title: 'Mapeamento de Portas de Rede com -p',
      description:
        'Por padrão, o container possui sua própria rede privada e IP interno. A flag -p porta_host:porta_container cria uma regra de NAT (iptables) redirecionando o tráfego da porta física para o container.',
      diagramType: 'docker-layers',
      summaryPoints: [
        'docker run instancia e inicia um novo container a partir de uma imagem.',
        'A flag -d inicia o container em segundo plano (detached mode).',
        'A flag -p 8080:80 mapeia a porta 8080 do host para a porta 80 interna.',
      ],
      quiz: [
        {
          id: 'qdk-2',
          question: 'O que o argumento "-p 8080:80" faz ao executar um container?',
          options: [
            'Define a memória máxima em 8080 MB',
            'Mapeia a porta 8080 do host para a porta 80 interna do container',
            'Gera 80 cópias idênticas do container',
            'Ativa o modo de depuração na porta 80',
          ],
          correctIndex: 1,
          explanation:
            'Exatamente! O padrão é sempre: -p porta_do_host:porta_do_container.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-dkrun',
        label: 'Nginx em Background',
        code: 'docker run -d -p 80:80 --name meu-web nginx',
        outputPreview: 'f947264826df... Container iniciado em background.',
        explanation: 'Inicia o servidor Nginx escutando na porta 80 da máquina host.',
      },
    ],
    lab: {
      task: 'Inicie um container a partir da imagem nginx com a porta 80 mapeada para a porta 80.',
      criteria: ['Utiliza docker run', 'Mapeia a porta 80:80', 'Especifica a imagem nginx'],
      defaultCode: 'docker run -d -p 80:80 nginx',
    },
  },
  {
    id: 'docker-03-docker-logs',
    exerciseId: 'docker-03-docker-logs',
    trackId: 'docker',
    trackCode: 'CL-240',
    moduleTitle: 'Diagnóstico & Logs',
    title: 'Monitoramento e Logs de Containers (docker logs)',
    order: 3,
    readTimeMin: 5,
    concept: {
      title: 'Captura de stdout e stderr em Containers',
      description:
        'A arquitetura recomendada em containers é direcionar logs para stdout/stderr. O Docker Daemon intercepta esses streams e armazena em arquivos JSON no host, permitindo inspeção centralizada.',
      diagramType: 'docker-layers',
      summaryPoints: [
        'docker logs container_id imprime as mensagens registradas.',
        'A flag -f (follow) acompanha a emissão de novos logs em tempo real.',
        'Permite diagnosticar falhas de inicialização ou crash de aplicações.',
      ],
      quiz: [
        {
          id: 'qdk-3',
          question: 'Qual flag do docker logs permite acompanhar os logs em tempo real?',
          options: ['-t', '-f', '-r', '-all'],
          correctIndex: 1,
          explanation: 'Correto! A flag -f (--follow) mantém a conexão aberta exibindo novos logs.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-dklogs',
        label: 'Inspecionar logs',
        code: 'docker logs meu-web',
        outputPreview: '10.0.0.1 - - [07/Oct/2026] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"',
        explanation: 'Exibe as requisições atendidas pelo container.',
      },
    ],
    lab: {
      task: 'Exiba os logs do container ativo para diagnóstico.',
      criteria: ['Utiliza docker logs', 'Especifica o container correto'],
      defaultCode: 'docker logs webserver',
    },
  },
];

// -----------------------------------------------------------------------------
// 5. AL-110 — Algoritmos e Estruturas de Dados
// -----------------------------------------------------------------------------
const AL_110_LESSONS: GuidedLesson[] = [
  {
    id: 'algo-01-big-o',
    trackId: 'algorithms',
    trackCode: 'AL-110',
    moduleTitle: 'Complexidade de Tempo & Notação Big-O',
    title: 'Notação Assintótica e Complexidade O(1) vs O(n)',
    order: 1,
    readTimeMin: 6,
    concept: {
      title: 'Análise de Desempenho no Pior Caso',
      description:
        'A notação Big-O descreve o comportamento do tempo de execução ou uso de memória de um algoritmo à medida que o tamanho da entrada (n) cresce em direção ao infinito. Algoritmos O(1) têm custo constante, enquanto O(n) crescem linearmente.',
      diagramType: 'algo-search',
      summaryPoints: [
        'Big-O desconsidera constantes aditivas e multiplicativas no limite assintótico.',
        'O(1) representa acesso direto indexado.',
        'O(n) representa varredura sequencial elemento a elemento.',
      ],
      quiz: [
        {
          id: 'qal-1',
          question: 'Qual a complexidade de tempo de acessar um array pelo seu índice numérico?',
          options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
          correctIndex: 2,
          explanation: 'Correto! O acesso por índice calcula o offset de memória instantaneamente em O(1).',
        },
      ],
    },
    examples: [
      {
        id: 'ex-bigo',
        label: 'Acesso Direto vs Varredura',
        code: '// O(1):\nconst primeiro = lista[0];\n\n// O(n):\nfor (const item of lista) {\n  if (item === alvo) return true;\n}',
        outputPreview: 'O(1) executa em 0.001ms independente se lista tem 10 ou 1.000.000 de itens.',
        explanation: 'Varreduras lineares dependem do tamanho exato da entrada.',
      },
    ],
    lab: {
      task: 'Analise o algoritmo de busca linear e identifique seu pior caso em um array de tamanho n.',
      criteria: [
        'Compreende que o pior caso ocorre quando o elemento está no fim ou ausente',
        'Complexidade identificada: O(n)',
      ],
      defaultCode: '// Algoritmo Linear: O(n)\nfunction buscaLinear(arr, val) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === val) return i;\n  }\n  return -1;\n}',
    },
  },
  {
    id: 'algo-02-binary-search',
    trackId: 'algorithms',
    trackCode: 'AL-110',
    moduleTitle: 'Busca & Divisão e Conquista',
    title: 'Busca Binária e Redução Logarítmica O(log n)',
    order: 2,
    readTimeMin: 7,
    concept: {
      title: 'A Elegância da Divisão ao Meio',
      description:
        'Em coleções previamente ordenadas, a Busca Binária descarta metade do espaço de busca a cada iteração comparando o alvo com o elemento central. Para 1 milhão de itens, requer no máximo 20 comparações.',
      diagramType: 'algo-search',
      summaryPoints: [
        'Pré-requisito indispensável: o array DEVE estar ordenado.',
        'Em cada passo, o espaço de busca é dividido por 2.',
        'Complexidade temporal: O(log n).',
      ],
      quiz: [
        {
          id: 'qal-2',
          question: 'Qual é o pré-requisito fundamental para a execução da Busca Binária?',
          options: [
            'O array precisa conter apenas números positivos',
            'O array deve estar obrigatoriamente ordenado',
            'O array precisa ter tamanho par',
            'O array deve ser menor que 1.000 elementos',
          ],
          correctIndex: 1,
          explanation:
            'Exato! A decisão de descartar metades depende da monotonicidade dos dados ordenados.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-bsearch',
        label: 'Busca Binária',
        code: 'let inicio = 0, fim = arr.length - 1;\nwhile (inicio <= fim) {\n  let meio = Math.floor((inicio + fim) / 2);\n  if (arr[meio] === alvo) return meio;\n  if (arr[meio] < alvo) inicio = meio + 1;\n  else fim = meio - 1;\n}',
        outputPreview: 'Encontra 42 em lista de 1.000.000 itens em apenas 18 iterações.',
        explanation: 'Desempenho assintótico O(log n).',
      },
    ],
    lab: {
      task: 'Implemente a lógica de cálculo do índice central na busca binária sem overflow numérico.',
      criteria: ['Calcula meio = Math.floor((inicio + fim) / 2)', 'Avança os limites de busca'],
      defaultCode: 'const meio = inicio + Math.floor((fim - inicio) / 2);',
    },
  },
];

// -----------------------------------------------------------------------------
// 6. SE-230 — Segurança de Aplicações
// -----------------------------------------------------------------------------
const SE_230_LESSONS: GuidedLesson[] = [
  {
    id: 'sec-01-sql-injection',
    trackId: 'security',
    trackCode: 'SE-230',
    moduleTitle: 'Ataques de Injeção & Sanitização',
    title: 'Vetores de Ataque: Compreendendo SQL Injection',
    order: 1,
    readTimeMin: 6,
    concept: {
      title: 'A Quebra da Fronteira entre Código e Dados',
      description:
        'A falha de SQL Injection ocorre quando dados não tratados provenientes do usuário são concatenados diretamente na string da instrução SQL. O atacante injeta caracteres de controle (como aspas simples e operadores relacionais) alterando a árvore sintática da consulta.',
      diagramType: 'sec-injection',
      summaryPoints: [
        'Nunca concatene variáveis de entrada diretamente em strings SQL.',
        'Entradas como "\' OR \'1\'=\'1" forçam a cláusula WHERE a avaliar para TRUE em todas as linhas.',
        'A vulnerabilidade permite bypass de autenticação, vazamento de dados e destruição do banco.',
      ],
      quiz: [
        {
          id: 'qsec-1',
          question: 'Por que a entrada "\' OR \'1\'=\'1" é perigosa em consultas mal projetadas?',
          options: [
            'Porque desliga a placa de rede do servidor',
            'Porque torna a condição WHERE verdadeira para todos os registros da tabela',
            'Porque deleta automaticamente o arquivo de banco',
            'Porque criptografa os dados com chave desconhecida',
          ],
          correctIndex: 1,
          explanation:
            'Exato! Como \'1\'=\'1\' é sempre verdadeiro, o banco retorna todas as linhas ignorando filtros de login ou permissão.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-sqli-bad',
        label: 'Vulnerável (Concatenação)',
        code: `// CÓDIGO INSEGURO:\nconst sql = "SELECT * FROM usuarios WHERE email = '" + inputEmail + "'";\n// Se inputEmail for "' OR '1'='1", a consulta vira:\n// SELECT * FROM usuarios WHERE email = '' OR '1'='1';`,
        outputPreview: 'Retorna todos os usuários do banco e faz bypass de autenticação.',
        explanation: 'O atacante injetou código que alterou a semântica da consulta.',
      },
      {
        id: 'ex-sqli-good',
        label: 'Seguro (Prepared Statement)',
        code: `// CÓDIGO PROTEGIDO:\nconst sql = "SELECT * FROM usuarios WHERE email = $1";\nawait db.query(sql, [inputEmail]);`,
        outputPreview: 'O banco trata a entrada puramente como dado literal texto.',
        explanation: 'A engine separa a análise sintática da passagem dos parâmetros.',
      },
    ],
    lab: {
      task: 'Identifique o padrão de consulta segura utilizando Prepared Statement com parâmetros posicionais ($1).',
      criteria: [
        'Não utiliza concatenação direta de strings',
        'Usa parâmetros parametrizados ($1, $2)',
      ],
      defaultCode: 'SELECT * FROM usuarios WHERE email = $1 AND senha = $2;',
    },
  },
  {
    id: 'sec-02-prepared-statements',
    trackId: 'security',
    trackCode: 'SE-230',
    moduleTitle: 'Ataques de Injeção & Sanitização',
    title: 'Prepared Statements e Parametrização Segura',
    order: 2,
    readTimeMin: 6,
    concept: {
      title: 'A Defesa Definitiva: Separação de Fases no Parser',
      description:
        'Com Prepared Statements, o SGBD compila o plano de execução da query ANTES de receber os parâmetros. Mesmo que um usuário insira código SQL malicioso dentro de um parâmetro, a engine o interpretará estritamente como string literal, neutralizando a injeção.',
      diagramType: 'sec-injection',
      summaryPoints: [
        'Fase 1: PREPARE compila a árvore AST da consulta.',
        'Fase 2: EXECUTE substitui os marcadores pelos valores recebidos.',
        'Torna impossível a alteração da lógica sintática original da consulta.',
      ],
      quiz: [
        {
          id: 'qsec-2',
          question: 'Qual o principal benefício dos Prepared Statements contra SQL Injection?',
          options: [
            'Eles apagam os dados do usuário a cada minuto',
            'Eles compilam a sintaxe antes de injetar os parâmetros, tratando entradas apenas como dados literais',
            'Eles exigem que o usuário use certificados digitais',
            'Eles bloqueiam todo o tráfego que não venha de localhost',
          ],
          correctIndex: 1,
          explanation:
            'Correto! O analisador léxico do banco não reprocessa a string de parâmetros como comandos SQL.',
        },
      ],
    },
    examples: [
      {
        id: 'ex-prep',
        label: 'Parametrização Robusta',
        code: `PREPARE busca_aluno (text) AS\n  SELECT nome, curso FROM alunos WHERE cidade = $1;\n\nEXECUTE busca_aluno('São Paulo');`,
        outputPreview: 'Consulta compilada com plano cacheado e proteção nativa.',
        explanation: 'Execução de alto desempenho e blindada contra injeção.',
      },
    ],
    lab: {
      task: 'Escreva a instrução SQL parametrizada de busca segura por cidade.',
      criteria: ['Utiliza $1 como marcador de parâmetro', 'Sem concatenação de string'],
      defaultCode: 'SELECT nome, curso FROM alunos WHERE cidade = $1;',
    },
  },
];

// -----------------------------------------------------------------------------
// Catálogo Unificado das 6 Trilhas Vetor
// -----------------------------------------------------------------------------
export const TRACKS_CATALOG: TrackDefinition[] = [
  {
    code: 'DB-201',
    trackKey: 'sql',
    name: 'Banco de Dados (PostgreSQL)',
    summary:
      'Modelagem relacional, consultas SQL otimizadas com DDL, DML, filtros avançados e índices B-Tree.',
    badge: 'PostgreSQL 16',
    accentColor: '#2F4BFF',
    totalHours: '12h de estudo',
    lessons: DB_201_LESSONS,
  },
  {
    code: 'AL-110',
    trackKey: 'algorithms',
    name: 'Algoritmos e Estruturas',
    summary:
      'Complexidade assintótica Big-O, busca binária, ordenação, tabelas hash e estruturas em árvore.',
    badge: 'Ciência da Computação',
    accentColor: '#D97706',
    totalHours: '10h de estudo',
    lessons: AL_110_LESSONS,
  },
  {
    code: 'NT-150',
    trackKey: 'networks',
    name: 'Redes de Computadores',
    summary:
      'Diagnóstico de conectividade, camadas TCP/IP, requisições HTTP e sockets do sistema operacional.',
    badge: 'TCP/IP & Sockets',
    accentColor: '#6366F1',
    totalHours: '8h de estudo',
    lessons: NT_150_LESSONS,
  },
  {
    code: 'LX-120',
    trackKey: 'linux',
    name: 'Linux e Shell',
    summary:
      'Comandos essenciais, sistema de arquivos hierárquico, streams de I/O e manipulação textual.',
    badge: 'POSIX & Bash',
    accentColor: '#0E8F67',
    totalHours: '9h de estudo',
    lessons: LX_120_LESSONS,
  },
  {
    code: 'SE-230',
    trackKey: 'security',
    name: 'Segurança de Aplicações',
    summary:
      'Prevenção contra SQL Injection, sanitização de inputs, criptografia de dados e práticas OWASP.',
    badge: 'AppSec & OWASP',
    accentColor: '#D6355F',
    totalHours: '8h de estudo',
    lessons: SE_230_LESSONS,
  },
  {
    code: 'CL-240',
    trackKey: 'docker',
    name: 'Cloud e Contêineres',
    summary:
      'Ciclo de vida de containers Docker, isolamento de processos, bind mounts e inspeção de logs.',
    badge: 'Docker & OCI',
    accentColor: '#0284C7',
    totalHours: '9h de estudo',
    lessons: CL_240_LESSONS,
  },
];

export function getAllGuidedLessons(): GuidedLesson[] {
  return TRACKS_CATALOG.flatMap((t) => t.lessons);
}

export function getGuidedLessonById(id: string): GuidedLesson | undefined {
  return getAllGuidedLessons().find((l) => l.id === id || l.exerciseId === id);
}

export function getTrackByCode(code: string): TrackDefinition | undefined {
  return TRACKS_CATALOG.find((t) => t.code === code);
}

export function getTrackByExerciseId(exerciseId: string): TrackDefinition | undefined {
  return TRACKS_CATALOG.find((t) => t.lessons.some((l) => l.id === exerciseId || l.exerciseId === exerciseId));
}
