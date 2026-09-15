import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Tag, 
  TrendingDown, 
  Trophy, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Flame,
  Bookmark,
  DollarSign
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('deals'); // 'deals' | 'collection'
  const [currency, setCurrency] = useState('BRL'); // 'BRL' | 'USD'
  
  // Estados para Ofertas da CheapShark
  const [searchQuery, setSearchQuery] = useState('');
  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Estados para Colecao Local
  const [collection, setCollection] = useState([]);
  const [stats, setStats] = useState({
    total_games: 0,
    total_saved_usd: 0,
    total_saved_brl: 0,
    usd_brl_rate: 5.14,
    average_savings_percent: 0,
    completed_games: 0,
    wishlist_games: 0,
    backlog_games: 0,
    playing_games: 0
  });
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [collectionSearch, setCollectionSearch] = useState('');

  // Modais e Toasts
  const [addModalItem, setAddModalItem] = useState(null);
  const [editModalItem, setEditModalItem] = useState(null);
  const [toast, setToast] = useState(null);

  // Formulario do Modal de Adicionar (POST)
  const [addForm, setAddForm] = useState({
    status: 'wishlist',
    notes: '',
    user_rating: 0
  });

  // Formulario do Modal de Editar (PUT)
  const [editForm, setEditForm] = useState({
    status: 'wishlist',
    notes: '',
    user_rating: 0
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Funcao utilitaria para formatar preco na moeda selecionada
  const formatMoney = (usdVal, brlVal) => {
    if (currency === 'BRL') {
      const val = brlVal !== undefined && brlVal !== null 
        ? brlVal 
        : (usdVal * (stats.usd_brl_rate || 5.14));
      return `R$ ${val.toFixed(2)}`;
    }
    return `$ ${usdVal.toFixed(2)}`;
  };

  // Carrega ofertas externas (GET /api/external/deals)
  const loadDeals = async (title = '') => {
    setLoadingDeals(true);
    try {
      const url = title.trim() 
        ? `${API_BASE_URL}/api/external/deals?title=${encodeURIComponent(title.trim())}&limit=16`
        : `${API_BASE_URL}/api/external/deals?limit=16`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Nao foi possivel carregar as ofertas da CheapShark.');
      const data = await res.json();
      setDeals(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingDeals(false);
    }
  };

  // Carrega colecao local (GET /api/games)
  const loadCollection = async () => {
    setLoadingCollection(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (collectionSearch.trim()) params.append('search', collectionSearch.trim());
      if (sortBy) params.append('sort_by', sortBy);

      const res = await fetch(`${API_BASE_URL}/api/games?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar sua colecao.');
      const data = await res.json();
      setCollection(data.items);
      setStats(data.stats);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingCollection(false);
    }
  };

  // Execucao inicial
  useEffect(() => {
    loadDeals();
    loadCollection();
  }, []);

  // Recarrega colecao ao alterar filtros ou busca
  useEffect(() => {
    loadCollection();
  }, [statusFilter, sortBy, collectionSearch]);

  // Abertura do Modal de Adicionar Jogo
  const handleOpenAddModal = (deal) => {
    setAddModalItem(deal);
    setAddForm({
      status: 'wishlist',
      notes: '',
      user_rating: 0
    });
  };

  // Executa POST /api/games
  const handleConfirmAdd = async (e) => {
    e.preventDefault();
    if (!addModalItem) return;

    try {
      const payload = {
        title: addModalItem.title,
        deal_id: addModalItem.deal_id,
        store_id: addModalItem.store_id,
        store_name: addModalItem.store_name,
        normal_price: addModalItem.normal_price,
        sale_price: addModalItem.sale_price,
        savings: addModalItem.savings,
        metacritic_score: addModalItem.metacritic_score,
        thumb: addModalItem.thumb,
        status: addForm.status,
        user_rating: parseInt(addForm.user_rating, 10) || 0,
        notes: addForm.notes
      };

      const res = await fetch(`${API_BASE_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 409) {
        throw new Error('Este jogo ja esta cadastrado com esse status na sua colecao.');
      }
      if (!res.ok) throw new Error('Falha ao adicionar o jogo a colecao.');

      showToast(`"${addModalItem.title}" adicionado a colecao! (POST realizado com sucesso)`);
      setAddModalItem(null);
      loadCollection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Abertura do Modal de Edicao (PUT)
  const handleOpenEditModal = (item) => {
    setEditModalItem(item);
    setEditForm({
      status: item.status,
      notes: item.notes || '',
      user_rating: item.user_rating || 0
    });
  };

  // Executa PUT /api/games/{id}
  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    if (!editModalItem) return;

    try {
      const payload = {
        status: editForm.status,
        user_rating: parseInt(editForm.user_rating, 10),
        notes: editForm.notes
      };

      const res = await fetch(`${API_BASE_URL}/api/games/${editModalItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Falha ao atualizar o jogo.');

      showToast(`"${editModalItem.title}" atualizado com sucesso! (PUT executado)`);
      setEditModalItem(null);
      loadCollection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Executa DELETE /api/games/{id}
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Tem certeza que deseja remover "${item.title}" da sua colecao?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${item.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Falha ao remover o jogo da colecao.');

      showToast(`"${item.title}" removido com sucesso! (DELETE executado)`);
      loadCollection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const statusLabel = {
    wishlist: { label: 'Lista de Desejos', className: 'status-wishlist' },
    backlog: { label: 'Backlog (Fila)', className: 'status-backlog' },
    playing: { label: 'Jogando', className: 'status-playing' },
    completed: { label: 'Zerado / Concluido', className: 'status-completed' }
  };

  return (
    <div className="app-container">
      {/* Toast Feedback Visual */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} color="#34d399" /> : <AlertCircle size={20} color="#fb7185" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header & Status */}
      <header className="header-wrapper">
        <div className="brand">
          <div className="brand-icon">
            <Gamepad2 size={28} />
          </div>
          <div>
            <h1 className="brand-title">GameDeals Vault</h1>
            <p className="brand-subtitle">
              Rastreador de Ofertas Digitais & Gerenciador de Backlog Gamer
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Seletor de Moeda */}
          <div className="currency-selector" title="Alternar moeda de visualizacao">
            <button 
              className={`currency-btn ${currency === 'BRL' ? 'active' : ''}`}
              onClick={() => setCurrency('BRL')}
            >
              BRL (R$)
            </button>
            <button 
              className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => setCurrency('USD')}
            >
              USD ($)
            </button>
          </div>

          <div className="status-badge" title="Cotacao oficial via AwesomeAPI">
            <span className="status-dot"></span>
            <span>1 USD = R$ {stats.usd_brl_rate ? stats.usd_brl_rate.toFixed(2) : '5.14'} (AwesomeAPI)</span>
          </div>
        </div>
      </header>

      {/* Metricas Consolidadas da Colecao */}
      <section className="metrics-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-purple">
            <Bookmark size={26} />
          </div>
          <div className="stat-info">
            <h4>Colecao Total</h4>
            <div className="stat-value">{stats.total_games} jogos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <TrendingDown size={26} />
          </div>
          <div className="stat-info">
            <h4>Economia Total</h4>
            <div className="stat-value">
              {currency === 'BRL' 
                ? `R$ ${stats.total_saved_brl.toFixed(2)}` 
                : `$ ${stats.total_saved_usd.toFixed(2)}`}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-gold">
            <Tag size={26} />
          </div>
          <div className="stat-info">
            <h4>Media de Desconto</h4>
            <div className="stat-value">{stats.average_savings_percent.toFixed(1)}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-cyan">
            <Trophy size={26} />
          </div>
          <div className="stat-info">
            <h4>Jogos Zerados</h4>
            <div className="stat-value">{stats.completed_games}</div>
          </div>
        </div>
      </section>

      {/* Navegacao entre Abas */}
      <nav className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
          onClick={() => setActiveTab('deals')}
        >
          <Flame size={18} />
          <span>Explorar Ofertas (CheapShark)</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('collection');
            loadCollection();
          }}
        >
          <Bookmark size={18} />
          <span>Minha Colecao ({stats.total_games})</span>
        </button>
      </nav>

      {/* ABA 1: EXPLORAR OFERTAS DA CHEAPSHARK (GET /api/external/deals) */}
      {activeTab === 'deals' && (
        <main>
          <section className="search-section">
            <form 
              className="search-bar"
              onSubmit={(e) => {
                e.preventDefault();
                loadDeals(searchQuery);
              }}
            >
              <Search size={20} color="#94a3b8" style={{ margin: 'auto 0' }} />
              <input 
                type="text" 
                className="search-input"
                placeholder="Pesquisar jogos em promocao (ex: Batman, Cyberpunk, Witcher, Resident Evil)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={loadingDeals}>
                {loadingDeals ? <div className="spinner" /> : 'Buscar Ofertas'}
              </button>
            </form>

            <div className="search-suggestions">
              <span>Sugestoes rapidas:</span>
              {['Batman', 'The Witcher', 'Cyberpunk 2077', 'Resident Evil', 'Elden Ring', 'Grand Theft Auto'].map((tag) => (
                <span 
                  key={tag} 
                  className="chip-tag"
                  onClick={() => {
                    setSearchQuery(tag);
                    loadDeals(tag);
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {loadingDeals ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto 16px auto', width: 36, height: 36 }} />
              <h3>Buscando promocoes na CheapShark...</h3>
              <p>Consultando lojas digitais parceiras em tempo real com cotacao AwesomeAPI.</p>
            </div>
          ) : deals.length === 0 ? (
            <div className="empty-state">
              <Gamepad2 size={48} color="#8b5cf6" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3>Nenhuma oferta encontrada</h3>
              <p>Tente buscar por outro titulo ou limpe o campo para ver as melhores ofertas globais.</p>
              <button className="btn-primary" onClick={() => { setSearchQuery(''); loadDeals(''); }}>
                Ver Maiores Descontos
              </button>
            </div>
          ) : (
            <div className="deals-grid">
              {deals.map((deal, idx) => (
                <article key={deal.deal_id || idx} className="deal-card">
                  <div className="deal-thumb-container">
                    <img 
                      src={deal.thumb || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80'} 
                      alt={deal.title}
                      className="deal-thumb"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
                      }}
                    />
                    <div className="savings-badge">-{deal.savings}%</div>
                    <div className="store-pill">{deal.store_name}</div>
                  </div>

                  <div className="deal-body">
                    <h3 className="deal-title" title={deal.title}>{deal.title}</h3>
                    
                    <div className="deal-meta">
                      {deal.metacritic_score ? (
                        <span className="metacritic-badge" title="Metacritic Score">
                          MC: {deal.metacritic_score}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Avaliacao nao listada</span>
                      )}
                      {deal.steam_rating_text && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          Steam: {deal.steam_rating_text}
                        </span>
                      )}
                    </div>

                    <div className="deal-pricing">
                      <span className="price-normal">
                        {formatMoney(deal.normal_price, deal.normal_price_brl)}
                      </span>
                      <span className="price-sale">
                        {formatMoney(deal.sale_price, deal.sale_price_brl)}
                      </span>
                    </div>

                    <button 
                      className="btn-card-action"
                      onClick={() => handleOpenAddModal(deal)}
                    >
                      <Plus size={16} />
                      <span>Salvar na Colecao</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ABA 2: MINHA COLECAO & BACKLOG (GET, PUT, DELETE) */}
      {activeTab === 'collection' && (
        <main>
          <div className="filters-bar">
            <div className="filter-group">
              <button 
                className={`filter-btn ${statusFilter === '' ? 'active' : ''}`}
                onClick={() => setStatusFilter('')}
              >
                Todos ({stats.total_games})
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'wishlist' ? 'active' : ''}`}
                onClick={() => setStatusFilter('wishlist')}
              >
                Desejos ({stats.wishlist_games})
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'backlog' ? 'active' : ''}`}
                onClick={() => setStatusFilter('backlog')}
              >
                Backlog ({stats.backlog_games})
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'playing' ? 'active' : ''}`}
                onClick={() => setStatusFilter('playing')}
              >
                Jogando ({stats.playing_games})
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Zerados ({stats.completed_games})
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input 
                type="text"
                placeholder="Filtrar na colecao..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                style={{
                  background: '#0d1322',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Mais Recentes</option>
                <option value="savings">Maior Economia</option>
                <option value="rating">Melhor Avaliacao</option>
                <option value="price">Menor Preco</option>
              </select>
            </div>
          </div>

          {loadingCollection ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
              <h3>Carregando sua colecao...</h3>
            </div>
          ) : collection.length === 0 ? (
            <div className="empty-state">
              <Bookmark size={48} color="#8b5cf6" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3>Sua colecao esta vazia</h3>
              <p>Navegue pela aba "Explorar Ofertas", pesquise seus jogos favoritos e salve-os aqui.</p>
              <button className="btn-primary" onClick={() => setActiveTab('deals')}>
                Explorar Ofertas Agora
              </button>
            </div>
          ) : (
            <div className="deals-grid">
              {collection.map((item) => {
                const badge = statusLabel[item.status] || { label: item.status, className: 'status-wishlist' };
                return (
                  <article key={item.id} className="deal-card">
                    <div className="deal-thumb-container">
                      <img 
                        src={item.thumb || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80'} 
                        alt={item.title}
                        className="deal-thumb"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
                        }}
                      />
                      <div className="savings-badge">-{item.savings}%</div>
                      <div className="store-pill">{item.store_name}</div>
                    </div>

                    <div className="deal-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className={`status-tag ${badge.className}`}>{badge.label}</span>
                        {item.user_rating > 0 && (
                          <div className="star-rating">
                            {[...Array(item.user_rating)].map((_, i) => (
                              <Star key={i} size={14} fill="#fbbf24" stroke="none" />
                            ))}
                          </div>
                        )}
                      </div>

                      <h3 className="deal-title" title={item.title}>{item.title}</h3>

                      {item.notes && (
                        <p style={{ 
                          fontSize: '0.78rem', 
                          color: '#94a3b8', 
                          background: 'rgba(255,255,255,0.03)', 
                          padding: '6px 8px', 
                          borderRadius: '6px',
                          marginBottom: '10px',
                          fontStyle: 'italic',
                          borderLeft: '2px solid var(--primary)'
                        }}>
                          "{item.notes}"
                        </p>
                      )}

                      <div className="deal-pricing">
                        <span className="price-normal">
                          {formatMoney(item.normal_price, item.normal_price_brl)}
                        </span>
                        <span className="price-sale">
                          {formatMoney(item.sale_price, item.sale_price_brl)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: 'auto' }}>
                          Economia: {formatMoney(item.normal_price - item.sale_price, item.savings_brl)}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 'auto' }}>
                        <button 
                          className="btn-card-action"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          <Edit3 size={15} />
                          <span>Editar (PUT)</span>
                        </button>
                        <button 
                          className="btn-danger"
                          title="Excluir da colecao (DELETE)"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* MODAL: ADICIONAR A COLECAO (POST /api/games) */}
      {addModalItem && (
        <div className="modal-overlay" onClick={() => setAddModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Salvar na Colecao (POST)</h3>
              <button className="modal-close" onClick={() => setAddModalItem(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdd}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'center' }}>
                <img 
                  src={addModalItem.thumb} 
                  alt={addModalItem.title} 
                  style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 8 }} 
                />
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'white' }}>{addModalItem.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#34d399' }}>
                    De ${addModalItem.normal_price} (R$ {addModalItem.normal_price_brl}) por <strong>${addModalItem.sale_price} (R$ {addModalItem.sale_price_brl})</strong> (-{addModalItem.savings}%)
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>Status Inicial no Backlog</label>
                <select 
                  className="form-control"
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                >
                  <option value="wishlist">Lista de Desejos (Wishlist)</option>
                  <option value="backlog">Backlog (Fila para Jogar)</option>
                  <option value="playing">Jogando Atualmente</option>
                  <option value="completed">Zerado / Concluido</option>
                </select>
              </div>

              <div className="form-group">
                <label>Avaliacao Inicial (Opcional: 0 a 5 estrelas)</label>
                <select 
                  className="form-control"
                  value={addForm.user_rating}
                  onChange={(e) => setAddForm({ ...addForm, user_rating: e.target.value })}
                >
                  <option value="0">Sem avaliacao</option>
                  <option value="1">1 estrela (Ruim)</option>
                  <option value="2">2 estrelas (Regular)</option>
                  <option value="3">3 estrelas (Bom)</option>
                  <option value="4">4 estrelas (Otimo)</option>
                  <option value="5">5 estrelas (Excelente)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Anotacoes Pessoais</label>
                <textarea 
                  className="form-control"
                  placeholder="Ex: Pegar na promocao da Steam, zerar no fim de semana..."
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setAddModalItem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Confirmar e Salvar (POST)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR JOGO (PUT /api/games/{id}) */}
      {editModalItem && (
        <div className="modal-overlay" onClick={() => setEditModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Atualizar Jogo (PUT)</h3>
              <button className="modal-close" onClick={() => setEditModalItem(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit}>
              <h4 style={{ fontSize: '1.05rem', color: 'white', marginBottom: 16 }}>
                {editModalItem.title}
              </h4>

              <div className="form-group">
                <label>Alterar Status</label>
                <select 
                  className="form-control"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="wishlist">Lista de Desejos (Wishlist)</option>
                  <option value="backlog">Backlog (Fila para Jogar)</option>
                  <option value="playing">Jogando Atualmente</option>
                  <option value="completed">Zerado / Concluido</option>
                </select>
              </div>

              <div className="form-group">
                <label>Avaliacao Pessoal (1 a 5 estrelas)</label>
                <select 
                  className="form-control"
                  value={editForm.user_rating}
                  onChange={(e) => setEditForm({ ...editForm, user_rating: e.target.value })}
                >
                  <option value="0">Sem avaliacao</option>
                  <option value="1">1 estrela (Ruim)</option>
                  <option value="2">2 estrelas (Regular)</option>
                  <option value="3">3 estrelas (Bom)</option>
                  <option value="4">4 estrelas (Otimo)</option>
                  <option value="5">5 estrelas (Excelente)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Anotacoes e Impressoes</label>
                <textarea 
                  className="form-control"
                  placeholder="Ex: Jogo incrivel, mais de 50h de gameplay..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditModalItem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Alteracoes (PUT)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
