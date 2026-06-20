import {
  Edge,
  EdgeChange,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
  InternalNode,
} from '@xyflow/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid/non-secure';

import { MindMapNode, NodeData, Team, Project, Comment, LogEntry } from './types';

export type RFState = {
  // Estados de Projetos
  projects: Project[];
  currentProjectId: string;
  
  // Estado ativo no React Flow
  nodes: MindMapNode[];
  edges: Edge[];
  
  // Estado de equipes
  teams: Team[];
  
  // Estado de Filtros
  filters: {
    teamId: string | null;
    assignee: string | null;
  };

  // Pilhas de Histórico (Desfazer/Refazer)
  past: Array<{ nodes: MindMapNode[]; edges: Edge[] }>;
  future: Array<{ nodes: MindMapNode[]; edges: Edge[] }>;

  // Ações do React Flow
  onNodesChange: OnNodesChange<MindMapNode>;
  onEdgesChange: OnEdgesChange;
  
  // Ações de Equipe
  addTeam: (team: Team) => void;
  updateTeam: (teamId: string, updatedTeam: Partial<Omit<Team, 'id'>>) => void;
  deleteTeam: (teamId: string) => void;
  
  // Ações de Nó
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  addChildNode: (parentNode: InternalNode, position: XYPosition) => void;
  deleteNode: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  resetMap: () => void;
  organizeLayout: () => void;

  // Ações de Projeto (Workspaces)
  createProject: (name: string) => void;
  renameProject: (projectId: string, name: string) => void;
  deleteProject: (projectId: string) => void;
  switchProject: (projectId: string) => void;

  // Ações de Filtro
  setFilters: (filters: Partial<RFState['filters']>) => void;
  clearFilters: () => void;

  // Ações de Histórico (Undo/Redo)
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Ações de Comentários
  addComment: (nodeId: string, author: string, text: string) => void;
  deleteComment: (nodeId: string, commentId: string) => void;
  
  // Ação de Log Manual
  addLogEntry: (action: string, details: string) => void;

  // Ações de Integração e Escala (Import/Export e Busca)
  importProject: (name: string, nodes: MindMapNode[], edges: Edge[], importedTeams: Team[]) => void;
  selectNode: (nodeId: string) => void;
};

// --- FUNÇÃO AUXILIAR PURA: Obter Descendentes em Cascata ---
const getDescendants = (nodeId: string, edges: Edge[]): string[] => {
  const descendants: string[] = [];
  const findChildren = (id: string) => {
    const children = edges.filter((e) => e.source === id).map((e) => e.target);
    children.forEach((childId) => {
      descendants.push(childId);
      findChildren(childId);
    });
  };
  findChildren(nodeId);
  return descendants;
};

// Helper para sincronizar as alterações de nós/edges com o array de projetos
const updateProjectsList = (projects: Project[], activeId: string, nodes: MindMapNode[], edges: Edge[]) => {
  return projects.map((p) => (p.id === activeId ? { ...p, nodes, edges } : p));
};

// --- ALGORITMO: Tronco Central (Central Trunk) ---
const getCentralTrunkLayout = (nodes: MindMapNode[], edges: Edge[]) => {
  if (nodes.length === 0) return { nodes, edges };

  const layoutedNodes = nodes.map(n => ({ ...n }));
  
  const rootIndex = layoutedNodes.findIndex(n => n.id === 'root');
  if (rootIndex !== -1) {
    // 1. Centralização Absoluta do Nó Raiz
    // O NodeOrigin é [0.5, 0.5], portanto a posição { x: 0, y: 0 } 
    // garante o nó exatamente no centro geométrico do layout.
    layoutedNodes[rootIndex].position = { x: 0, y: 0 };
    // O nó raiz usará os valores padrão/implícitos para emitir as linhas
  }

  const adjList: Record<string, string[]> = {};
  edges.forEach(e => {
    if (!adjList[e.source]) adjList[e.source] = [];
    adjList[e.source].push(e.target);
  });

  const rootId = 'root';
  const rootChildren = adjList[rootId] || [];
  
  let leftCount = 0;
  let rightCount = 0;

  const positionBranch = (nodeId: string, isLeft: boolean, depth: number, yOffset: number) => {
    const nodeIndex = layoutedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    // 3. Espaçamento Horizontal (X-Gap) Generoso
    // Aumentado para 400px para permitir que o smoothstep tenha bastante espaço para curva
    const xDist = 400; 
    
    // Calcula a posição no eixo X: Negativo para a esquerda, Positivo para a direita
    const xPos = isLeft ? -(depth * xDist) : (depth * xDist);
    
    layoutedNodes[nodeIndex].position = { x: xPos, y: yOffset };

    // 2. Handles Dinâmicos (A Chave para Linhas Limpas)
    // Atualiza explicitamente onde a linha entra e sai de cada nó filho
    if (isLeft) {
      layoutedNodes[nodeIndex].targetPosition = 'right' as any;
      layoutedNodes[nodeIndex].sourcePosition = 'left' as any;
    } else {
      layoutedNodes[nodeIndex].targetPosition = 'left' as any;
      layoutedNodes[nodeIndex].sourcePosition = 'right' as any;
    }

    const children = adjList[nodeId] || [];
    children.forEach((childId, idx) => {
      // Offset no Y para evitar sobreposição de nós
      positionBranch(childId, isLeft, depth + 1, yOffset + (idx * 160));
    });
  };

  rootChildren.forEach((childId, idx) => {
    const isLeft = idx % 2 === 0;
    if (isLeft) {
      positionBranch(childId, true, 1, 160 * leftCount);
      leftCount++;
    } else {
      positionBranch(childId, false, 1, 160 * rightCount);
      rightCount++;
    }
  });

  return { nodes: layoutedNodes, edges };
};

const defaultTeams: Team[] = [
  { id: 't1', name: 'Equipe Front', colorHex: '#3b82f6', members: ['Alice', 'Bob', 'Carlos'] },
  { id: 't2', name: 'Equipe Back', colorHex: '#f97316', members: ['Diana', 'Eduardo', 'Fernanda'] },
  { id: 't3', name: 'Design', colorHex: '#ec4899', members: ['Gabriel', 'Helena'] }
];

const initialNodes: MindMapNode[] = [
  {
    id: 'root',
    type: 'mindmap',
    data: { label: 'Projeto TCC', comments: [] },
    position: { x: -100, y: 0 },
    dragHandle: '.node-header',
  },
];

const useStore = create<RFState>()(
  persist(
    (set, get) => ({
      // Estados Iniciais
      projects: [
        {
          id: 'default',
          name: 'Projeto Principal',
          nodes: initialNodes,
          edges: [],
          activityLog: [],
        },
      ],
      currentProjectId: 'default',
      nodes: initialNodes,
      edges: [],
      teams: defaultTeams,
      filters: {
        teamId: null,
        assignee: null,
      },
      past: [],
      future: [],

      onNodesChange: (changes: NodeChange<MindMapNode>[]) => {
        const nextNodes = applyNodeChanges<MindMapNode>(changes, get().nodes);
        set({
          nodes: nextNodes,
          projects: updateProjectsList(get().projects, get().currentProjectId, nextNodes, get().edges),
        });
      },
      
      onEdgesChange: (changes: EdgeChange[]) => {
        const nextEdges = applyEdgeChanges(changes, get().edges);
        set({
          edges: nextEdges,
          projects: updateProjectsList(get().projects, get().currentProjectId, get().nodes, nextEdges),
        });
      },
      
      addTeam: (team: Team) => {
        set({ teams: [...get().teams, team] });
      },
      
      updateTeam: (teamId: string, updatedTeam: Partial<Omit<Team, 'id'>>) => {
        set({
          teams: get().teams.map((t) =>
            t.id === teamId ? { ...t, ...updatedTeam } : t
          ),
        });
      },
      
      deleteTeam: (teamId: string) => {
        get().takeSnapshot();
        const oldTeam = get().teams.find(t => t.id === teamId);
        const nextTeams = get().teams.filter((t) => t.id !== teamId);
        
        const nextNodes = get().nodes.map((node) => {
          if (node.data.teamId === teamId) {
            return {
              ...node,
              data: {
                ...node.data,
                teamId: undefined,
                assignee: undefined,
              },
            };
          }
          return node;
        });

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Equipe Deletada',
          details: `Equipe '${oldTeam ? oldTeam.name : 'Desconhecida'}' foi removida do sistema`,
        };

        set({
          teams: nextTeams,
          nodes: nextNodes,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: nextNodes, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },
      
      updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
        const targetNode = get().nodes.find((n) => n.id === nodeId);
        if (!targetNode) return;

        // Se a alteração for de equipe, responsável ou status (seletores discretos), grava snapshot de histórico antes
        const isTeamChange = 'teamId' in data && data.teamId !== targetNode.data.teamId;
        const isStructuralSelectChange = isTeamChange || ('assignee' in data && data.assignee !== targetNode.data.assignee);
        const isStatusChange = ('status' in data && data.status !== targetNode.data.status);
        
        if (isStructuralSelectChange || isStatusChange) {
          get().takeSnapshot();
        }

        // Obtém todos os descendentes para a herança em cascata (Cascading Update) se a equipe mudar
        let affectedIds = [nodeId];
        if (isTeamChange) {
          const descendants = getDescendants(nodeId, get().edges);
          affectedIds = [nodeId, ...descendants];
        }

        const nextNodes = get().nodes.map((node) => {
          // Atualiza o nó alvo que o usuário modificou diretamente
          if (node.id === nodeId) {
            const newData = { ...node.data, ...data };
            if (isTeamChange) newData.assignee = '';
            return { ...node, data: newData };
          }
          
          // Herança em cascata: atualiza a equipe de todos os descendentes (filhos, netos, etc)
          if (isTeamChange && affectedIds.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                teamId: data.teamId,
                assignee: '', // Reseta o responsável pois a equipe mudou
              }
            };
          }

          return node;
        });

        // Logs de alterações em metadados
        const newLogs: LogEntry[] = [];
        const nodeName = targetNode.data.label;

        if ('teamId' in data && data.teamId !== targetNode.data.teamId) {
          const oldTeam = get().teams.find(t => t.id === targetNode.data.teamId);
          const newTeam = get().teams.find(t => t.id === data.teamId);
          newLogs.push({
            id: nanoid(),
            timestamp: new Date().toISOString(),
            action: 'Equipe Alterada',
            details: `Tarefa '${nodeName}' vinculada à equipe '${newTeam ? newTeam.name : 'Nenhuma'}' (antiga: '${oldTeam ? oldTeam.name : 'Nenhuma'}')`,
          });
        }

        if ('assignee' in data && data.assignee !== targetNode.data.assignee) {
          newLogs.push({
            id: nanoid(),
            timestamp: new Date().toISOString(),
            action: 'Responsável Alterado',
            details: `Tarefa '${nodeName}' atribuída a '${data.assignee || 'Não Atribuído'}' (antigo: '${targetNode.data.assignee || 'Não Atribuído'}')`,
          });
        }

        if ('status' in data && data.status !== targetNode.data.status) {
          newLogs.push({
            id: nanoid(),
            timestamp: new Date().toISOString(),
            action: 'Status Alterado',
            details: `Tarefa '${nodeName}' alterada para o status '${data.status}' (antigo: '${targetNode.data.status || 'Pendente'}')`,
          });
        }

        set({
          nodes: nextNodes,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: nextNodes, activityLog: [...newLogs, ...(p.activityLog || [])] }
              : p
          ),
        });
      },
      
      addChildNode: (parentNode: InternalNode, position: XYPosition) => {
        get().takeSnapshot();

        const newNode: MindMapNode = {
          id: nanoid(),
          type: 'mindmap',
          data: { label: 'Nova Tarefa', comments: [], status: 'Pendente' }, // Inicializado com status 'Pendente'
          position,
          dragHandle: '.node-header',
          parentId: parentNode.id,
        };

        const newEdge: Edge = {
          id: nanoid(),
          source: parentNode.id,
          target: newNode.id,
          type: 'mindmap',
          animated: true,
        };

        const nextNodes = [...get().nodes, newNode];
        const nextEdges = [...get().edges, newEdge];

        const parentNodeObj = get().nodes.find(n => n.id === parentNode.id);
        const parentName = parentNodeObj?.data.label || 'Tarefa';

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Tarefa Criada',
          details: `Tarefa '${newNode.data.label}' criada como sub-tarefa de '${parentName}'`,
        };

        set({
          nodes: nextNodes,
          edges: nextEdges,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: nextNodes, edges: nextEdges, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },
      
      resetMap: () => {
        get().takeSnapshot();

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Mapa Reiniciado',
          details: 'Todas as tarefas foram excluídas e o mapa voltou ao estado inicial',
        };

        set({
          nodes: initialNodes,
          edges: [],
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: initialNodes, edges: [], activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },
      
      organizeLayout: () => {
        get().takeSnapshot();

        const visibleNodes = get().nodes.filter((n) => !n.hidden);
        const visibleEdges = get().edges.filter((e) => !e.hidden);
        const { nodes: layoutedNodes } = getCentralTrunkLayout(visibleNodes, visibleEdges);
        
        const layoutedMap = new Map(layoutedNodes.map(n => [n.id, n]));
        
        const finalNodes = get().nodes.map(n => {
          const lNode = layoutedMap.get(n.id);
          return lNode ? lNode : n;
        });

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Layout Organizado',
          details: 'O layout do organograma foi reestruturado automaticamente no modo Tronco Central',
        };

        set({
          nodes: finalNodes,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: finalNodes, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },
      
      deleteNode: (nodeId: string) => {
        get().takeSnapshot();

        const edges = get().edges;
        const descendants = getDescendants(nodeId, edges);
        const idsToDelete = [nodeId, ...descendants];
        const nextNodes = get().nodes.filter((n) => !idsToDelete.includes(n.id));
        const nextEdges = edges.filter(
          (e) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)
        );

        const targetNode = get().nodes.find((n) => n.id === nodeId);
        const nodeName = targetNode?.data.label || 'Tarefa';

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Tarefa Deletada',
          details: `Tarefa '${nodeName}' e suas sub-tarefas foram removidas`,
        };

        set({
          nodes: nextNodes,
          edges: nextEdges,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: nextNodes, edges: nextEdges, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },
      
      toggleCollapse: (nodeId: string) => {
        const nodes = get().nodes;
        const edges = get().edges;
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;
        
        const isCollapsed = !node.data.collapsed;
        const descendants = getDescendants(nodeId, edges);
        
        const nextNodes = nodes.map((n) => {
          if (n.id === nodeId) return { ...n, data: { ...n.data, collapsed: isCollapsed } };
          if (descendants.includes(n.id)) return { ...n, hidden: isCollapsed };
          return n;
        });
        const nextEdges = edges.map((e) => {
          if (descendants.includes(e.target)) return { ...e, hidden: isCollapsed };
          return e;
        });
        
        set({
          nodes: nextNodes,
          edges: nextEdges,
          projects: updateProjectsList(get().projects, get().currentProjectId, nextNodes, nextEdges),
        });
      },

      // --- Ações de Projetos ---
      createProject: (name: string) => {
        const newProjectId = nanoid();
        const newProject: Project = {
          id: newProjectId,
          name: name.trim(),
          nodes: initialNodes,
          edges: [],
          activityLog: [
            {
              id: nanoid(),
              timestamp: new Date().toISOString(),
              action: 'Projeto Criado',
              details: `Workspace '${name.trim()}' foi criado com sucesso`,
            }
          ],
        };
        set({
          projects: [...get().projects, newProject],
          currentProjectId: newProjectId,
          nodes: initialNodes,
          edges: [],
          past: [],
          future: [],
        });
      },

      renameProject: (projectId: string, name: string) => {
        const oldProject = get().projects.find(p => p.id === projectId);
        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Projeto Renomeado',
          details: `Workspace renomeado de '${oldProject ? oldProject.name : 'Desconhecido'}' para '${name.trim()}'`,
        };

        set({
          projects: get().projects.map((p) =>
            p.id === projectId 
              ? { ...p, name: name.trim(), activityLog: [newLog, ...(p.activityLog || [])] } 
              : p
          ),
        });
      },

      deleteProject: (projectId: string) => {
        const projects = get().projects;
        if (projects.length <= 1) return;

        const nextProjects = projects.filter((p) => p.id !== projectId);
        
        if (get().currentProjectId === projectId) {
          const nextActiveProject = nextProjects[0];
          set({
            projects: nextProjects,
            currentProjectId: nextActiveProject.id,
            nodes: nextActiveProject.nodes,
            edges: nextActiveProject.edges,
            past: [],
            future: [],
          });
        } else {
          set({
            projects: nextProjects,
          });
        }
      },

      switchProject: (projectId: string) => {
        const updatedProjects = updateProjectsList(get().projects, get().currentProjectId, get().nodes, get().edges);
        const targetProject = updatedProjects.find((p) => p.id === projectId);
        if (!targetProject) return;

        set({
          projects: updatedProjects,
          currentProjectId: projectId,
          nodes: targetProject.nodes,
          edges: targetProject.edges,
          past: [],
          future: [],
        });
      },

      // --- Ações de Filtros ---
      setFilters: (filters: Partial<RFState['filters']>) => {
        set({
          filters: {
            ...get().filters,
            ...filters,
          },
        });
      },

      clearFilters: () => {
        set({
          filters: {
            teamId: null,
            assignee: null,
          },
        });
      },

      // --- Ações de Histórico (Undo/Redo) ---
      takeSnapshot: () => {
        const current = { 
          nodes: get().nodes.map(n => ({ ...n, data: { ...n.data, comments: n.data.comments ? n.data.comments.map(c => ({ ...c })) : [] } })), 
          edges: get().edges.map(e => ({ ...e })) 
        };
        
        const lastPast = get().past[get().past.length - 1];
        if (lastPast) {
          const isNodesIdentical = JSON.stringify(lastPast.nodes) === JSON.stringify(current.nodes);
          const isEdgesIdentical = JSON.stringify(lastPast.edges) === JSON.stringify(current.edges);
          if (isNodesIdentical && isEdgesIdentical) return;
        }

        const maxHistory = 30;
        const nextPast = [...get().past, current];
        if (nextPast.length > maxHistory) nextPast.shift();

        set({
          past: nextPast,
          future: [],
        });
      },

      undo: () => {
        const past = get().past;
        if (past.length === 0) return;
        
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        
        const current = { 
          nodes: get().nodes.map(n => ({ ...n, data: { ...n.data, comments: n.data.comments ? n.data.comments.map(c => ({ ...c })) : [] } })), 
          edges: get().edges.map(e => ({ ...e })) 
        };
        const newFuture = [current, ...get().future];

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Ação Desfeita',
          details: 'Uma alteração anterior no organograma foi desfeita via Ctrl+Z',
        };
        
        set({
          past: newPast,
          future: newFuture,
          nodes: previous.nodes,
          edges: previous.edges,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: previous.nodes, edges: previous.edges, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },

      redo: () => {
        const future = get().future;
        if (future.length === 0) return;
        
        const next = future[0];
        const newFuture = future.slice(1);
        
        const current = { 
          nodes: get().nodes.map(n => ({ ...n, data: { ...n.data, comments: n.data.comments ? n.data.comments.map(c => ({ ...c })) : [] } })), 
          edges: get().edges.map(e => ({ ...e })) 
        };
        const newPast = [...get().past, current];

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Ação Refeita',
          details: 'Uma alteração anteriormente desfeita foi restaurada',
        };
        
        set({
          past: newPast,
          future: newFuture,
          nodes: next.nodes,
          edges: next.edges,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: next.nodes, edges: next.edges, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },

      // --- Ações de Comentários ---
      addComment: (nodeId: string, author: string, text: string) => {
        get().takeSnapshot();

        const newComment: Comment = {
          id: nanoid(),
          author,
          text: text.trim(),
          createdAt: new Date().toISOString(),
        };

        const targetNode = get().nodes.find((n) => n.id === nodeId);
        const nodeName = targetNode?.data.label || 'Tarefa';

        const nextNodes = get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                comments: [...(node.data.comments || []), newComment],
              },
            };
          }
          return node;
        });

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Comentário Adicionado',
          details: `${author} comentou na tarefa '${nodeName}': "${text.trim().substring(0, 30)}${text.trim().length > 30 ? '...' : ''}"`,
        };

        set({
          nodes: nextNodes,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: nextNodes, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },

      deleteComment: (nodeId: string, commentId: string) => {
        get().takeSnapshot();

        const targetNode = get().nodes.find((n) => n.id === nodeId);
        const nodeName = targetNode?.data.label || 'Tarefa';

        const nextNodes = get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                comments: (node.data.comments || []).filter((c) => c.id !== commentId),
              },
            };
          }
          return node;
        });

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Comentário Deletado',
          details: `Um comentário foi removido da tarefa '${nodeName}'`,
        };

        set({
          nodes: nextNodes,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: nextNodes, activityLog: [newLog, ...(p.activityLog || [])] }
              : p
          ),
        });
      },

      addLogEntry: (action: string, details: string) => {
        const newEntry: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action,
          details,
        };

        set({
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, activityLog: [newEntry, ...(p.activityLog || [])] }
              : p
          ),
        });
      },

      importProject: (name: string, nodes: MindMapNode[], edges: Edge[], importedTeams: Team[]) => {
        const newProjectId = nanoid();
        const currentTeams = get().teams;
        const nextTeams = [...currentTeams];

        // Mescla equipes importadas se elas não existirem no sistema (por nome ou id)
        importedTeams.forEach((importedTeam) => {
          const exists = currentTeams.some(
            (t) => t.id === importedTeam.id || t.name.toLowerCase() === importedTeam.name.toLowerCase()
          );
          if (!exists) {
            nextTeams.push(importedTeam);
          }
        });

        const newLog: LogEntry = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          action: 'Projeto Importado',
          details: `Workspace '${name.trim()}' foi importado com sucesso via JSON`,
        };

        const newProject: Project = {
          id: newProjectId,
          name: name.trim(),
          nodes,
          edges,
          activityLog: [newLog],
        };

        set({
          projects: [...get().projects, newProject],
          currentProjectId: newProjectId,
          nodes,
          edges,
          teams: nextTeams,
          past: [],
          future: [],
        });

        get().takeSnapshot();
      },

      selectNode: (nodeId: string) => {
        const nextNodes = get().nodes.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }));
        set({
          nodes: nextNodes,
          projects: get().projects.map((p) =>
            p.id === get().currentProjectId
              ? { ...p, nodes: nextNodes }
              : p
          ),
        });
      },
    }),
    {
      name: 'tcc-mindmap-storage-v3',
      version: 3, // Migração incrementada para v3
      migrate: (persistedState: any, version: number) => {
        if (persistedState) {
          // Migração v1/v2 -> v3
          if (!persistedState.projects || persistedState.projects.length === 0) {
            const legacyNodes = persistedState.nodes || initialNodes;
            const legacyEdges = persistedState.edges || [];
            persistedState.projects = [
              {
                id: 'default',
                name: 'Projeto Principal',
                nodes: legacyNodes,
                edges: legacyEdges,
                activityLog: [],
              }
            ];
            persistedState.currentProjectId = 'default';
          }

          // Inicializa activityLog, comments e status nos projetos
          persistedState.projects = persistedState.projects.map((p: any) => ({
            ...p,
            activityLog: p.activityLog || [],
            nodes: p.nodes ? p.nodes.map((n: any) => ({
              ...n,
              data: {
                ...n.data,
                comments: n.data.comments || [],
                status: n.data.status || (n.id === 'root' ? undefined : 'Pendente'),
              }
            })) : [],
          }));

          // Inicializa nos nós ativos
          if (persistedState.nodes) {
            persistedState.nodes = persistedState.nodes.map((n: any) => ({
              ...n,
              data: {
                ...n.data,
                comments: n.data.comments || [],
                status: n.data.status || (n.id === 'root' ? undefined : 'Pendente'),
              }
            }));
          }

          if (!persistedState.filters) {
            persistedState.filters = {
              teamId: null,
              assignee: null,
            };
          }
        }
        return persistedState;
      },
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        nodes: state.nodes,
        edges: state.edges,
        teams: state.teams,
        filters: state.filters,
      }),
    }
  )
);

export default useStore;
