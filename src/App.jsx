import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect, useLocation, useHistory } from 'react-router-dom';
import { IonApp, IonIcon } from '@ionic/react';
import {
  homeOutline, peopleOutline, cubeOutline, documentTextOutline, flaskOutline,
  logOutOutline, sparklesOutline,
} from 'ionicons/icons';
import { loadDB } from './services/db';
import { loadFormulasFromServer } from './services/formulaService';
import { api } from './services/api';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Orcamentos from './pages/Orcamentos';
import Formulas from './pages/Formulas';
import AiAssistant from './pages/AiAssistant';

const NAV_ITEMS = [
  { section: 'Principal' },
  { key: 'dashboard', icon: homeOutline, label: 'Dashboard' },
  { key: 'ai', icon: sparklesOutline, label: 'Assistente IA' },
  { section: 'Gestão' },
  { key: 'clientes', icon: peopleOutline, label: 'Clientes' },
  { key: 'produtos', icon: cubeOutline, label: 'Produtos' },
  { key: 'orcamentos', icon: documentTextOutline, label: 'Orçamentos' },
  { key: 'formulas', icon: flaskOutline, label: 'Fórmulas' },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  ai: 'Assistente IA',
  clientes: 'Clientes',
  produtos: 'Produtos',
  orcamentos: 'Orçamentos',
  formulas: 'Fórmulas',
};

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const history = useHistory();
  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  return (
    <div className="sidebar">
      <div className="sb-header"><div className="mark">A</div><span>angler</span></div>
      <nav className="sb-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) return <div key={'s' + i} className="sb-section">{item.section}</div>;
          return (
            <div key={item.key} className={`sb-item ${currentPage === item.key ? 'active' : ''}`} onClick={() => history.push('/' + item.key)}>
              <IonIcon icon={item.icon} style={{ width: 18, height: 18, opacity: currentPage === item.key ? 1 : 0.7 }} />
              {item.label}
            </div>
          );
        })}
      </nav>
      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">AD</div>
          <div className="sb-user-info">
            <div className="sb-user-name">Admin</div>
            <div className="sb-user-role">Administrador</div>
          </div>
          <button className="btn-icon" onClick={onLogout} title="Sair">
            <IonIcon icon={logOutOutline} style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Topbar = () => {
  const location = useLocation();
  const currentPage = location.pathname.replace('/', '') || 'dashboard';
  return (
    <div className="topbar">
      <h1>{PAGE_TITLES[currentPage] || 'Dashboard'}</h1>
    </div>
  );
};

const AppLayout = ({ onLogout, username }) => {
  return (
    <div className="app-layout">
      <Sidebar onLogout={onLogout} />
      <div className="main-area">
        <Topbar />
        <div className="page-content">
          <Switch>
            <Route exact path="/dashboard" component={Dashboard} />
            <Route exact path="/ai" component={AiAssistant} />
            <Route exact path="/clientes" component={Clientes} />
            <Route exact path="/produtos" component={Produtos} />
            <Route exact path="/orcamentos" component={Orcamentos} />
            <Route exact path="/formulas" component={Formulas} />
            <Redirect from="/" to="/dashboard" />
          </Switch>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('angler_token');
    if (token) {
      api.verify()
        .then(async (data) => {
          await Promise.all([loadDB(), loadFormulasFromServer()]);
          setUser(data.username);
        })
        .catch(() => {
          localStorage.removeItem('angler_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (username) => {
    // Limpar dados do localStorage de sessão anterior
    localStorage.removeItem('anglerDB');
    localStorage.removeItem('angler_formulas');
    await Promise.all([loadDB(), loadFormulasFromServer()]);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('angler_token');
    setUser(null);
  };

  if (loading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontSize: 14 }}>
          Carregando...
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <Router>
        <Switch>
          {/* Rotas públicas - login e cadastro */}
          <Route exact path="/login">
            {user ? <Redirect to="/dashboard" /> : <Login mode="login" onLogin={handleLogin} />}
          </Route>
          <Route exact path="/cadastro">
            {user ? <Redirect to="/dashboard" /> : <Login mode="register" onLogin={handleLogin} />}
          </Route>

          {/* Rotas protegidas - precisam estar logado */}
          {user ? (
            <Route path="/">
              <AppLayout onLogout={handleLogout} username={user} />
            </Route>
          ) : (
            <>
              <Route exact path="/">
                <Landing />
              </Route>
              <Redirect to="/" />
            </>
          )}
        </Switch>
      </Router>
    </IonApp>
  );
};

export default App;
