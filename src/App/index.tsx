import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  ConnectionLineType,
  NodeOrigin,
  OnConnectEnd,
  OnConnectStart,
  useReactFlow,
  useStoreApi,
  Controls,
  Panel,
  InternalNode,
  Background,
  BackgroundVariant,
  MiniMap,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Trash2, LayoutGrid, FileImage, FileText, ChevronDown, Users, History, BarChart3, FileJson, Search } from 'lucide-react';

import useStore, { RFState } from './store';
import MindMapNode from './MindMapNode';
import MindMapEdge from './MindMapEdge';
import TeamsModal from './TeamsModal';
import WorkspacePanel from './WorkspacePanel';
import FilterPanel from './FilterPanel';
import HistoryPanel from './HistoryPanel';
import DashboardPanel from './DashboardPanel';
import SearchModal from './SearchModal';
import TutorialPanel from './TutorialPanel';

// we need to import the React Flow styles to make it work
import '@xyflow/react/dist/style.css';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  teams: state.teams,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  addChildNodeById: state.addChildNodeById,
  resetMap: state.resetMap,
  organizeLayout: state.organizeLayout,
  undo: state.undo,
  redo: state.redo,
  takeSnapshot: state.takeSnapshot,
  selectNode: state.selectNode,
});

const nodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes = {
  mindmap: MindMapEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0.5];

const connectionLineStyle = { stroke: '#F6AD55', strokeWidth: 3 };
const defaultEdgeOptions = { style: connectionLineStyle, type: 'mindmap' };

function Flow() {
  const store = useStoreApi();
  const { 
    nodes, 
    edges, 
    teams, 
    onNodesChange, 
    onEdgesChange, 
    addChildNodeById, 
    resetMap, 
    organizeLayout,
    undo,
    redo,
    takeSnapshot,
    selectNode,
  } = useStore(
    useShallow(selector)
  );
  const { screenToFlowPosition, fitView } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Manipulador para salvar snapshot ao fim do arraste do nó no gráfico
  const onNodeDragStop = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  // Efeito global para gerenciar atalhos de desfazer e refazer (Ctrl+Z / Ctrl+Y) e busca (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrl = event.ctrlKey || event.metaKey;
      const isInputFocused = document.activeElement instanceof HTMLInputElement || 
                             document.activeElement instanceof HTMLTextAreaElement;

      if (isCtrl) {
        if (event.key.toLowerCase() === 'z') {
          if (isInputFocused) return; // Permite desfazer nativo de caracteres digitados
          event.preventDefault();
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (event.key.toLowerCase() === 'y') {
          if (isInputFocused) return;
          event.preventDefault();
          redo();
        } else if (event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setShowSearch(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleExport = useCallback((format: 'png' | 'pdf') => {
    setShowExportMenu(false);
    
    // PILAR 4: Captura matemática absoluta
    const nodesBounds = getNodesBounds(store.getState().nodes);
    // Definimos uma resolução de tela base para o print (ex: 1920x1080)
    const imageWidth = 1920;
    const imageHeight = 1080;
    
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.1);
    
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) return;

    toPng(viewportElement, {
      backgroundColor: '#0f172a',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      if (format === 'png') {
        const a = document.createElement('a');
        a.setAttribute('download', 'organograma.png');
        a.setAttribute('href', dataUrl);
        a.click();
      } else {
        const pdf = new jsPDF({ orientation: 'landscape', format: 'a4' });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('organograma.pdf');
      }
    }).catch(err => {
      console.error(err);
    });
  }, []);

  const handleExportJSON = useCallback(() => {
    setShowExportMenu(false);
    const activeProject = useStore.getState().projects.find((p) => p.id === useStore.getState().currentProjectId);
    if (!activeProject) return;

    const exportData = {
      type: 'tcc-mindmap-workspace',
      version: '1.0',
      project: {
        name: activeProject.name,
        nodes: useStore.getState().nodes,
        edges: useStore.getState().edges,
        activityLog: activeProject.activityLog,
      },
      teams: useStore.getState().teams,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `backup-workspace-${activeProject.name.toLowerCase().replace(/\s+/g, '-')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, []);

  const handleSelectNode = useCallback((nodeId: string) => {
    selectNode(nodeId);
    fitView({ nodes: [{ id: nodeId }], duration: 800, maxZoom: 1.2 });
  }, [selectNode, fitView]);

  const getChildNodePosition = (
    event: MouseEvent | TouchEvent,
    parentNode?: InternalNode
  ) => {
    const { domNode } = store.getState();

    if (
      !domNode ||
      !parentNode?.internals.positionAbsolute ||
      !parentNode?.measured.width ||
      !parentNode?.measured.height
    ) {
      return;
    }

    const panePosition = screenToFlowPosition({
      x: 'clientX' in event ? event.clientX : event.touches[0].clientX,
      y: 'clientY' in event ? event.clientY : event.touches[0].clientY,
    });

    return {
      x: panePosition.x - parentNode.internals.positionAbsolute.x,
      y: panePosition.y - parentNode.internals.positionAbsolute.y,
    };
  };

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 1) return;
    event.preventDefault();
    
    const node = (event.target as Element).closest('.react-flow__node');
    if (!node) return;

    const nodeElement = node as HTMLElement;
    const nodeId = nodeElement.getAttribute('data-id');
    if (!nodeId) return;

    const { nodeLookup } = store.getState();
    const parentNode = nodeLookup.get(nodeId);
    if (!parentNode) return;

    const childPosition = getChildNodePosition(event.nativeEvent as MouseEvent, parentNode);
    if (!childPosition) return;

    addChildNodeById(nodeId, childPosition);
  }, [screenToFlowPosition, addChildNodeById]);

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    // we need to remember where the connection started so we can add the new node to the correct parent on connect end
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const { nodeLookup } = store.getState();
      const targetIsPane = (event.target as Element).classList.contains(
        'react-flow__pane'
      );
      const node = (event.target as Element).closest('.react-flow__node');

      if (node) {
        node.querySelector('input')?.focus({ preventScroll: true });
      } else if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeLookup.get(connectingNodeId.current);

        if (parentNode) {
          const childNodePosition = getChildNodePosition(event, parentNode);

          if (childNodePosition) {
            addChildNodeById(parentNode.id, childNodePosition);
          }
        }
      }
    },
    [getChildNodePosition, addChildNodeById]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      onMouseDown={handleMouseDown}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodeOrigin={nodeOrigin}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineStyle={connectionLineStyle}
      connectionLineType={ConnectionLineType.Straight}
      onNodeDragStop={onNodeDragStop}
      fitView
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="var(--node-border)" />
      <MiniMap 
        nodeColor={(n) => {
          const team = teams.find(t => t.id === n.data?.teamId);
          return team ? team.colorHex : 'rgba(255, 255, 255, 0.3)';
        }}
        nodeStrokeColor={(n) => {
          const team = teams.find(t => t.id === n.data?.teamId);
          return team ? team.colorHex : 'rgba(255, 255, 255, 0.5)';
        }}
        nodeBorderRadius={8}
        maskColor="rgba(15, 23, 42, 0.8)"
        style={{
          backgroundColor: 'var(--bg-gradient-end)',
          borderRadius: '8px',
          border: '1px solid var(--node-border)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      />
      <Controls showInteractive={false} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }} />
      
      <Panel position="top-left">
        <WorkspacePanel />
      </Panel>
      
      <Panel position="top-right">
        <FilterPanel />
      </Panel>
      
      <Panel position="top-center" className="toolbar-panel">
        <div className="toolbar-content">
          <div className="dropdown">
            <button className="toolbar-btn" onClick={() => setShowExportMenu(!showExportMenu)} title="Baixar">
              <Download size={20} />
              <span>Baixar</span>
              <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => handleExport('png')}>
                  <FileImage size={16} /> PNG
                </button>
                <button className="dropdown-item" onClick={() => handleExport('pdf')}>
                  <FileText size={16} /> PDF
                </button>
                <button className="dropdown-item" onClick={handleExportJSON}>
                  <FileJson size={16} /> JSON (Backup)
                </button>
              </div>
            )}
          </div>
          <button className="toolbar-btn" onClick={() => organizeLayout()} title="Organizar Layout Central">
            <LayoutGrid size={20} />
            <span>Organizar</span>
          </button>
          <button className="toolbar-btn" onClick={() => setShowTeamsModal(true)} title="Gerenciar Equipes">
            <Users size={20} />
            <span>Equipes</span>
          </button>
          <button className="toolbar-btn" onClick={() => setShowHistory(true)} title="Histórico de Atividades">
            <History size={20} />
            <span>Histórico</span>
          </button>
          <button className="toolbar-btn" onClick={() => setShowDashboard(true)} title="Dashboard de Progresso">
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
          <button className="toolbar-btn" onClick={() => setShowSearch(true)} title="Buscar Tarefas (Ctrl+K)">
            <Search size={20} />
            <span>Buscar</span>
          </button>
          <button className="toolbar-btn danger" onClick={() => resetMap()} title="Limpar Mapa">
            <Trash2 size={20} />
            <span>Limpar</span>
          </button>
        </div>
      </Panel>
      
      {showTeamsModal && <TeamsModal onClose={() => setShowTeamsModal(false)} />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showDashboard && <DashboardPanel onClose={() => setShowDashboard(false)} />}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} onSelectNode={handleSelectNode} />
      <TutorialPanel />
    </ReactFlow>
  );
}

export default Flow;
