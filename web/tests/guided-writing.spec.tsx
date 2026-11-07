import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { GuidedWritingUnit } from '@/features/french-learning/components/GuidedWritingUnit'
import { browserStorage } from '@/shared/storage'

beforeEach(() => localStorage.clear())
function stage(name: string) {
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Étapes de l’atelier' })).getByRole('button', { name: new RegExp(name) }))
}
it('guides the learner through six stages with reasons, examples and retry feedback', () => {
  render(<GuidedWritingUnit scope="student-class" />)
  expect(screen.getByRole('heading', { level: 1, name: 'Atelier d’écriture guidée' })).toBeInTheDocument()
  expect(within(screen.getByRole('navigation', { name: 'Étapes de l’atelier' })).getAllByRole('button')).toHaveLength(6)
  stage('Construire')
  fireEvent.click(screen.getByLabelText('une raison générale'))
  expect(screen.getByText(/À revoir : cette phrase/)).toBeInTheDocument()
  fireEvent.click(screen.getByLabelText('un exemple concret'))
  expect(screen.getByText(/Oui : cette scène/)).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Ma première raison' })).toBeInTheDocument()
})
it('retains the plan, letter, revision and checklist after save and remount', () => {
  const view = render(<GuidedWritingUnit scope="student-class" />)
  fireEvent.change(screen.getByRole('textbox', { name: 'À qui écris-tu ?' }), { target: { value: 'À la direction' } })
  stage('Rédiger')
  fireEvent.change(screen.getByRole('textbox', { name: 'Ma lettre à la direction' }), { target: { value: 'Je propose un coin calme.' } })
  stage('Améliorer')
  expect(screen.getByRole('textbox', { name: 'Ma lettre après révision' })).toHaveValue('Je propose un coin calme.')
  fireEvent.change(screen.getByRole('textbox', { name: /Réécris une phrase/ }), { target: { value: 'Un coin calme permettrait de lire.' } })
  stage('Relire')
  fireEvent.click(screen.getByLabelText('Mon texte répond à la consigne et respecte son destinataire.'))
  fireEvent.click(screen.getByRole('button', { name: 'J’ai travaillé cette étape' }))
  view.unmount()
  render(<GuidedWritingUnit scope="student-class" />)
  expect(screen.getByLabelText('Mon texte répond à la consigne et respecte son destinataire.')).toBeChecked()
  expect(screen.getByText('Je propose un coin calme.')).toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
  stage('Comprendre')
  expect(screen.getByRole('textbox', { name: 'À qui écris-tu ?' })).toHaveValue('À la direction')
  stage('Améliorer')
  expect(screen.getByRole('textbox', { name: /Réécris une phrase/ })).toHaveValue('Un coin calme permettrait de lire.')
})
it('isolates work by scope and tolerates unavailable storage', () => {
  const view = render(<GuidedWritingUnit scope="first" />)
  stage('Rédiger')
  fireEvent.change(screen.getByRole('textbox', { name: 'Ma lettre à la direction' }), { target: { value: 'First student letter' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer mon atelier' }))
  view.unmount()
  render(<GuidedWritingUnit scope="second" />)
  stage('Rédiger')
  expect(screen.getByRole('textbox', { name: 'Ma lettre à la direction' })).toHaveValue('')
  vi.spyOn(browserStorage, 'write').mockReturnValueOnce(false)
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer mon atelier' }))
  expect(screen.getByText(/Enregistrement indisponible/)).toBeInTheDocument()
})
it('falls back safely when saved workshop data is corrupt', () => {
  localStorage.setItem('deeptutor:v2:local:french-learning:writing-workshop:broken', '{invalid')
  render(<GuidedWritingUnit scope="broken" />)
  expect(screen.getByRole('heading', { name: '1. Comprendre la consigne' })).toBeInTheDocument()
})
