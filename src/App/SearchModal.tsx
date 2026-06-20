import { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Search, CornerDownLeft, Users, Calendar, HelpCircle, CheckSquare, Clock } from 'lucide-react';
import useStore from './store';
import { MindMapNode } from './types';

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
};

export default function SearchModal({ isOpen, onClose, onSelectNode }: SearchModalProps) {
  const { nodes, teams } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      teams: state.teams,
    }))
  );

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Foca no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtra as tarefas indexando múltiplos campos de metadados
  const filteredNodes = isOpen
    ? nodes.filter((node) => {
        // Ignora raiz se não houver busca ativa, mas permite se for buscado
        if (node.id === 'root' && !query) return false;

        const labelMatch = node.data.label.toLowerCase().includes(query.toLowerCase());
        const detailsMatch = (node.data.details || '').toLowerCase().includes(query.toLowerCase());
        const assigneeMatch = (node.data.assignee || '').toLowerCase().includes(query.toLowerCase());
        const statusMatch = (node.data.status || 'Pendente').toLowerCase().includes(query.toLowerCase());

        // Busca pelo nome da equipe
        const team = teams.find((t) => t.id === node.data.teamId);
        const teamMatch = team ? team.name.toLowerCase().includes(query.toLowerCase()) : false;

        return labelMatch || detailsMatch || assigneeMatch || statusMatch || teamMatch;
      })
    : [];

  // Garante que o index selecionado não extrapole os resultados filtrados
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Rola o container para manter o item selecionado visível
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector('.search-result-item.selected') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Escuta teclas de navegação no modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredNodes.length > 0 ? (prev + 1) % filteredNodes.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredNodes.length > 0 ? (prev - 1 + filteredNodes.length) % filteredNodes.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredNodes.length > 0 && filteredNodes[selectedIndex]) {
          handleSelect(filteredNodes[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredNodes, selectedIndex, onClose]);

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-container" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Buscar por tarefa, detalhes, responsável, equipe ou status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="search-shortcut-badge">ESC</div>
        </div>

        <div className="search-results-body nowheel" ref={resultsContainerRef}>
          {filteredNodes.length === 0 ? (
            <div className="search-empty-state">
              <HelpCircle size={32} />
              <p>Nenhuma tarefa encontrada para "{query}"</p>
              <span>Tente buscar por "Concluído", "Back", ou pelo nome do responsável.</span>
            </div>
          ) : (
            <div className="search-results-list">
              {filteredNodes.map((node, index) => {
                const team = teams.find((t) => t.id === node.data.teamId);
                const isSelected = index === selectedIndex;
                const status = node.data.status || (node.id === 'root' ? undefined : 'Pendente');

                return (
                  <div
                    key={node.id}
                    className={`search-result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(node.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="search-result-main">
                      <span className="search-result-title">
                        {node.data.label}
                        {node.id === 'root' && <span className="root-indicator">Raiz</span>}
                      </span>
                      {node.data.details && (
                        <p className="search-result-desc">{node.data.details}</p>
                      )}
                    </div>

                    <div className="search-result-meta">
                      {team && (
                        <span className="result-team-badge" style={{ borderColor: team.colorHex, color: team.colorHex }}>
                          <Users size={10} />
                          {team.name}
                        </span>
                      )}

                      {node.data.assignee && (
                        <span className="result-assignee-badge">
                          {node.data.assignee}
                        </span>
                      )}

                      {status && (
                        <span className={`result-status-badge status-${status.replace(/\s/g, '')}`}>
                          {status === 'Concluído' ? '✅' : status === 'Em Andamento' ? '🚀' : '⏳'} {status}
                        </span>
                      )}

                      {isSelected && (
                        <span className="result-enter-indicator">
                          <CornerDownLeft size={10} />
                          ir para
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="search-footer">
          <div className="footer-keys">
            <span>
              <kbd>↑↓</kbd> Navegar
            </span>
            <span>
              <kbd>↵ Enter</kbd> Selecionar
            </span>
            <span>
              <kbd>ESC</kbd> Fechar
            </span>
          </div>
          <div className="footer-info">
            Busca Global de Equipes & TCC
          </div>
        </div>
      </div>
    </div>
  );
}
