import { useEffect, useState } from 'react';
import { Activity, Trophy, TrendingUp, Users, Medal, Star, Hash, User, History, LineChart as LineIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

import fallbackData from './data/dashboard_data.json';
import logoSimecq from './assets/logo_simecq.png';

const COLORS = ['#22c55e', '#15803d', '#86efac', '#4ade80', '#bbf7d0', '#166534', '#6ee7b7', '#d1fae5'];

const getLatestRaceId = (dashboardData) => {
  if (!dashboardData?.races?.length) return '';
  return dashboardData.races[dashboardData.races.length - 1].id;
};

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const formatRaceLabel = (raceId) => {
  const label = raceId
    .replace(/^gp-/i, '')
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

  return `GP ${label}`;
};

const formatEventDate = (value) => {
  if (!value) return 'Data por confirmar';

  const [day, month, year] = value.split('/');
  if (!day || !month || !year) return value;

  const monthLabel = MONTHS_PT[Number(month) - 1];
  if (!monthLabel) return value;

  return `${Number(day)} ${monthLabel} ${year}`;
};

const shortenEscalaoLabel = (value) =>
  value
    .replace(/\s*-\s*Femininos?/gi, ' F')
    .replace(/\s*-\s*Masculinos?/gi, ' M')
    .replace(/\bFemininos?\b/gi, 'F')
    .replace(/\bMasculinos?\b/gi, 'M');

const shortenClubLabel = (value) => {
  if (value === 'SIMECQ') return value;
  return value.length > 28 ? `${value.slice(0, 27)}…` : value;
};

const tooltipTheme = {
  background: 'var(--tooltip-bg)',
  border: '1px solid var(--tooltip-border)',
  borderRadius: '12px',
  boxShadow: 'var(--tooltip-shadow)',
};

const tooltipLabelStyle = {
  color: 'var(--tooltip-label)',
  fontWeight: 600,
};

const tooltipItemStyle = {
  color: 'var(--tooltip-item)',
};

const parseRaceTime = (value) => {
  if (!value) return Number.POSITIVE_INFINITY;

  const [hours = '0', minutes = '0', seconds = '0', milliseconds = '0'] = value
    .replace(/s$/i, '')
    .split(':');

  return (
    Number(hours) * 60 * 60 * 1000 +
    Number(minutes) * 60 * 1000 +
    Number(seconds) * 1000 +
    Number(milliseconds)
  );
};

const getEscalaoAge = (esc) => {
  const e = esc.toLowerCase();
  if (e.includes('sub')) {
    const m = e.match(/sub[ -]?(\d+)/);
    return m ? parseInt(m[1]) : 0;
  }
  if (e.includes('sen') || e.includes('sén')) return 30;
  const m = e.match(/[mfv](et)?\s*-?\s*(\d+)/i);
  if (m) return parseInt(m[2]);
  return 99;
};

const compareEscalao = (a, b) => {
  const ageA = getEscalaoAge(a);
  const ageB = getEscalaoAge(b);
  if (ageA !== ageB) return ageA - ageB;
  return a.localeCompare(b);
};

const useIsMobile = (breakpoint = 600) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
};

const TableScroll = ({ children, className = '' }) => (
  <div className="table-scroll-area">
    <div className={`table-wrapper${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  </div>
);

function App() {
  const data = fallbackData;
  const [activeTab, setActiveTab] = useState('race'); // 'race' | 'overall' | 'athlete'
  const [selectedRaceId, setSelectedRaceId] = useState(() => getLatestRaceId(fallbackData));
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('oeiras-dashboard-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('oeiras-dashboard-theme', theme);
  }, [theme]);

  if (!data || !data.races || data.races.length === 0) {
    return (
      <div className="dashboard-container flex-center" style={{ minHeight: '80vh' }}>
        <p style={{ color: 'var(--muted)' }}>A carregar dados...</p>
      </div>
    );
  }

  const selectedRaceIndex = data.races.findIndex((race) => race.id === selectedRaceId);
  const safeRaceIndex = selectedRaceIndex >= 0 ? selectedRaceIndex : 0;
  const raceData = data.races[safeRaceIndex];
  const previousRaceData = safeRaceIndex > 0 ? data.races[safeRaceIndex - 1] : null;

  const renderMedal = (pos) => {
    if (pos === 1) return <span className="flex-align text-success"><Medal size={16} /> 1º</span>;
    if (pos === 2) return <span className="flex-align" style={{ color: '#cbd5e1' }}><Medal size={16} /> 2º</span>;
    if (pos === 3) return <span className="flex-align" style={{ color: '#b45309' }}><Medal size={16} /> 3º</span>;
    return <span style={{ opacity: 0.5 }}>{pos}º</span>;
  };

  return (
    <div className="dashboard-container">
      <header className="header animate-fade-up">
        <div className="header-toolbar">
          <button
            className="theme-toggle"
            onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        <h1>Troféu Oeiras</h1>
        <p>Dashboard Analítico • SIMECQ</p>
      </header>

      <div className="tabs animate-fade-up">
        <button className={`tab-btn ${activeTab === 'race' ? 'active' : ''}`} onClick={() => setActiveTab('race')}>Vista da Etapa</button>
        <button className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`} onClick={() => setActiveTab('overall')}>Vista Geral</button>
        <button className={`tab-btn ${activeTab === 'athlete' ? 'active' : ''}`} onClick={() => setActiveTab('athlete')}>Vista por Atleta</button>
      </div>

      <div className="animate-fade-up" key={activeTab}>
        {activeTab === 'race' ? (
          <RaceStatsView
            data={data}
            raceData={raceData}
            previousRaceData={previousRaceData}
            selectedRaceId={selectedRaceId}
            setSelectedRaceId={setSelectedRaceId}
            renderMedal={renderMedal}
          />
        ) : activeTab === 'overall' ? (
          <OverallStatsView
            data={data}
            renderMedal={renderMedal}
          />
        ) : (
          <AthleteStatsView
            data={data}
            renderMedal={renderMedal}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}

function RaceStatsView({ data, raceData, previousRaceData, selectedRaceId, setSelectedRaceId, renderMedal }) {
  const [subTab, setSubTab] = useState('global');
  const [classificationView, setClassificationView] = useState('general');
  const [sortField, setSortField] = useState('pontos');
  const [sortAsc, setSortAsc] = useState(false);
  const [improverSortField, setImproverSortField] = useState('improvedBy');
  const [improverSortAsc, setImproverSortAsc] = useState(false);
  const isMobile = useIsMobile();
  const yAxisWidth = isMobile ? 125 : 180;

  const colPos = { width: '12%' };
  const colName = { width: '43%' };
  const colEsc = { width: '20%' };
  const colTime = { width: '12.5%' };
  const colPts = { width: '12.5%' };

  const provasSet = new Set(raceData.simecq_results.map(a => a.prova || "Desconhecida"));
  const provasArray = Array.from(provasSet).sort((a, b) => {
    const matchA = a.match(/\d+/);
    const matchB = b.match(/\d+/);
    if (matchA && matchB) return parseInt(matchA[0]) - parseInt(matchB[0]);
    return a.localeCompare(b);
  });

  const totalPoints = raceData.simecq_results.reduce((acc, curr) => acc + curr.pontos, 0);
  const partCount = raceData.simecq_results.length;

  const simMatch = ["sociedade de instrução musical e escolar cruz quebradense (simecq)", "simecq", "sociedade de instrução musical e escolar cruz quebradense"];
  const sRankThisRaceObj = raceData.club_rankings.find(c => simMatch.some(sm => c.clube.toLowerCase().includes(sm)));
  const sRankThisRace = sRankThisRaceObj ? sRankThisRaceObj.posicao : 'N/A';

  const overallClubObj = data.overall_club_rankings.find(c => simMatch.some(sm => c.clube.toLowerCase().includes(sm)));
  const sGlobalRank = overallClubObj ? overallClubObj.posicao : 'N/A';

  const improvers = [];
  const newAthletes = [];
  if (previousRaceData) {
    raceData.simecq_results.forEach(a => {
      let lastResultPos = null;
      for (let i = data.races.findIndex(r => r.id === selectedRaceId) - 1; i >= 0; i--) {
        const pastResult = data.races[i].simecq_results.find(pa => pa.dorsal === a.dorsal);
        if (pastResult) { lastResultPos = pastResult.posicao; break; }
      }
      if (!lastResultPos) newAthletes.push(a);
      else if (a.posicao < lastResultPos) improvers.push({ athlete: a, improvedBy: lastResultPos - a.posicao });
    });
  }

  const escalaoPoints = {};
  raceData.simecq_results.forEach(a => {
    escalaoPoints[a.escalao] = (escalaoPoints[a.escalao] || 0) + a.pontos;
  });
  const barData = Object.keys(escalaoPoints)
    .map(k => ({ name: k, value: Math.round(escalaoPoints[k] * 10) / 10 }))
    .sort((a, b) => b.value - a.value);

  const availableTabs = new Set(['global', ...provasArray]);
  if (improvers.length > 0) availableTabs.add('improvers');
  if (newAthletes.length > 0) availableTabs.add('new');

  const activeSubTab = availableTabs.has(subTab) ? subTab : 'global';

  let displayAthletes = raceData.simecq_results;
  if (activeSubTab !== 'global' && activeSubTab !== 'improvers' && activeSubTab !== 'new') {
    displayAthletes = raceData.simecq_results.filter(a => (a.prova || "Desconhecida") === activeSubTab);
  }

  const groupedByEscalao = displayAthletes.reduce((groups, athlete) => {
    if (!groups[athlete.escalao]) groups[athlete.escalao] = [];
    groups[athlete.escalao].push(athlete);
    return groups;
  }, {});

  const sortedAthletes = [...displayAthletes].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'tempo') {
      valA = parseRaceTime(valA);
      valB = parseRaceTime(valB);
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return a.posicao - b.posicao;
  });

  const handleSort = (field) => {
    setSortAsc((currentDirection) => (sortField === field ? !currentDirection : field === 'tempo'));
    setSortField(field);
  };

  const sortArrow = (field) => {
    if (sortField !== field) return ' ↕';
    return sortAsc ? ' ↑' : ' ↓';
  };

  const handleImproverSort = (field) => {
    setImproverSortAsc((cur) => (improverSortField === field ? !cur : field !== 'improvedBy'));
    setImproverSortField(field);
  };

  const sortedImprovers = [...improvers].sort((a, b) => {
    if (improverSortField === 'improvedBy') {
      return improverSortAsc ? a.improvedBy - b.improvedBy : b.improvedBy - a.improvedBy;
    }
    if (improverSortField === 'escalao') {
      const cmp = improverSortAsc
        ? compareEscalao(a.athlete.escalao, b.athlete.escalao)
        : compareEscalao(b.athlete.escalao, a.athlete.escalao);
      return cmp !== 0 ? cmp : b.improvedBy - a.improvedBy;
    }
    return 0;
  });

  const improverSortArrow = (field) => {
    if (improverSortField !== field) return ' ↕';
    return improverSortAsc ? ' ↑' : ' ↓';
  };

  return (
    <>
      <div className="flex-center">
        <select className="modern-select" value={selectedRaceId} onChange={e => setSelectedRaceId(e.target.value)}>
          {data.races.map(r => <option key={r.id} value={r.id}>{`${formatRaceLabel(r.id)} • ${formatEventDate(r.event_date)}`}</option>)}
        </select>
      </div>
      <div className="event-meta">
        <span className="event-title">{formatRaceLabel(raceData.id)}</span>
        <span className="event-date">{formatEventDate(raceData.event_date)}</span>
      </div>

      <div className="bento-grid">
        <div className="bento-item" style={{ gridColumn: 'span 4' }}>
          <div className="item-title"><Activity size={16} /> Pontuação Etapa</div>
          <div className="kpi-value">{Math.round(totalPoints)}</div>
          <div className="kpi-subtext">Pontos combinados</div>
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 4' }}>
          <div className="item-title"><Users size={16} /> Atletas</div>
          <div className="kpi-value">{partCount}</div>
          <div className="kpi-subtext">Total em competição</div>
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 4' }}>
          <div className="item-title"><Trophy size={16} /> Rank Clube</div>
          <div className="kpi-value">#{sRankThisRace}</div>
          <div className="kpi-subtext">Geral: #{sGlobalRank}</div>
        </div>

        <div className="bento-item" style={{ gridColumn: 'span 12' }}>
          <div className="item-title"><TrendingUp size={16} /> Distribuição de Pontos</div>
          <div style={{ width: '100%', height: `${Math.max(340, barData.length * 32 + 60)}px`, marginTop: '1rem', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: isMobile ? 4 : 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted)" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={yAxisWidth} stroke="var(--muted)" tick={{ fontSize: 10 }} tickFormatter={shortenEscalaoLabel} />
                <Tooltip
                  contentStyle={tooltipTheme}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value) => [value, 'Pontos']}
                  labelFormatter={shortenEscalaoLabel}
                />
                <Bar dataKey="value" barSize={20} radius={[0, 6, 6, 0]}>
                  {barData.map((e, index) => {
                    const name = e.name.toUpperCase();
                    const isFemale = /\bF\b/.test(name) || name.includes('FEMININO');
                    return (
                      <Cell
                        key={index}
                        fill={isFemale ? '#fb7185' : '#3b82f6'}
                        fillOpacity={0.8}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-item" style={{ gridColumn: 'span 12' }}>
          <div className="sub-tabs">
            <button className={`sub-tab-btn ${activeSubTab === 'global' ? 'active' : ''}`} onClick={() => setSubTab('global')}>Resumo</button>
            {provasArray.map(p => <button key={p} className={`sub-tab-btn ${activeSubTab === p ? 'active' : ''}`} onClick={() => setSubTab(p)}>{p}</button>)}
            {improvers.length > 0 && <button className={`sub-tab-btn ${activeSubTab === 'improvers' ? 'active' : ''}`} onClick={() => setSubTab('improvers')}>Subidas</button>}
            {newAthletes.length > 0 && <button className={`sub-tab-btn ${activeSubTab === 'new' ? 'active' : ''}`} onClick={() => setSubTab('new')}>Estreias</button>}
          </div>

          {activeSubTab !== 'global' && activeSubTab !== 'improvers' && activeSubTab !== 'new' && (
            <div className="view-toggle-row">
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${classificationView === 'general' ? 'active' : ''}`}
                  onClick={() => setClassificationView('general')}
                >
                  Geral
                </button>
                <button
                  className={`view-toggle-btn ${classificationView === 'byEscalao' ? 'active' : ''}`}
                  onClick={() => setClassificationView('byEscalao')}
                >
                  Por Escalão
                </button>
              </div>
            </div>
          )}

          <TableScroll className={activeSubTab !== 'global' && activeSubTab !== 'improvers' && activeSubTab !== 'new' ? 'table-wrapper-separated' : ''}>
            {activeSubTab === 'improvers' ? (
              <table>
                <thead>
                  <tr>
                    <th style={colName}>Atleta</th>
                    <th
                      className="sortable-header"
                      style={colEsc}
                      onClick={() => handleImproverSort('escalao')}
                    >
                      Escalão{improverSortArrow('escalao')}
                    </th>
                    <th
                      className="sortable-header"
                      style={colPts}
                      onClick={() => handleImproverSort('improvedBy')}
                    >
                      Evolução{improverSortArrow('improvedBy')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedImprovers.map((imp, i) => (
                    <tr key={i}>
                      <td>{imp.athlete.nome}</td>
                      <td>{shortenEscalaoLabel(imp.athlete.escalao)}</td>
                      <td className="text-success">↑ {imp.improvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeSubTab === 'new' ? (
              <table>
                <thead><tr><th style={colName}>Atleta</th><th style={colEsc}>Escalão</th><th style={colPts}>Status</th></tr></thead>
                <tbody>{newAthletes.map((na, i) => <tr key={i}><td>{na.nome}</td><td>{shortenEscalaoLabel(na.escalao)}</td><td className="text-secondary">Estreia</td></tr>)}</tbody>
              </table>
            ) : activeSubTab !== 'global' && classificationView === 'byEscalao' ? (
              <div className="classification-stack">
                {Object.keys(groupedByEscalao).sort(compareEscalao).map((escalao) => (
                  <div key={escalao} className="escalao-section">
                    <div className="escalao-heading">{escalao}</div>
                    <TableScroll className="table-wrapper-nested">
                      <table>
                        <thead>
                          <tr>
                            <th style={colPos}>Pos</th>
                            <th style={colName}>Atleta</th>
                            <th style={colTime}>Tempo</th>
                            <th style={colPts}>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...groupedByEscalao[escalao]]
                            .sort((a, b) => a.posicao - b.posicao)
                            .map((athlete, index) => (
                              <tr key={`${athlete.dorsal}-${index}`}>
                                <td>{renderMedal(athlete.posicao)}</td>
                                <td>{athlete.nome}</td>
                                <td>{athlete.tempo || '-'}</td>
                                <td>{athlete.pontos}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </TableScroll>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th style={colPos}>Pos</th><th style={colName}>Atleta</th><th style={colEsc}>Escalão</th>
                      {activeSubTab !== 'global' && <th className="sortable-header" style={colTime} onClick={() => handleSort('tempo')}>Tempo{sortArrow('tempo')}</th>}
                      <th className="sortable-header" style={colPts} onClick={() => handleSort('pontos')}>Pts{sortArrow('pontos')}</th>
                    </tr>
                  </thead>
                  <tbody>{sortedAthletes.map((a, i) => <tr key={i}><td>{renderMedal(a.posicao)}</td><td>{a.nome}</td><td>{shortenEscalaoLabel(a.escalao)}</td>{activeSubTab !== 'global' && <td>{a.tempo || '-'}</td>}<td>{a.pontos}</td></tr>)}</tbody>
                </table>
              </>
            )}
          </TableScroll>
        </div>
      </div>
    </>
  );
}

function OverallStatsView({ data, renderMedal }) {
  const [classificationView, setClassificationView] = useState('general');
  const [generalSortField, setGeneralSortField] = useState('posicao_escalao');
  const [generalSortAsc, setGeneralSortAsc] = useState(true);
  const isMobile = useIsMobile();
  const clubYAxisWidth = isMobile ? 125 : 220;
  const topClubs = [...data.overall_club_rankings].sort((a, b) => a.posicao - b.posicao).slice(0, 10);
  const simMatch = ["sociedade de instrução musical e escolar cruz quebradense (simecq)", "simecq"];
  const simecqClub = data.overall_club_rankings.find((club) => simMatch.some((sm) => club.clube.toLowerCase().includes(sm)));
  const clubBarData = topClubs.map(c => ({
    name: simMatch.some(sm => c.clube.toLowerCase().includes(sm)) ? "SIMECQ" : c.clube,
    fullName: c.clube,
    value: c.pontos,
    isSimecq: simMatch.some(sm => c.clube.toLowerCase().includes(sm))
  }));

  const byEsc = {};
  data.best_athletes.forEach(a => { if (!byEsc[a.escalao]) byEsc[a.escalao] = []; byEsc[a.escalao].push(a); });

  const generalRanking = [...data.best_athletes];

  const sortedGeneralRanking = [...generalRanking].sort((a, b) => {
    if (a[generalSortField] < b[generalSortField]) return generalSortAsc ? -1 : 1;
    if (a[generalSortField] > b[generalSortField]) return generalSortAsc ? 1 : -1;
    return a.posicao_escalao - b.posicao_escalao || b.pontos - a.pontos;
  });

  const colPos = { width: '12%' };
  const colName = { width: '48%' };
  const colPts = { width: '20%' };
  const colPart = { width: '20%' };
  const colEsc = { width: '24%' };

  const handleGeneralSort = (field) => {
    setGeneralSortAsc((currentDirection) => (
      generalSortField === field ? !currentDirection : field === 'posicao_escalao'
    ));
    setGeneralSortField(field);
  };

  const generalSortArrow = (field) => {
    if (generalSortField !== field) return ' ↕';
    return generalSortAsc ? ' ↑' : ' ↓';
  };

  return (
    <div className="bento-grid">
      <div className="bento-item" style={{ gridColumn: 'span 12' }}>
        <div className="item-title"><Trophy size={16} /> Top 10 Clubes Gerais</div>
        {simecqClub && (() => {
          const sortedClubs = [...data.overall_club_rankings].sort((a, b) => a.posicao - b.posicao);
          const clubAbove = sortedClubs.find(c => c.posicao === simecqClub.posicao - 1);
          const pointsToClimb = clubAbove ? Math.ceil(clubAbove.pontos - simecqClub.pontos) + 1 : null;
          return (
            <div className="simecq-stats-bar">
              <div className="simecq-stat">
                <span className="simecq-stat-value">{Math.round(simecqClub.pontos)}</span>
                <span className="simecq-stat-label">Pontos do clube</span>
              </div>
              <div className="simecq-stat-divider" />
              <div className="simecq-stat">
                <span className="simecq-stat-value">#{simecqClub.posicao}</span>
                <span className="simecq-stat-label">Posição atual</span>
              </div>
              <div className="simecq-stat-divider" />
              <div className="simecq-stat">
                <span className="simecq-stat-value simecq-stat-climb">
                  {pointsToClimb !== null ? `+${pointsToClimb}` : '—'}
                </span>
                <span className="simecq-stat-label">Pts p/ subir posição</span>
              </div>
            </div>
          );
        })()}
        <div style={{ width: '100%', height: '340px', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={340}>
            <BarChart data={clubBarData} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: isMobile ? 4 : 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted)" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={clubYAxisWidth} stroke="var(--muted)" tick={{ fontSize: isMobile ? 10 : 11 }} tickFormatter={isMobile ? (v) => shortenClubLabel(v).slice(0, 18) : shortenClubLabel} />
              <Tooltip
                contentStyle={tooltipTheme}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(value) => [value, 'Pontos']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || _}
              />
              <Bar dataKey="value" barSize={24} radius={[0, 6, 6, 0]}>
                {clubBarData.map((e, index) => (
                  <Cell
                    key={index}
                    fill={e.isSimecq ? 'var(--chart-simecq)' : 'var(--primary)'}
                    fillOpacity={e.isSimecq ? 1 : 0.7}
                    stroke={e.isSimecq ? 'var(--chart-simecq-stroke)' : 'transparent'}
                    strokeWidth={e.isSimecq ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bento-item" style={{ gridColumn: 'span 12' }}>
        <div className="item-title"><Hash size={16} /> Classificações</div>
        <div className="view-toggle-row">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${classificationView === 'general' ? 'active' : ''}`}
              onClick={() => setClassificationView('general')}
            >
              Geral
            </button>
            <button
              className={`view-toggle-btn ${classificationView === 'byEscalao' ? 'active' : ''}`}
              onClick={() => setClassificationView('byEscalao')}
            >
              Por Escalão
            </button>
          </div>
        </div>

        {classificationView === 'general' ? (
          <TableScroll>
            <table>
              <thead>
                <tr>
                  <th className="sortable-header" style={colPos} onClick={() => handleGeneralSort('posicao_escalao')}>Pos{generalSortArrow('posicao_escalao')}</th>
                  <th style={colName}>Atleta</th>
                  <th style={colEsc}>Escalão</th>
                  <th className="sortable-header" style={colPts} onClick={() => handleGeneralSort('pontos')}>Pontos{generalSortArrow('pontos')}</th>
                  <th className="sortable-header" style={colPart} onClick={() => handleGeneralSort('participacoes')}>Participações{generalSortArrow('participacoes')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedGeneralRanking.map((athlete) => (
                  <tr key={`${athlete.dorsal}-${athlete.escalao}`} className={athlete.posicao_escalao <= 15 ? 'highlight-row' : ''}>
                    <td>{renderMedal(athlete.posicao_escalao)}</td>
                    <td>{athlete.nome}</td>
                    <td>{shortenEscalaoLabel(athlete.escalao)}</td>
                    <td>{athlete.pontos}</td>
                    <td>{athlete.participacoes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : (
          Object.keys(byEsc).sort(compareEscalao).map(esc => {
            const ats = [...byEsc[esc]].sort((a, b) => a.posicao_escalao - b.posicao_escalao);
            return (
              <div key={esc} className="escalao-section">
                <div className="escalao-heading">{esc}</div>
                <TableScroll>
                  <table>
                    <thead><tr><th style={colPos}>Pos</th><th style={colName}>Atleta</th><th style={colPts}>Pontos</th><th style={colPart}>Participações</th></tr></thead>
                    <tbody>
                      {ats.map((a, i) => (
                        <tr key={i} className={a.posicao_escalao <= 15 ? 'highlight-row' : ''}>
                          <td>{a.posicao_escalao <= 15 && <Star size={10} fill="var(--success)" stroke="none" style={{ marginRight: 4 }} />}{renderMedal(a.posicao_escalao)}</td>
                          <td>{a.nome}</td><td>{a.pontos}</td><td>{a.participacoes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


function AthleteStatsView({ data, renderMedal, theme }) {
  const [selectedAthlete, setSelectedAthlete] = useState(() => {
    // Default to the first athlete in the overall ranking
    return data.best_athletes?.[0]?.dorsal || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  const pointsColor = theme === 'dark' ? 'white' : 'black';

  const athletes = [...data.best_athletes].sort((a, b) => a.nome.localeCompare(b.nome));

  const filteredAthletes = athletes.filter(a =>
    a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.escalao.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (filteredAthletes.length > 0) {
      const current = filteredAthletes.find(a => a.dorsal === selectedAthlete);
      if (!current) {
        setSelectedAthlete(filteredAthletes[0].dorsal);
      }
    }
  }, [filteredAthletes]);

  const groupedAthletes = filteredAthletes.reduce((acc, a) => {
    if (!acc[a.escalao]) acc[a.escalao] = [];
    acc[a.escalao].push(a);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedAthletes).sort(compareEscalao);

  const currentAthlete = data.best_athletes.find(a => a.dorsal === selectedAthlete);

  if (!currentAthlete) return <div className="flex-center" style={{ padding: '2rem' }}>Selecione um atleta.</div>;

  // Extract history
  const history = data.races.map(race => {
    const result = race.simecq_results.find(a => a.dorsal === selectedAthlete);
    return {
      raceId: race.id,
      raceName: formatRaceLabel(race.id),
      posicao: result ? result.posicao : null,
      pontos: result ? result.pontos : 0,
      participou: !!result
    };
  });

  // Filter only races where they participated for the charts
  const participatedHistory = history.filter(h => h.participou);

  // Cumulative points
  let runningTotal = 0;
  const evolutionData = participatedHistory.map(h => {
    runningTotal += h.pontos;
    return {
      ...h,
      acumulado: runningTotal
    };
  });

  const bestPos = Math.min(...participatedHistory.map(h => h.posicao));
  const maxPts = Math.max(...participatedHistory.map(h => h.pontos));
  const participationRate = Math.round((participatedHistory.length / data.races.length) * 100);

  return (
    <div className="bento-grid">
      <div className="bento-item" style={{ gridColumn: 'span 12' }}>
        <div className="flex-center" style={{ marginBottom: '1rem', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
          <div className="search-container" style={{ width: '100%', maxWidth: '300px' }}>
            <input
              type="text"
              className="modern-input"
              placeholder="Pesquisar atleta..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <select
            className="modern-select"
            value={selectedAthlete}
            onChange={e => setSelectedAthlete(e.target.value)}
            style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}
          >
            {sortedCategories.map(cat => (
              <optgroup key={cat} label={cat}>
                {groupedAthletes[cat].map(a => (
                  <option key={a.dorsal} value={a.dorsal}>
                    {a.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="bento-item" style={{ gridColumn: 'span 3' }}>
        <div className="item-title"><Activity size={16} /> Pontos Totais</div>
        <div className="kpi-value">{Math.round(currentAthlete.pontos)}</div>
        <div className="kpi-subtext">Acumulado da época</div>
      </div>

      <div className="bento-item" style={{ gridColumn: 'span 3' }}>
        <div className="item-title"><Trophy size={16} /> Rank Escalão</div>
        <div className="kpi-value">
          {currentAthlete.posicao_escalao === 1 ? (
            <span className="flex-align" style={{ gap: '8px', color: '#fbbf24' }}><Trophy size={28} fill="currentColor" stroke="none" /> 1º</span>
          ) : currentAthlete.posicao_escalao === 9999 ? (
            "N/A"
          ) : (
            `#${currentAthlete.posicao_escalao}`
          )}
        </div>
        <div className="kpi-subtext">
          {currentAthlete.posicao_escalao === 1
            ? `Líder no ${shortenEscalaoLabel(currentAthlete.escalao)}`
            : currentAthlete.posicao_escalao === 9999
              ? "Sem classificação geral"
              : `+${Math.round(currentAthlete.pontos_falta_proximo || 0)} pts p/ subir • Geral no ${shortenEscalaoLabel(currentAthlete.escalao)}`}
        </div>
      </div>

      <div className="bento-item" style={{ gridColumn: 'span 3' }}>
        <div className="item-title"><Star size={16} /> Melhor Posição</div>
        <div className="kpi-value">{bestPos}º</div>
        <div className="kpi-subtext">Recorde pessoal em prova</div>
      </div>

      <div className="bento-item" style={{ gridColumn: 'span 3' }}>
        <div className="item-title"><Users size={16} /> Participação</div>
        <div className="kpi-value">{participationRate}%</div>
        <div className="kpi-subtext">{participatedHistory.length} de {data.races.length} provas</div>
      </div>

      <div className="bento-item" style={{ gridColumn: 'span 12' }}>
        <div className="item-title"><LineIcon size={16} /> Evolução de Posicionamento e Pontos</div>
        <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="raceName" stroke="var(--muted)" tick={{ fontSize: 10 }} />
              <YAxis
                yAxisId="left"
                orientation="left"
                reversed
                domain={[1, 'auto']}
                stroke="var(--success)"
                tick={{ fontSize: 10 }}
                allowDecimals={false}
                label={{ value: 'Posição', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--success)' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={pointsColor}
                tick={{ fontSize: 10 }}
                allowDecimals={false}
                label={{ value: 'Pontos', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: pointsColor } }}
              />
              <Tooltip
                contentStyle={tooltipTheme}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(value, name) => {
                  if (name === 'posicao') return [`${value}º`, 'Posição'];
                  if (name === 'pontos') return [value, 'Pontos'];
                  return [value, name];
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="posicao"
                stroke="var(--success)"
                strokeWidth={3}
                dot={{ r: 6, fill: 'var(--success)', strokeWidth: 2, stroke: 'var(--background)' }}
                activeDot={{ r: 8 }}
                name="Posição"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pontos"
                stroke={pointsColor}
                strokeWidth={3}
                dot={{ r: 6, fill: pointsColor, strokeWidth: 2, stroke: 'var(--background)' }}
                activeDot={{ r: 8 }}
                name="Pontos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bento-item" style={{ gridColumn: 'span 12' }}>
        <div className="item-title"><History size={16} /> Histórico de Provas</div>
        <TableScroll>
          <table>
            <thead>
              <tr>
                <th>Prova</th>
                <th>Posição</th>
                <th>Pontos</th>
                <th>Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {evolutionData.map((h, i) => (
                <tr key={i}>
                  <td>{h.raceName}</td>
                  <td>{renderMedal(h.posicao)}</td>
                  <td>{h.pontos}</td>
                  <td>{h.acumulado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </div>
    </div>
  );
}

export default App;
