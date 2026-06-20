import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import useStore from '../store';
import { type MindMapNode as MindMapNodeType } from '../types';

function MindMapNode({ id, data, selected }: NodeProps<MindMapNodeType>) {
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
        totalTasks: tasks.length,
        completedTasks: completed
      };
    })
  );

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

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      <div 
        className="node-container"
        style={{
          borderColor: borderStyle,
          boxShadow: glowStyle,
          opacity: isFilteredOut ? 0.15 : 1,
          pointerEvents: isFilteredOut ? 'none' : 'auto',
        }}
      >
        <div className="node-header">
          <div className="drag-handle custom-drag-handle" style={{ cursor: 'grab', padding: '0 4px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }} title="Mover Tarefa">
            <GripVertical size={14} />
          </div>
          <div className="inputWrapper">
            <input
              value={data.label}
              onChange={(evt) => updateNodeData(id, { label: evt.target.value })}
              onFocus={takeSnapshot} // Captura o estado original pré-edição no foco
              className="input nodrag"
              ref={inputRef}
              placeholder="Nova Tarefa"
            />
          </div>
          
          <div className="node-actions">
            {id === 'root' ? (
              <div className="root-progress-badge nodrag" title="Progresso de Conclusão do TCC">
                {completionPercentage}%
              </div>
            ) : (
              <button className="node-action-btn danger nodrag" onClick={() => deleteNode(id)} title="Deletar Tarefa">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {isExpanded && id !== 'root' && (
          <div className="node-details">
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <select
                className={`detail-select status-select status-${(data.status || 'Pendente').replace(/\s/g, '')} nodrag`}
                value={data.status || 'Pendente'}
                onChange={(e) => updateNodeData(id, { status: e.target.value as any })}
              >
                <option value="Pendente">⏳ Pendente</option>
                <option value="Em Andamento">🚀 Em Andamento</option>
                <option value="Concluído">✅ Concluído</option>
              </select>
            </div>

            <div className="detail-row">
              <span className="detail-label">Equipe:</span>
              <select
                className="detail-select nodrag"
                value={data.teamId || ''}
                onChange={(e) => updateNodeData(id, { teamId: e.target.value })}
              >
                <option value="">Nenhuma</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Resp:</span>
              <select
                className="detail-select nodrag"
                value={data.assignee || ''}
                onChange={(e) => updateNodeData(id, { assignee: e.target.value })}
                disabled={!selectedTeam || selectedTeam.members.length === 0}
              >
                <option value="">Não Atribuído</option>
                {selectedTeam?.members.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <div className="detail-row" style={{ marginTop: '4px', flexDirection: 'column', alignItems: 'stretch' }}>
              <span className="detail-label" style={{ marginBottom: '4px' }}>Detalhes:</span>
              <textarea
                className="detail-textarea nodrag nowheel"
                value={data.details || ''}
                onChange={(e) => updateNodeData(id, { details: e.target.value })}
                onFocus={takeSnapshot} // Captura o estado original pré-edição no foco
                placeholder="Descreva a tarefa..."
                rows={2}
              />
            </div>

            {/* Seção de Comentários */}
            <div className="comments-section nodrag">
              <button 
                type="button"
                className="comments-toggle-btn nodrag"
                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
              >
                <span>💬 {data.comments?.length || 0} {data.comments?.length === 1 ? 'comentário' : 'comentários'}</span>
                <span>{isCommentsExpanded ? '▲' : '▼'}</span>
              </button>

              {isCommentsExpanded && (
                <div className="comments-box nodrag">
                  {data.comments && data.comments.length > 0 && (
                    <div className="comments-list nowheel">
                      {data.comments.map((c) => (
                        <div key={c.id} className="comment-item">
                          <div className="comment-meta">
                            <span className="comment-author">{c.author}</span>
                            <span className="comment-date">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button 
                              type="button" 
                              className="comment-delete-btn" 
                              onClick={() => deleteComment(id, c.id)}
                              title="Remover Comentário"
                            >
                              ×
                            </button>
                          </div>
                          <p className="comment-text">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddComment} className="comment-form">
                    <div className="comment-form-row">
                      <select
                        className="comment-author-select"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
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
                        className="comment-input"
                        placeholder="Adicionar..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button type="submit" className="comment-submit-btn" disabled={!commentText.trim()}>
                        Postar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        <button className="node-collapse-btn nodrag" onClick={() => setIsExpanded(!isExpanded)} title="Detalhes da Tarefa">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={!isExpanded} 
        style={isExpanded ? { opacity: 0, pointerEvents: 'none' } : undefined}
      />
    </>
  );
}

export default MindMapNode;

