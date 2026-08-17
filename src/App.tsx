import { useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import Papa from 'papaparse'
import {
  Activity, ArrowRight, Check, ChevronDown, CircleDollarSign,
  Database, Download, FileSpreadsheet, FlaskConical, Gauge,
  GitBranch, Info, LayoutDashboard, Lightbulb, Menu, MessageSquareText,
  MoreHorizontal, Plus, Search, Send, ShieldCheck, Sparkles, Target,
  TrendingUp, Upload, Users, X,
} from 'lucide-react'
import './App.css'
import {
  calculatePortfolio, estimateProductiveHours, formatCurrency, formatShort,
  defaultAssumptions, evidenceWeightKeys, confidenceWeightKeys, studies, copilotSpend,
  type Product, type EvidenceGrade, type Confidence, type ResponseRecord, type Assumptions,
} from './model'

type Page = 'overview' | 'responses' | 'hypotheses' | 'studies' | 'imports'

type Hypothesis = {
  id: number; useCase: string; owner: string; product: Product
  expectedEffect: string; outcome: string; evidence: string
  status: 'Collecting' | 'Ready to test' | 'Validated'
}
type ImportRecord = {
  id: number; name: string; source: string; rows: number; date: string
  status: 'Ready' | 'Needs mapping'; columns?: number; note?: string
}
type CsvRow = Record<string, string>

const navigation = [
  { id: 'overview' as Page, label: 'Overview', icon: LayoutDashboard },
  { id: 'responses' as Page, label: 'Sample responses', icon: MessageSquareText },
  { id: 'hypotheses' as Page, label: 'Value hypotheses', icon: Lightbulb },
  { id: 'studies' as Page, label: 'Outcome studies', icon: FlaskConical },
  { id: 'imports' as Page, label: 'Data imports', icon: Database },
]

const seedResponses: ResponseRecord[] = [
  { id: 1, role: 'Software Engineer', team: 'Digital Channels', product: 'GitHub Copilot', workType: 'Code and tests', timeSaved: '1–4 hours', effect: 'Speed and quality', outcome: 'More work completed', date: '07 Aug' },
  { id: 2, role: 'Business Analyst', team: 'Operations', product: 'Copilot Cowork', workType: 'Research and synthesis', timeSaved: '15–60 minutes', effect: 'Speed', outcome: 'Earlier delivery', date: '07 Aug' },
  { id: 3, role: 'Account Executive', team: 'Enterprise Sales', product: 'Copilot Cowork', workType: 'Customer communication', timeSaved: '1–4 hours', effect: 'Scope and quality', outcome: 'Better quality', date: '06 Aug' },
  { id: 4, role: 'Engineering Manager', team: 'Platform', product: 'GitHub Copilot', workType: 'Code review', timeSaved: '15–60 minutes', effect: 'Risk reduction', outcome: 'Less rework', date: '05 Aug' },
  { id: 5, role: 'Service Designer', team: 'Customer Care', product: 'Copilot Cowork', workType: 'Document drafting', timeSaved: '<15 minutes', effect: 'Speed', outcome: 'No identified outcome', date: '04 Aug' },
]

const seedHypotheses: Hypothesis[] = [
  { id: 1, useCase: 'Generate unit tests', owner: 'Digital Channels', product: 'GitHub Copilot', expectedEffect: 'Shorter development cycle', outcome: 'Increase release throughput', evidence: 'GitHub + deployment data', status: 'Collecting' },
  { id: 2, useCase: 'Summarize case material', owner: 'Customer Operations', product: 'Copilot Cowork', expectedEffect: 'Less preparation time', outcome: 'Handle more cases per week', evidence: 'Case management system', status: 'Ready to test' },
  { id: 3, useCase: 'Draft sales proposals', owner: 'Enterprise Sales', product: 'Copilot Cowork', expectedEffect: 'Faster response to clients', outcome: 'Improve proposal conversion', evidence: 'CRM opportunity data', status: 'Collecting' },
  { id: 4, useCase: 'Accelerate code review', owner: 'Platform Engineering', product: 'GitHub Copilot', expectedEffect: 'Reduce review wait time', outcome: 'Deliver changes earlier', evidence: 'Pull request cycle time', status: 'Validated' },
]

const initialImports: ImportRecord[] = [
  { id: 1, name: 'github-copilot-usage-july.csv', source: 'GitHub Copilot', rows: 842, date: '02 Aug 2026', status: 'Ready' },
  { id: 2, name: 'm365-cowork-consumption-july.csv', source: 'Microsoft 365', rows: 1264, date: '02 Aug 2026', status: 'Ready' },
  { id: 3, name: 'employee-team-map.csv', source: 'Employee mapping', rows: 518, date: '01 Aug 2026', status: 'Ready' },
]

const evidenceColors: Record<EvidenceGrade, string> = { Observed: '#087f6b', Estimated: '#2f6fce', Modelled: '#de7b22', Anecdotal: '#b4bdc5' }

const teamEvidence: { team: string; product: Product; spend: number; grossValue: number; grade: EvidenceGrade; confidence: Confidence; trend: string }[] = [
  { team: 'Digital Channels', product: 'GitHub Copilot', spend: 6840, grossValue: 91200, grade: 'Observed', confidence: 'High', trend: '+8%' },
  { team: 'Customer Operations', product: 'Copilot Cowork', spend: 5190, grossValue: 68400, grade: 'Estimated', confidence: 'Medium', trend: '+5%' },
  { team: 'Enterprise Sales', product: 'Copilot Cowork', spend: 4720, grossValue: 54100, grade: 'Estimated', confidence: 'Medium', trend: '+12%' },
  { team: 'Platform Engineering', product: 'GitHub Copilot', spend: 3960, grossValue: 48700, grade: 'Observed', confidence: 'High', trend: '+3%' },
]

function readStored<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback }
  catch { return fallback }
}
function saveStored<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)) }

const storageKeys = ['proofline-responses', 'proofline-hypotheses', 'proofline-imports', 'proofline-assumptions']
const storageVersion = '2'
function ensureStorageVersion() {
  try {
    if (localStorage.getItem('proofline-version') !== storageVersion) {
      storageKeys.forEach((key) => localStorage.removeItem(key))
      localStorage.setItem('proofline-version', storageVersion)
    }
  } catch { /* storage unavailable */ }
}
ensureStorageVersion()

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  URL.revokeObjectURL(url)
}
const importTemplateCsv = 'product,team,role,user,consumption,cost\nGitHub Copilot,Digital Channels,Software Engineer,user-1042,320,58.40\nCopilot Cowork,Operations,Business Analyst,user-2087,145,32.10\n'

function ProductMark({ product }: { product: Product }) {
  return product === 'GitHub Copilot' ? <GitBranch size={15} /> : <Sparkles size={15} />
}
function EvidenceBadge({ grade }: { grade: EvidenceGrade }) {
  return <span className={`evidence-badge ${grade.toLowerCase()}`}><span />{grade}</span>
}

function App() {
  const [page, setPage] = useState<Page>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [hypothesisOpen, setHypothesisOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [responses, setResponses] = useState<ResponseRecord[]>(() => readStored('proofline-responses', seedResponses))
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(() => readStored('proofline-hypotheses', seedHypotheses))
  const [imports, setImports] = useState<ImportRecord[]>(() => readStored('proofline-imports', initialImports))
  const [assumptions, setAssumptions] = useState<Assumptions>(() => ({ ...defaultAssumptions, ...readStored('proofline-assumptions', defaultAssumptions) }))
  const fileInput = useRef<HTMLInputElement>(null)
  const estimatedHours = estimateProductiveHours(responses)
  const portfolioHealth = calculatePortfolio(estimatedHours.low, assumptions).healthScore

  const navigate = (next: Page) => { setPage(next); setMenuOpen(false) }
  const showNotice = (message: string) => {
    setNotice(message); window.setTimeout(() => setNotice(''), 3200)
  }
  const updateAssumption = (key: keyof Assumptions, value: number) => {
    const next = { ...assumptions, [key]: value }; setAssumptions(next); saveStored('proofline-assumptions', next)
  }
  const resetAssumptions = () => { setAssumptions(defaultAssumptions); saveStored('proofline-assumptions', defaultAssumptions) }
  const exportPortfolio = () => {
    const snapshot = { exportedAt: new Date().toISOString(), assumptions, responses, hypotheses, imports }
    downloadBlob(`proofline-portfolio-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), 'application/json')
    showNotice('Portfolio snapshot exported.')
  }
  const submitSurvey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    const next: ResponseRecord = {
      id: Date.now(), role: String(data.get('role')), team: String(data.get('team')),
      product: String(data.get('product')) as Product, workType: String(data.get('workType')),
      timeSaved: String(data.get('timeSaved')), effect: String(data.get('effect')),
      outcome: String(data.get('outcome')), date: 'Today',
    }
    const updated = [next, ...responses]; setResponses(updated); saveStored('proofline-responses', updated)
    setSurveyOpen(false); showNotice('Response recorded. Thank you.')
  }
  const submitHypothesis = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    const next: Hypothesis = {
      id: Date.now(), useCase: String(data.get('useCase')), owner: String(data.get('owner')),
      product: String(data.get('product')) as Product, expectedEffect: String(data.get('expectedEffect')),
      outcome: String(data.get('outcome')), evidence: String(data.get('evidence')), status: 'Collecting',
    }
    const updated = [next, ...hypotheses]; setHypotheses(updated); saveStored('proofline-hypotheses', updated)
    setHypothesisOpen(false); showNotice('Value hypothesis added.')
  }
  const importCsv = (file: File) => {
    Papa.parse<CsvRow>(file, { header: true, skipEmptyLines: true, complete: ({ data, meta, errors }) => {
      const fields = meta.fields ?? []
      const lower = fields.map((field) => field.toLowerCase())
      const hasIdentity = lower.some((field) => ['team', 'role', 'user'].includes(field))
      const recognized = hasIdentity && lower.some((field) => ['product', 'consumption', 'cost'].includes(field))
      const costField = fields.find((field) => ['cost', 'consumption', 'spend'].includes(field.toLowerCase()))
      const totalCost = costField ? data.reduce((sum, row) => sum + (Number(row[costField]) || 0), 0) : 0
      const note = [`${fields.length} columns`, costField ? `${formatCurrency(totalCost)} ${costField.toLowerCase()}` : null].filter(Boolean).join(' · ')
      const ready = errors.length === 0 && recognized
      const next: ImportRecord = { id: Date.now(), name: file.name,
        source: file.name.toLowerCase().includes('github') ? 'GitHub Copilot' : file.name.toLowerCase().includes('employee') ? 'Employee mapping' : 'Microsoft 365',
        rows: data.length, columns: fields.length, note, date: 'Today', status: ready ? 'Ready' : 'Needs mapping' }
      const updated = [next, ...imports]; setImports(updated); saveStored('proofline-imports', updated)
      showNotice(ready
        ? `${data.length.toLocaleString()} rows · ${fields.length} columns imported from ${file.name}.`
        : `${file.name} imported but needs mapping — an identity field (team, role, user) and a product or cost field are expected.`)
    } })
  }
  const currentTitle = navigation.find((item) => item.id === page)?.label ?? 'Overview'

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={20} /></div><span>Proofline</span></div>
      <div className="workspace-switcher"><div className="workspace-avatar">CT</div><div><strong>Contoso Group</strong><span>AI value portfolio</span></div><ChevronDown size={16} /></div>
      <nav aria-label="Primary navigation">
        <p className="nav-label">Measure</p>
        {navigation.slice(0, 4).map(({ id, label, icon: Icon }) => <button className={page === id ? 'active' : ''} onClick={() => navigate(id)} key={id}><Icon size={18} />{label}{id === 'responses' && <span className="nav-count">{responses.length}</span>}</button>)}
        <p className="nav-label data-label">Manage</p>
        {navigation.slice(4).map(({ id, label, icon: Icon }) => <button className={page === id ? 'active' : ''} onClick={() => navigate(id)} key={id}><Icon size={18} />{label}</button>)}
      </nav>
      <div className="method-card"><div className="method-icon"><ShieldCheck size={18} /></div><div><strong>Evidence health</strong><span>Value retained after weighting</span></div><div className="health-score">{portfolioHealth}</div></div>
      <div className="sidebar-user"><div className="user-avatar">AM</div><div><strong>Alex Morgan</strong><span>Portfolio owner</span></div><MoreHorizontal size={18} /></div>
    </aside>

    <main>
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={20} /></button>
        <div><p className="eyebrow">AI value portfolio</p><h1>{currentTitle}</h1></div>
        <div className="header-actions"><button className="secondary-button desktop-action" onClick={exportPortfolio}><Download size={16} /> Export</button><button className="primary-button" onClick={() => setSurveyOpen(true)}><Send size={16} /> Sample response</button></div>
      </header>
      {page === 'overview' && <Overview onNavigate={navigate} responses={responses} assumptions={assumptions} onAssumptionChange={updateAssumption} onResetAssumptions={resetAssumptions} />}
      {page === 'responses' && <Responses responses={responses} onOpenSurvey={() => setSurveyOpen(true)} />}
      {page === 'hypotheses' && <Hypotheses hypotheses={hypotheses} onOpen={() => setHypothesisOpen(true)} />}
      {page === 'studies' && <Studies />}
      {page === 'imports' && <Imports imports={imports} fileInput={fileInput} onImport={importCsv} />}
    </main>
    {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    {notice && <div className="toast"><Check size={17} />{notice}</div>}
    {surveyOpen && <SurveyModal onClose={() => setSurveyOpen(false)} onSubmit={submitSurvey} />}
    {hypothesisOpen && <HypothesisModal onClose={() => setHypothesisOpen(false)} onSubmit={submitHypothesis} />}
  </div>
}

function Overview({ onNavigate, responses, assumptions, onAssumptionChange, onResetAssumptions }: { onNavigate: (page: Page) => void; responses: ResponseRecord[]; assumptions: Assumptions; onAssumptionChange: (key: keyof Assumptions, value: number) => void; onResetAssumptions: () => void }) {
  const [teamQuery, setTeamQuery] = useState('')
  const estimated = estimateProductiveHours(responses)
  const hoursLow = estimated.low, hoursMid = estimated.mid
  const filteredTeams = teamEvidence.filter((row) => row.team.toLowerCase().includes(teamQuery.trim().toLowerCase()))
  const lowPortfolio = calculatePortfolio(hoursLow, assumptions)
  const midPortfolio = calculatePortfolio(hoursMid, assumptions)
  const realizedLow = lowPortfolio.adjustedValue, realizedMid = midPortfolio.adjustedValue
  const netLow = realizedLow - copilotSpend
  const roiLow = netLow / copilotSpend, roiMid = (realizedMid - copilotSpend) / copilotSpend
  const pillars = lowPortfolio.pillars
  const maxPillar = Math.max(...pillars.map((item) => item.value))
  const mixStops = lowPortfolio.evidenceMix.reduce<{ end: number; stops: string[] }>((result, item) => {
    const start = result.end
    const end = start + item.percentage
    return { end, stops: [...result.stops, `${evidenceColors[item.grade]} ${start}% ${end}%`] }
  }, { end: 0, stops: [] }).stops.join(', ')
  const hourlyPct = ((assumptions.loadedHourlyCost - 30) / (150 - 30)) * 100
  return <div className="page-content overview-page">
    <section className="summary-strip"><div className="summary-heading"><div><span className="live-dot" />Portfolio summary</div><p>Headline figures are evidence-adjusted; upside shows the midpoint estimate</p></div><div className="metric-grid"><Metric label="Copilot spend" value={formatCurrency(copilotSpend)} detail="2 products · 518 people" icon={CircleDollarSign} /><Metric label="Adjusted value" value={formatCurrency(realizedLow)} detail={`Gross ${formatShort(lowPortfolio.rawValue)}`} icon={Target} emphasis /><Metric label="Net value" value={formatCurrency(netLow)} detail="After evidence weights and AI cost" icon={TrendingUp} /><Metric label="Portfolio ROI" value={`${roiLow.toFixed(1)}×`} detail={`Upside ${roiMid.toFixed(1)}×`} icon={Gauge} /></div></section>
    <section className="panel assumptions-panel"><div className="assumptions-head"><div><p className="section-kicker">Modelling assumptions</p><h2>Adjust valuation inputs and evidence policy</h2><p className="assumptions-sub">Every input persists in this browser and recomputes adjusted value, evidence health, and ROI immediately.</p></div><button className="text-button" onClick={onResetAssumptions}>Reset to defaults</button></div><div className="assumptions-body"><div className="assumption"><div className="assumption-top"><span>Loaded hourly cost</span><strong>{formatCurrency(assumptions.loadedHourlyCost)}/hr</strong></div><input type="range" min={30} max={150} step={5} value={assumptions.loadedHourlyCost} onChange={(event) => onAssumptionChange('loadedHourlyCost', Number(event.target.value))} aria-label="Loaded hourly cost" style={{ backgroundSize: `${hourlyPct}% 100%` }} /><div className="assumption-scale"><span>$30</span><span>$150</span></div></div><div className="assumption"><div className="assumption-top"><span>Realization factor</span><strong>{Math.round(assumptions.realizationFactor * 100)}%</strong></div><input type="range" min={0} max={100} step={5} value={Math.round(assumptions.realizationFactor * 100)} onChange={(event) => onAssumptionChange('realizationFactor', Number(event.target.value) / 100)} aria-label="Realization factor" style={{ backgroundSize: `${Math.round(assumptions.realizationFactor * 100)}% 100%` }} /><div className="assumption-scale"><span>0%</span><span>100%</span></div></div><div className="assumption-readout"><div><span>Evidence-adjusted ROI</span><strong className="readout-roi">{roiLow.toFixed(1)}×</strong></div><div><span>Value retained</span><strong>{lowPortfolio.healthScore}%</strong></div></div></div><div className="weight-policy"><section><span>Evidence weights</span><div className="weight-grid">{(Object.keys(evidenceWeightKeys) as EvidenceGrade[]).map((grade) => <WeightControl key={grade} label={grade} grade={grade} value={assumptions[evidenceWeightKeys[grade]]} onChange={(value) => onAssumptionChange(evidenceWeightKeys[grade], value)} />)}</div></section><section><span>Confidence multipliers</span><div className="weight-grid confidence-grid">{(Object.keys(confidenceWeightKeys) as Confidence[]).map((confidence) => <WeightControl key={confidence} label={confidence} value={assumptions[confidenceWeightKeys[confidence]]} onChange={(value) => onAssumptionChange(confidenceWeightKeys[confidence], value)} />)}</div></section></div></section>
    <section className="dashboard-grid">
      <article className="panel value-panel"><PanelTitle kicker="Business Value pillars" title="Evidence-adjusted value" /><div className="value-total"><strong>{formatShort(realizedLow)}</strong><span className="value-tag">adjusted</span><span className="value-upside"><TrendingUp size={14} /> gross {formatShort(lowPortfolio.rawValue)}</span></div><div className="stacked-bar">{pillars.map((item) => <span key={item.label} style={{ width: `${item.value / realizedLow * 100}%`, background: item.color }} />)}</div><div className="mechanism-list">{pillars.map((item) => <div className="mechanism-row" key={item.label}><span className="legend-dot" style={{ background: item.color }} /><span>{item.label}</span><div className="micro-bar"><i style={{ width: `${item.value / maxPillar * 100}%`, background: item.color }} /></div><strong>{formatShort(item.value)}</strong></div>)}</div></article>
      <article className="panel evidence-panel"><div className="panel-header"><div><p className="section-kicker">Evidence mix</p><h2>How strong is the portfolio?</h2></div><button className="text-button" onClick={() => onNavigate('studies')}>View studies <ArrowRight size={15} /></button></div><div className="evidence-donut-wrap"><div className="evidence-donut" style={{ background: `conic-gradient(${mixStops})` }}><div><strong>{lowPortfolio.healthScore}</strong><span>value retained</span></div></div><div className="evidence-legend">{lowPortfolio.evidenceMix.map((item) => <div key={item.grade}><EvidenceBadge grade={item.grade} /><span><strong>{Math.round(item.percentage)}%</strong><small>{Math.round(lowPortfolio.evidenceWeights[item.grade] * 100)}% weight</small></span></div>)}</div></div><div className="evidence-callout"><Info size={17} /><span><strong>{formatCurrency(realizedLow)} retained from {formatCurrency(lowPortfolio.rawValue)} gross value.</strong> Each contribution is adjusted by its evidence and confidence weights.</span></div></article>
      <article className="panel pillars-panel"><div className="panel-header"><div><p className="section-kicker">Microsoft Business Value framework</p><h2>Value across four strategic pillars</h2></div><span className="response-count">{responses.length} sampled responses</span></div><div className="pillar-grid">{pillars.map((pillar) => <div className="pillar-summary" key={pillar.label}><span className="pillar-swatch" style={{ background: pillar.color }} /><div><span>{pillar.label}</span><strong>{formatCurrency(pillar.value)}</strong><p>{pillar.description}</p><small>Gross {formatCurrency(pillar.rawValue)} · {pillar.sourceCount} evidence source{pillar.sourceCount === 1 ? '' : 's'}</small></div></div>)}</div></article>
    </section>
    <section className="panel team-panel"><div className="panel-header"><div><p className="section-kicker">Portfolio detail</p><h2>Evidence by team</h2></div><div className="table-actions"><label><Search size={15} /><input placeholder="Find a team" aria-label="Find a team" value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} /></label></div></div><div className="table-scroll"><table><thead><tr><th>Team</th><th>Product</th><th>Spend</th><th>Adjusted value</th><th>ROI</th><th>Confidence</th><th>Trend</th></tr></thead><tbody>{filteredTeams.map((row) => { const adjustedValue = row.grossValue * lowPortfolio.evidenceWeights[row.grade] * lowPortfolio.confidenceWeights[row.confidence]; const roi = adjustedValue / row.spend; return <tr key={row.team}><td><strong>{row.team}</strong></td><td><span className="product-cell"><ProductMark product={row.product} />{row.product}</span></td><td>{formatCurrency(row.spend)}</td><td><strong>{formatCurrency(adjustedValue)}</strong></td><td><span className="roi-pill">{roi.toFixed(1)}×</span></td><td><span className={`confidence-pill ${row.confidence.toLowerCase()}`}>{row.confidence}</span></td><td><span className="trend-value">{row.trend}</span></td></tr> })}{filteredTeams.length === 0 && <tr><td colSpan={7} className="table-empty">No teams match “{teamQuery}”.</td></tr>}</tbody></table></div><button className="table-footer" onClick={() => onNavigate('hypotheses')}>View all teams and hypotheses <ArrowRight size={15} /></button></section>
  </div>
}

function PanelTitle({ kicker, title }: { kicker: string; title: string }) { return <div className="panel-header"><div><p className="section-kicker">{kicker}</p><h2>{title}</h2></div><button className="icon-button" aria-label="More options"><MoreHorizontal size={19} /></button></div> }
function Metric({ label, value, detail, icon: Icon, emphasis = false }: { label: string; value: string; detail: string; icon: typeof Activity; emphasis?: boolean }) { return <div className={`metric ${emphasis ? 'emphasis' : ''}`}><div className="metric-label"><Icon size={16} />{label}</div><strong>{value}</strong><span>{detail}</span></div> }
function MiniStat({ label, value, note }: { label: string; value: string; note: string }) { return <div className="mini-stat"><span>{label}</span><strong>{value}</strong><p>{note}</p></div> }
function WeightControl({ label, grade, value, onChange }: { label: string; grade?: EvidenceGrade; value: number; onChange: (value: number) => void }) { return <label className="weight-control"><span>{grade ? <EvidenceBadge grade={grade} /> : label}<strong>{Math.round(value * 100)}%</strong></span><input type="range" min={0} max={100} step={5} value={Math.round(value * 100)} onChange={(event) => onChange(Number(event.target.value) / 100)} aria-label={`${label} weight`} style={{ backgroundSize: `${Math.round(value * 100)}% 100%` }} /></label> }

function Responses({ responses, onOpenSurvey }: { responses: ResponseRecord[]; onOpenSurvey: () => void }) {
  const target = 385
  const collected = responses.length
  const progress = Math.min(100, Math.round((collected / target) * 100))
  const remaining = Math.max(0, target - collected)
  const minutesByBucket: Record<string, number> = { None: 0, '<15 minutes': 7.5, '15–60 minutes': 37.5, '1–4 hours': 150, '>4 hours': 300 }
  const minutes = responses.map((item) => minutesByBucket[item.timeSaved] ?? 0).sort((a, b) => a - b)
  const median = minutes.length === 0 ? 0 : minutes[Math.floor((minutes.length - 1) / 2)]
  const medianLabel = median >= 60 ? `${(median / 60).toFixed(1)} h` : `${Math.round(median)} min`
  const withOutcome = responses.filter((item) => item.outcome && item.outcome !== 'No identified outcome').length
  const outcomeRate = collected === 0 ? 0 : Math.round((withOutcome / collected) * 100)
  const products = new Set(responses.map((item) => item.product)).size
  return <div className="page-content"><section className="sampling-banner"><div className="sampling-icon"><MessageSquareText size={24} /></div><div><p className="section-kicker">Stratified experience sampling</p><h2>July collection progress</h2><p>{collected} of {target} target responses · balanced across product, role, team, and usage intensity</p></div><div className="sampling-progress"><strong>{progress}%</strong><div><i style={{ width: `${progress}%` }} /></div><span>{remaining} responses remaining</span></div><button className="primary-button" onClick={onOpenSurvey}><Send size={16} /> Preview survey</button></section><section className="mini-stat-grid"><MiniStat label="Responses collected" value={collected.toLocaleString()} note={`of ${target} target`} /><MiniStat label="Median time saved" value={medianLabel} note="per sampled task" /><MiniStat label="Outcome identified" value={`${outcomeRate}%`} note="of responses" /><MiniStat label="Products sampled" value={String(products)} note="distinct products" /></section><section className="panel records-panel"><div className="panel-header"><div><p className="section-kicker">Latest evidence</p><h2>Sample responses</h2></div><EvidenceBadge grade="Estimated" /></div><div className="table-scroll"><table><thead><tr><th>Role and team</th><th>Product</th><th>Work type</th><th>Time saved</th><th>Effect</th><th>Enabled outcome</th><th>Date</th></tr></thead><tbody>{responses.map((item) => <tr key={item.id}><td><strong>{item.role}</strong><span className="cell-subtitle">{item.team}</span></td><td><span className="product-cell"><ProductMark product={item.product} />{item.product}</span></td><td>{item.workType}</td><td><strong>{item.timeSaved}</strong></td><td>{item.effect}</td><td>{item.outcome}</td><td>{item.date}</td></tr>)}</tbody></table></div></section></div>
}

function Hypotheses({ hypotheses, onOpen }: { hypotheses: Hypothesis[]; onOpen: () => void }) {
  return <div className="page-content"><PageIntro kicker="Quarterly value planning" title="Connect AI use to an outcome before measuring it" text="Managers register a small number of testable claims. Teams do not document every task." action={<button className="primary-button" onClick={onOpen}><Plus size={17} /> Add hypothesis</button>} /><section className="hypothesis-grid">{hypotheses.map((item) => <article className="hypothesis-card" key={item.id}><div className="hypothesis-top"><span className="product-chip"><ProductMark product={item.product} />{item.product}</span><button className="icon-button"><MoreHorizontal size={18} /></button></div><h3>{item.useCase}</h3><p className="owner"><Users size={15} />{item.owner}</p><div className="hypothesis-flow"><div><span>Expected effect</span><strong>{item.expectedEffect}</strong></div><ArrowRight size={18} /><div><span>Business outcome</span><strong>{item.outcome}</strong></div></div><div className="evidence-source"><Database size={15} /><div><span>Evidence source</span><strong>{item.evidence}</strong></div></div><div className="card-footer"><span className={`status-pill ${item.status.toLowerCase().replaceAll(' ', '-')}`}><span />{item.status}</span></div></article>)}</section></div>
}

function Studies() {
  const ordered = [...studies].sort((a, b) => Number(Boolean(b.baseline)) - Number(Boolean(a.baseline)))
  return <div className="page-content"><PageIntro kicker="Causal evidence" title="Focused studies for the claims that matter most" text="Broad sampling discovers promising use cases. These studies test whether Copilot caused a measurable outcome." /><section className="study-grid">{ordered.map(({ icon: Icon, ...study }) => <article className="study-card" key={study.id}><div className="study-heading"><div className="study-icon"><Icon size={21} /></div><div><span className="product-chip"><ProductMark product={study.product} />{study.product}</span><h3>{study.title}</h3></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="study-design"><FlaskConical size={16} /><span>{study.group}</span></div><div className="study-result"><span>{study.metric}</span><strong>{study.result}</strong>{study.baseline ? <div className="study-baseline"><span className="baseline-from">{study.baseline}</span><ArrowRight size={13} /><span className="baseline-to">{study.current}</span></div> : <span className="no-baseline">No baseline set</span>}{study.comparison && <div className="study-comparison"><span>Basis</span>{study.comparison}</div>}</div><div className="study-progress"><div><i style={{ width: `${study.progress}%` }} /></div><span>{study.progress === 100 ? 'Study complete' : `${study.progress}% data collected`}</span></div><div className="study-footer"><EvidenceBadge grade={study.grade} /><span className={`confidence-pill ${study.confidence.toLowerCase()}`}>{study.confidence} confidence</span><span className="study-value">Gross {formatCurrency(study.grossValue)}</span></div></article>)}</section><section className="methodology-note"><ShieldCheck size={22} /><div><strong>Methodology guardrail</strong><p>Users are not compared directly with non-users. Studies use matched teams, stable pre/post measures, or staggered rollout to reduce selection bias. A baseline shows the comparison each result is measured against.</p></div></section></div>
}

function Imports({ imports, fileInput, onImport }: { imports: ImportRecord[]; fileInput: RefObject<HTMLInputElement | null>; onImport: (file: File) => void }) {
  return <div className="page-content"><PageIntro kicker="Portfolio inputs" title="Bring cost, usage, and organization data together" text="Upload aggregate exports. Message content, prompts, and source code are neither required nor collected." /><section className="import-layout"><div className="upload-panel" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) onImport(file) }}><div className="upload-icon"><Upload size={26} /></div><h3>Import a CSV export</h3><p>Drop a GitHub Copilot, Microsoft 365, or employee mapping export here.</p><input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = '' }} /><button className="secondary-button" onClick={() => fileInput.current?.click()}><FileSpreadsheet size={16} /> Choose CSV file</button><span className="upload-hint">Expected fields include product, team, role, user, consumption, and cost.</span></div><div className="privacy-panel"><ShieldCheck size={22} /><div><p className="section-kicker">Privacy by design</p><h3>Measure value, not people</h3><ul>{['Aggregate reporting by default', 'No prompt or content inspection', 'Minimum team-size thresholds', 'Role-based access ready'].map((text) => <li key={text}><Check size={15} />{text}</li>)}</ul></div></div></section><section className="panel records-panel"><div className="panel-header"><div><p className="section-kicker">Import history</p><h2>Connected datasets</h2></div><button className="text-button" onClick={() => downloadBlob('proofline-import-template.csv', importTemplateCsv, 'text/csv')}><Download size={15} /> Download template</button></div><div className="table-scroll"><table><thead><tr><th>File</th><th>Source</th><th>Rows</th><th>Imported</th><th>Status</th></tr></thead><tbody>{imports.map((item) => <tr key={item.id}><td><span className="file-cell"><FileSpreadsheet size={17} /><strong>{item.name}</strong></span>{item.note && <span className="cell-subtitle">{item.note}</span>}</td><td>{item.source}</td><td>{item.rows.toLocaleString()}</td><td>{item.date}</td><td><span className={`import-status ${item.status === 'Ready' ? 'ready' : 'mapping'}`}><span />{item.status}</span></td></tr>)}</tbody></table></div></section></div>
}

function PageIntro({ kicker, title, text, action }: { kicker: string; title: string; text: string; action?: ReactNode }) { return <section className="page-intro"><div><p className="section-kicker">{kicker}</p><h2>{title}</h2><p>{text}</p></div>{action}</section> }
function ModalShell({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) { return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><p className="section-kicker">{eyebrow}</p><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>{children}</div></div> }

function SurveyModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <ModalShell eyebrow="30-second sample" title="How did Copilot help with this task?" onClose={onClose}><form onSubmit={onSubmit} className="modal-form"><div className="form-row"><label>Product<select name="product" required><option>GitHub Copilot</option><option>Copilot Cowork</option></select></label><label>Work type<select name="workType" required><option>Code and tests</option><option>Research and synthesis</option><option>Document drafting</option><option>Customer communication</option><option>Data analysis</option><option>Meeting follow-up</option></select></label></div><div className="form-row"><label>Your role<input name="role" required placeholder="e.g. Software Engineer" /></label><label>Team<input name="team" required placeholder="e.g. Digital Channels" /></label></div><fieldset><legend>Approximately how much time did it save?</legend><div className="option-grid">{['None', '<15 minutes', '15–60 minutes', '1–4 hours', '>4 hours'].map((value) => <label className="radio-option" key={value}><input type="radio" name="timeSaved" value={value} required /><span>{value}</span></label>)}</div></fieldset><div className="form-row"><label>What changed?<select name="effect" required><option>Speed</option><option>Quality</option><option>Speed and quality</option><option>Scope</option><option>Confidence</option><option>Risk reduction</option></select></label><label>What did that enable?<select name="outcome" required><option>More work completed</option><option>Earlier delivery</option><option>Better quality</option><option>Less rework</option><option>Reduced pressure</option><option>Avoided external cost</option><option>No identified outcome</option></select></label></div><div className="modal-actions"><span><ShieldCheck size={15} />Reported only in aggregate</span><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">Record response <ArrowRight size={16} /></button></div></form></ModalShell>
}
function HypothesisModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <ModalShell eyebrow="Value hypothesis" title="Define a claim worth testing" onClose={onClose}><form onSubmit={onSubmit} className="modal-form"><label>AI-assisted use case<input name="useCase" required placeholder="e.g. Generate unit tests" /></label><div className="form-row"><label>Owning team<input name="owner" required placeholder="e.g. Digital Channels" /></label><label>Product<select name="product"><option>GitHub Copilot</option><option>Copilot Cowork</option></select></label></div><label>Expected effect<input name="expectedEffect" required placeholder="e.g. Shorter development cycle" /></label><label>Business outcome<input name="outcome" required placeholder="e.g. Increase release throughput" /></label><label>Operational evidence source<input name="evidence" required placeholder="e.g. Deployment and pull request data" /></label><div className="modal-actions"><span><Target size={15} />Make the outcome observable</span><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">Add hypothesis <ArrowRight size={16} /></button></div></form></ModalShell>
}

export default App