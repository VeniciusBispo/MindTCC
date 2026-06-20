import { useShallow } from 'zustand/react/shallow';
import { X, History } from 'lucide-react';
import useStore from './store';

type HistoryPanelProps = {
  onClose: () => void;
};

// Função pura e isolada para formatar data de forma relativa, facilitando testabilidade futura
export const formatRelativeTime = (isoString: string): string => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  
  if (isNaN(diffMs)) return 'Data desconhecida';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 7) return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  
  return date.toLocaleDateString();
};

export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  const { projects, currentProjectId } = useStore(
    useShallow((state) => ({
      projects: state.projects,
      currentProjectId: state.currentProjectId,
    }))
  );

  const activeProject = projects.find((p) => p.id === currentProjectId);
  const activityLog = activeProject?.activityLog || [];

  return (
    <div className="history-drawer-overlay" onClick={onClose}>
      <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="history-drawer-header">
          <div className="history-drawer-title">
            <History size={18} />
            <h2>Histórico de Atividades</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="Fechar Histórico">
            <X size={20} />
          </button>
        </div>

        <div className="history-drawer-body nowheel">
          {activityLog.length === 0 ? (
            <div className="empty-history">
              <p>Nenhuma atividade registrada neste projeto.</p>
            </div>
          ) : (
            <div className="history-timeline">
              {activityLog.map((log) => (
                <div key={log.id} className="history-log-item">
                  <div className="log-marker" />
                  <div className="log-content">
                    <div className="log-header-row">
                      <span className="log-action">{log.action}</span>
                      <span className="log-time">{formatRelativeTime(log.timestamp)}</span>
                    </div>
                    <p className="log-details">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
