import { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';

interface TutorialItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  keys: string[];
}

const TutorialPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const tutorials: TutorialItem[] = [
    {
      title: 'Criar Sub-Tarefa (Botão +)',
      description: 'Selecione um card e clique no botão redondo com "+" que aparece na parte inferior para criar uma nova sub-tarefa.',
      keys: ['Mouse LMB', 'em selecionado'],
      icon: '🖱️',
    },
    {
      title: 'Criar Sub-Tarefa (Middle Click)',
      description: 'Clique com o botão do meio do mouse em qualquer card para criar uma nova sub-tarefa diretamente.',
      keys: ['Botão Central', 'do Mouse'],
      icon: '🖱️',
    },
    {
      title: 'Mover Cards',
      description: 'Clique no ícone de grades (≡) ou em qualquer parte do card para arrastá-lo livremente pelo mapa.',
      keys: ['Mouse LMB', '+ Arrastar'],
      icon: '🖱️',
    },
    {
      title: 'Editar Título',
      description: 'Clique no título do card para editá-lo. Funciona com o painel de edição do lado direito.',
      keys: ['Double Click', 'ou seleção'],
      icon: '⌨️',
    },
    {
      title: 'Deletar Card',
      description: 'Selecione o card e clique no botão de lixeira (🗑️) que aparece no canto superior direito.',
      keys: ['Seleção +', 'Botão Delete'],
      icon: '🗑️',
    },
    {
      title: 'Detalhes e Controles',
      description: 'Selecione um card para abrir o painel de controles (Status, Formato, Equipe, Responsável, Detalhes, Comentários).',
      keys: ['Click no Card', 'à direita'],
      icon: '⚙️',
    },
    {
      title: 'Desfazer/Refazer',
      description: 'Use Ctrl+Z para desfazer e Ctrl+Shift+Z ou Ctrl+Y para refazer suas ações.',
      keys: ['Ctrl+Z', 'ou Ctrl+Y'],
      icon: '↩️',
    },
    {
      title: 'Buscar Tarefas',
      description: 'Pressione Ctrl+K para abrir a barra de busca e encontrar tarefas por título.',
      keys: ['Ctrl+K', 'Buscar'],
      icon: '🔍',
    },
  ];

  return (
    <>
      {/* Botão Flutuante de Ajuda */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="help-button nodrag"
        title="Ver Tutorial"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-color)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.3s ease',
          fontSize: 0,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
        }}
      >
        <HelpCircle size={24} />
      </button>

      {/* Painel de Tutorial */}
      {isOpen && (
        <div
          className="tutorial-panel nodrag nowheel"
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '20px',
            width: '380px',
            maxHeight: '70vh',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid var(--accent-color)',
            borderRadius: '12px',
            padding: '20px',
            zIndex: 998,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            overflowY: 'auto',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              📚 Tutorial
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="nodrag"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tutorials.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
              >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--accent-color)' }}>
                    {item.title}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '6px' }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {item.keys.map((key, k) => (
                    <span
                      key={k}
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 500,
                        color: 'var(--accent-color)',
                      }}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>💡 Dica:</strong> Você pode combinar múltiplas ações para um fluxo de trabalho mais eficiente!
          </div>
        </div>
      )}
    </>
  );
};

export default TutorialPanel;
