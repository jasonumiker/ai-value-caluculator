import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import App from './App'
import { defaultAssumptions } from './model'

beforeEach(() => {
  localStorage.clear()
})

function summaryMetric(label: string): string {
  const strip = document.querySelector('.summary-strip') as HTMLElement
  const strong = within(strip).getByText(label).closest('.metric')!.querySelector('strong')!
  return strong.textContent ?? ''
}
function storedAssumptions() {
  return JSON.parse(localStorage.getItem('proofline-assumptions') ?? '{}')
}

describe('Portfolio overview', () => {
  it('renders the headline metrics, four pillars, and evidence health', () => {
    render(<App />)
    expect(screen.getByText('Copilot spend')).toBeInTheDocument()
    expect(screen.getAllByText('Adjusted value').length).toBeGreaterThan(0)
    expect(screen.getByText('Net value')).toBeInTheDocument()
    expect(screen.getByText('Portfolio ROI')).toBeInTheDocument()
    expect(screen.getByText('Evidence health')).toBeInTheDocument()
    expect(summaryMetric('Copilot spend')).toBe('$28,460')
    ;['Improved Performance', 'Cost Savings', 'Innovation / Transformation', 'Risk Mitigation'].forEach((pillar) => {
      expect(screen.getAllByText(pillar).length).toBeGreaterThan(0)
    })
  })

  it('labels evidence with all four grades', () => {
    render(<App />)
    ;['Observed', 'Estimated', 'Modelled', 'Anecdotal'].forEach((grade) => {
      expect(screen.getAllByText(grade).length).toBeGreaterThan(0)
    })
  })
})

describe('Editable valuation policy', () => {
  it('exposes nine persisted sliders', () => {
    render(<App />)
    expect(screen.getAllByRole('slider')).toHaveLength(9)
  })

  it('recomputes ROI, persists a slider change, and resets to defaults', async () => {
    const user = userEvent.setup()
    render(<App />)
    const roiBefore = Number(summaryMetric('Portfolio ROI').replace('×', ''))

    fireEvent.change(screen.getByLabelText('Anecdotal weight'), { target: { value: '0' } })
    expect(storedAssumptions().anecdotalWeight).toBe(0)
    const roiAfter = Number(summaryMetric('Portfolio ROI').replace('×', ''))
    expect(roiAfter).toBeLessThan(roiBefore)

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    expect(storedAssumptions().anecdotalWeight).toBe(defaultAssumptions.anecdotalWeight)
  })

  it('exports a portfolio snapshot', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(await screen.findByText('Portfolio snapshot exported.')).toBeInTheDocument()
  })
})

describe('Experience sampling survey', () => {
  it('records a response and persists it', async () => {
    const user = userEvent.setup()
    render(<App />)
    const before = JSON.parse(localStorage.getItem('proofline-responses') ?? 'null')

    await user.click(screen.getByRole('button', { name: 'Sample response' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Your role'), 'Test Engineer')
    await user.type(within(dialog).getByLabelText('Team'), 'Test Team')
    fireEvent.click(within(dialog).getByRole('radio', { name: '1–4 hours' }))
    await user.click(within(dialog).getByRole('button', { name: /Record response/ }))

    expect(await screen.findByText('Response recorded. Thank you.')).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('proofline-responses') ?? '[]')
    // Seed set has 5 responses; a new one is prepended.
    expect(stored.length).toBe((before?.length ?? 5) + 1)
    expect(stored[0].role).toBe('Test Engineer')
  })
})

describe('Value hypothesis registry', () => {
  it('adds and persists a hypothesis', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Value hypotheses' }))
    await user.click(screen.getByRole('button', { name: /Add hypothesis/ }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('AI-assisted use case'), 'Draft release notes')
    await user.type(within(dialog).getByLabelText('Owning team'), 'Docs')
    await user.type(within(dialog).getByLabelText('Expected effect'), 'Faster drafting')
    await user.type(within(dialog).getByLabelText('Business outcome'), 'Ship notes sooner')
    await user.type(within(dialog).getByLabelText('Operational evidence source'), 'Release tracker')
    await user.click(within(dialog).getByRole('button', { name: /Add hypothesis/ }))

    expect(await screen.findByText('Value hypothesis added.')).toBeInTheDocument()
    expect(screen.getByText('Draft release notes')).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('proofline-hypotheses') ?? '[]')
    expect(stored.length).toBe(5)
  })
})

describe('Outcome studies', () => {
  it('shows the three study designs', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Outcome studies' }))
    expect(screen.getByText('Developer delivery cycle')).toBeInTheDocument()
    expect(screen.getByText('84 engineers · matched teams')).toBeInTheDocument()
    expect(screen.getByText('126 participants · pre/post')).toBeInTheDocument()
    expect(screen.getByText('42 opportunities · staggered rollout')).toBeInTheDocument()
  })
})

describe('CSV ingestion', () => {
  it('parses an uploaded export and adds it to the import history', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Data imports' }))

    const csv = 'product,team,role,user,consumption,cost\nGitHub Copilot,Digital Channels,Engineer,u1,100,50\n'
    const file = new File([csv], 'test-usage.csv', { type: 'text/csv' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(await screen.findByText('test-usage.csv')).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('proofline-imports') ?? '[]')
    expect(stored[0].name).toBe('test-usage.csv')
    expect(stored[0].status).toBe('Ready')
    expect(stored[0].rows).toBe(1)
  })
})
