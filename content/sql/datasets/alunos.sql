CREATE TABLE IF NOT EXISTS alunos (
  id INT PRIMARY KEY,
  nome TEXT NOT NULL,
  idade INT NOT NULL,
  curso TEXT NOT NULL,
  cidade TEXT
);

INSERT INTO alunos (id, nome, idade, curso, cidade) VALUES
  (1, 'Ana Silva', 20, 'Engenharia de Software', 'São Paulo'),
  (2, 'Bruno Costa', 22, 'Ciência da Computação', 'Rio de Janeiro'),
  (3, 'Carla Dias', 17, 'Sistemas de Informação', 'Belo Horizonte'),
  (4, 'Diego Rocha', 19, 'Engenharia de Software', NULL),
  (5, 'Eduarda Lima', 24, 'Análise de Dados', 'Curitiba'),
  (6, 'Felipe Santos', 16, 'Ciência da Computação', 'São Paulo'),
  (7, 'Gabriela Souza', 21, 'Sistemas de Informação', 'Porto Alegre'),
  (8, 'Henrique Alves', 23, 'Engenharia de Software', 'São Paulo'),
  (9, 'Isabela Ribeiro', 18, 'Análise de Dados', NULL),
  (10, 'João Pedro Mendes', 25, 'Ciência da Computação', 'Campinas'),
  (11, 'Larissa Carvalho', 17, 'Engenharia de Software', 'Rio de Janeiro'),
  (12, 'Lucas Fernandes', 22, 'Sistemas de Informação', 'São Paulo');
