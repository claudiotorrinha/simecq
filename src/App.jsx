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

const formatAthleteWithDorsal = (athlete) => {
  if (!athlete) return '';
  const name = athlete.nome || '';
  return athlete.dorsal ? `${name} (${athlete.dorsal})` : name;
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

  const isFemaleEscalao = (esc) => /\bF\b|feminino/i.test(esc);
  const femalePoints = raceData.simecq_results.filter(a => isFemaleEscalao(a.escalao)).reduce((s, a) => s + a.pontos, 0);
  const malePoints = totalPoints - femalePoints;
  const femalePct = totalPoints > 0 ? Math.round((femalePoints / totalPoints) * 100) : 0;
  const malePct = 100 - femalePct;

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
          <div className="item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><TrendingUp size={16} /> Distribuição de Pontos</span>
            <span style={{ fontWeight: 'normal', color: 'var(--muted)', fontSize: '0.9rem' }}>
              (<span style={{ color: '#fb7185' }}>{femalePct}%</span> <span style={{ color: '#3b82f6' }}>{malePct}%</span>)
            </span>
          </div>
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
                      <td>{formatAthleteWithDorsal(imp.athlete)}</td>
                      <td>{shortenEscalaoLabel(imp.athlete.escalao)}</td>
                      <td className="text-success">↑ {imp.improvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeSubTab === 'new' ? (
              <table>
                <thead><tr><th style={colName}>Atleta</th><th style={colEsc}>Escalão</th><th style={colPts}>Status</th></tr></thead>
                <tbody>{newAthletes.map((na, i) => <tr key={i}><td>{formatAthleteWithDorsal(na)}</td><td>{shortenEscalaoLabel(na.escalao)}</td><td className="text-secondary">Estreia</td></tr>)}</tbody> 
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
                                <td>{formatAthleteWithDorsal(athlete)}</td>
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
                  <tbody>{sortedAthletes.map((a, i) => <tr key={i}><td>{renderMedal(a.posicao)}</td><td>{formatAthleteWithDorsal(a)}</td><td>{shortenEscalaoLabel(a.escalao)}</td>{activeSubTab !== 'global' && <td>{a.tempo || '-'}</td>}<td>{a.pontos}</td></tr>)}</tbody>
                </table>
              </>
            )}
          </TableScroll>
        </div>
      </div>
    </>
  );
}

const ClubFilterBar = ({ clubs, getColor, getShort, isSimecqFn, activeClubs, onToggle, hoveredClub, onHover }) => (
  <div className="club-filter-bar">
    {clubs.map((club, idx) => {
      const isSim = isSimecqFn(club.clube);
      const isActive = activeClubs.has(club.clube);
      const color = getColor(club.clube, idx);
      const isHovered = hoveredClub === club.clube;
      return (
        <button
          key={club.clube}
          className={`club-filter-pill${isActive ? ' active' : ''}${isSim ? ' simecq' : ''}${isHovered ? ' hovered' : ''}`}
          style={isActive ? { '--pill-color': color, '--pill-color-dim': color + '33' } : undefined}
          onClick={() => { if (!isSim) onToggle(club.clube); }}
          onMouseEnter={() => onHover(club.clube)}
          onMouseLeave={() => onHover(null)}
          title={club.clube}
        >
          <span className="pill-dot" style={{ background: isActive ? color : undefined }} />
          {getShort(club.clube)}
        </button>
      );
    })}
  </div>
);

function OverallStatsView({ data, renderMedal }) {
  const [classificationView, setClassificationView] = useState('general');
  const [generalSortField, setGeneralSortField] = useState('posicao_escalao');
  const [generalSortAsc, setGeneralSortAsc] = useState(true);
  const [chart1View, setChart1View] = useState('position');
  const [chart2View, setChart2View] = useState('points');
  const [activeClubs, setActiveClubs] = useState(() => {
    const defaultKeywords = ['simecq', 'leião', 'queijas', 'leceia', 'lage'];
    return new Set(
      data.overall_club_rankings
        .filter(c => defaultKeywords.some(kw => c.clube.toLowerCase().includes(kw)))
        .map(c => c.clube)
    );
  });
  const [hoveredClub, setHoveredClub] = useState(null);
  const toggleClub = (name) => setActiveClubs(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  // Renders a permanent value label at the last (rightmost) data point of a line
  const makeEndLabel = (dataLength, color, formatter, dimmed, emphasize = false) => ({ x, y, value, index }) => {
    if (index !== dataLength - 1 || value == null) return null;
    const labelText = formatter(value);
    const fontSize = emphasize ? 12 : 10;
    const labelX = x + 8;
    const labelOpacity = emphasize ? 1 : (dimmed ? 0.15 : 1);
    const textLength = String(labelText).length;
    const labelWidth = emphasize
      ? Math.max(18, textLength * fontSize * 0.45 + 6)
      : 0;

    return (
      <g>
        {emphasize && (
          <rect
            x={labelX - 4}
            y={y - fontSize / 2 - 3}
            width={labelWidth}
            height={fontSize + 6}
            rx={4}
            fill="var(--background)"
            opacity={0.92}
          />
        )}
        <text
          x={labelX}
          y={y}
          fill={color}
          fontSize={fontSize}
          fontWeight={emphasize ? 800 : 700}
          dominantBaseline="middle"
          style={{
            pointerEvents: 'none',
            opacity: labelOpacity,
            paintOrder: emphasize ? 'stroke' : undefined,
            stroke: emphasize ? 'var(--background)' : undefined,
            strokeWidth: emphasize ? 4 : undefined,
          }}
        >
          {labelText}
        </text>
      </g>
    );
  };
  const isMobile = useIsMobile();
  const simMatch = ["sociedade de instrução musical e escolar cruz quebradense (simecq)", "simecq"];
  const simecqClub = data.overall_club_rankings.find((club) => simMatch.some((sm) => club.clube.toLowerCase().includes(sm)));
  const top10Clubs = [...data.overall_club_rankings].sort((a, b) => a.posicao - b.posicao).slice(0, 10);

  const CLUB_PALETTE = ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6', '#ef4444', '#a78bfa'];
  const isSimecq = (name) => simMatch.some(sm => name.toLowerCase().includes(sm));
  const getClubColor = (clubName, index) => isSimecq(clubName) ? '#22c55e' : CLUB_PALETTE[index % CLUB_PALETTE.length];
  const getShortName = (clubName) => {
    if (isSimecq(clubName)) return 'SIMECQ';
    const low = clubName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (low.includes('sporting')) return 'Linda-a-Pastora';
    if (low.includes('tejo')) return 'Run Tejo';
    if (low.includes('valejas') || low.includes('atletico')) return 'Valejas';

    const dash = clubName.match(/[-–]\s*([A-Z]{2,})$/);
    if (dash) return dash[1];
    const paren = clubName.match(/\(([A-Z]{2,})\)/);
    if (paren) return paren[1];
    const words = clubName.replace(/[“”"]/g, '').split(/\s+/)
      .filter(w => w.length > 3 && !/^(de|da|do|dos|das|e|a|o|os|as|em|no|na|1º|2º)$/i.test(w));
    return words.slice(-2).join(' ');
  };

  // Per-race chart data: position and points in each individual race
  const perRaceChartData = data.races.map(race => {
    const entry = { raceName: formatRaceLabel(race.id) };
    top10Clubs.forEach(club => {
      const r = race.club_rankings.find(c => c.clube === club.clube);
      entry[`pos_${club.clube}`] = r?.posicao ?? null;
      entry[`pts_${club.clube}`] = r?.pontos ?? null;
    });
    return entry;
  });

  // Cumulative chart data: running points total + global position after each race
  const runningPts = {};
  const cumulativeChartData = data.races.map(race => {
    race.club_rankings.forEach(c => {
      runningPts[c.clube] = (runningPts[c.clube] || 0) + c.pontos;
    });
    const sorted = Object.entries(runningPts).sort((a, b) => b[1] - a[1]);
    const posMap = Object.fromEntries(sorted.map(([clube], idx) => [clube, idx + 1]));
    const entry = { raceName: formatRaceLabel(race.id) };
    top10Clubs.forEach(club => {
      entry[`cumpts_${club.clube}`] = runningPts[club.clube] || 0;
      entry[`cumpos_${club.clube}`] = posMap[club.clube] || null;
    });
    return entry;
  });

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
        <div className="item-title"><Trophy size={16} /> Top 10 Clubes — Visão Geral</div>
        {simecqClub && (() => {
          const sortedClubs = [...data.overall_club_rankings].sort((a, b) => a.posicao - b.posicao);
          const clubAbove = sortedClubs.find(c => c.posicao === simecqClub.posicao - 1);
          const pointsToClimb = clubAbove ? Math.ceil(clubAbove.pontos - simecqClub.pontos) : null;
          const totalRaces = data.races.length;
          const racesWithSimecq = data.races.filter(r => r.simecq_results.length > 0).length;
          const avgAthletes = (data.races.reduce((s, r) => s + r.simecq_results.length, 0) / racesWithSimecq).toFixed(1);
          const avgPoints = Math.round(data.races.reduce((s, r) => s + r.simecq_results.reduce((ps, a) => ps + a.pontos, 0), 0) / racesWithSimecq);
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
              <div className="simecq-stat-divider" />
              <div className="simecq-stat">
                <span className="simecq-stat-value">{avgAthletes}</span>
                <span className="simecq-stat-label">Média atletas / etapa</span>
              </div>
              <div className="simecq-stat-divider" />
              <div className="simecq-stat">
                <span className="simecq-stat-value">{avgPoints}</span>
                <span className="simecq-stat-label">Média pontos / etapa</span>
              </div>
            </div>
          );
        })()}

        {/* Shared club filter bar */}
        <ClubFilterBar
          clubs={top10Clubs}
          getColor={getClubColor}
          getShort={getShortName}
          isSimecqFn={isSimecq}
          activeClubs={activeClubs}
          onToggle={toggleClub}
          hoveredClub={hoveredClub}
          onHover={setHoveredClub}
        />

        {/* Chart 1 — Per-race results */}
        <div style={{ marginTop: '1.5rem' }}>
          <div className="club-chart-header">
            <span className="club-chart-title">Resultados por Etapa</span>
            <div className="view-toggle">
              <button className={`view-toggle-btn ${chart1View === 'position' ? 'active' : ''}`} onClick={() => setChart1View('position')}>Posição</button>
              <button className={`view-toggle-btn ${chart1View === 'points' ? 'active' : ''}`} onClick={() => setChart1View('points')}>Pontos</button>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px', marginTop: '0.75rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perRaceChartData} margin={{ top: 8, right: 56, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="raceName" stroke="var(--muted)" tick={{ fontSize: isMobile ? 8 : 10 }} />
                <YAxis
                  reversed={chart1View === 'position'}
                  domain={chart1View === 'position' ? [1, 'dataMax'] : [0, 'auto']}
                  stroke="var(--muted)"
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                  width={32}
                  tickFormatter={chart1View === 'position' ? (v) => `${v}º` : undefined}
                />
                <Tooltip
                  contentStyle={tooltipTheme}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value, name) => {
                    const clubName = name.replace(/^(pos|pts)_/, '');
                    return [chart1View === 'position' ? `${value}º` : value, getShortName(clubName)];
                  }}
                  itemSorter={(item) => chart1View === 'position' ? item.value : -item.value}
                />
                {top10Clubs.map((club, idx) => {
                  if (!activeClubs.has(club.clube)) return null;
                  const isSim = isSimecq(club.clube);
                  const dimmed = hoveredClub && hoveredClub !== club.clube;
                  const color = getClubColor(club.clube, idx);
                  const fmt1 = chart1View === 'position' ? v => `${v}º` : v => v;
                  return (
                    <Line
                      key={club.clube}
                      type="monotone"
                      dataKey={chart1View === 'position' ? `pos_${club.clube}` : `pts_${club.clube}`}
                      stroke={color}
                      strokeWidth={isSim ? (hoveredClub === club.clube ? 5 : 3.5) : (hoveredClub === club.clube ? 3 : 1.5)}
                      strokeOpacity={dimmed ? 0.12 : (isSim ? 1 : 0.85)}
                      dot={isSim ? { r: 5, fill: '#22c55e', stroke: 'var(--background)', strokeWidth: 2 } : { r: 3, fillOpacity: dimmed ? 0.1 : 1 }}
                      activeDot={{ r: isSim ? 8 : 6, onMouseEnter: () => setHoveredClub(club.clube), onMouseLeave: () => setHoveredClub(null) }}
                      label={makeEndLabel(perRaceChartData.length, color, fmt1, dimmed, isSim)}
                      name={club.clube}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 — Cumulative evolution */}
        <div style={{ marginTop: '2rem' }}>
          <div className="club-chart-header">
            <span className="club-chart-title">Evolução Acumulada</span>
            <div className="view-toggle">
              <button className={`view-toggle-btn ${chart2View === 'position' ? 'active' : ''}`} onClick={() => setChart2View('position')}>Posição</button>
              <button className={`view-toggle-btn ${chart2View === 'points' ? 'active' : ''}`} onClick={() => setChart2View('points')}>Pontos</button>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px', marginTop: '0.75rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeChartData} margin={{ top: 8, right: 56, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="raceName" stroke="var(--muted)" tick={{ fontSize: isMobile ? 8 : 10 }} />
                <YAxis
                  reversed={chart2View === 'position'}
                  domain={chart2View === 'position' ? [1, 'dataMax'] : [0, 'auto']}
                  stroke="var(--muted)"
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                  width={32}
                  tickFormatter={chart2View === 'position' ? (v) => `${v}º` : undefined}
                />
                <Tooltip
                  contentStyle={tooltipTheme}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value, name) => {
                    const clubName = name.replace(/^(cumpos|cumpts)_/, '');
                    return [chart2View === 'position' ? `${value}º` : value, getShortName(clubName)];
                  }}
                  itemSorter={(item) => chart2View === 'position' ? item.value : -item.value}
                />
                {top10Clubs.map((club, idx) => {
                  if (!activeClubs.has(club.clube)) return null;
                  const isSim = isSimecq(club.clube);
                  const dimmed = hoveredClub && hoveredClub !== club.clube;
                  const color = getClubColor(club.clube, idx);
                  const fmt2 = chart2View === 'position' ? v => `${v}º` : v => v;
                  return (
                    <Line
                      key={club.clube}
                      type="monotone"
                      dataKey={chart2View === 'position' ? `cumpos_${club.clube}` : `cumpts_${club.clube}`}
                      stroke={color}
                      strokeWidth={isSim ? (hoveredClub === club.clube ? 5 : 3.5) : (hoveredClub === club.clube ? 3 : 1.5)}
                      strokeOpacity={dimmed ? 0.12 : (isSim ? 1 : 0.85)}
                      dot={isSim ? { r: 5, fill: '#22c55e', stroke: 'var(--background)', strokeWidth: 2 } : { r: 3, fillOpacity: dimmed ? 0.1 : 1 }}
                      activeDot={{ r: isSim ? 8 : 6, onMouseEnter: () => setHoveredClub(club.clube), onMouseLeave: () => setHoveredClub(null) }}
                      label={makeEndLabel(cumulativeChartData.length, color, fmt2, dimmed, isSim)}
                      name={club.clube}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
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
                    <td>{formatAthleteWithDorsal(athlete)}</td>
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
                          <td>{formatAthleteWithDorsal(a)}</td><td>{a.pontos}</td><td>{a.participacoes}</td>
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
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  const pointsColor = theme === 'dark' ? 'white' : 'black';

  const athletes = [...data.best_athletes].sort((a, b) => a.nome.localeCompare(b.nome));

  const filteredAthletes = athletes.filter(a =>
    a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.escalao.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.dorsal?.toString().includes(searchQuery.trim())
  );

  useEffect(() => {
    if (filteredAthletes.length === 1) {
      setSelectedAthlete(filteredAthletes[0].dorsal);
      return;
    }

    if (selectedAthlete && !filteredAthletes.some(a => a.dorsal === selectedAthlete)) {
      setSelectedAthlete('');
    }
  }, [filteredAthletes, selectedAthlete]);

  const groupedAthletes = filteredAthletes.reduce((acc, a) => {
    if (!acc[a.escalao]) acc[a.escalao] = [];
    acc[a.escalao].push(a);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedAthletes).sort(compareEscalao);

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
            <option value="" disabled>Selecione um atleta...</option>
            {sortedCategories.map(cat => (
              <optgroup key={cat} label={cat}>
                {groupedAthletes[cat].map(a => (
                  <option key={a.dorsal} value={a.dorsal}>
                    {formatAthleteWithDorsal(a)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {!selectedAthlete ? (
        <div className="bento-item animate-fade-up" style={{ gridColumn: 'span 12', textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--surface-strong)', padding: '1.5rem', borderRadius: '50%', border: '1px solid var(--card-border)' }}>
              <User size={48} strokeWidth={1.5} color="var(--muted)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--foreground)' }}>Nenhum atleta selecionado</h3>
            <p style={{ margin: 0, color: 'var(--muted)', maxWidth: '400px', lineHeight: 1.5 }}>
              Pesquise pelo nome ou escalão e selecione um atleta para visualizar as suas estatísticas, evolução e histórico de provas.
            </p>
          </div>
        </div>
      ) : (() => {
        const currentAthlete = data.best_athletes.find(a => a.dorsal === selectedAthlete);
        if (!currentAthlete) return null;

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
        const participationRate = Math.round((participatedHistory.length / data.races.length) * 100);

        return (
          <>
            <div className="bento-item animate-fade-up" style={{ gridColumn: 'span 3' }}>
              <div className="item-title"><Activity size={16} /> Pontos Totais</div>
              <div className="kpi-value">{Math.round(currentAthlete.pontos)}</div>
              <div className="kpi-subtext">Acumulado da época</div>
            </div>

            <div className="bento-item animate-fade-up" style={{ gridColumn: 'span 3' }}>
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

            <div className="bento-item animate-fade-up" style={{ gridColumn: 'span 3' }}>
              <div className="item-title"><Star size={16} /> Melhor Posição</div>
              <div className="kpi-value">{bestPos}º</div>
              <div className="kpi-subtext">Recorde pessoal em prova</div>
            </div>

            <div className="bento-item animate-fade-up" style={{ gridColumn: 'span 3' }}>
              <div className="item-title"><Users size={16} /> Participação</div>
              <div className="kpi-value">{participationRate}%</div>
              <div className="kpi-subtext">{participatedHistory.length} de {data.races.length} provas</div>
            </div>

            <div className="bento-item animate-fade-up" style={{ gridColumn: 'span 12' }}>
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

            <div className="bento-item animate-fade-up" style={{ gridColumn: 'span 12' }}>
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
          </>
        );
      })()}
    </div>
  );
}

export default App;
