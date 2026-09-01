import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  logInOutline, personAddOutline, arrowForwardOutline,
  flashOutline, shieldCheckmarkOutline, analyticsOutline,
  documentTextOutline, cubeOutline, peopleOutline,
  sparklesOutline, checkmarkCircleOutline, trendingUpOutline,
  globeOutline, lockClosedOutline, cloudOutline,
  chevronDownOutline, menuOutline, closeOutline,
} from 'ionicons/icons';
import '../landing.css';

/* ─── Dados ─── */
const FEATURES = [
  {
    icon: flashOutline,
    title: 'Orçamentos Instantâneos',
    desc: 'Gere propostas comerciais em segundos com IA que cruza custos de materiais, margem e tempo de fabricação.',
    color: '#fcd535',
  },
  {
    icon: documentTextOutline,
    title: 'Gestão de Fórmulas',
    desc: 'Crie e calcule fórmulas LaTeX com preview em tempo real. Ideal para cálculos técnicos e industriais.',
    color: '#0ecb81',
  },
  {
    icon: peopleOutline,
    title: 'Cadastro de Clientes',
    desc: 'Gerencie sua base de clientes com busca, filtros e histórico completo de orçamentos e notas fiscais.',
    color: '#3b82f6',
  },
  {
    icon: cubeOutline,
    title: 'Controle de Produtos',
    desc: 'Organize seu catálogo com categorias, preços, estoque e status. Tudo integrado aos orçamentos.',
    color: '#a855f7',
  },
  {
    icon: sparklesOutline,
    title: 'Assistente IA',
    desc: 'Chat inteligente com Google Gemini para análises, sugestões e resumo dos dados do seu negócio.',
    color: '#4285f4',
  },
  {
    icon: shieldCheckmarkOutline,
    title: 'Seguro & Confiável',
    desc: 'Autenticação JWT, sincronização com MongoDB e conformidade com LGPD. Seus dados protegidos.',
    color: '#f6465d',
  },
];

const STATS = [
  { val: '10x', label: 'Mais rápido em orçamentos' },
  { val: '0', label: 'Papel no chão de fábrica' },
  { val: '24/7', label: 'Acesso de qualquer lugar' },
  { val: 'LGPD', label: 'Dados em conformidade' },
];

const STEPS = [
  { num: '01', title: 'Cadastre-se', desc: 'Crie sua conta gratuita em segundos.' },
  { num: '02', title: 'Configure', desc: 'Adicione clientes, produtos e fórmulas.' },
  { num: '03', title: 'Produza', desc: 'Gere orçamentos, calcule preços e emita notas.' },
];

const PROBLEMS = [
  { before: 'Orçamentos levam dias', after: 'Propostas em segundos com IA' },
  { before: 'Papelada no chão de fábrica', after: '100% digital e organizado' },
  { before: 'NF manual e atrasada', after: 'Emissão automática e rastreável' },
  { before: 'Dados espalhados', after: 'Dashboard centralizado em tempo real' },
];

/* ─── Componente ─── */
export default function Landing({ onLogin, onRegister }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">

      {/* ═══ NAVBAR ═══ */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => scrollTo('hero')}>
            <div className="lp-logo-mark">A</div>
            <span>Angler</span>
          </div>
          <div className={`lp-nav-links ${menuOpen ? 'open' : ''}`}>
            <button onClick={() => scrollTo('features')}>Funcionalidades</button>
            <button onClick={() => scrollTo('solution')}>Solução</button>
            <button onClick={() => scrollTo('how')}>Como Funciona</button>
            <button onClick={() => scrollTo('about')}>Sobre</button>
          </div>
          <div className="lp-nav-actions">
            <button className="btn btn-ghost btn-sm" onClick={onLogin}>
              <IonIcon icon={logInOutline} style={{ fontSize: 15 }} /> Entrar
            </button>
            <button className="btn btn-primary btn-sm" onClick={onRegister}>
              Começar Grátis
            </button>
          </div>
          <button className="lp-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <IonIcon icon={menuOpen ? closeOutline : menuOutline} style={{ fontSize: 22 }} />
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-glow g1" />
          <div className="lp-hero-glow g2" />
          <div className="lp-hero-grid" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <IonIcon icon={trendingUpOutline} style={{ fontSize: 13 }} />
            Transformação Digital para Empresas
          </div>
          <h1>
            Chega de orçamentos<br />
            que <span className="lp-highlight">levam dias</span>.
          </h1>
          <p className="lp-hero-sub">
            A Angler é a plataforma de gestão integrada que automatiza orçamentos,
            controla estoque, gerencia clientes e utiliza inteligência artificial
            para gerar propostas comerciais em segundos.
          </p>
          <div className="lp-hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onRegister}>
              Criar Conta Gratuita
              <IonIcon icon={arrowForwardOutline} style={{ fontSize: 18 }} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onLogin}>
              <IonIcon icon={logInOutline} style={{ fontSize: 18 }} /> Já tenho conta
            </button>
          </div>
          <div className="lp-hero-stats">
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat">
                <div className="lp-stat-val">{s.val}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="lp-hero-scroll" onClick={() => scrollTo('features')}>
          <IonIcon icon={chevronDownOutline} />
        </div>
      </section>

      {/* ═══ PROBLEMA → SOLUÇÃO ═══ */}
      <section className="lp-section lp-problem" id="solution">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-tag">O Problema</span>
            <h2>Do caos à <span className="lp-highlight">eficiência</span></h2>
            <p>Empresas ainda perdem dias com processos manuais. A Angler muda isso.</p>
          </div>
          <div className="lp-transform-grid">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="lp-transform-card">
                <div className="lp-transform-before">
                  <span className="lp-transform-label">Antes</span>
                  <p>{p.before}</p>
                </div>
                <div className="lp-transform-arrow">→</div>
                <div className="lp-transform-after">
                  <span className="lp-transform-label">Com Angler</span>
                  <p>{p.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="lp-section lp-features" id="features">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-tag">Funcionalidades</span>
            <h2>Tudo que sua empresa precisa<br />em <span className="lp-highlight">um só lugar</span></h2>
            <p>Módulos integrados de CRUD, IA e automação para transformar sua operação.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                  <IonIcon icon={f.icon} style={{ fontSize: 22 }} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA ═══ */}
      <section className="lp-section lp-how" id="how">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-tag">Como Funciona</span>
            <h2>Três passos para <span className="lp-highlight">começar</span></h2>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TECNOLOGIA ═══ */}
      <section className="lp-section lp-tech">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-tag">Tecnologia</span>
            <h2>Construído com as <span className="lp-highlight">melhores ferramentas</span></h2>
          </div>
          <div className="lp-tech-grid">
            <div className="lp-tech-item">
              <IonIcon icon={globeOutline} style={{ fontSize: 28, color: '#3b82f6' }} />
              <span>React + Ionic</span>
            </div>
            <div className="lp-tech-item">
              <IonIcon icon={cloudOutline} style={{ fontSize: 28, color: '#0ecb81' }} />
              <span>Node.js + Express</span>
            </div>
            <div className="lp-tech-item">
              <IonIcon icon={analyticsOutline} style={{ fontSize: 28, color: '#a855f7' }} />
              <span>MongoDB</span>
            </div>
            <div className="lp-tech-item">
              <IonIcon icon={sparklesOutline} style={{ fontSize: 28, color: '#4285f4' }} />
              <span>Google Gemini AI</span>
            </div>
            <div className="lp-tech-item">
              <IonIcon icon={lockClosedOutline} style={{ fontSize: 28, color: '#fcd535' }} />
              <span>JWT Auth</span>
            </div>
            <div className="lp-tech-item">
              <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: 28, color: '#f6465d' }} />
              <span>LGPD Compliance</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOBRE ═══ */}
      <section className="lp-section lp-about" id="about">
        <div className="lp-container">
          <div className="lp-about-grid">
            <div className="lp-about-text">
              <span className="lp-tag">Sobre o Projeto</span>
              <h2>Angler — <span className="lp-highlight">Sistema de Gestão Empresarial</span></h2>
              <p>
                A Angler nasceu como Trabalho de Conclusão de Curso (TCC) do 3º ano
                do Ensino Médio Integrado ao Técnico em Informática da <strong>FIAP School</strong>,
                com o objetivo de resolver problemas reais de gestão identificados na
                empresa <strong>North Bag</strong>, especializada em embalagens personalizadas.
              </p>
              <p>
                A plataforma automatiza o cálculo de preços, elimina a dependência de
                formulários físicos e integra gestão de clientes, produtos, orçamentos
                e fórmulas em uma única interface moderna e segura.
              </p>
              <div className="lp-about-team">
                <span className="lp-about-team-label">Equipe:</span>
                <span>Guilherme Andrade • Gustavo Naldoni • Leonardo dos Passos • Leonardo Ken • Luiz Nacaratti • Rafael Teodoro</span>
              </div>
            </div>
            <div className="lp-about-visual">
              <div className="lp-about-card">
                <div className="lp-about-card-header">
                  <div className="lp-about-card-logo">A</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Angler</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Gestão Empresarial</div>
                  </div>
                </div>
                <div className="lp-about-card-stats">
                  <div className="lp-about-stat">
                    <div className="lp-about-stat-icon" style={{ background: 'rgba(252,213,53,.12)', color: '#fcd535' }}>
                      <IonIcon icon={peopleOutline} />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>128</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Clientes</div>
                    </div>
                  </div>
                  <div className="lp-about-stat">
                    <div className="lp-about-stat-icon" style={{ background: 'rgba(14,203,129,.12)', color: '#0ecb81' }}>
                      <IonIcon icon={documentTextOutline} />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>R$ 45k</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Receita</div>
                    </div>
                  </div>
                  <div className="lp-about-stat">
                    <div className="lp-about-stat-icon" style={{ background: 'rgba(59,130,246,.12)', color: '#3b82f6' }}>
                      <IonIcon icon={cubeOutline} />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>56</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Produtos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="lp-section lp-cta">
        <div className="lp-container">
          <div className="lp-cta-box">
            <div className="lp-cta-glow" />
            <h2>Pronto para transformar<br />sua <span className="lp-highlight">gestão empresarial</span>?</h2>
            <p>Comece gratuitamente. Sem cartão de crédito.</p>
            <div className="lp-cta-buttons">
              <button className="btn btn-primary btn-lg" onClick={onRegister}>
                Criar Conta Gratuita
                <IonIcon icon={arrowForwardOutline} style={{ fontSize: 18 }} />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={onLogin}>
                <IonIcon icon={logInOutline} style={{ fontSize: 18 }} /> Já tenho conta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <div className="lp-logo">
                <div className="lp-logo-mark">A</div>
                <span>Angler</span>
              </div>
              <p>Sistema de Gestão Empresarial</p>
            </div>
            <div className="lp-footer-links">
              <button onClick={() => scrollTo('features')}>Funcionalidades</button>
              <button onClick={() => scrollTo('solution')}>Solução</button>
              <button onClick={() => scrollTo('how')}>Como Funciona</button>
              <button onClick={() => scrollTo('about')}>Sobre</button>
            </div>
            <div className="lp-footer-copy">
              © 2026 Angler — TCC 3º EMIB FIAP School. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
