<div align="center">
  <img src="https://img.icons8.com/color/96/000000/mind-map.png" alt="Logo" width="80" height="80">
  <h1 align="center">MindTCC</h1>
  <p align="center">
    Um organograma interativo e mapa mental focado no gerenciamento de Trabalhos de Conclusão de Curso (TCC) e projetos acadêmicos.
    <br />
    <a href="#-sobre-o-projeto"><strong>Explore a documentação »</strong></a>
    <br />
  </p>
</div>

<details>
  <summary>Tabela de Conteúdos</summary>
  <ol>
    <li><a href="#-sobre-o-projeto">Sobre o Projeto</a></li>
    <li><a href="#-funcionalidades">Funcionalidades</a></li>
    <li><a href="#%EF%B8%8F-tecnologias-utilizadas">Tecnologias Utilizadas</a></li>
    <li><a href="#-como-começar">Como Começar</a></li>
    <li><a href="#-como-contribuir">Como Contribuir</a></li>
    <li><a href="#-licença">Licença</a></li>
  </ol>
</details>

## 🎯 Sobre o Projeto

Este projeto foi desenvolvido para resolver a dificuldade de organização visual em equipes de pesquisa e projetos acadêmicos (como um TCC). Ele utiliza uma interface visual de organograma/mapa mental onde cada nó representa uma tarefa ou objetivo, permitindo designar responsáveis, rastrear o progresso e manter um registro claro de quem está fazendo o quê.

O sistema é executado inteiramente no navegador (client-side) e permite a gestão de múltiplos times e a exportação dos fluxos criados para PDF ou JSON.

## ✨ Funcionalidades

- **Mapa Mental Interativo:** Crie e conecte tarefas dinamicamente com suporte a arrastar e soltar (Drag & Drop).
- **Gestão de Equipes (Teams):** Cadastre times com cores customizadas e adicione membros para atribuir às tarefas.
- **Detalhamento de Tarefas:** Cada card possui metadados embutidos como:
  - `Status` (Pendente, Em Andamento, Concluído)
  - `Equipe` e `Responsável`
  - Descrição da tarefa
  - Sistema de comentários com rastreabilidade
- **Dashboard de Progresso:** Um painel com indicadores circulares que exibem o percentual de conclusão do projeto em tempo real e o andamento por equipe.
- **Filtros e Busca (Spotlight):** 
  - Filtre tarefas por equipe ou responsável (esmaecendo o que não importa).
  - Pressione `Ctrl + K` para buscar tarefas globais pelo título e focar nelas no mapa.
- **Desfazer / Refazer:** O aplicativo mantém o histórico do seu trabalho. Errou? Use `Ctrl + Z`.
- **Exportação e Backup:** Exporte o mapa mental para PNG, PDF de alta resolução, ou baixe o Workspace em formato `.json` para continuar depois.
- **MiniMap e Controles:** Mini-mapa interativo com as cores reais das equipes para navegação fácil em organogramas muito grandes.

## 🛠️ Tecnologias Utilizadas

A aplicação foi construída com foco em performance e uma UI Premium (Glassmorphism):

- **[React](https://reactjs.org/)** (com Vite)
- **[React Flow / XYFlow](https://reactflow.dev/)** (Motor de renderização do grafo)
- **[Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)** (Gerenciamento global de estado)
- **[Lucide Icons](https://lucide.dev/)** (Ícones modernos)
- **TypeScript** (Tipagem forte para escalabilidade)

## 🚀 Como Começar

Siga as instruções abaixo para rodar o projeto localmente na sua máquina.

### Pré-requisitos

- Node.js (versão 16.x ou superior recomendada)
- npm ou yarn

### Instalação

1. Clone o repositório
   ```sh
   git clone https://github.com/seu-usuario/nome-do-projeto.git
   ```
2. Navegue até a pasta do projeto
   ```sh
   cd nome-do-projeto
   ```
3. Instale as dependências
   ```sh
   npm install
   ```
4. Inicie o servidor de desenvolvimento
   ```sh
   npm run dev
   ```
5. Abra o navegador em `http://localhost:5173` (ou a porta indicada no terminal).

## 🤝 Como Contribuir

Contribuições são o que fazem a comunidade open source um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/NovaFuncionalidade`)
3. Faça o Commit de suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Faça o Push para a Branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 🙏 Agradecimentos e Créditos

Este projeto teve como base estrutural inicial o excelente repositório **[React Flow Mindmap App](https://github.com/xyflow/react-flow-mindmap-app)** criado pela equipe do xyflow. A partir dessa base incrível, adicionamos toda a arquitetura de gestão de projetos acadêmicos, incluindo a gestão de equipes, dashboard de progresso, sistema de comentários integrados, filtros globais, exportação e armazenamento persistente.

## 📝 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
