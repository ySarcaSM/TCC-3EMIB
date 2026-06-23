import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect, useLocation, useHistory } from 'react-router-dom';
import { IonApp, IonIcon, IonSearchbar } from '@ionic/react';
import {
  homeOutline, peopleOutline, cubeOutline, documentTextOutline, flaskOutline, logOutOutline, searchOutline,
} from 'ionicons/icons';
import { loadDB } from './services/db';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Orcamentos from './pages/Orcamentos';
import Formulas from './pages/Formulas';

const NAV_ITEMS = [
  { section: 'Principal' },
  { key: 'dashboard', icon: homeOutline, label: 'Dashboard' },
  { section: 'Gestão' },
  { key: 'clientes', icon: peopleOutline, label: 'Clientes' },
  { key: 'produtos', icon: cubeOutline, label: 'Produtos' },
  { key: 'orcamentos', icon: documentTextOutline, label: 'Orçamentos' },
  { key: 'formulas', icon: flaskOutline, label: 'Fórmulas' },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard',
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
      <div className="sb-header">
        <div className="mark">A</div>
        <span>angler</span>
      </div>
      <nav className="sb-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return <div key={'s' + i} className="sb-section">{item.section}</div>;
          }
          return (
            <div
              key={item.key}
              className={`sb-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => history.push('/' + item.key)}
            >
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
  const title = PAGE_TITLES[currentPage] || 'Dashboard';

  return (
    <div className="topbar">
      <h1>{title}</h1>
      <div className="topbar-right">
        <div className="search-box">
          <IonIcon icon={searchOutline} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--muted)' }} />
          <input type="text" placeholder="Buscar..." />
        </div>
      </div>
    </div>
  );
};

const AppLayout = ({ onLogout }) => {
  return (
    <div className="app-layout">
      <Sidebar onLogout={onLogout} />
      <div className="main-area">
        <Topbar />
        <div className="page-content">
          <Switch>
            <Route exact path="/dashboard" render={(props) => <Dashboard {...props} />} />
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
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => { loadDB(); }, []);

  if (!loggedIn) {
    return (
      <IonApp>
        <Login onLogin={() => setLoggedIn(true)} />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <Router>
        <AppLayout onLogout={() => setLoggedIn(false)} />
      </Router>
    </IonApp>
  );
};

export default App;