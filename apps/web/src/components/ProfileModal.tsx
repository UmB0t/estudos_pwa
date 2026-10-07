import React, { useState, useRef } from 'react';
import { useProgression } from '../context/ProgressionContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentProfile,
    profiles,
    switchProfile,
    createProfile,
    deleteProfile,
    exportData,
    importData,
  } = useProgression();

  const [newProfileName, setNewProfileName] = useState('');
  const [activeTab, setActiveTab] = useState<'profiles' | 'backup'>('profiles');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      setIsProcessing(true);
      await createProfile(newProfileName.trim());
      setNewProfileName('');
      setFeedback({ type: 'success', message: 'Novo perfil criado e selecionado com sucesso!' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao criar perfil.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o perfil "${name}" e todo seu histórico?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      await deleteProfile(id);
      setFeedback({ type: 'success', message: `Perfil "${name}" excluído.` });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao excluir perfil.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `sql-lab-progresso-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'Arquivo JSON de progresso exportado com sucesso!' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao exportar dados.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await file.text();
      const res = await importData(text);
      setFeedback({
        type: 'success',
        message: `Importação realizada com sucesso! (${res.profilesCount} perfis e ${res.progressCount} registros processados)`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro na validação do arquivo importado.',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Gerenciamento de Perfis &amp; Dados</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'profiles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profiles');
              setFeedback(null);
            }}
          >
            👤 Perfis Locais
          </button>
          <button
            className={`modal-tab ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('backup');
              setFeedback(null);
            }}
          >
            💾 Backup &amp; Sincronização (JSON)
          </button>
        </div>

        <div className="modal-body">
          {feedback && (
            <div className={`modal-alert ${feedback.type}`}>
              {feedback.type === 'success' ? '✅' : '⚠️'} {feedback.message}
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="profiles-tab-content">
              <p className="tab-description">
                Alterne entre perfis ou crie um novo para separar seus estudos, anotações e progresso.
              </p>

              <div className="profile-list">
                {profiles.map((p) => {
                  const isActive = p.id === currentProfile?.id;
                  return (
                    <div key={p.id} className={`profile-item ${isActive ? 'active' : ''}`}>
                      <div className="profile-info">
                        <span className="profile-name">
                          {p.name} {isActive && <span className="active-tag">Ativo</span>}
                        </span>
                        <span className="profile-date">
                          Criado em: {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="profile-actions">
                        {!isActive && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => switchProfile(p.id)}
                            disabled={isProcessing}
                          >
                            Ativar
                          </button>
                        )}
                        {profiles.length > 1 && (
                          <button
                            className="btn btn-outline btn-sm btn-danger"
                            onClick={() => handleDeleteProfile(p.id, p.name)}
                            disabled={isProcessing}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleCreateProfile} className="create-profile-form">
                <input
                  type="text"
                  placeholder="Nome do novo perfil (ex: Revisão Prova)"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  disabled={isProcessing}
                  className="input-text"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isProcessing || !newProfileName.trim()}
                >
                  Criar Perfil
                </button>
              </form>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="backup-tab-content">
              <p className="tab-description">
                Exporte todo o seu progresso local em formato JSON seguro para transferir entre máquinas ou restaurar backups.
              </p>

              <div className="backup-section">
                <h4>Exportar Dados</h4>
                <p className="backup-help">
                  Baixe um arquivo contendo todos os perfis, tentativas e exercícios resolvidos.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleExport}
                  disabled={isProcessing}
                >
                  ⬇️ Baixar Backup JSON
                </button>
              </div>

              <div className="backup-divider" />

              <div className="backup-section">
                <h4>Importar &amp; Mesclar Dados</h4>
                <p className="backup-help">
                  Selecione um arquivo de backup previamente exportado. O sistema validará o schema e mesclará as tentativas preservando status de conclusão.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  ⬆️ Selecionar Arquivo JSON para Importar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
