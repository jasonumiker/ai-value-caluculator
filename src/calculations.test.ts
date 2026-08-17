import { describe, it, expect } from 'vitest'
import {
  calculatePortfolio,
  defaultAssumptions,
  estimateProductiveHours,
  formatCurrency,
  formatShort,
  studies,
  copilotSpend,
  sampledPopulation,
  periodsPerMonth,
} from './model'
import type { Assumptions, ResponseRecord } from './model'

const allOnes: Assumptions = {
  ...defaultAssumptions,
  observedWeight: 1, estimatedWeight: 1, modelledWeight: 1, anecdotalWeight: 1,
  highConfidenceWeight: 1, mediumConfidenceWeight: 1, lowConfidenceWeight: 1,
}
const allZero: Assumptions = {
  ...defaultAssumptions,
  observedWeight: 0, estimatedWeight: 0, modelledWeight: 0, anecdotalWeight: 0,
  highConfidenceWeight: 0, mediumConfidenceWeight: 0, lowConfidenceWeight: 0,
}
const response = (timeSaved: string): ResponseRecord => ({
  id: 1, role: 'r', team: 't', product: 'GitHub Copilot', workType: 'w',
  timeSaved, effect: 'Speed', outcome: 'More work completed', date: 'Today',
})

describe('README defaults', () => {
  it('matches the documented valuation policy defaults', () => {
    expect(defaultAssumptions).toEqual({
      loadedHourlyCost: 65, realizationFactor: 0.55,
      observedWeight: 1, estimatedWeight: 0.85, modelledWeight: 0.75, anecdotalWeight: 0.4,
      highConfidenceWeight: 1, mediumConfidenceWeight: 0.9, lowConfidenceWeight: 0.75,
    })
  })
  it('uses the documented Copilot spend', () => {
    expect(copilotSpend).toBe(28460)
  })
})

describe('calculatePortfolio — evidence-adjusted value', () => {
  it('adjusted value equals gross when every weight is 100% (health = 100)', () => {
    const p = calculatePortfolio(1000, allOnes)
    expect(p.adjustedValue).toBeCloseTo(p.rawValue, 5)
    expect(p.healthScore).toBe(100)
  })

  it('zeroing all weights removes all adjusted value (health = 0)', () => {
    const p = calculatePortfolio(1000, allZero)
    expect(p.adjustedValue).toBe(0)
    expect(p.healthScore).toBe(0)
  })

  it('evidence health = round(adjusted / gross * 100)', () => {
    const p = calculatePortfolio(1500, defaultAssumptions)
    expect(p.healthScore).toBe(Math.round((p.adjustedValue / p.rawValue) * 100))
    expect(p.healthScore).toBeLessThan(100)
  })

  it('adjusts each contribution by evidence weight × confidence multiplier', () => {
    // Anecdotal "New capability cases" (52600) is Low confidence.
    const raised = { ...defaultAssumptions, anecdotalWeight: 0.8 }
    const lowered = { ...defaultAssumptions, anecdotalWeight: 0.2 }
    const delta = calculatePortfolio(0, raised).adjustedValue - calculatePortfolio(0, lowered).adjustedValue
    // Δweight (0.6) × gross (52600) × Low confidence multiplier (0.75)
    expect(delta).toBeCloseTo(0.6 * 52600 * defaultAssumptions.lowConfidenceWeight, 5)
  })

  it('converts productive hours to gross value via hourly cost × realization factor', () => {
    const a = calculatePortfolio(1000, defaultAssumptions).rawValue
    const b = calculatePortfolio(2000, defaultAssumptions).rawValue
    expect(b - a).toBeCloseTo(1000 * defaultAssumptions.loadedHourlyCost * defaultAssumptions.realizationFactor, 5)
  })

  it('net value = adjusted value − AI cost', () => {
    const { adjustedValue } = calculatePortfolio(1200, defaultAssumptions)
    expect(adjustedValue - copilotSpend).toBeCloseTo(adjustedValue - 28460, 5)
  })
})

describe('calculatePortfolio — four Business Value pillars', () => {
  it('returns exactly the four documented pillars with metadata', () => {
    const { pillars } = calculatePortfolio(1000, defaultAssumptions)
    expect(pillars.map((p) => p.label)).toEqual([
      'Improved Performance', 'Cost Savings', 'Innovation / Transformation', 'Risk Mitigation',
    ])
    pillars.forEach((p) => {
      expect(p.color).toMatch(/^#/)
      expect(typeof p.description).toBe('string')
    })
  })

  it('evidence mix percentages sum to 100 when gross value is positive', () => {
    const { evidenceMix } = calculatePortfolio(1000, defaultAssumptions)
    const total = evidenceMix.reduce((sum, item) => sum + item.percentage, 0)
    expect(total).toBeCloseTo(100, 5)
  })
})

describe('outcome studies feed the portfolio', () => {
  it('gross value includes every study grossValue plus the non-study contributions', () => {
    const studyGross = studies.reduce((sum, s) => sum + s.grossValue, 0)
    // With 0 hours the surveyed-productivity contribution is 0.
    expect(calculatePortfolio(0, defaultAssumptions).rawValue).toBeCloseTo(studyGross + 52600 + 67900, 5)
  })

  it('assigns study gross value to the study pillar', () => {
    const { pillars } = calculatePortfolio(0, defaultAssumptions)
    const byLabel = Object.fromEntries(pillars.map((p) => [p.label, p.rawValue]))
    expect(byLabel['Improved Performance']).toBeCloseTo(84200 + 46000, 5)
    expect(byLabel['Cost Savings']).toBeCloseTo(40100, 5)
  })

  it('includes matched-team, pre/post, and staggered-rollout designs', () => {
    const groups = studies.map((s) => s.group).join(' | ')
    expect(groups).toMatch(/matched teams/)
    expect(groups).toMatch(/pre\/post/)
    expect(groups).toMatch(/staggered rollout/)
  })

  it('labels studies with Observed and Estimated evidence and allows optional baselines', () => {
    expect(studies.some((s) => s.grade === 'Observed')).toBe(true)
    expect(studies.some((s) => s.grade === 'Estimated')).toBe(true)
    expect(studies.some((s) => !s.baseline)).toBe(true)
    expect(studies.some((s) => s.baseline && s.comparison)).toBe(true)
  })
})

describe('estimateProductiveHours — experience sampling', () => {
  it('returns zero hours for no responses', () => {
    expect(estimateProductiveHours([])).toEqual({ low: 0, mid: 0 })
  })

  it('extrapolates a single sampled response to the population and period', () => {
    const { low, mid } = estimateProductiveHours([response('1–4 hours')])
    const scale = sampledPopulation * periodsPerMonth
    expect(low).toBeCloseTo(1 * scale, 5)
    expect(mid).toBeCloseTo(2.5 * scale, 5)
  })

  it('averages the sample so repeated identical responses do not inflate hours', () => {
    const one = estimateProductiveHours([response('1–4 hours')])
    const two = estimateProductiveHours([response('1–4 hours'), response('1–4 hours')])
    expect(two.low).toBeCloseTo(one.low, 5)
  })

  it('treats unknown or "None" buckets as zero saved time', () => {
    expect(estimateProductiveHours([response('None')])).toEqual({ low: 0, mid: 0 })
    expect(estimateProductiveHours([response('not-a-bucket')])).toEqual({ low: 0, mid: 0 })
  })

  it('a larger time-saved bucket produces more estimated hours', () => {
    const small = estimateProductiveHours([response('<15 minutes')]).low
    const large = estimateProductiveHours([response('>4 hours')]).low
    expect(large).toBeGreaterThan(small)
  })
})

describe('formatting helpers', () => {
  it('formats currency with thousands separators', () => {
    expect(formatCurrency(28460)).toBe('$28,460')
    expect(formatCurrency(0)).toBe('$0')
  })
  it('formats short currency in thousands', () => {
    expect(formatShort(84200)).toBe('$84.2k')
  })
})
