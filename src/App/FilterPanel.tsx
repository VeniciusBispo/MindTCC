import { useShallow } from 'zustand/react/shallow';
import { Filter, X } from 'lucide-react';
import useStore from './store';

export default function FilterPanel() {
  const { teams, filters, setFilters, clearFilters } = useStore(
    useShallow((state) => ({
      teams: state.teams,
      filters: state.filters,
      setFilters: state.setFilters,
      clearFilters: state.clearFilters,
    }))
  );

  const { teamId, assignee } = filters;

  // Filtro de equipe selecionada
  const selectedTeam = teams.find((t) => t.id === teamId);

  // Calcula de forma isolada e pura a lista de membros a exibir
  const memberOptions = (() => {
    if (selectedTeam) {
      return selectedTeam.members;
    }
    // Se não há equipe selecionada, une os membros de todas as equipes
    const allMembers = teams.reduce<string[]>((acc, team) => {
      team.members.forEach((m) => {
        if (!acc.includes(m)) acc.push(m);
      });
      return acc;
    }, []);
    return allMembers;
  })();

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    // Quando altera o time de filtro, o responsável é reiniciado para manter consistência
    setFilters({
      teamId: val === '' ? null : val,
      assignee: null,
    });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters({
      assignee: val === '' ? null : val,
    });
  };

  const hasActiveFilters = teamId !== null || assignee !== null;

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <Filter size={14} />
        <span>Foco Visual</span>
      </div>

      <div className="filter-controls">
        <div className="filter-field">
          <label>Equipe</label>
          <select 
            className="filter-select" 
            value={teamId || ''} 
            onChange={handleTeamChange}
          >
            <option value="">Todas</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Membro</label>
          <select 
            className="filter-select" 
            value={assignee || ''} 
            onChange={handleAssigneeChange}
          >
            <option value="">Todos</option>
            {memberOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        
        {hasActiveFilters && (
          <button className="filter-clear-btn" onClick={clearFilters} title="Limpar Filtros">
            <X size={12} />
            <span>Limpar</span>
          </button>
        )}
      </div>
    </div>
  );
}
