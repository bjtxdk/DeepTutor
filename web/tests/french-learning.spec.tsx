import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { FrenchLearningPage } from '@/features/french-learning/components/FrenchLearningPage'
import { NAV_BY_HREF, isNavActive, PRIMARY_NAV_HREFS, DEFAULT_COLLAPSED_NAV } from '@/components/sidebar/nav-entries'
import { capabilityForPath } from '@/lib/capability-routes'
import { categoryForPath } from '@/lib/navigation'
import { resolveNavLayout } from '@/lib/sidebar-layout'
import { browserStorage } from '@/shared/storage'

const account = vi.hoisted(() => ({ userId: 'student-a', loading: false }))
const workspace = vi.hoisted(() => ({ id: 'french-class' }))
vi.mock('@/hooks/useAuthStatus', () => ({ useAuthStatus: () => account }))
vi.mock('@/lib/workspace-scope', () => ({ activeWorkspaceId: () => workspace.id }))
beforeEach(() => { localStorage.clear(); account.userId = 'student-a'; workspace.id = 'french-class' })
function renderReading() {
  const view = render(<FrenchLearningPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Unité 1 · Espaces verts' }))
  return view
}
const open = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Unité 1 · Espaces verts' }))
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Activités de français' })).getByRole('button', { name: new RegExp(name) }))
}

it('offers age-appropriate reading, four stages and honest self-reported progress without model access', () => {
  renderReading()
  expect(screen.getByRole('heading', { level: 1, name: 'French Learning' })).toBeInTheDocument()
  expect(screen.getByRole('article')).toHaveTextContent('Un parc, plusieurs besoins')
  for (const title of ['Lecture', 'Écriture', 'Grammaire', 'Vocabulaire']) {
    expect(within(screen.getByRole('navigation', { name: 'Activités de français' })).getByRole('button', { name: new RegExp(title) })).toBeInTheDocument()
  }
  fireEvent.click(screen.getByRole('button', { name: 'Marquer cette étape terminée' }))
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
  fireEvent.click(screen.getByRole('button', { name: 'Continuer mon parcours' }))
  expect(screen.getByRole('heading', { name: 'Vocabulaire' })).toBeInTheDocument()
  expect(capabilityForPath('/french-learning')).toBeNull()
})

it('requires all answers, explains mistakes, and allows retry without leaking feedback into another stage', () => {
  renderReading()
  const verify = screen.getByRole('button', { name: 'Vérifier mes réponses' })
  expect(verify).toBeDisabled()
  fireEvent.click(screen.getByLabelText('Fermer toutes les boutiques.'))
  fireEvent.click(screen.getByLabelText('Pour expliquer un autre besoin à considérer.'))
  fireEvent.click(screen.getByLabelText('Il faut comparer les besoins et explorer plusieurs solutions.'))
  fireEvent.click(verify)
  expect(screen.getByText(/2 \/ 3 réponses correctes/)).toBeInTheDocument()
  expect(screen.getByText(/Le premier paragraphe annonce/)).toBeInTheDocument()
  fireEvent.click(screen.getByLabelText('Transformer une partie du parc en stationnement.'))
  fireEvent.click(verify)
  expect(screen.getByText(/3 \/ 3 réponses correctes/)).toBeInTheDocument()
  open('Vocabulaire')
  expect(screen.queryByText(/réponses correctes/)).toBeNull()
})

it('saves the draft, answers, revision checklist and stage locally and resumes after remount', () => {
  const view = renderReading()
  fireEvent.click(screen.getByLabelText('Transformer une partie du parc en stationnement.'))
  open('Écriture')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte d’opinion' }), { target: { value: 'Je propose de protéger notre parc.' } })
  fireEvent.click(screen.getByLabelText('J’annonce clairement mon opinion.'))
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
  expect(screen.getByText('Enregistré dans ce navigateur.')).toBeInTheDocument()
  view.unmount()
  renderReading()
  expect(screen.getByRole('textbox', { name: 'Mon texte d’opinion' })).toHaveValue('Je propose de protéger notre parc.')
  expect(screen.getByLabelText('J’annonce clairement mon opinion.')).toBeChecked()
  open('Lecture')
  expect(screen.getByLabelText('Transformer une partie du parc en stationnement.')).toBeChecked()
})

it('does not expose another account’s draft', () => {
  const view = renderReading()
  open('Écriture')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte d’opinion' }), { target: { value: 'Private draft' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
  account.userId = 'student-b'
  view.rerender(<FrenchLearningPage />)
  open('Écriture')
  expect(screen.getByRole('textbox', { name: 'Mon texte d’opinion' })).toHaveValue('')
})

it('keeps drafts separate between content workspaces', () => {
  const view = renderReading()
  open('Écriture')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte d’opinion' }), { target: { value: 'Only this workspace' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
  workspace.id = 'another-class'
  view.rerender(<FrenchLearningPage />)
  open('Écriture')
  expect(screen.getByRole('textbox', { name: 'Mon texte d’opinion' })).toHaveValue('')
})

it('handles unavailable storage without falsely promising a saved draft', () => {
  vi.spyOn(browserStorage, 'write').mockReturnValueOnce(false)
  renderReading()
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
  expect(screen.getByText(/Enregistrement indisponible/)).toBeInTheDocument()
})

it('ignores corrupt saved data without crashing', () => {
  localStorage.setItem('deeptutor:v2:local:french-learning:green-spaces:["student-a","french-class"]', '{broken')
  renderReading()
  expect(screen.getByRole('heading', { name: 'Lecture' })).toBeInTheDocument()
})

it('adds navigation without discarding a customized sidebar', () => {
  const entry = NAV_BY_HREF.get('/french-learning')!
  expect(categoryForPath('/french-learning')).toBe('learning')
  expect(entry.label).toBe('French Learning')
  expect(entry.requires).toBeUndefined()
  expect(isNavActive('/french-learning', entry.href)).toBe(true)
  const saved = { order: ['/kanban', '/learning', '/chat'], collapsed: ['/kanban'] }
  const resolved = resolveNavLayout(PRIMARY_NAV_HREFS, saved, DEFAULT_COLLAPSED_NAV)
  expect(resolved.visible).toContain('/french-learning')
  expect(resolved.collapsed).toContain('/kanban')
  expect(saved).toEqual({ order: ['/kanban', '/learning', '/chat'], collapsed: ['/kanban'] })
})

it('keeps the first unit and its unsaved draft intact while visiting the writing workshop', () => {
  renderReading()
  open('Écriture')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte d’opinion' }), { target: { value: 'My original opinion' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unité 2 · Atelier d’écriture' }))
  expect(screen.getByRole('heading', { level: 1, name: 'Atelier d’écriture guidée' })).toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'À qui écris-tu ?' }), { target: { value: 'La direction' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unité 1 · Espaces verts' }))
  expect(screen.getByRole('textbox', { name: 'Mon texte d’opinion' })).toHaveValue('My original opinion')
  fireEvent.click(screen.getByRole('button', { name: 'Unité 2 · Atelier d’écriture' }))
  expect(screen.getByRole('textbox', { name: 'À qui écris-tu ?' })).toHaveValue('La direction')
})

it('preserves both writing units while the foundations unit is visited', () => {
  renderReading()
  open('Écriture')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte d’opinion' }), { target: { value: 'My old course draft' } })
  fireEvent.click(screen.getByRole('button', { name: 'Bases · De la phrase au texte' }))
  expect(screen.getByRole('heading', { level: 1, name: 'De la phrase au texte' })).toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon essai personnel' }), { target: { value: 'My sentence trial' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unité 2 · Atelier d’écriture' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'À qui écris-tu ?' }), { target: { value: 'School principal' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unité 1 · Espaces verts' }))
  expect(screen.getByRole('textbox', { name: 'Mon texte d’opinion' })).toHaveValue('My old course draft')
  fireEvent.click(screen.getByRole('button', { name: 'Bases · De la phrase au texte' }))
  expect(screen.getByRole('textbox', { name: 'Mon essai personnel' })).toHaveValue('My sentence trial')
  fireEvent.click(screen.getByRole('button', { name: 'Unité 2 · Atelier d’écriture' }))
  expect(screen.getByRole('textbox', { name: 'À qui écris-tu ?' })).toHaveValue('School principal')
})


it('starts with everyday quests and preserves the older drafts while switching topics and units', () => {
  render(<FrenchLearningPage />)
  expect(screen.getByRole('heading', { level: 1, name: 'La vie en cinq histoires' })).toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte du défi' }), { target: { value: 'Un sac bleu.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Bases · De la phrase au texte' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon essai personnel' }), { target: { value: 'Ma phrase complète.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Défis · La vie en cinq histoires' }))
  expect(screen.getByRole('textbox', { name: 'Mon texte du défi' })).toHaveValue('Un sac bleu.')
  fireEvent.click(screen.getByRole('button', { name: 'Bases · De la phrase au texte' }))
  expect(screen.getByRole('textbox', { name: 'Mon essai personnel' })).toHaveValue('Ma phrase complète.')
})
