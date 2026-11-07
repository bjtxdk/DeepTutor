'use client'
/* eslint-disable i18n/no-literal-ui-text -- Learning activities intentionally remain in Canadian French. */
import { useEffect, useRef, useState } from 'react'
import { BookOpen, Check, ChevronLeft, ChevronRight, Languages, PenLine, SpellCheck } from 'lucide-react'
import { FeaturePage, PageHeader } from '@/components/layout/FeaturePage'
import { Button } from '@/components/ui/Button'
import { browserStorage, defineStorageKey } from '@/shared/storage'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { activeWorkspaceId } from '@/lib/workspace-scope'
import { GuidedWritingUnit } from './GuidedWritingUnit'
import { WritingFoundationsUnit } from './WritingFoundationsUnit'
import { LifeWritingQuests } from './LifeWritingQuests'

const steps = [
  { title: 'Lecture', icon: BookOpen, goal: 'Comprendre et justifier une interprétation', minutes: 20 },
  { title: 'Vocabulaire', icon: Languages, goal: 'Choisir des mots précis en contexte', minutes: 15 },
  { title: 'Grammaire', icon: SpellCheck, goal: 'Accorder et relier ses idées', minutes: 15 },
  { title: 'Écriture', icon: PenLine, goal: 'Défendre une opinion avec des exemples', minutes: 25 },
]
const article = [
  'À la sortie des classes, le petit parc du quartier se remplit de voix. Certains enfants jouent au ballon, tandis que d’autres préfèrent lire à l’ombre des arbres. Pourtant, à la dernière réunion du conseil municipal, un projet a provoqué un débat : une partie du parc pourrait devenir un stationnement. Les commerçants souhaitent accueillir davantage de clients. Des familles, elles, craignent de perdre un lieu de rencontre. Comment prendre une décision qui tient compte des besoins de chacun ?',
  'Pour Léa, élève de cinquième année, le parc est bien plus qu’un terrain de jeu. « Pendant les journées chaudes, nous pouvons nous reposer sous les arbres », explique-t-elle. Les arbres offrent de l’ombre et les surfaces couvertes de végétation absorbent une partie de l’eau de pluie. À l’inverse, une grande surface asphaltée peut accumuler de la chaleur. Protéger les espaces verts aide donc à rendre le quartier plus agréable, surtout en été.',
  'Cependant, Marc, qui travaille dans une boutique voisine, soulève un autre problème. Des clients viennent de loin ou transportent des objets lourds. Ils ne peuvent pas tous se déplacer à pied ou à vélo. Selon lui, un meilleur accès aux magasins pourrait soutenir les commerces du quartier. Il demande que leurs difficultés soient aussi entendues. Son avis rappelle qu’un débat ne se résume pas toujours à choisir entre une bonne et une mauvaise idée.',
  'La classe de Léa propose alors de chercher un compromis. Avant de transformer le parc, pourquoi ne pas compter les places libres dans les rues voisines à différents moments de la journée ? On pourrait aussi mieux indiquer les stationnements existants et améliorer les supports à vélos. Ces pistes ne régleraient peut-être pas toutes les difficultés, mais elles permettraient de comparer plusieurs solutions avant de prendre une décision difficile à annuler.',
  'Les élèves préparent une lettre au conseil municipal. Ils veulent conserver les arbres et l’aire de jeu, tout en reconnaissant les besoins des commerçants. Pour convaincre, ils devront présenter des raisons précises, donner des exemples et écouter les objections. Protéger les espaces verts ne signifie pas ignorer les autres habitants. Cela peut plutôt devenir une occasion de réfléchir ensemble à l’avenir du quartier. Et toi, quelle solution défendrais-tu ? Les informations du texte suffisent-elles, ou faudrait-il en recueillir d’autres ?',
]
const words = [
  ['un espace vert', 'Un lieu où poussent des végétaux, comme un parc.', 'Le quartier souhaite conserver cet espace vert.'],
  ['craindre', 'Avoir peur qu’une chose se produise.', 'Les familles craignent de perdre le parc.'],
  ['absorber', 'Retenir ou laisser entrer un liquide.', 'Le sol peut absorber de l’eau.'],
  ['asphalté', 'Recouvert d’asphalte, comme certaines routes.', 'Le stationnement asphalté est chaud.'],
  ['soulever un problème', 'Attirer l’attention sur une difficulté.', 'Marc soulève le problème du transport.'],
  ['un compromis', 'Une solution où chacun accepte de faire un effort.', 'Le groupe cherche un compromis.'],
  ['une objection', 'Une raison donnée pour contester une idée.', 'Léa écoute les objections avant de répondre.'],
  ['recueillir', 'Rassembler des informations ou des objets.', 'Les élèves recueillent des observations.'],
]
type Question = { id: string; prompt: string; options: string[]; correct: number; explanation: string }
const readingQuiz: Question[] = [
  { id: 'r1', prompt: 'Quel projet déclenche le débat ?', options: ['Transformer une partie du parc en stationnement.', 'Fermer toutes les boutiques.', 'Agrandir la bibliothèque.'], correct: 0, explanation: 'Le premier paragraphe annonce le projet de stationnement. Il ne s’agit pas de fermer les commerces.' },
  { id: 'r2', prompt: 'Pourquoi le texte présente-t-il aussi l’avis de Marc ?', options: ['Pour montrer que les arbres sont inutiles.', 'Pour expliquer un autre besoin à considérer.', 'Pour prouver que tous les clients viennent à vélo.'], correct: 1, explanation: 'Le troisième paragraphe explique les difficultés de certains clients. Reconnaître une objection permet de construire une réponse plus nuancée.' },
  { id: 'r3', prompt: 'Quel résumé respecte le mieux le texte ?', options: ['Tous les habitants refusent les commerces.', 'Le stationnement est la seule solution.', 'Il faut comparer les besoins et explorer plusieurs solutions.'], correct: 2, explanation: 'Les deux derniers paragraphes proposent de recueillir des informations et de rechercher un compromis.' },
]
const vocabularyQuiz: Question[] = [
  { id: 'v1', prompt: 'Dans ce débat, un « compromis » est…', options: ['une victoire sans discussion.', 'une solution qui tient compte de plusieurs besoins.', 'une information inventée.'], correct: 1, explanation: 'Un compromis demande des efforts de plusieurs côtés. Il ne garantit pas que chacun obtient tout ce qu’il souhaite.' },
  { id: 'v2', prompt: 'Quel verbe remplace « recueillir » dans « recueillir des observations » ?', options: ['Rassembler', 'Effacer', 'Refuser'], correct: 0, explanation: 'Recueillir signifie ici rassembler. Le contexte parle d’obtenir davantage d’informations avant de décider.' },
]
const grammarQuiz: Question[] = [
  { id: 'g1', prompt: 'Choisis le groupe du nom correctement accordé.', options: ['Des espace vert précieux', 'Des espaces verts précieux', 'Des espaces verte précieuses'], correct: 1, explanation: '« Espaces » est masculin pluriel : « verts » et « précieux » s’accordent avec ce nom. « Précieux » a déjà un x au singulier.' },
  { id: 'g2', prompt: 'Les élèves ___ une lettre au conseil municipal.', options: ['prépare', 'prépares', 'préparent'], correct: 2, explanation: 'Le sujet « les élèves » peut être remplacé par « ils » : au présent, ils préparent.' },
  { id: 'g3', prompt: 'Le parc est utile. ___, certains commerçants demandent plus de places.', options: ['Cependant', 'Donc', 'Parce que'], correct: 0, explanation: '« Cependant » introduit une opposition. « Donc » annonce plutôt une conséquence.' },
  { id: 'g4', prompt: 'Choisis la phrase correcte.', options: ['Les élèves on écrit à la ville.', 'Les élèves ont écrit à la ville.', 'Les élèves ont écrits à la ville.'], correct: 1, explanation: '« Ont » est le verbe avoir. Dans « ont écrit à la ville », aucun complément direct ne précède le verbe : « écrit » reste ici inchangé.' },
]
const checklist = ['J’annonce clairement mon opinion.', 'Je développe deux raisons avec des exemples.', 'Je reconnais une objection et j’y réponds.', 'J’utilise des connecteurs et des paragraphes.', 'Je vérifie les accords, les verbes et la ponctuation.']
const empty = () => ({ step: 0, done: [] as number[], draft: '', notes: ['', '', ''], checks: [] as number[], answers: {} as Record<string, number> })
type Progress = ReturnType<typeof empty>
function valid(value: unknown): value is Progress {
  if (!value || typeof value !== 'object') return false
  const v = value as Progress
  return Number.isInteger(v.step) && v.step >= 0 && v.step < 4 &&
    Array.isArray(v.done) && v.done.every(n => Number.isInteger(n) && n >= 0 && n < 4) &&
    typeof v.draft === 'string' && v.draft.length <= 20000 &&
    Array.isArray(v.notes) && v.notes.length === 3 && v.notes.every(n => typeof n === 'string' && n.length <= 5000) &&
    Array.isArray(v.checks) && v.checks.every(n => Number.isInteger(n) && n >= 0 && n < checklist.length) &&
    !!v.answers && typeof v.answers === 'object' && !Array.isArray(v.answers) &&
    Object.entries(v.answers).every(([id, n]) => [...readingQuiz, ...vocabularyQuiz, ...grammarQuiz].some(q => q.id === id && Number.isInteger(n) && n >= 0 && n < q.options.length))
}
const field = 'w-full min-w-0 rounded-lg border border-border bg-background p-3 text-sm leading-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const panel = 'rounded-xl border border-border bg-card p-5 sm:p-7'

function Quiz({ title, questions, answers, onAnswer }: { title: string; questions: Question[]; answers: Progress['answers']; onAnswer: (id: string, n: number) => void }) {
  const [submitted, setSubmitted] = useState(false)
  return <section aria-label={title} className="mt-6 space-y-5">
    <h3 className="text-lg font-semibold">{title}</h3>
    {questions.map(q => <fieldset key={q.id} className="space-y-2">
      <legend className="mb-2 font-medium">{q.prompt}</legend>
      {q.options.map((option, n) => <label key={option} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/50">
        <input className="mt-1 shrink-0" type="radio" name={q.id} checked={answers[q.id] === n} onChange={() => { setSubmitted(false); onAnswer(q.id, n) }} />{option}
      </label>)}
      {submitted && <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed">{answers[q.id] === q.correct ? 'Bonne réponse. ' : 'À revoir. '}{q.explanation}</p>}
    </fieldset>)}
    <Button onClick={() => setSubmitted(true)} disabled={questions.some(q => answers[q.id] === undefined)}>Vérifier mes réponses</Button>
    {submitted && <p role="status" className="text-sm">{questions.filter(q => answers[q.id] === q.correct).length} / {questions.length} réponses correctes. Relis les explications et essaie à nouveau.</p>}
  </section>
}

export function FrenchLearningPage() {
  const auth = useAuthStatus()
  if (auth.loading) return <FeaturePage><p aria-busy="true">Chargement du parcours…</p></FeaturePage>
  const scope = JSON.stringify([auth.userId ?? 'local', activeWorkspaceId()])
  return <FrenchUnits key={scope} scope={scope} />
}
function FrenchUnits({ scope }: { scope: string }) {
  const [unit, setUnit] = useState<'reading' | 'writing' | 'foundations' | 'quests'>('quests')
  return <div className="flex h-full min-h-0 flex-col">
    <nav aria-label="Unités de français" className="flex shrink-0 flex-wrap gap-2 border-b border-border px-6 py-3">
      <Button variant={unit === 'quests' ? 'primary' : 'secondary'} aria-pressed={unit === 'quests'} onClick={() => setUnit('quests')}>Défis · La vie en cinq histoires</Button>
      <Button variant={unit === 'foundations' ? 'primary' : 'secondary'} aria-pressed={unit === 'foundations'} onClick={() => setUnit('foundations')}>Bases · De la phrase au texte</Button>
      <Button variant={unit === 'reading' ? 'primary' : 'secondary'} aria-pressed={unit === 'reading'} onClick={() => setUnit('reading')}>Unité 1 · Espaces verts</Button>
      <Button variant={unit === 'writing' ? 'primary' : 'secondary'} aria-pressed={unit === 'writing'} onClick={() => setUnit('writing')}>Unité 2 · Atelier d’écriture</Button>
    </nav>
    <div className="min-h-0 flex-1">
      <div hidden={unit !== 'quests'} className="h-full"><LifeWritingQuests scope={scope} /></div>
      <div hidden={unit !== 'foundations'} className="h-full"><WritingFoundationsUnit scope={scope} /></div>
      <div hidden={unit !== 'reading'} className="h-full"><Course scope={scope} /></div>
      <div hidden={unit !== 'writing'} className="h-full"><GuidedWritingUnit scope={scope} /></div>
    </div>
  </div>
}
function Course({ scope }: { scope: string }) {
  const key = defineStorageKey<Progress>({ name: `french-learning:green-spaces:${scope}`, scope: 'local', version: 1, fallback: empty(), validate: valid })
  const [state, setState] = useState<Progress>(empty)
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const storageKey = defineStorageKey<Progress>({ name: `french-learning:green-spaces:${scope}`, scope: 'local', version: 1, fallback: empty(), validate: valid })
    // Hydrate only after mount so server and browser render the same initial view.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(browserStorage.read(storageKey))
    setReady(true)
  }, [scope])
  const save = () => setSaved(browserStorage.write(key, state) ? 'Enregistré dans ce navigateur.' : 'Enregistrement indisponible. Copie ton texte avant de quitter la page.')
  const update = (next: Progress) => { setState(next); setSaved('Modifications non enregistrées.') }
  const move = (step: number) => {
    const next = { ...state, step }
    setState(next)
    setSaved(browserStorage.write(key, next) ? 'Enregistré dans ce navigateur.' : 'Enregistrement indisponible. Copie ton texte avant de quitter la page.')
    requestAnimationFrame(() => heading.current?.focus())
  }
  const complete = () => {
    const next = { ...state, done: [...new Set([...state.done, state.step])] }
    setState(next)
    setSaved(browserStorage.write(key, next) ? 'Étape marquée comme terminée et enregistrée.' : 'Étape terminée pour cette session ; enregistrement indisponible.')
  }
  const onAnswer = (id: string, n: number) => update({ ...state, answers: { ...state.answers, [id]: n } })
  const count = state.draft.trim() ? state.draft.trim().split(/\s+/u).length : 0
  if (!ready) return <FeaturePage><p aria-busy="true">Chargement du parcours…</p></FeaturePage>
  return <FeaturePage><div lang="fr-CA" className="space-y-6">
    <PageHeader title="French Learning" description="5e année · Français langue seconde · Lire, réfléchir et défendre son point de vue" />
    <section aria-label="Mon parcours" className={`${panel} bg-muted/30`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unité 1 · Vie de quartier · Environ 75 minutes, à ton rythme</p>
      <h2 className="mt-2 text-2xl font-semibold">Faut-il protéger davantage les espaces verts ?</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Explore un débat, compare les arguments et rédige ton opinion. Tu peux répartir ce parcours sur plusieurs séances. Les textes et les situations sont des exemples fictifs.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{state.done.length} / 4 étapes terminées</span>
        <progress aria-label="Progression du parcours" value={state.done.length} max={4} className="h-2 w-40 max-w-full accent-[var(--primary)]" />
        <Button size="sm" variant="secondary" onClick={() => move([0, 1, 2, 3].find(n => !state.done.includes(n)) ?? 3)}>Continuer mon parcours</Button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Progression déclarée par toi, pas une note. Sauvegarde avec « Enregistrer » ou en changeant d’étape. Données locales à ce navigateur, ce compte et cet espace de travail ; aucune synchronisation.</p>
    </section>
    <nav aria-label="Activités de français" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {steps.map(({ title, icon: Icon, minutes }, n) => <button key={title} type="button" aria-current={state.step === n ? 'step' : undefined} onClick={() => move(n)} className={`min-w-0 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${state.step === n ? 'border-primary bg-muted' : 'border-border hover:bg-muted/50'}`}>
        <span className="flex items-center gap-2 text-sm font-semibold"><Icon aria-hidden size={17} />{title}{state.done.includes(n) && <Check aria-label="Terminé" size={16} />}</span>
        <span className="mt-2 block text-xs text-muted-foreground">Étape {n + 1} · {minutes} min</span>
      </button>)}
    </nav>
    <section key={state.step} aria-labelledby="activity-title" className={panel}>
      <p className="text-xs text-muted-foreground">Étape {state.step + 1} sur 4</p>
      <h2 id="activity-title" ref={heading} tabIndex={-1} className="mt-1 text-xl font-semibold focus:outline-none">{steps[state.step].title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Objectif : {steps[state.step].goal}.</p>
      {state.step === 0 && <div>
        <article className="mt-6 max-w-3xl space-y-4 text-base leading-8"><h3 className="text-lg font-semibold">Un parc, plusieurs besoins</h3>{article.map((p, n) => <p key={p}><span className="mr-2 text-xs font-semibold text-muted-foreground">§{n + 1}</span>{p}</p>)}</article>
        <Quiz title="Comprendre le texte" questions={readingQuiz} answers={state.answers} onAnswer={onAnswer} />
        <div className="mt-7 space-y-5"><h3 className="text-lg font-semibold">Aller plus loin : justifie tes idées</h3>
          {['Quelle solution défendrais-tu ? Donne deux raisons et cite un indice du texte.', 'Quelles informations manquent avant de prendre une décision ? Explique leur utilité.', 'Le titre « Un parc, plusieurs besoins » convient-il ? Appuie ta réponse sur deux points de vue.'].map((prompt, n) => <div key={prompt}>
            <label htmlFor={`note-${n}`} className="mb-2 block text-sm font-medium">{prompt}</label>
            <textarea id={`note-${n}`} rows={3} maxLength={5000} value={state.notes[n]} onChange={e => update({ ...state, notes: state.notes.map((v, i) => i === n ? e.target.value : v) })} className={field} />
          </div>)}
          <details className="rounded-lg bg-muted/50 p-4"><summary className="cursor-pointer font-medium">Pistes de réponse et critères</summary><p className="mt-3 text-sm leading-7">Plusieurs réponses sont possibles. Par exemple, préserver les arbres tout en utilisant mieux les places existantes répond à deux besoins (§2 et §4). Il faudrait vérifier le nombre de places libres et les besoins des clients. Une bonne justification relie une idée, un indice précis et une explication. Le titre annonce les points de vue des familles et des commerçants. Ces pistes ne constituent pas une correction automatique.</p></details>
        </div>
      </div>}
      {state.step === 1 && <div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{words.map(([term, definition, example]) => <details key={term} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">{term}</summary><p className="mt-3 text-sm leading-7">{definition}</p><p className="mt-2 text-sm italic text-muted-foreground">{example}</p></details>)}</div>
        <p className="mt-4 text-sm leading-7">Défi oral : remplace « c’est bien » par une expression précise, par exemple « cela offre de l’ombre ». Invente ensuite une phrase avec « objection » et « compromis ».</p>
        <Quiz title="Les mots en contexte" questions={vocabularyQuiz} answers={state.answers} onAnswer={onAnswer} />
      </div>}
      {state.step === 2 && <div>
        <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm leading-7"><h3 className="font-semibold">Une petite boîte à outils</h3><ul className="ml-5 list-disc space-y-2"><li>Dans le groupe du nom, repère le nom et accorde ses adjectifs : des espaces verts précieux.</li><li>Pour accorder le verbe, trouve son sujet : les élèves → ils préparent.</li><li>Cause : parce que. Conséquence : donc. Opposition : cependant. Exemple : par exemple.</li><li>« Ont » peut être remplacé par « avaient » ; « on » peut souvent être remplacé par « il ».</li></ul></div>
        <Quiz title="Réviser mes phrases" questions={grammarQuiz} answers={state.answers} onAnswer={onAnswer} />
      </div>}
      {state.step === 3 && <div className="mt-6 space-y-5">
        <p className="text-sm leading-7">Écris au conseil municipal pour défendre une solution. Vise environ 120 à 180 mots : c’est un repère, pas une note. Présente ton opinion, développe deux raisons avec des exemples, puis réponds à une objection avant de conclure.</p>
        <details className="rounded-lg bg-muted/50 p-4"><summary className="cursor-pointer font-medium">Un plan pour démarrer</summary><ol className="ml-5 mt-3 list-decimal space-y-2 text-sm leading-7"><li>À mon avis, la ville devrait…</li><li>D’abord… Par exemple…</li><li>Ensuite… Cependant, certains pensent que… Je propose…</li><li>En conclusion…</li></ol><p className="mt-3 text-sm">Utilise ce plan comme appui, puis choisis tes propres formulations.</p></details>
        <label htmlFor="opinion" className="block font-medium">Mon texte d’opinion</label>
        <textarea id="opinion" rows={12} maxLength={20000} value={state.draft} onChange={e => update({ ...state, draft: e.target.value })} aria-describedby="word-count" className={field} />
        <p id="word-count" className="text-sm text-muted-foreground">{count} mots environ · Repère : 120–180 mots</p>
        <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Ma relecture</legend>{checklist.map((label, n) => <label key={label} className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5" checked={state.checks.includes(n)} onChange={() => update({ ...state, checks: state.checks.includes(n) ? state.checks.filter(i => i !== n) : [...state.checks, n] })} />{label}</label>)}</fieldset>
        <p className="rounded-lg bg-muted/50 p-4 text-sm leading-7">Autoévaluation : demande-toi quel passage convainc le mieux et lequel tu pourrais préciser. Les réponses ouvertes et le texte ne sont pas notés automatiquement. Tu peux les faire relire par un adulte ou ton enseignant.</p>
      </div>}
      <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-5">
        <Button variant="secondary" onClick={save}>Enregistrer</Button>
        <Button onClick={complete} disabled={state.done.includes(state.step)}>{state.done.includes(state.step) ? 'Étape terminée' : 'Marquer cette étape terminée'}</Button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-muted-foreground">{saved || 'Reprends ton travail ici après l’avoir enregistré.'}</p>
      <div className="mt-5 flex flex-wrap justify-between gap-3">
        <Button variant="ghost" disabled={state.step === 0} onClick={() => move(state.step - 1)} icon={<ChevronLeft size={16} />}>Étape précédente</Button>
        <Button variant="secondary" disabled={state.step === 3} onClick={() => move(state.step + 1)}>Étape suivante<ChevronRight aria-hidden size={16} /></Button>
      </div>
    </section>
    <aside className={`${panel} text-sm leading-7`}><h2 className="font-semibold">Et après cette unité ?</h2><p className="mt-2 text-muted-foreground">Poursuis avec « Unité 2 · Atelier d’écriture » en haut de la page. Tu y apprendras à préparer, rédiger et réviser une lettre d’opinion sur la cour d’école, en six étapes guidées.</p></aside>
  </div></FeaturePage>
}
