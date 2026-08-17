import { BookOpenCheck, Code2, TrendingUp, type LucideIcon } from 'lucide-react'

export type Product = 'GitHub Copilot' | 'Copilot Cowork'
export type EvidenceGrade = 'Observed' | 'Estimated' | 'Modelled' | 'Anecdotal'
export type Confidence = 'High' | 'Medium' | 'Low'
export type PillarLabel = 'Improved Performance' | 'Cost Savings' | 'Innovation / Transformation' | 'Risk Mitigation'

export type ResponseRecord = {
  id: number; role: string; team: string; product: Product; workType: string
  timeSaved: string; effect: string; outcome: string; date: string
}

export type Study = {
  id: number; title: string; group: string; metric: string; result: string
  confidence: Confidence; grade: EvidenceGrade; product: Product; progress: number
  pillar: PillarLabel; grossValue: number
  icon: LucideIcon; baseline?: string; current?: string; comparison?: string
}

export const studies: Study[] = [
  { id: 1, title: 'Developer delivery cycle', group: '84 engineers · matched teams', metric: 'Median pull request cycle time', result: '18% faster', confidence: 'High', grade: 'Observed', product: 'GitHub Copilot', progress: 100, icon: Code2, pillar: 'Improved Performance', grossValue: 84200, baseline: '5.2 days', current: '4.3 days', comparison: 'vs. matched teams, prior quarter' },
  { id: 2, title: 'Knowledge work preparation', group: '126 participants · pre/post', metric: 'Preparation time per case', result: '31 min saved', confidence: 'Medium', grade: 'Estimated', product: 'Copilot Cowork', progress: 72, icon: BookOpenCheck, pillar: 'Cost Savings', grossValue: 40100 },
  { id: 3, title: 'Sales proposal response', group: '42 opportunities · staggered rollout', metric: 'Time to first proposal', result: '2.1 days earlier', confidence: 'Medium', grade: 'Observed', product: 'Copilot Cowork', progress: 46, icon: TrendingUp, pillar: 'Improved Performance', grossValue: 46000, baseline: '6.4 days', current: '4.3 days', comparison: 'vs. staggered-rollout control cohort' },
]

export const copilotSpend = 28460

const pillarMetadata: Record<PillarLabel, { color: string; description: string }> = {
  'Improved Performance': { color: '#087f6b', description: 'Higher throughput and faster delivery' },
  'Cost Savings': { color: '#de7b22', description: 'Avoided spend and operating cost' },
  'Innovation / Transformation': { color: '#2f6fce', description: 'New capabilities and redesigned work' },
  'Risk Mitigation': { color: '#8391a7', description: 'Better quality, control, and resilience' },
}

export type Assumptions = {
  loadedHourlyCost: number; realizationFactor: number
  observedWeight: number; estimatedWeight: number; modelledWeight: number; anecdotalWeight: number
  highConfidenceWeight: number; mediumConfidenceWeight: number; lowConfidenceWeight: number
}
export const defaultAssumptions: Assumptions = {
  loadedHourlyCost: 65, realizationFactor: 0.55,
  observedWeight: 1, estimatedWeight: 0.85, modelledWeight: 0.75, anecdotalWeight: 0.4,
  highConfidenceWeight: 1, mediumConfidenceWeight: 0.9, lowConfidenceWeight: 0.75,
}
export const evidenceWeightKeys: Record<EvidenceGrade, keyof Assumptions> = {
  Observed: 'observedWeight', Estimated: 'estimatedWeight', Modelled: 'modelledWeight', Anecdotal: 'anecdotalWeight',
}
export const confidenceWeightKeys: Record<Confidence, keyof Assumptions> = {
  High: 'highConfidenceWeight', Medium: 'mediumConfidenceWeight', Low: 'lowConfidenceWeight',
}

type ValueContribution = {
  name: string; pillar: PillarLabel; rawValue: number; grade: EvidenceGrade; confidence: Confidence; adjustedValue: number
}

export function calculatePortfolio(hours: number, assumptions: Assumptions) {
  const evidenceWeights = Object.fromEntries((Object.keys(evidenceWeightKeys) as EvidenceGrade[]).map((grade) => [grade, assumptions[evidenceWeightKeys[grade]]])) as Record<EvidenceGrade, number>
  const confidenceWeights = Object.fromEntries((Object.keys(confidenceWeightKeys) as Confidence[]).map((confidence) => [confidence, assumptions[confidenceWeightKeys[confidence]]])) as Record<Confidence, number>
  const rawContributions: Omit<ValueContribution, 'adjustedValue'>[] = [
    { name: 'Surveyed productivity', pillar: 'Improved Performance', rawValue: hours * assumptions.loadedHourlyCost * assumptions.realizationFactor, grade: 'Estimated', confidence: 'Medium' },
    ...studies.map((study) => ({ name: study.title, pillar: study.pillar, rawValue: study.grossValue, grade: study.grade, confidence: study.confidence })),
    { name: 'New capability cases', pillar: 'Innovation / Transformation', rawValue: 52600, grade: 'Anecdotal', confidence: 'Low' },
    { name: 'Quality and risk valuation', pillar: 'Risk Mitigation', rawValue: 67900, grade: 'Modelled', confidence: 'Medium' },
  ]
  const contributions: ValueContribution[] = rawContributions.map((item) => ({ ...item, adjustedValue: item.rawValue * evidenceWeights[item.grade] * confidenceWeights[item.confidence] }))
  const rawValue = contributions.reduce((sum, item) => sum + item.rawValue, 0)
  const adjustedValue = contributions.reduce((sum, item) => sum + item.adjustedValue, 0)
  const pillars = (Object.keys(pillarMetadata) as PillarLabel[]).map((label) => {
    const matches = contributions.filter((item) => item.pillar === label)
    return {
      label, ...pillarMetadata[label],
      rawValue: matches.reduce((sum, item) => sum + item.rawValue, 0),
      value: matches.reduce((sum, item) => sum + item.adjustedValue, 0),
      sourceCount: matches.length,
    }
  })
  const evidenceMix = (Object.keys(evidenceWeights) as EvidenceGrade[]).map((grade) => ({
    grade,
    percentage: rawValue === 0 ? 0 : contributions.filter((item) => item.grade === grade).reduce((sum, item) => sum + item.rawValue, 0) / rawValue * 100,
  }))
  return { rawValue, adjustedValue, pillars, evidenceMix, evidenceWeights, confidenceWeights, healthScore: rawValue === 0 ? 0 : Math.round(adjustedValue / rawValue * 100) }
}

export const timeSavedHours: Record<string, { low: number; mid: number }> = {
  None: { low: 0, mid: 0 },
  '<15 minutes': { low: 0.1, mid: 0.2 },
  '15–60 minutes': { low: 0.25, mid: 0.6 },
  '1–4 hours': { low: 1, mid: 2.5 },
  '>4 hours': { low: 4, mid: 5.5 },
}
export const sampledPopulation = 518
export const periodsPerMonth = 4.33
export function estimateProductiveHours(responses: ResponseRecord[]) {
  if (responses.length === 0) return { low: 0, mid: 0 }
  const totals = responses.reduce((acc, item) => {
    const bucket = timeSavedHours[item.timeSaved] ?? { low: 0, mid: 0 }
    return { low: acc.low + bucket.low, mid: acc.mid + bucket.mid }
  }, { low: 0, mid: 0 })
  const scale = (sampledPopulation * periodsPerMonth) / responses.length
  return { low: totals.low * scale, mid: totals.mid * scale }
}

export function formatCurrency(value: number) { return `$${Math.round(value).toLocaleString('en-US')}` }
export function formatShort(value: number) { return `$${(value / 1000).toFixed(1)}k` }
