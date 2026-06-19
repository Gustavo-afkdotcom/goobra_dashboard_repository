import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface Props {
  onGameCreated: (gameId: string) => void;
}

export default function Lobby({ onGameCreated }: Props) {
  const store = useGameStore();
  const [tab, setTab] = useState<'new' | 'join'>('new');
  const [p1Name, setP1Name] = useState('');
  const [joinId, setJoinId] = useState('');
  const [joinName, setJoinName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [createdP2Id, setCreatedP2Id] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinPid, setJoinPid] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    const pidParam = params.get('pid');
    if (joinParam) { setTab('join'); setJoinId(joinParam); }
    if (pidParam) setJoinPid(pidParam);
  }, []);

  const handleCreate = async () => {
    if (!p1Name.trim()) { setError('Ingresa tu nombre'); return; }
    setLoading(true); setError('');
    try {
      store.connect();
      const { gameId, p1Id, p2Id } = await store.createGame({ p1Name: p1Name.trim() });
      store.joinGame(gameId, p1Name.trim(), p1Id);
      setCreatedGameId(gameId); setCreatedP2Id(p2Id);
    } catch (e: any) {
      setError(e.message ?? 'Error al crear la partida');
    } finally { setLoading(false); }
  };

  const handleJoin = () => {
    if (!joinId.trim() || !joinName.trim()) { setError('Completa todos los campos'); return; }
    store.connect();
    store.joinGame(joinId.trim(), joinName.trim(), joinPid || undefined);
    onGameCreated(joinId.trim());
  };

  const shareUrl = createdGameId && createdP2Id
    ? `${window.location.protocol}//${window.location.host}?join=${createdGameId}&pid=${createdP2Id}`
    : '';

  if (createdGameId) {
    return (
      <div style={styles.overlay}>
        <div style={{ ...styles.card, maxWidth: 420 }}>
          <div style={styles.header}>
            <div style={styles.castle}>🏰</div>
            <h1 style={styles.title}>PARTIDA CREADA</h1>
            <p style={styles.subtitle}>Jugando como <strong style={{ color: '#c9a96e' }}>{p1Name}</strong></p>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center' }}>Comparte este enlace con tu oponente.</div>
            <div style={{ background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', wordBreak: 'break-all', fontSize: 12, color: '#7aaa5e', fontFamily: 'monospace' }}>
              {shareUrl}
            </div>
            <button style={{ ...styles.btn }} onClick={() => navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>
              {copied ? '✓ Copiado!' : '📋 Copiar enlace'}
            </button>
            <button style={{ ...styles.createBtn, marginTop: 4 }} onClick={() => onGameCreated(createdGameId)}>
              ▶ Entrar al tablero
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.castle}>🏰</div>
          <h1 style={styles.title}>CARCASSONNE</h1>
          <p style={styles.subtitle}>Multijugador · Análisis de partidas · Seguimiento ELO</p>
        </div>
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(tab === 'new' ? styles.tabActive : {}) }} onClick={() => setTab('new')}>Nueva partida</button>
          <button style={{ ...styles.tab, ...(tab === 'join' ? styles.tabActive : {}) }} onClick={() => setTab('join')}>Unirse a partida</button>
        </div>
        {tab === 'new' && (
          <div style={styles.form}>
            <label style={styles.label}>TU NOMBRE</label>
            <input style={styles.input} value={p1Name} onChange={e => setP1Name(e.target.value)} placeholder="Jugador 1" maxLength={30} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            {error && <div style={styles.error}>{error}</div>}
            <button style={{ ...styles.createBtn, opacity: loading ? 0.6 : 1 }} onClick={handleCreate} disabled={loading}>
              {loading ? 'Creando...' : '▶ Crear partida'}
            </button>
          </div>
        )}
        {tab === 'join' && (
          <div style={styles.form}>
            <label style={styles.label}>ID DE PARTIDA</label>
            <input style={styles.input} value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <label style={styles.label}>TU NOMBRE</label>
            <input style={styles.input} value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Jugador 2" maxLength={30} autoFocus onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.createBtn} onClick={handleJoin}>Unirse</button>
          </div>
        )}
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #1e1e3a', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[['📊', 'Análisis de cada jugada en tiempo real'], ['📈', 'Seguimiento ELO y estadísticas'], ['🎯', 'Rating de precisión por movimiento'], ['💾', 'Datos guardados entre sesiones']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #0d1a2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' },
  card: { background: '#14142a', border: '1px solid #2a2a4a', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  header: { textAlign: 'center', padding: '28px 24px 16px', borderBottom: '1px solid #1e1e3a' },
  castle: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: 900, letterSpacing: 6, color: '#c9a96e', marginTop: 8 },
  subtitle: { fontSize: 12, color: '#555', marginTop: 6 },
  tabs: { display: 'flex', borderBottom: '1px solid #1e1e3a' },
  tab: { flex: 1, padding: '12px 0', background: 'transparent', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer' },
  tabActive: { color: '#c9a96e', borderBottom: '2px solid #c9a96e' },
  form: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 11, color: '#666', letterSpacing: 1.5, fontWeight: 700 },
  input: { background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, padding: '12px 14px', color: '#eee', fontSize: 16, outline: 'none' },
  error: { background: '#2a1a1a', color: '#ff7043', border: '1px solid #ff4444', borderRadius: 6, padding: '8px 12px', fontSize: 12 },
  createBtn: { background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  btn: { background: '#1e2a3a', color: '#ccc', border: '1px solid #2a3a4a', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' },
};
