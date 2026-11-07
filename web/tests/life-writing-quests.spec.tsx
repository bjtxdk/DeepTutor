import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { LifeWritingQuests } from '@/features/french-learning/components/LifeWritingQuests'
import { browserStorage } from '@/shared/storage'

beforeEach(() => localStorage.clear())
function level(name: string) { fireEvent.click(within(screen.getByRole('navigation', { name: 'Les cinq défis' })).getByRole('button', { name: new RegExp(name) })) }
it('offers five everyday topics from concrete descriptions to a nuanced opinion without locking exploration', () => {
  render(<LifeWritingQuests scope="student" />)
  expect(within(screen.getByRole('navigation', { name: 'Les cinq défis' })).getAllByRole('button')).toHaveLength(5)
  for (const [topic,heading] of [['objet','L’objet mystère'],['goûter','Le goûter à partager'],['invitation','L’invitation surprise'],['récréation','La récréation imprévue'],['week-end','Mon choix pour le week-end']]) {
    level(topic)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  }
})
it('awards an effort badge only after the objective mini-question, a draft and self-review, then suggests the next topic', () => {
  render(<LifeWritingQuests scope="student" />)
  const badge = screen.getByRole('button', { name: 'Obtenir mon badge d’effort' })
  expect(badge).toBeDisabled()
  fireEvent.click(screen.getByLabelText('Il est vraiment super.'))
  expect(screen.getByText(/Essaie encore/)).toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte du défi' }), { target: { value: 'Mon sac est bleu.' } })
  for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox)
  expect(badge).toBeDisabled()
  fireEvent.click(screen.getByLabelText('Il a deux bretelles et une poche devant.'))
  expect(screen.getByText(/Bien joué/)).toBeInTheDocument()
  fireEvent.click(badge)
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
  expect(screen.getByRole('button', { name: 'Badge obtenu : Œil de détective' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Continuer mon aventure' }))
  expect(screen.getByRole('heading', { name: 'Le goûter à partager' })).toBeInTheDocument()
})
it('keeps a separate plan, draft and choices for each topic, and restores them after saving', () => {
  const view = render(<LifeWritingQuests scope="student" />)
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon objet et son utilisation' }), { target: { value: 'Mon livre du soir' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte du défi' }), { target: { value: 'Mon livre a une couverture verte.' } })
  fireEvent.click(screen.getByLabelText('Il a deux bretelles et une poche devant.'))
  fireEvent.click(screen.getByRole('button', { name: 'Écrire sans les aides' }))
  expect(screen.queryByRole('textbox', { name: 'Mon objet et son utilisation' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Retrouver les aides' }))
  expect(screen.getByRole('textbox', { name: 'Mon objet et son utilisation' })).toHaveValue('Mon livre du soir')
  level('goûter')
  expect(screen.getByRole('textbox', { name: 'Mon texte du défi' })).toHaveValue('')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte du défi' }), { target: { value: 'Verse le yogourt.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer mes défis' }))
  view.unmount()
  render(<LifeWritingQuests scope="student" />)
  expect(screen.getByRole('textbox', { name: 'Mon texte du défi' })).toHaveValue('Verse le yogourt.')
  level('objet')
  expect(screen.getByRole('textbox', { name: 'Mon texte du défi' })).toHaveValue('Mon livre a une couverture verte.')
  expect(screen.getByLabelText('Il a deux bretelles et une poche devant.')).toBeChecked()
})
it('keeps different student/workspace scopes separate and exposes failed saves', () => {
  const view = render(<LifeWritingQuests scope="first" />)
  fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte du défi' }), { target: { value: 'Private trial' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer mes défis' }))
  view.unmount()
  render(<LifeWritingQuests scope="second" />)
  expect(screen.getByRole('textbox', { name: 'Mon texte du défi' })).toHaveValue('')
  vi.spyOn(browserStorage, 'write').mockReturnValueOnce(false)
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer mes défis' }))
  expect(screen.getByText(/Enregistrement indisponible/)).toBeInTheDocument()
})
it('recovers from corrupt saved data', () => {
  localStorage.setItem('deeptutor:v2:local:french-learning:life-quests:broken', '{bad')
  render(<LifeWritingQuests scope="broken" />)
  expect(screen.getByRole('heading', { name: 'L’objet mystère' })).toBeInTheDocument()
})

it('finishes the five-level adventure without losing the completed effort badges', () => {
  render(<LifeWritingQuests scope="student" />)
  const rounds = [
    ['objet', 'Il a deux bretelles et une poche devant.'],
    ['goûter', 'Enfin'],
    ['invitation', 'L’heure et le lieu du rendez-vous.'],
    ['récréation', 'Je suis déçu parce que la pluie interrompt notre partie.'],
    ['week-end', 'Ce jeu plaira à ceux qui aiment les énigmes, mais les règles demandent un peu de patience.'],
  ]
  for (const [topic,answer] of rounds) {
    level(topic)
    fireEvent.click(screen.getByLabelText(answer))
    fireEvent.change(screen.getByRole('textbox', { name: 'Mon texte du défi' }), { target: { value: 'Mon essai personnel. Je vais le relire avec un adulte.' } })
    for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox)
    fireEvent.click(screen.getByRole('button', { name: 'Obtenir mon badge d’effort' }))
  }
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '5')
  expect(screen.getByRole('region', { name: 'Aventure terminée' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Revoir mes défis' }))
  expect(screen.getByRole('heading', { name: 'Mon choix pour le week-end' })).toBeInTheDocument()
})
