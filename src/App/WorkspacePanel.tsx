import { useState, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDown, Plus, Trash2, Edit2, Check, X, FolderKanban, Upload } from 'lucide-react';
import useStore from './store';

export default function WorkspacePanel() {
  const {
    projects,
    currentProjectId,
    createProject,
    renameProject,
    deleteProject,
    switchProject,
    importProject,
  } = useStore(
    useShallow((state) => ({
      projects: state.projects,
      currentProjectId: state.currentProjectId,
      createProject: state.createProject,
      renameProject: state.renameProject,
      deleteProject: state.deleteProject,
      switchProject: state.switchProject,
      importProject: state.importProject,
    }))
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
        setShowNewInput(false);
        setConfirmDeleteId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  const handleCreate = () => {
    if (newProjectName.trim() === '') return;
    createProject(newProjectName);
    setNewProjectName('');
    setShowNewInput(false);
    setIsOpen(false); // Fecha o dropdown ao criar para focar no novo mapa
  };

  const handleStartEdit = (id: string, currentName: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (editName.trim() === '') return;
    renameProject(id, editName);
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDeleteClick = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    deleteProject(id);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const triggerImportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);

        // Validação do Schema do Workspace
        if (!data || typeof data !== 'object') {
          alert('Arquivo JSON inválido.');
          return;
        }

        if (data.type !== 'tcc-mindmap-workspace' || !data.project || !data.project.nodes || !data.project.edges) {
          alert('Este arquivo não é um backup de workspace compatível.');
          return;
        }

        const projectName = data.project.name || 'Projeto Importado';
        const nodes = data.project.nodes;
        const edges = data.project.edges;
        const importedTeams = data.teams || [];

        importProject(projectName, nodes, edges, importedTeams);

        // Reseta o input e fecha dropdown
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsOpen(false);
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo JSON. Verifique a integridade do arquivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="workspace-panel" ref={containerRef}>
      <button className="workspace-btn" onClick={() => setIsOpen(!isOpen)}>
        <FolderKanban size={16} />
        <span className="workspace-active-name">{activeProject?.name}</span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className="workspace-dropdown-menu">
          <div className="workspace-dropdown-header">Workspaces</div>
          
          <div className="workspace-list">
            {projects.map((p) => {
              const isEditing = editingId === p.id;
              const isConfirmingDelete = confirmDeleteId === p.id;
              const isActive = p.id === currentProjectId;

              return (
                <div 
                  key={p.id} 
                  className={`workspace-item ${isActive ? 'active' : ''}`}
                  onClick={() => !isEditing && !isConfirmingDelete && switchProject(p.id)}
                >
                  {isEditing ? (
                    <div className="workspace-edit-row" onClick={(e) => e.stopPropagation()}>
                      <input
                        className="workspace-edit-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(p.id, e)}
                      />
                      <button className="workspace-action-btn check" onClick={(e) => handleSaveEdit(p.id, e)}>
                        <Check size={12} />
                      </button>
                      <button className="workspace-action-btn cancel" onClick={handleCancelEdit}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="workspace-delete-confirm-row" onClick={(e) => e.stopPropagation()}>
                      <span className="confirm-text">Excluir?</span>
                      <button className="confirm-btn danger" onClick={(e) => handleConfirmDelete(p.id, e)}>Sim</button>
                      <button className="confirm-btn secondary" onClick={handleCancelDelete}>Não</button>
                    </div>
                  ) : (
                    <>
                      <span className="workspace-item-name">{p.name}</span>
                      <div className="workspace-item-actions">
                        <button 
                          className="workspace-item-action-btn edit" 
                          onClick={(e) => handleStartEdit(p.id, p.name, e)}
                          title="Renomear Projeto"
                        >
                          <Edit2 size={12} />
                        </button>
                        {projects.length > 1 && (
                          <button 
                            className="workspace-item-action-btn delete" 
                            onClick={(e) => handleDeleteClick(p.id, e)}
                            title="Excluir Projeto"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="workspace-divider" />

          {showNewInput ? (
            <div className="workspace-new-form" onClick={(e) => e.stopPropagation()}>
              <input
                className="workspace-new-input"
                placeholder="Nome do projeto..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="workspace-new-actions">
                <button className="workspace-btn-small primary" onClick={handleCreate}>Criar</button>
                <button className="workspace-btn-small" onClick={() => setShowNewInput(false)}>Voltar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              <button className="workspace-add-btn" onClick={() => setShowNewInput(true)}>
                <Plus size={14} />
                <span>Novo Workspace</span>
              </button>
              
              <button 
                className="workspace-add-btn" 
                onClick={triggerImportClick} 
                style={{ 
                  borderStyle: 'dashed', 
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
                title="Importar Workspace via JSON"
              >
                <Upload size={14} />
                <span>Importar JSON</span>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleImportFile}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
