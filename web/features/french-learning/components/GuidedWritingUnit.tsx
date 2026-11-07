'use client'
/* eslint-disable i18n/no-literal-ui-text -- French writing instruction stays in the target language. */
import { useEffect, useRef, useState } from 'react'
import { FeaturePage, PageHeader } from '@/components/layout/FeaturePage'
import { Button } from '@/components/ui/Button'
import { browserStorage, defineStorageKey } from '@/shared/storage'

const stages = ['Comprendre la consigne', 'Construire ses arguments', 'Organiser son texte', 'Rédiger un brouillon', 'Améliorer ses phrases', 'Relire et partager']
const prompts = [
  ['destinataire', 'À qui écris-tu ?', 'Qui prendra la décision ? Quel ton convient à cette personne ?'],
  ['objectif', 'Que veux-tu obtenir ?', 'Formule le changement que tu proposes.'],
  ['opinion', 'Mon opinion', 'Quelle solution défends-tu et pourquoi ?'],
  ['raison1', 'Ma première raison', 'Évite « c’est bien » : précise un bénéfice.'],
  ['exemple1', 'Un exemple pour cette raison', 'Décris une situation concrète, sans inventer de statistiques.'],
  ['raison2', 'Ma deuxième raison', 'Choisis une idée différente de la première.'],
  ['exemple2', 'Un exemple pour ma deuxième raison', 'Explique ce que cet exemple permet de comprendre.'],
  ['objection', 'Un autre point de vue', 'Que pourrait répondre une personne en désaccord ?'],
  ['reponse', 'Ma réponse à cette objection', 'Reconnais le besoin exprimé, puis propose une solution.'],
  ['conclusion', 'Ma conclusion', 'Rappelle ta proposition sans recopier ton introduction.'],
] as const
const reviewItems = ['Mon texte répond à la consigne et respecte son destinataire.', 'Mon opinion est claire et mes deux raisons sont différentes.', 'Chaque raison est soutenue par un exemple expliqué.', 'Je réponds à une objection sans me moquer de l’autre avis.', 'Mes paragraphes et mes connecteurs rendent les idées faciles à suivre.', 'J’ai vérifié les accords, les verbes, les accents et la ponctuation.']
const initial = () => ({ stage: 0, completed: [] as number[], plan: {} as Record<string, string>, draft: '', revision: '', review: [] as number[], choice: '' })
type Work = ReturnType<typeof initial>
function valid(value: unknown): value is Work {
  if (!value || typeof value !== 'object') return false
  const v = value as Work
  return Number.isInteger(v.stage) && v.stage >= 0 && v.stage < stages.length &&
    Array.isArray(v.completed) && v.completed.every(n => Number.isInteger(n) && n >= 0 && n < stages.length) && new Set(v.completed).size === v.completed.length &&
    !!v.plan && typeof v.plan === 'object' && !Array.isArray(v.plan) && Object.entries(v.plan).every(([k, text]) => prompts.some(([id]) => id === k) && typeof text === 'string' && text.length <= 4000) &&
    typeof v.draft === 'string' && v.draft.length <= 20000 && typeof v.revision === 'string' && v.revision.length <= 4000 &&
    Array.isArray(v.review) && v.review.every(n => Number.isInteger(n) && n >= 0 && n < reviewItems.length) && ['','reason','example'].includes(v.choice)
}
const field = 'w-full min-w-0 rounded-lg border border-border bg-background p-3 text-sm leading-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const card = 'rounded-xl border border-border p-5 sm:p-6'

export function GuidedWritingUnit({ scope }: { scope: string }) {
  const key = defineStorageKey<Work>({ name: `french-learning:writing-workshop:${scope}`, scope: 'local', version: 1, fallback: initial(), validate: valid })
  const [work, setWork] = useState<Work>(initial)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('')
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const storageKey = defineStorageKey<Work>({ name: `french-learning:writing-workshop:${scope}`, scope: 'local', version: 1, fallback: initial(), validate: valid })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWork(browserStorage.read(storageKey))
    setReady(true)
  }, [scope])
  const update = (next: Work) => { setWork(next); setStatus('Modifications non enregistrées.') }
  const save = (next = work) => { setWork(next); setStatus(browserStorage.write(key, next) ? 'Atelier enregistré dans ce navigateur.' : 'Enregistrement indisponible : copie ton travail avant de quitter.') }
  const go = (stage: number) => { save({ ...work, stage }); requestAnimationFrame(() => title.current?.focus()) }
  const inputs = (ids: readonly string[]) => prompts.filter(([id]) => ids.includes(id)).map(([id, label, hint]) => <div key={id}>
    <label htmlFor={`writing-${id}`} className="mb-2 block text-sm font-semibold">{label}</label>
    <p id={`hint-${id}`} className="mb-2 text-sm leading-6 text-muted-foreground">{hint}</p>
    <textarea id={`writing-${id}`} aria-describedby={`hint-${id}`} rows={3} maxLength={4000} className={field} value={work.plan[id] ?? ''} onChange={e => update({ ...work, plan: { ...work.plan, [id]: e.target.value } })} />
  </div>)
  const count = work.draft.trim() ? work.draft.trim().split(/\s+/u).length : 0
  if (!ready) return <FeaturePage><p aria-busy="true">Chargement de l’atelier…</p></FeaturePage>
  return <FeaturePage><div lang="fr-CA" className="space-y-6">
    <PageHeader title="Atelier d’écriture guidée" description="Unité 2 · 5e année · Français langue seconde · Deux séances de 30 à 40 minutes, à adapter" />
    <section className={`${card} bg-muted/30`} aria-label="Mission d’écriture">
      <h2 className="text-xl font-semibold">Convaincre avec des raisons et des exemples</h2>
      <p className="mt-3 text-sm leading-7">Mission fictive : écris à la direction de ton école pour proposer une amélioration de la cour. Tu peux défendre l’ajout d’un coin calme, d’arbres ou d’un espace de jeux. Choisis une proposition et tiens compte des autres élèves.</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">Tu construis ton propre texte, pas une réponse à recopier. Cet atelier a son propre plan, son brouillon et sa progression : ton travail sur les espaces verts reste séparé.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm">{work.completed.length} / 6 étapes travaillées</span><progress aria-label="Progression de l’atelier" value={work.completed.length} max={6} className="h-2 w-36 max-w-full" /><Button variant="secondary" size="sm" onClick={() => go(stages.findIndex((_, n) => !work.completed.includes(n)) < 0 ? 5 : stages.findIndex((_, n) => !work.completed.includes(n)))}>Reprendre mon atelier</Button></div>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">Enregistre avant de quitter. Changer d’étape enregistre aussi ton travail dans ce navigateur, ce compte et cet espace de travail. La progression est déclarée par toi ; ce n’est pas une note.</p>
    </section>
    <nav aria-label="Étapes de l’atelier" className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">{stages.map((label, n) => <button key={label} type="button" onClick={() => go(n)} aria-current={work.stage === n ? 'step' : undefined} className={`rounded-lg border p-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${work.stage === n ? 'border-primary bg-muted' : 'border-border hover:bg-muted/50'}`}>{n + 1}. {label}{work.completed.includes(n) ? ' ✓' : ''}</button>)}</nav>
    <section className={`${card} space-y-5`} aria-labelledby="workshop-stage" key={work.stage}>
      <h2 id="workshop-stage" ref={title} tabIndex={-1} className="text-xl font-semibold focus:outline-none">{work.stage + 1}. {stages[work.stage]}</h2>
      {work.stage === 0 && <>
        <p className="text-sm leading-7">Avant d’écrire, repère trois choses : le destinataire, le but et la forme du texte. Ici, tu écris une lettre d’opinion à la direction pour proposer un aménagement de la cour. Un ton poli et des exemples de la vie scolaire seront plus utiles que des ordres.</p>
        <details className="rounded-lg bg-muted/50 p-4"><summary className="cursor-pointer font-medium">Comment je réfléchis avant d’écrire</summary><p className="mt-3 text-sm leading-7">« Je ne raconte pas simplement ma récréation : je veux convaincre. Je dois donc expliquer un besoin et montrer comment ma proposition y répond. » Reformule ensuite la mission avec tes propres mots.</p></details>
        {inputs(['destinataire', 'objectif', 'opinion'])}
      </>}
      {work.stage === 1 && <>
        <div className="rounded-lg bg-muted/50 p-4 text-sm leading-7"><h3 className="font-semibold">Raison → exemple → explication</h3><p>Raison : un coin calme répondrait aux besoins des élèves qui souhaitent se reposer.</p><p>Exemple : pendant la récréation, un élève pourrait y lire à l’écart du ballon.</p><p>Explication : cet espace lui permettrait de profiter de la pause sans participer à un jeu bruyant.</p></div>
        <fieldset className="space-y-3"><legend className="mb-2 text-sm font-semibold">« Un élève pourrait lire à l’écart du ballon » est surtout…</legend>{[['reason','une raison générale'],['example','un exemple concret']].map(([value,label]) => <label key={value} className="flex items-center gap-3 text-sm"><input type="radio" name="reason-example" value={value} checked={work.choice === value} onChange={() => update({ ...work, choice: value })} />{label}</label>)}</fieldset>
        {work.choice && <p role="status" className="rounded-lg bg-muted/50 p-3 text-sm leading-7">{work.choice === 'example' ? 'Oui : cette scène précise illustre le besoin de calme.' : 'À revoir : cette phrase décrit une scène précise. La raison générale est le besoin de calme.'} Tu peux modifier ton choix.</p>}
        {inputs(['raison1','exemple1','raison2','exemple2'])}
      </>}
      {work.stage === 2 && <>
        <ol className="ml-5 list-decimal space-y-2 text-sm leading-7"><li>Introduction : nomme le sujet et ton opinion.</li><li>Développement : explique deux raisons différentes, chacune avec un exemple.</li><li>Objection : reconnais un autre besoin et réponds-y avec respect.</li><li>Conclusion : rappelle la solution et invite à la considérer.</li></ol>
        <p className="text-sm leading-7">Pour relier tes idées : d’abord, ensuite, par exemple, parce que, cependant, donc, en conclusion. Choisis le lien qui correspond à ta pensée, plutôt que d’ajouter un connecteur à chaque phrase.</p>
        <details className="rounded-lg bg-muted/50 p-4"><summary className="cursor-pointer font-medium">Exemple d’objection et de réponse</summary><p className="mt-3 text-sm leading-7">« Certains élèves veulent garder assez de place pour les jeux de ballon. Cependant, un petit coin calme près de la clôture pourrait répondre à un autre besoin sans occuper tout le terrain. » Cet exemple propose un compromis ; il ne prouve pas que cet emplacement existe dans ton école.</p></details>
        {inputs(['objection','reponse','conclusion'])}
      </>}
      {work.stage === 3 && <>
        <p className="text-sm leading-7">Rédige maintenant une lettre d’environ 120 à 180 mots. Cette longueur est un repère, pas une note. Utilise ton plan comme aide, sans le recopier mot pour mot. Ajoute une formule d’appel et une formule de politesse ; tu peux signer avec des initiales.</p>
        <details className="rounded-lg bg-muted/50 p-4"><summary className="cursor-pointer font-medium">Consulter mon plan</summary><dl className="mt-3 space-y-3">{prompts.map(([id,label]) => <div key={id}><dt className="text-sm font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{work.plan[id] || 'À compléter dans les étapes précédentes.'}</dd></div>)}</dl></details>
        <label htmlFor="guided-draft" className="block font-semibold">Ma lettre à la direction</label><textarea id="guided-draft" rows={14} maxLength={20000} value={work.draft} onChange={e => update({ ...work, draft: e.target.value })} className={field} aria-describedby="guided-count" />
        <p id="guided-count" className="text-sm text-muted-foreground">{count} mots environ · Repère : 120–180</p>
      </>}
      {work.stage === 4 && <>
        <div className="rounded-lg bg-muted/50 p-4 text-sm leading-7"><h3 className="font-semibold">Observer une amélioration</h3><p>Avant : « Je veux un coin calme. C’est bien. Tout le monde aime ça. »</p><p>Après : « Je propose un coin calme pour les élèves qui souhaitent lire ou se reposer. Par exemple, quelques bancs à l’écart des jeux de ballon leur offriraient une autre façon de profiter de la récréation. »</p><p className="mt-2">Qu’est-ce qui change ? Le besoin est précisé, un exemple est ajouté et « tout le monde » n’est plus présenté comme un fait sans preuve.</p></div>
        <label htmlFor="guided-revision" className="block font-semibold">Réécris une phrase de ton brouillon pour la rendre plus précise</label><textarea id="guided-revision" rows={4} maxLength={4000} value={work.revision} onChange={e => update({ ...work, revision: e.target.value })} className={field} />
        <p className="text-sm leading-7">Compare ta nouvelle phrase avec l’ancienne : précise-t-elle qui, pourquoi ou comment ? Évite-t-elle une répétition ou une généralisation ?</p>
        <label htmlFor="revised-letter" className="block font-semibold">Ma lettre après révision</label><textarea id="revised-letter" rows={12} maxLength={20000} value={work.draft} onChange={e => update({ ...work, draft: e.target.value })} className={field} />
        <p className="text-xs leading-6 text-muted-foreground">Ce champ modifie le même brouillon que l’étape 4. La phrase d’essai reste séparée : rien n’est remplacé automatiquement.</p>
      </>}
      {work.stage === 5 && <>
        <p className="text-sm leading-7">Relis une première fois pour les idées, puis une deuxième fois pour la langue. Coche seulement ce que tu as réellement vérifié ; tu peux retourner modifier ton texte.</p>
        <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Ma vérification finale</legend>{reviewItems.map((label,n) => <label key={label} className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={work.review.includes(n)} onChange={() => update({ ...work, review: work.review.includes(n) ? work.review.filter(i => i !== n) : [...work.review,n] })} />{label}</label>)}</fieldset>
        <h3 className="font-semibold">Ma lettre à relire avec un adulte</h3><p className="whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-4 text-sm leading-7">{work.draft || 'Ton brouillon est vide. Retourne à l’étape 4 pour commencer.'}</p>
        <p className="text-sm leading-7">Demande : « Quelle raison te convainc le plus ? Où manque-t-il une explication ? » Choisis ensuite une amélioration à faire. Cet atelier ne note pas automatiquement ta lettre et ne l’envoie à personne. Tu peux copier le texte pour le partager toi-même.</p>
        <Button variant="secondary" onClick={() => go(4)}>Retourner améliorer ma lettre</Button>
      </>}
      <div className="flex flex-wrap gap-3 border-t border-border pt-5"><Button variant="secondary" onClick={() => save()}>Enregistrer mon atelier</Button><Button disabled={work.completed.includes(work.stage)} onClick={() => save({ ...work, completed: [...new Set([...work.completed,work.stage])] })}>{work.completed.includes(work.stage) ? 'Étape travaillée' : 'J’ai travaillé cette étape'}</Button></div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{status || 'Ton travail reste local à ce navigateur.'}</p>
      <div className="flex flex-wrap justify-between gap-3"><Button variant="ghost" disabled={work.stage === 0} onClick={() => go(work.stage - 1)}>Retour à l’étape précédente</Button><Button variant="secondary" disabled={work.stage === stages.length - 1} onClick={() => go(work.stage + 1)}>Passer à l’étape suivante</Button></div>
    </section>
  </div></FeaturePage>
}
