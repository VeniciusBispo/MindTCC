import { type Node, type Edge } from '@xyflow/react';

export type Team = {
  id: string;
  name: string;
  colorHex: string;
  members: string[];
};

export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string; // Formato ISO
};

export type LogEntry = {
  id: string;
  timestamp: string; // Formato ISO
  action: string;
  details: string;
};

export type TaskStatus = 'Pendente' | 'Em Andamento' | 'Concluído';

export type NodeShape = 'retangulo' | 'arredondado' | 'circulo' | 'losango';

export type NodeData = {
  label: string;
  teamId?: string;
  assignee?: string;
  details?: string;
  collapsed?: boolean;
  comments?: Comment[];
  status?: TaskStatus;
  shape?: NodeShape;
};

export type MindMapNode = Node<NodeData, 'mindmap'>;

export type Project = {
  id: string;
  name: string;
  nodes: MindMapNode[];
  edges: Edge[];
  activityLog: LogEntry[];
};

export interface WorkspaceExportData {
  type: 'tcc-mindmap-workspace';
  version: string;
  project: {
    name: string;
    nodes: MindMapNode[];
    edges: Edge[];
    activityLog?: LogEntry[];
  };
  teams: Team[];
}
