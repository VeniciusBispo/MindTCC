import { useState } from 'react';
import { X, Plus, Users, Edit2, Trash2, ArrowLeft, Check } from 'lucide-react';
import { nanoid } from 'nanoid/non-secure';
import { useShallow } from 'zustand/react/shallow';
import useStore from './store';
import { Team } from './types';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

type TeamsModalProps = {
  onClose: () => void;
};

export default function TeamsModal({ onClose }: TeamsModalProps) {
  // Otimização de seletor unificado para o CRUD de equipes
  const { teams, addTeam, updateTeam, deleteTeam } = useStore(
    useShallow((state) => ({
      teams: state.teams,
      addTeam: state.addTeam,
      updateTeam: state.updateTeam,
      deleteTeam: state.deleteTeam,
    }))
  );
  
  // Controle de navegação interna do modal
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // Estados do formulário de equipe
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState(COLORS[6]); // Padrão azul
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');

  // Controle de exclusão segura
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleAddMember = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && memberInput.trim() !== '') {
      e.preventDefault();
      const trimmedMember = memberInput.trim();
      if (!members.includes(trimmedMember)) {
        setMembers([...members, trimmedMember]);
      }
      setMemberInput('');
    }
  };

  const handleRemoveMember = (member: string) => {
    setMembers(members.filter(m => m !== member));
  };

  const handleEditClick = (team: Team) => {
    setEditingTeamId(team.id);
    setName(team.name);
    setColorHex(team.colorHex);
    setMembers(team.members);
    setMemberInput('');
    setConfirmingDeleteId(null);
    setView('form');
  };

  const handleNewTeamClick = () => {
    setEditingTeamId(null);
    setName('');
    setColorHex(COLORS[6]);
    setMembers([]);
    setMemberInput('');
    setConfirmingDeleteId(null);
    setView('form');
  };

  const handleSave = () => {
    if (name.trim() === '') return;
    
    if (editingTeamId) {
      updateTeam(editingTeamId, {
        name: name.trim(),
        colorHex,
        members
      });
    } else {
      const newTeam: Team = {
        id: nanoid(),
        name: name.trim(),
        colorHex,
        members
      };
      addTeam(newTeam);
    }
    
    setView('list');
  };

  const handleDeleteClick = (teamId: string) => {
    setConfirmingDeleteId(teamId);
  };

  const handleConfirmDelete = (teamId: string) => {
    deleteTeam(teamId);
    setConfirmingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <Users size={20} />
            <h2>
              {view === 'list' 
                ? 'Gerenciar Equipes' 
                : (editingTeamId ? 'Editar Equipe' : 'Nova Equipe')}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        {view === 'list' ? (
          <>
            <div className="modal-body">
              {teams.length === 0 ? (
                <div className="empty-teams">
                  <p>Nenhuma equipe cadastrada.</p>
                </div>
              ) : (
                <div className="teams-list">
                  {teams.map((team) => (
                    <div key={team.id} className="team-item">
                      <div className="team-info">
                        <div 
                          className="team-color-indicator" 
                          style={{ backgroundColor: team.colorHex }} 
                        />
                        <div className="team-details-text">
                          <span className="team-name">{team.name}</span>
                          <span className="team-members-count">
                            {team.members.length} {team.members.length === 1 ? 'membro' : 'membros'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="team-item-actions">
                        {confirmingDeleteId === team.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="btn-primary" 
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '11px', 
                                backgroundColor: '#ef4444' 
                              }} 
                              onClick={() => handleConfirmDelete(team.id)}
                            >
                              Excluir
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px' }} 
                              onClick={handleCancelDelete}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              className="icon-btn edit-btn" 
                              onClick={() => handleEditClick(team)} 
                              title="Editar Equipe"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              className="icon-btn delete-btn" 
                              onClick={() => handleDeleteClick(team.id)} 
                              title="Excluir Equipe"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>Fechar</button>
              <button className="btn-primary" onClick={handleNewTeamClick}>
                <Plus size={16} /> Criar Equipe
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome da Equipe</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ex: Equipe de Marketing" 
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Cor de Identificação</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-circle ${colorHex === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColorHex(c)}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Membros (Digite e pressione Enter)</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={memberInput} 
                  onChange={e => setMemberInput(e.target.value)}
                  onKeyDown={handleAddMember}
                  placeholder="Digite um nome e pressione Enter" 
                />
                <div className="chips-container">
                  {members.map(m => (
                    <div key={m} className="chip">
                      <span>{m}</span>
                      <button type="button" onClick={() => handleRemoveMember(m)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setView('list')}>
                <ArrowLeft size={16} /> Voltar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSave} 
                disabled={!name.trim()}
              >
                <Check size={16} /> {editingTeamId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
