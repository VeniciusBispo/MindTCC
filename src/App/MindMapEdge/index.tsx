import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import useStore from '../store';

export default function MindMapEdge(props: EdgeProps) {
  const { 
    id,
    source, 
    target, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY, 
    sourcePosition, 
    targetPosition, 
    markerEnd,
    markerStart,
    interactionWidth,
    style
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  // Otimização de Performance: Subscreve apenas à cor e ao status de filtro relativos aos nós desta conexão.
  const { strokeColor, isFiltered } = useStore((state) => {
    const sourceNode = state.nodes.find((n) => n.id === source);
    const targetNode = state.nodes.find((n) => n.id === target);
    
    // 1. Calcula a cor com base no time do nó alvo
    const teamId = targetNode?.data?.teamId;
    const team = state.teams.find((t) => t.id === teamId);
    const color = team ? team.colorHex : 'rgba(255, 255, 255, 0.2)';
    
    // 2. Calcula se a conexão está fora do foco dos filtros ativos
    const { teamId: filterTeamId, assignee: filterAssignee } = state.filters;
    let filtered = false;
    
    if (filterTeamId || filterAssignee) {
      const checkNodeFiltered = (node: any) => {
        if (!node) return false;
        // O nó raiz nunca é considerado filtrado
        if (node.id === 'root') return false;
        
        if (filterTeamId && node.data.teamId !== filterTeamId) return true;
        if (filterAssignee && node.data.assignee !== filterAssignee) return true;
        return false;
      };
      
      // Esmaece a linha se a origem ou o destino estiverem filtrados
      filtered = checkNodeFiltered(sourceNode) || checkNodeFiltered(targetNode);
    }
    
    return {
      strokeColor: color,
      isFiltered: filtered,
    };
  });

  return (
    <BaseEdge 
      id={id}
      path={edgePath} 
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={interactionWidth}
      style={{ 
        ...style, 
        stroke: strokeColor,
        opacity: isFiltered ? 0.15 : 1,
        transition: 'opacity 0.2s',
      }} 
    />
  );
}
