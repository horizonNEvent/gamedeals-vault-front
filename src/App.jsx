import React, { useState, useEffect, useMemo } from 'react';
import { 
  Compass, 
  Layers, 
  TrendingDown, 
  Trophy, 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  Star, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

// URL base da API: comunicação direta do navegador com a API na porta 8000 (sem necessidade de rede compartilhada no Docker)
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname
    ? `http://${window.location.hostname}:8000`
    : 'http://localhost:8000'
);

export default function App() {
  const [activeTab, setActiveTab] = useState('deals'); // 'deals' | 'collection'
  const [currency, setCurrency] = useState('BRL'); // 'BRL' | 'USD'
  
  // Ofertas externas CheapShark
  const [searchQuery, setSearchQuery] = useState('');
  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Colecao local
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

  // Formularios
  const [addForm, setAddForm] = useState({
    status: 'wishlist',
    notes: '',
    user_rating: 0
  });

  const [editForm, setEditForm] = useState({
    status: 'wishlist',
    notes: '',
    user_rating: 0
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Conjunto de títulos já adicionados à coleção para feedback visual instantâneo
  const collectionTitles = useMemo(() => {
    return new Set(collection.map((c) => c.title.toLowerCase().trim()));
  }, [collection]);

  // Formatador de preco
  const formatMoney = (usdVal, brlVal) => {
    if (currency === 'BRL') {
      const val = brlVal !== undefined && brlVal !== null 
        ? brlVal 
        : (usdVal * (stats.usd_brl_rate || 5.14));
      return `R$ ${val.toFixed(2).replace('.', ',')}`;
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
      if (!res.ok) throw new Error('Não foi possível carregar as ofertas externas.');
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
      if (!res.ok) throw new Error('Erro ao carregar a coleção.');
      const data = await res.json();
      setCollection(data.items);
      setStats(data.stats);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingCollection(false);
    }
  };

  useEffect(() => {
    loadDeals();
    loadCollection();
  }, []);

  useEffect(() => {
    loadCollection();
  }, [statusFilter, sortBy, collectionSearch]);

  // Modal Adicionar (POST)
  const handleOpenAddModal = (deal) => {
    setAddModalItem(deal);
    setAddForm({
      status: 'wishlist',
      notes: '',
      user_rating: 0
    });
  };

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
        throw new Error('Este jogo já consta na sua coleção.');
      }
      if (!res.ok) throw new Error('Falha ao adicionar à coleção.');

      showToast(`"${addModalItem.title}" salvo na coleção.`);
      setAddModalItem(null);
      loadCollection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Modal Editar (PUT)
  const handleOpenEditModal = (item) => {
    setEditModalItem(item);
    setEditForm({
      status: item.status,
      notes: item.notes || '',
      user_rating: item.user_rating || 0
    });
  };

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

      showToast(`"${editModalItem.title}" atualizado.`);
      setEditModalItem(null);
      loadCollection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Excluir (DELETE)
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Remover "${item.title}" da sua coleção?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${item.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Falha ao remover item.');

      showToast(`"${item.title}" removido.`);
      loadCollection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const statusConfig = {
    wishlist: { label: 'Desejo' },
    backlog: { label: 'Backlog' },
    playing: { label: 'Jogando' },
    completed: { label: 'Zerado' }
  };

  const quickSearches = ['Elden Ring', 'Cyberpunk 2077', 'The Witcher', 'Resident Evil', 'Batman', 'Hollow Knight'];

  return (
    <div className="app-layout">
      {/* Toast Minimalista */}
      {toast && (
        <div className="toast-wrapper">
          <div className={`minimal-toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="toast-icon success" />
            ) : (
              <AlertCircle size={16} className="toast-icon error" />
            )}
            <span className="toast-text">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Barra de Navegacao Superior */}
      <header className="navbar">
        <div className="navbar-content">
          <div className="brand-group">
            <div className="brand-symbol">
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <div className="brand-text">
              <span className="brand-name">GameDeals</span>
            </div>
          </div>

          <div className="navbar-actions">
            <div className="segmented-control" role="group" aria-label="Moeda">
              <button 
                type="button"
                className={`segmented-btn ${currency === 'BRL' ? 'active' : ''}`}
                onClick={() => setCurrency('BRL')}
              >
                BRL (R$)
              </button>
              <button 
                type="button"
                className={`segmented-btn ${currency === 'USD' ? 'active' : ''}`}
                onClick={() => setCurrency('USD')}
              >
                USD ($)
              </button>
            </div>

            <div className="live-rate-pill" title="Cotação comercial oficial em tempo real">
              <span>USD/BRL {stats.usd_brl_rate ? stats.usd_brl_rate.toFixed(2) : '5.14'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-container">
        {/* Abas Estilo Segmented Bar */}
        <div className="tabs-header">
          <div className="tab-pill-group">
            <button 
              type="button"
              className={`tab-pill ${activeTab === 'deals' ? 'active' : ''}`}
              onClick={() => setActiveTab('deals')}
            >
              <Compass size={16} />
              <span>Explorar Ofertas</span>
            </button>
            <button 
              type="button"
              className={`tab-pill ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('collection');
                loadCollection();
              }}
            >
              <Layers size={16} />
              <span>Minha Coleção</span>
              <span className="tab-counter">{stats.total_games}</span>
            </button>
          </div>
        </div>

        {/* ABA: EXPLORAR OFERTAS */}
        {activeTab === 'deals' && (
          <section className="view-section">
            <div className="search-toolbar">
              <form 
                className="search-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  loadDeals(searchQuery);
                }}
              >
                <Search size={17} className="search-icon" />
                <input 
                  type="text" 
                  className="search-field"
                  placeholder="Pesquisar ofertas de PC (Steam, Epic, GOG, Humble)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchQuery('');
                      loadDeals('');
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
                <button type="submit" className="action-button primary" disabled={loadingDeals}>
                  {loadingDeals ? 'Buscando...' : 'Pesquisar'}
                </button>
              </form>

              <div className="quick-tags-row">
                <span className="quick-tags-label">Sugestões:</span>
                <div className="quick-tags-list">
                  {quickSearches.map((tag) => (
                    <button 
                      key={tag} 
                      type="button"
                      className={`tag-chip ${searchQuery === tag ? 'active' : ''}`}
                      onClick={() => {
                        setSearchQuery(tag);
                        loadDeals(tag);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingDeals ? (
              <div className="loading-container">
                <div className="minimal-spinner" />
                <p>Consultando base de ofertas em tempo real...</p>
              </div>
            ) : deals.length === 0 ? (
              <div className="empty-panel">
                <div className="empty-icon-box">
                  <Search size={24} />
                </div>
                <h3>Nenhuma oferta encontrada</h3>
                <p>Tente refinar sua busca ou volte para as maiores ofertas do catálogo global.</p>
                <button 
                  type="button" 
                  className="action-button secondary"
                  onClick={() => { setSearchQuery(''); loadDeals(''); }}
                >
                  Carregar Maiores Descontos
                </button>
              </div>
            ) : (
              <div className="cards-grid">
                {deals.map((deal, idx) => {
                  const isSaved = collectionTitles.has(deal.title.toLowerCase().trim());
                  return (
                    <article key={deal.deal_id || idx} className="game-card">
                      <div className="card-media">
                        <img 
                          src={deal.thumb || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80'} 
                          alt={deal.title}
                          className="media-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
                          }}
                        />
                        <div className="media-overlay">
                          <span className="discount-tag">-{Math.round(deal.savings)}%</span>
                          <span className="store-tag">{deal.store_name}</span>
                        </div>
                      </div>

                      <div className="card-content">
                        <div className="card-header">
                          <h3 className="game-title" title={deal.title}>{deal.title}</h3>
                        </div>

                        <div className="card-indicators">
                          {deal.metacritic_score ? (
                            <span className="meta-pill" title="Pontuação Metacritic">
                              MC {deal.metacritic_score}
                            </span>
                          ) : (
                            <span className="meta-pill muted">Sem review</span>
                          )}
                          {deal.steam_rating_text && (
                            <span className="steam-pill">{deal.steam_rating_text}</span>
                          )}
                        </div>

                        <div className="card-footer">
                          <div className="pricing-stack">
                            <span className="price-struck">
                              {formatMoney(deal.normal_price, deal.normal_price_brl)}
                            </span>
                            <span className="price-final">
                              {formatMoney(deal.sale_price, deal.sale_price_brl)}
                            </span>
                          </div>

                          <button 
                            type="button"
                            className={`card-cta ${isSaved ? 'saved' : ''}`}
                            onClick={() => handleOpenAddModal(deal)}
                          >
                            {isSaved ? (
                              <>
                                <Check size={14} />
                                <span>Salvo</span>
                              </>
                            ) : (
                              <>
                                <Plus size={14} />
                                <span>Coleção</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ABA: MINHA COLECAO */}
        {activeTab === 'collection' && (
          <section className="view-section">
            <div className="filter-toolbar">
              <div className="status-filter-group">
                <button 
                  type="button"
                  className={`filter-tab ${statusFilter === '' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('')}
                >
                  Todos <span className="tab-subcount">{stats.total_games}</span>
                </button>
                <button 
                  type="button"
                  className={`filter-tab ${statusFilter === 'wishlist' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('wishlist')}
                >
                  Desejos <span className="tab-subcount">{stats.wishlist_games}</span>
                </button>
                <button 
                  type="button"
                  className={`filter-tab ${statusFilter === 'backlog' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('backlog')}
                >
                  Backlog <span className="tab-subcount">{stats.backlog_games}</span>
                </button>
                <button 
                  type="button"
                  className={`filter-tab ${statusFilter === 'playing' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('playing')}
                >
                  Jogando <span className="tab-subcount">{stats.playing_games}</span>
                </button>
                <button 
                  type="button"
                  className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                >
                  Zerados <span className="tab-subcount">{stats.completed_games}</span>
                </button>
              </div>

              <div className="collection-controls">
                <div className="mini-search">
                  <Search size={14} className="mini-search-icon" />
                  <input 
                    type="text"
                    placeholder="Filtrar coleção..."
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                  />
                </div>

                <div className="select-wrapper">
                  <select 
                    className="minimal-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="latest">Mais recentes</option>
                    <option value="savings">Maior economia</option>
                    <option value="rating">Melhor avaliação</option>
                    <option value="price">Menor preço</option>
                  </select>
                  <ChevronDown size={14} className="select-arrow" />
                </div>
              </div>
            </div>

            {loadingCollection ? (
              <div className="loading-container">
                <div className="minimal-spinner" />
                <p>Carregando registros da coleção...</p>
              </div>
            ) : collection.length === 0 ? (
              <div className="empty-panel">
                <div className="empty-icon-box">
                  <Layers size={24} />
                </div>
                <h3>Nenhum jogo nesta visualização</h3>
                <p>Navegue pela aba de ofertas para adicionar jogos ao seu backlog ou altere os filtros acima.</p>
                <button 
                  type="button"
                  className="action-button primary" 
                  onClick={() => setActiveTab('deals')}
                >
                  Explorar Ofertas
                </button>
              </div>
            ) : (
              <div className="cards-grid">
                {collection.map((item) => {
                  const conf = statusConfig[item.status] || statusConfig.wishlist;
                  return (
                    <article key={item.id} className="game-card collection-card">
                      <div className="card-media">
                        <img 
                          src={item.thumb || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80'} 
                          alt={item.title}
                          className="media-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
                          }}
                        />
                        <div className="media-overlay">
                          <span className="status-badge-inline">
                            {conf.label}
                          </span>
                          <span className="store-tag">{item.store_name}</span>
                        </div>
                      </div>

                      <div className="card-content">
                        <div className="card-header">
                          <h3 className="game-title" title={item.title}>{item.title}</h3>
                          
                          {item.user_rating > 0 && (
                            <div className="rating-stars" title={`${item.user_rating} de 5 estrelas`}>
                              {[...Array(item.user_rating)].map((_, i) => (
                                <Star key={i} size={13} className="star-filled" />
                              ))}
                            </div>
                          )}
                        </div>

                        {item.notes ? (
                          <p className="item-note">"{item.notes}"</p>
                        ) : (
                          <p className="item-note empty">Sem anotações cadastradas</p>
                        )}

                        <div className="pricing-stack compact">
                          <span className="price-final">
                            {formatMoney(item.sale_price, item.sale_price_brl)}
                          </span>
                          {item.normal_price > item.sale_price && (
                            <span className="savings-diff">
                              Economia: {formatMoney(item.normal_price - item.sale_price, item.savings_brl)}
                            </span>
                          )}
                        </div>

                        <div className="collection-card-actions">
                          <button 
                            type="button"
                            className="btn-text-action"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            <Pencil size={14} />
                            <span>Editar</span>
                          </button>
                          <button 
                            type="button"
                            className="btn-text-danger"
                            title="Remover jogo da coleção"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 size={14} />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* MODAL ADICIONAR (POST) */}
      {addModalItem && (
        <div className="modal-backdrop" onClick={() => setAddModalItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title-group">
                <h3>Adicionar à Coleção</h3>
                <span className="modal-subtitle">Defina o status e suas impressões</span>
              </div>
              <button 
                type="button"
                className="modal-close-btn" 
                onClick={() => setAddModalItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdd} className="modal-form">
              <div className="game-preview-card">
                <img 
                  src={addModalItem.thumb} 
                  alt={addModalItem.title} 
                  className="preview-thumb"
                />
                <div className="preview-info">
                  <h4 className="preview-title">{addModalItem.title}</h4>
                  <div className="preview-pricing">
                    <span className="price-tag-badge">-{Math.round(addModalItem.savings)}%</span>
                    <span className="preview-price">{formatMoney(addModalItem.sale_price, addModalItem.sale_price_brl)}</span>
                    <span className="preview-store">{addModalItem.store_name}</span>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <label className="input-label">Status no Backlog</label>
                <div className="select-wrapper">
                  <select 
                    className="minimal-input"
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                  >
                    <option value="wishlist">Lista de Desejos (Wishlist)</option>
                    <option value="backlog">Fila para Jogar (Backlog)</option>
                    <option value="playing">Jogando Atualmente</option>
                    <option value="completed">Zerado / Concluído</option>
                  </select>
                  <ChevronDown size={14} className="select-arrow" />
                </div>
              </div>

              <div className="form-row">
                <label className="input-label">Avaliação Inicial</label>
                <div className="select-wrapper">
                  <select 
                    className="minimal-input"
                    value={addForm.user_rating}
                    onChange={(e) => setAddForm({ ...addForm, user_rating: e.target.value })}
                  >
                    <option value="0">Sem avaliação definida</option>
                    <option value="5">★★★★★ — 5 estrelas (Excelente)</option>
                    <option value="4">★★★★☆ — 4 estrelas (Muito bom)</option>
                    <option value="3">★★★☆☆ — 3 estrelas (Bom)</option>
                    <option value="2">★★☆☆☆ — 2 estrelas (Regular)</option>
                    <option value="1">★☆☆☆☆ — 1 estrela (Ruim)</option>
                  </select>
                  <ChevronDown size={14} className="select-arrow" />
                </div>
              </div>

              <div className="form-row">
                <label className="input-label">Anotações Pessoais</label>
                <textarea 
                  className="minimal-input textarea"
                  placeholder="Ex: Jogo recomendado pelo amigo, zerar antes do fim do ano..."
                  rows={3}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="action-button secondary" 
                  onClick={() => setAddModalItem(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="action-button primary">
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR (PUT) */}
      {editModalItem && (
        <div className="modal-backdrop" onClick={() => setEditModalItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title-group">
                <h3>Editar Item da Coleção</h3>
                <span className="modal-subtitle">{editModalItem.title}</span>
              </div>
              <button 
                type="button"
                className="modal-close-btn" 
                onClick={() => setEditModalItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit} className="modal-form">
              <div className="form-row">
                <label className="input-label">Alterar Status</label>
                <div className="select-wrapper">
                  <select 
                    className="minimal-input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="wishlist">Lista de Desejos (Wishlist)</option>
                    <option value="backlog">Fila para Jogar (Backlog)</option>
                    <option value="playing">Jogando Atualmente</option>
                    <option value="completed">Zerado / Concluído</option>
                  </select>
                  <ChevronDown size={14} className="select-arrow" />
                </div>
              </div>

              <div className="form-row">
                <label className="input-label">Avaliação Pessoal</label>
                <div className="select-wrapper">
                  <select 
                    className="minimal-input"
                    value={editForm.user_rating}
                    onChange={(e) => setEditForm({ ...editForm, user_rating: e.target.value })}
                  >
                    <option value="0">Sem avaliação definida</option>
                    <option value="5">★★★★★ — 5 estrelas (Excelente)</option>
                    <option value="4">★★★★☆ — 4 estrelas (Muito bom)</option>
                    <option value="3">★★★☆☆ — 3 estrelas (Bom)</option>
                    <option value="2">★★☆☆☆ — 2 estrelas (Regular)</option>
                    <option value="1">★☆☆☆☆ — 1 estrela (Ruim)</option>
                  </select>
                  <ChevronDown size={14} className="select-arrow" />
                </div>
              </div>

              <div className="form-row">
                <label className="input-label">Anotações e Impressões</label>
                <textarea 
                  className="minimal-input textarea"
                  placeholder="Registre suas impressões sobre o gameplay..."
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="action-button secondary" 
                  onClick={() => setEditModalItem(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="action-button primary">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
