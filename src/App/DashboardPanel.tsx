import { useShallow } from 'zustand/react/shallow';
import { X, BarChart3, Users, CheckSquare, Award } from 'lucide-react';
import useStore from './store';

type DashboardPanelProps = {
  onClose: () => void;
};

export default function DashboardPanel({ onClose }: DashboardPanelProps) {
  const { nodes, teams } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      teams: state.teams,
    }))
  );

  // Filtra as tarefas ignorando o nó raiz principal do TCC
  const tasks = nodes.filter((n) => n.id !== 'root');
  const totalTasks = tasks.length;
  
  // Contagem de tarefas por status
  const pendingTasks = tasks.filter((n) => n.data.status === 'Pendente' || !n.data.status).length;
  const inProgressTasks = tasks.filter((n) => n.data.status === 'Em Andamento').length;
  const completedTasks = tasks.filter((n) => n.data.status === 'Concluído').length;

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Gráfico Circular SVG nativo e responsivo
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.32
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // Estatísticas por Equipe do Projeto
  const teamStats = teams.map((team) => {
    const teamTasks = tasks.filter((n) => n.data.teamId === team.id);
    const total = teamTasks.length;
    const completed = teamTasks.filter((n) => n.data.status === 'Concluído').length;
    const inProgress = teamTasks.filter((n) => n.data.status === 'Em Andamento').length;
    const pending = teamTasks.filter((n) => n.data.status === 'Pendente' || !n.data.status).length;

    return {
      id: team.id,
      name: team.name,
      colorHex: team.colorHex,
      total,
      completed,
      inProgress,
      pending,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // Estatísticas de Carga de Trabalho por Membro cadastrado nas equipes
  const memberStats = teams.reduce<Array<{ name: string; teamName: string; total: number; completed: number; percentage: number }>>((acc, team) => {
    team.members.forEach((member) => {
      const memberTasks = tasks.filter((n) => n.data.teamId === team.id && n.data.assignee === member);
      const total = memberTasks.length;
      const completed = memberTasks.filter((n) => n.data.status === 'Concluído').length;

      acc.push({
        name: member,
        teamName: team.name,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    });
    return acc;
  }, []).sort((a, b) => b.total - a.total); // Ordena por quem tem mais tarefas atribuídas

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <div className="dashboard-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <div className="dashboard-title">
            <BarChart3 size={18} />
            <h2>Dashboard de Progresso</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="Fechar Dashboard">
            <X size={20} />
          </button>
        </div>

        <div className="dashboard-body nowheel">
          {/* Cartão de Progresso Geral Circular */}
          <div className="dashboard-card progress-circle-card">
            <div className="progress-svg-container">
              <svg width="120" height="120" viewBox="0 0 100 100" className="progress-ring">
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  stroke="var(--accent-color)" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                  }}
                />
                <text 
                  x="50" 
                  y="55" 
                  textAnchor="middle" 
                  fill="var(--text-primary)" 
                  fontSize="20" 
                  fontWeight="700"
                  fontFamily="'Inter', sans-serif"
                >
                  {completionPercentage}%
                </text>
              </svg>
            </div>
            <div className="progress-text-info">
              <h3>Progresso Geral</h3>
              <p className="subtitle">Taxa de conclusão do projeto</p>
              <div className="status-grid">
                <div className="grid-item">
                  <span className="count-label">Total</span>
                  <span className="count-number">{totalTasks}</span>
                </div>
                <div className="grid-item text-success">
                  <span className="count-label">Concluídas</span>
                  <span className="count-number">{completedTasks}</span>
                </div>
                <div className="grid-item text-warning">
                  <span className="count-label">Fazendo</span>
                  <span className="count-number">{inProgressTasks}</span>
                </div>
                <div className="grid-item text-muted">
                  <span className="count-label">Pendentes</span>
                  <span className="count-number">{pendingTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progresso por Equipes com Barras Empilhadas */}
          <div className="dashboard-card">
            <h3 className="section-title"><Users size={16} /> Progresso por Equipe</h3>
            {teamStats.length === 0 ? (
              <p className="empty-text">Nenhuma equipe cadastrada no sistema.</p>
            ) : (
              <div className="teams-progress-list">
                {teamStats.map((team) => (
                  <div key={team.id} className="team-progress-row">
                    <div className="team-meta-info">
                      <span className="team-progress-name" style={{ color: team.colorHex }}>
                        {team.name}
                      </span>
                      <span className="team-progress-stats">
                        {team.completed}/{team.total} ({team.percentage}%)
                      </span>
                    </div>

                    <div className="progress-bar-container">
                      {team.total > 0 ? (
                        <>
                          <div 
                            className="bar bar-success" 
                            style={{ 
                              width: `${(team.completed / team.total) * 100}%`,
                              backgroundColor: team.colorHex 
                            }} 
                            title={`${team.completed} Concluídas`}
                          />
                          <div 
                            className="bar bar-warning" 
                            style={{ 
                              width: `${(team.inProgress / team.total) * 100}%`,
                              backgroundColor: `${team.colorHex}80` 
                            }} 
                            title={`${team.inProgress} Em Andamento`}
                          />
                          <div 
                            className="bar bar-pending" 
                            style={{ 
                              width: `${(team.pending / team.total) * 100}%`,
                              backgroundColor: 'rgba(255, 255, 255, 0.08)' 
                            }} 
                            title={`${team.pending} Pendentes`}
                          />
                        </>
                      ) : (
                        <div className="bar bar-empty" style={{ width: '100%' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carga de Trabalho e Aproveitamento por Profissional */}
          <div className="dashboard-card">
            <h3 className="section-title"><Award size={16} /> Carga de Trabalho</h3>
            {memberStats.length === 0 ? (
              <p className="empty-text">Nenhum membro cadastrado nas equipes.</p>
            ) : (
              <div className="members-work-list">
                {memberStats.map((member) => (
                  <div key={`${member.teamName}-${member.name}`} className="member-work-row">
                    <div className="member-name-column">
                      <span className="member-name-text">{member.name}</span>
                      <span className="member-team-text">{member.teamName}</span>
                    </div>
                    
                    <div className="member-stats-column">
                      <div className="member-task-count">
                        <CheckSquare size={12} style={{ opacity: 0.7 }} />
                        <span>{member.total} {member.total === 1 ? 'tarefa' : 'tarefas'}</span>
                      </div>
                      
                      {member.total > 0 ? (
                        <div className="member-progress-pill" style={{
                          backgroundColor: member.percentage === 100 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: member.percentage === 100 ? '#4ade80' : 'var(--text-primary)'
                        }}>
                          {member.percentage}% conc.
                        </div>
                      ) : (
                        <span className="no-tasks-text">Sem tarefas</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
