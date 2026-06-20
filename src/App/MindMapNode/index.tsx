import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Handle, NodeProps, Position, NodeResizer, NodeToolbar, useReactFlow } from '@xyflow/react';
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import useStore from '../store';
import { type MindMapNode as MindMapNodeType, type NodeShape } from '../types';

function MindMapNode({ id, data, selected, targetPosition = Position.Top, sourcePosition = Position.Bottom }: NodeProps<MindMapNodeType>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('Visitante');
  const inputRef = useRef<HTMLInputElement>(null);

  // Otimização de Performance: Unifica as subscrições do Zustand em um único seletor com useShallow.
  // O nó raiz assina o progresso, mas apenas re-renderiza se o total de tarefas ou concluídas mudar.
  const { 
    updateNodeData, 
    deleteNode, 
    teams, 
    filters, 
    takeSnapshot, 
    addComment, 
    deleteComment,
    addChildNode,
    totalTasks,
    completedTasks
  } = useStore(
    useShallow((state) => {
      const tasks = state.nodes.filter((n) => n.id !== 'root');
      const completed = tasks.filter((n) => n.data.status === 'Concluído').length;
      return {
        updateNodeData: state.updateNodeData,
        deleteNode: state.deleteNode,
        teams: state.teams,
        filters: state.filters,
        takeSnapshot: state.takeSnapshot,
        addComment: state.addComment,
        deleteComment: state.deleteComment,
        addChildNode: state.addChildNode,
        totalTasks: tasks.length,
        completedTasks: completed
      };
    })
  );

  const { getNode } = useReactFlow();

  const selectedTeam = teams.find((t) => t.id === data.teamId);

  // Lista todos os membros de todas as equipes para o seletor de autor de comentários
  const allProjectMembers = teams.reduce<string[]>((acc, team) => {
    team.members.forEach((m) => {
      if (!acc.includes(m)) acc.push(m);
    });
    return acc;
  }, []);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 1);
  }, []);

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.width = `${data.label.length * 8 + 20}px`;
    }
  }, [data.label.length]);

  // Efeito Spotlight: Verifica se o nó atende aos critérios dos filtros ativos
  const isFilteredOut = (() => {
    const { teamId, assignee } = filters;
    if (!teamId && !assignee) return false;
    if (id === 'root') return false;
    if (teamId && data.teamId !== teamId) return true;
    if (assignee && data.assignee !== assignee) return true;
    return false;
  })();

  // Estilização dinâmica baseada no time selecionado e se o nó está selecionado
  const borderStyle = selected
    ? (selectedTeam ? selectedTeam.colorHex : 'var(--accent-color)')
    : (selectedTeam ? selectedTeam.colorHex : 'var(--node-border)');

  const glowStyle = selected
    ? (selectedTeam ? `0 0 20px ${selectedTeam.colorHex}80` : '0 0 20px var(--accent-glow)')
    : (selectedTeam ? `0 0 15px ${selectedTeam.colorHex}40` : 'var(--node-shadow)');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() === '') return;
    addComment(id, commentAuthor, commentText.trim());
    setCommentText('');
  };

  const handleAddChild = () => {
    const parentNode = getNode(id);
    if (!parentNode) return;
    
    // Posiciona o novo nó abaixo do nó pai
    const childPosition = {
      x: (parentNode.measured?.width || 120) + 100,
      y: 0,
    };
    
    addChildNode(parentNode, childPosition);
  };

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const shapeClass = data.shape ? `shape-${data.shape}` : 'shape-arredondado';

  return (
    <>
      <NodeResizer 
        minWidth={120} 
        minHeight={60} 
        isVisible={selected} 
        lineClassName="border-blue-400" 
        handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded"
        onResizeStart={() => {}}
        onResizeEnd={() => {}}
      />
      
      {/* ===== FORMA GEOMÉTRICA PRINCIPAL (100% arrastável) ===== */}
      <div 
        className={`node-container ${shapeClass}`}
        style={{
          borderColor: borderStyle,
          boxShadow: glowStyle,
          opacity: isFilteredOut ? 0.15 : 1,
          pointerEvents: isFilteredOut ? 'none' : 'auto',
        }}
      >
        <div className="node-header">
          <div className="drag-handle" title="Mover Tarefa">
            <GripVertical size={14} />
          </div>
          <div className="inputWrapper">
            <input
              value={data.label}
              onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
              onFocus={takeSnapshot}
              className="input nodrag"
              ref={inputRef}
              placeholder="Nova Tarefa"
            />
          </div>
          
          <div className="node-actions">
            {id === 'root' ? (
              <div className="root-progress-badge nodrag" title="Progresso de Conclusão do TCC" style={{ 
                fontSize: '11px', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap'
              }}>
                {completionPercentage}%
              </div>
            ) : (
              <button className="node-action-btn danger nodrag" onClick={() => deleteNode(id)} title="Deletar Tarefa" style={{ pointerEvents: 'auto' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== BOTÃO ADICIONAR FILHO (Aparece quando selecionado) ===== */}
      {selected && !isFilteredOut && id !== 'root' && (
        <button
          className="add-child-btn nodrag"
          onClick={handleAddChild}
          title="Adicionar Sub-Tarefa (Middle Click em qualquer nó)"
          style={{
            position: 'absolute',
            bottom: '-18px',
            right: '10%',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color)',
            border: '2px solid var(--node-bg)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s ease',
            fontSize: 0,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
        >
          <Plus size={16} />
        </button>
      )}

      {/* ===== HANDLES: Manter na div principal para auto-layout funcionar ===== */}
      <Handle type="target" position={targetPosition} />
      <Handle 
        type="source" 
        position={sourcePosition} 
        isConnectable={!isExpanded} 
        style={isExpanded ? { opacity: 0, pointerEvents: 'none' } : undefined}
      />

      {/* ===== NODE TOOLBAR: Controles complexos (com nodrag/nowheel) ===== */}
      <NodeToolbar position={Position.Right} isVisible={selected && !isFilteredOut}>
        <div className="toolbar-panel nodrag nowheel" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'var(--node-bg)',
          border: `2px solid ${borderStyle}`,
          borderRadius: '8px',
          boxShadow: glowStyle,
          fontSize: '13px',
          minWidth: '200px',
          maxWidth: '280px',
        }}>
          
          {/* Status */}
          {id !== 'root' && (
            <div className="toolbar-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="detail-label" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status</span>
              <select
                className={`detail-select status-select status-${(data.status || 'Pendente').replace(/\s/g, '')} nodrag`}
                value={data.status || 'Pendente'}
                onChange={(e) => updateNodeData(id, { status: e.target.value as any })}
                style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${borderStyle}`, backgroundColor: 'var(--input-bg)' }}
              >
                <option value="Pendente">⏳ Pendente</option>
                <option value="Em Andamento">🚀 Em Andamento</option>
                <option value="Concluído">✅ Concluído</option>
              </select>
            </div>
          )}

          {/* Formato */}
          {id !== 'root' && (
            <div className="toolbar-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="detail-label" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Formato</span>
              <select
                className="detail-select nodrag"
                value={data.shape || 'arredondado'}
                onChange={(e) => updateNodeData(id, { shape: e.target.value as NodeShape })}
                style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${borderStyle}`, backgroundColor: 'var(--input-bg)' }}
              >
                <option value="retangulo">Retângulo</option>
                <option value="arredondado">Arredondado</option>
                <option value="circulo">Círculo</option>
                <option value="losango">Losango</option>
              </select>
            </div>
          )}

          {/* Equipe */}
          {id !== 'root' && (
            <div className="toolbar-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="detail-label" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Equipe</span>
              <select
                className="detail-select nodrag"
                value={data.teamId || ''}
                onChange={(e) => updateNodeData(id, { teamId: e.target.value })}
                style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${borderStyle}`, backgroundColor: 'var(--input-bg)' }}
              >
                <option value="">Nenhuma</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Responsável */}
          {id !== 'root' && (
            <div className="toolbar-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="detail-label" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Responsável</span>
              <select
                className="detail-select nodrag"
                value={data.assignee || ''}
                onChange={(e) => updateNodeData(id, { assignee: e.target.value })}
                disabled={!selectedTeam || selectedTeam.members.length === 0}
                style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${borderStyle}`, backgroundColor: 'var(--input-bg)' }}
              >
                <option value="">Não Atribuído</option>
                {selectedTeam?.members.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Detalhes */}
          {id !== 'root' && (
            <div className="toolbar-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="detail-label" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Detalhes</span>
              <textarea
                className="detail-textarea nodrag nowheel"
                value={data.details || ''}
                onChange={(e) => updateNodeData(id, { details: e.target.value })}
                onFocus={takeSnapshot}
                placeholder="Descreva a tarefa..."
                rows={2}
                style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${borderStyle}`, backgroundColor: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {/* Comentários */}
          {id !== 'root' && (
            <div className="toolbar-row comments-section nodrag">
              <button 
                type="button"
                className="comments-toggle-btn nodrag"
                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'var(--input-bg)',
                  border: `1px solid ${borderStyle}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}
              >
                <span>💬 {data.comments?.length || 0} {data.comments?.length === 1 ? 'comentário' : 'comentários'}</span>
                <span>{isCommentsExpanded ? '▲' : '▼'}</span>
              </button>

              {isCommentsExpanded && (
                <div className="comments-box nodrag" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: 'var(--input-bg)',
                  border: `1px solid ${borderStyle}`,
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {data.comments && data.comments.length > 0 && (
                    <div className="comments-list nowheel" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {data.comments.map((c) => (
                        <div key={c.id} className="comment-item" style={{
                          padding: '6px',
                          backgroundColor: 'var(--node-bg)',
                          border: `1px solid ${borderStyle}20`,
                          borderRadius: '3px',
                          fontSize: '11px'
                        }}>
                          <div className="comment-meta" style={{ display: 'flex', gap: '4px', marginBottom: '4px', fontSize: '10px' }}>
                            <span className="comment-author" style={{ fontWeight: 600, color: borderStyle }}>{c.author}</span>
                            <span className="comment-date" style={{ color: 'var(--text-secondary)' }}>
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button 
                              type="button" 
                              className="comment-delete-btn" 
                              onClick={() => deleteComment(id, c.id)}
                              title="Remover Comentário"
                              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
                            >
                              ×
                            </button>
                          </div>
                          <p className="comment-text" style={{ margin: 0, lineHeight: 1.3, color: 'var(--text-primary)' }}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddComment} className="comment-form" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <select
                      className="comment-author-select nodrag"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      style={{ padding: '4px', borderRadius: '3px', border: `1px solid ${borderStyle}`, backgroundColor: 'var(--node-bg)', fontSize: '11px' }}
                    >
                      <option value="Visitante">Visitante</option>
                      {allProjectMembers.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="comment-input nodrag"
                      placeholder="Adicionar..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      style={{ padding: '4px', borderRadius: '3px', border: `1px solid ${borderStyle}`, backgroundColor: 'var(--node-bg)', fontSize: '11px' }}
                    />
                    <button 
                      type="submit" 
                      className="comment-submit-btn nodrag" 
                      disabled={!commentText.trim()}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '3px',
                        border: 'none',
                        backgroundColor: commentText.trim() ? borderStyle : 'var(--text-secondary)',
                        color: 'white',
                        cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '11px',
                        fontWeight: 500
                      }}
                    >
                      Postar
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </NodeToolbar>
    </>
  );
}

export default MindMapNode;

