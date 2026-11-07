'use client'
/* eslint-disable i18n/no-literal-ui-text -- Fixed French writing exercises remain in the target language. */
import { useEffect, useRef, useState } from 'react'
import { Search, Utensils, Mail, CloudRain, Star, Check } from 'lucide-react'
import { FeaturePage, PageHeader } from '@/components/layout/FeaturePage'
import { Button } from '@/components/ui/Button'
import { browserStorage, defineStorageKey } from '@/shared/storage'

const quests = [
  {
    title: 'L’objet mystère', icon: Search, genre: 'Décrire', time: '10–15 min', length: '3 à 5 phrases', badge: 'Œil de détective',
    mission: 'Choisis un objet de ton quotidien : sac, ballon, livre ou vêtement. Décris-le sans le nommer tout de suite. Un proche doit pouvoir le reconnaître grâce à tes indices.',
    skill: 'Écrire des phrases complètes et ajouter des détails précis.',
    model: 'Mon objet est bleu et assez grand pour contenir mes cahiers. Il possède deux bretelles et une petite poche devant. Chaque matin, je le porte pour aller à l’école. As-tu deviné ? C’est mon sac à dos.',
    before: 'Il est beau. Je l’aime.', after: 'Il est bleu foncé et sa poche avant contient mes crayons.',
    tip: 'Remplace un jugement vague par une couleur, une forme, une matière ou une utilisation. Commence par des phrases courtes : elles peuvent être très claires.',
    prompts: ['Mon objet et son utilisation', 'Deux détails qui le rendent reconnaissable', 'Une phrase-indice pour le faire deviner'],
    bank: ['Il possède…', 'Il sert à…', 'Sa surface est…', 'une poche', 'lisse', 'souple'],
    question: 'Quel indice aide le mieux à reconnaître un objet ?', options: ['Il est vraiment super.', 'Il a deux bretelles et une poche devant.', 'Je l’aime beaucoup.'], answer: 1,
    explanation: 'Les bretelles et la poche sont des détails observables. « Super » ou « je l’aime » expriment un avis, mais permettent difficilement de reconnaître l’objet.',
    checks: ['Mes phrases disent clairement de quoi je parle.', 'J’ai donné au moins deux détails observables.', 'J’ai vérifié les majuscules et les points.'],
    launch: 'Mon objet… Il possède… Il sert à…',
  },
  {
    title: 'Le goûter à partager', icon: Utensils, genre: 'Expliquer une suite d’actions', time: '15–20 min', length: '5 à 7 phrases', badge: 'Chef des étapes',
    mission: 'Explique à un ami comment préparer un goûter simple sans cuisson, par exemple un bol de yogourt aux fruits. Ton lecteur doit pouvoir suivre les actions dans le bon ordre.',
    skill: 'Utiliser des verbes précis et des mots qui organisent les étapes.',
    model: 'Pour préparer mon bol, il faut du yogourt, une banane et des céréales. D’abord, verse le yogourt dans un bol. Ensuite, pèle la banane et coupe-la en petits morceaux. Ajoute les morceaux sur le yogourt. Puis, répartis les céréales sur le dessus. Enfin, mélange doucement si tu préfères une texture uniforme.',
    before: 'Tu mets les choses. Après tu fais le reste.', after: 'Verse le yogourt dans un bol, puis ajoute les morceaux de banane.',
    tip: 'Nomme ce que tu utilises et choisis un verbe concret : verser, ajouter, mélanger. Garde la même façon de t’adresser au lecteur, par exemple « Verse… Ajoute… ».',
    prompts: ['Ce qu’il faut préparer', 'Les actions, dans l’ordre', 'Comment savoir que le goûter est prêt'],
    bank: ['d’abord', 'ensuite', 'puis', 'enfin', 'verse', 'ajoute', 'mélange'],
    question: 'Quel mot annonce normalement la dernière étape ?', options: ['D’abord', 'Enfin', 'Parce que'], answer: 1,
    explanation: '« Enfin » annonce la fin d’une suite. « D’abord » commence la préparation ; « parce que » sert à expliquer une cause.',
    checks: ['J’ai nommé les ingrédients ou le matériel.', 'Mes actions sont dans un ordre facile à suivre.', 'J’ai choisi des verbes précis et des mots de succession.'],
    launch: 'Pour préparer… il faut… D’abord… Ensuite… Enfin…',
  },
  {
    title: 'L’invitation surprise', icon: Mail, genre: 'Écrire un message', time: '15–20 min', length: '6 à 8 phrases', badge: 'Messager attentionné',
    mission: 'Écris une invitation fictive à un ami pour un après-midi de jeux, une sortie au parc ou une activité créative. Donne les informations utiles, explique ce qui lui plairait et demande une réponse. Utilise des prénoms et des lieux imaginaires.',
    skill: 'Penser à son lecteur : qui, quoi, quand, où et pourquoi.',
    model: 'Salut Camille ! Je t’invite à un après-midi de jeux samedi, de 14 h à 16 h. Nous nous retrouverons à la salle des loisirs du quartier. J’aimerais essayer notre nouveau jeu de coopération. Comme tu aimes résoudre des énigmes, je pense que cette activité te plaira. Tu peux aussi proposer un jeu. Peux-tu me dire vendredi si tu seras disponible ? À bientôt ! Alex',
    before: 'Viens jouer bientôt. Ça sera bien.', after: 'Je t’invite samedi, de 14 h à 16 h, à la salle des loisirs pour essayer un jeu de coopération.',
    tip: 'Un message n’est pas seulement une liste d’informations. Une salutation, une raison personnelle et une question de confirmation aident le lecteur à se sentir invité.',
    prompts: ['L’activité, le moment et le lieu imaginaires', 'Pourquoi mon ami pourrait aimer cette activité', 'Comment lui demander de confirmer'],
    bank: ['Je t’invite…', 'Nous pourrions…', 'Comme tu aimes…', 'Serais-tu disponible ?', 'À bientôt !'],
    question: 'Dans « Viens jouer samedi ! », quelles informations pratiques manquent encore ?', options: ['La couleur préférée de l’auteur.', 'Une liste de tous ses amis.', 'L’heure et le lieu du rendez-vous.'], answer: 2,
    explanation: 'L’ami sait quoi faire et quel jour venir, mais il lui manque l’heure et le lieu. Relire du point de vue du destinataire aide à repérer ce qui manque.',
    checks: ['Mon ami sait quoi faire, quand et où venir.', 'J’ai expliqué pourquoi cette activité pourrait lui plaire.', 'Mon message contient une salutation et une demande de réponse.'],
    launch: 'Salut… Je t’invite… Comme tu aimes… Peux-tu… ?',
  },
  {
    title: 'La récréation imprévue', icon: CloudRain, genre: 'Raconter une histoire', time: '20–25 min', length: '80 à 120 mots, à adapter', badge: 'Conteur des surprises',
    mission: 'Raconte une récréation réelle ou inventée qui ne se passe pas comme prévu : une averse arrive, un ballon disparaît ou une nouvelle personne rejoint le groupe. Présente la situation, un petit problème, une réaction et la fin.',
    skill: 'Organiser un récit dans le temps et relier actions et émotions.',
    model: 'Pendant la récréation, Inès et ses amis jouent au ballon près du préau. Soudain, une averse les oblige à se mettre à l’abri. Inès est déçue, car leur partie vient de commencer. Elle remarque alors un élève qui attend seul. Elle lui propose de choisir un jeu de devinettes. Le groupe se rassemble et chacun invente une énigme. Peu à peu, les rires remplacent les plaintes contre la pluie. Lorsque la cloche sonne, Inès est surprise : cette récréation a été amusante malgré le changement de programme.',
    before: 'Il pleut. Je suis triste. On joue à autre chose.', after: 'Quand la pluie interrompt notre partie, je suis déçu. Alors, je propose un jeu de devinettes sous le préau.',
    tip: 'Montre ce qui provoque l’émotion et ce que le personnage fait ensuite. Choisis un temps principal, par exemple le présent, et garde une suite d’événements compréhensible.',
    prompts: ['Au début : qui, où et quelle activité ?', 'Le problème et la réaction du personnage', 'La solution et ce qui change à la fin'],
    bank: ['au début', 'soudain', 'alors', 'peu à peu', 'finalement', 'déçu', 'soulagé'],
    question: 'Quelle phrase relie une émotion à sa cause ?', options: ['Je suis déçu parce que la pluie interrompt notre partie.', 'Je suis déçu. Le préau est gris.', 'Il pleut. Il y a une cloche.'], answer: 0,
    explanation: '« Parce que » explique ici pourquoi le personnage est déçu. Les autres propositions juxtaposent des informations sans rendre ce lien clair.',
    checks: ['On comprend la situation de départ et le problème.', 'Une réaction ou une action mène vers la fin.', 'J’ai relié une émotion à un événement et relu mes verbes.'],
    launch: 'Au début… Soudain… Je me sens… Alors… Finalement…',
  },
  {
    title: 'Mon choix pour le week-end', icon: Star, genre: 'Donner un avis argumenté', time: '25–30 min', length: '120 à 160 mots, à adapter', badge: 'Critique bienveillant',
    mission: 'Choisis un livre, un jeu ou une activité de week-end que tu connais. Recommande-le à quelqu’un de ton âge. Donne deux raisons différentes avec des exemples, reconnais une limite et termine par un conseil. Tu peux aussi imaginer une activité.',
    skill: 'Développer un avis avec des preuves concrètes et une nuance.',
    model: 'Pour un samedi pluvieux, je recommande un jeu de coopération. D’abord, les joueurs doivent discuter au lieu de chercher seulement à gagner seuls. Par exemple, chacun peut expliquer son idée avant que le groupe choisisse une stratégie. Ensuite, une partie permet de partager un défi sans écran. On peut faire une pause pour parler de ce qui a bien fonctionné. Cependant, certains jeux ont des règles longues à apprendre : il vaut mieux commencer par une version courte. Je conseillerais donc cette activité aux amis qui aiment réfléchir ensemble et qui acceptent d’écouter plusieurs solutions. Pour une première partie, je choisirais un jeu dont tout le monde comprend rapidement le but. Une personne pourrait lire les règles à voix haute, puis nous ferions un essai. Ainsi, chacun aurait le temps de poser ses questions avant de commencer.',
    before: 'Ce jeu est le meilleur. Tout le monde va l’aimer.', after: 'Je recommande ce jeu aux amis qui aiment réfléchir ensemble, car les joueurs doivent discuter pour résoudre les défis.',
    tip: 'Distingue un goût personnel d’un fait. Explique pour qui ton choix convient et évite « tout le monde ». Une petite limite rend ton conseil plus utile, pas forcément moins convaincant.',
    prompts: ['Mon choix et les personnes à qui je le recommande', 'Deux raisons différentes, chacune avec un exemple', 'Une limite et mon conseil final'],
    bank: ['je recommande', 'd’abord', 'par exemple', 'ensuite', 'cependant', 'cela convient à…', 'je conseille'],
    question: 'Quel avis aide le mieux le lecteur à choisir ?', options: ['C’est le meilleur, sans discussion.', 'Ce jeu plaira à ceux qui aiment les énigmes, mais les règles demandent un peu de patience.', 'Tout le monde doit l’acheter.'], answer: 1,
    explanation: 'Cet avis nomme un public, une qualité et une limite. Il permet au lecteur de décider selon ses préférences plutôt que de suivre une affirmation absolue.',
    checks: ['J’ai formulé mon avis et développé deux raisons différentes.', 'Mes exemples soutiennent les raisons et je reconnais une limite.', 'J’ai organisé mes paragraphes et relu les accords et les verbes.'],
    launch: 'Je recommande… D’abord… Par exemple… Ensuite… Cependant… Je conseille…',
  },
]
const initial = () => ({ level: 0, drafts: Array<string>(5).fill(''), plans: Array.from({length:5},()=>Array<string>(3).fill('')), choices: {} as Record<string,number>, reviews: Array.from({length:5},()=>[] as number[]), badges: [] as number[] })
type Work = ReturnType<typeof initial>
function valid(value: unknown): value is Work {
  if (!value || typeof value !== 'object') return false
  const v = value as Work
  const indices = (a: unknown, max: number): a is number[] => Array.isArray(a) && a.every(n=>Number.isInteger(n) && n>=0 && n<max) && new Set(a).size===a.length
  return Number.isInteger(v.level) && v.level>=0 && v.level<5 && Array.isArray(v.drafts) && v.drafts.length===5 && v.drafts.every(s=>typeof s==='string' && s.length<=20000) &&
    Array.isArray(v.plans) && v.plans.length===5 && v.plans.every(a=>Array.isArray(a) && a.length===3 && a.every(s=>typeof s==='string' && s.length<=4000)) &&
    !!v.choices && typeof v.choices==='object' && !Array.isArray(v.choices) && Object.entries(v.choices).every(([k,n])=>/^[0-4]$/.test(k) && Number.isInteger(n) && n>=0 && n<3) &&
    Array.isArray(v.reviews) && v.reviews.length===5 && v.reviews.every(a=>indices(a,3)) && indices(v.badges,5)
}
const card='rounded-xl border border-border p-5 sm:p-6'
const field='w-full min-w-0 rounded-lg border border-border bg-background p-3 text-sm leading-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
export function LifeWritingQuests({scope}:{scope:string}) {
  const key=defineStorageKey<Work>({name:`french-learning:life-quests:${scope}`,scope:'local',version:1,fallback:initial(),validate:valid})
  const [work,setWork]=useState<Work>(initial)
  const [ready,setReady]=useState(false)
  const [status,setStatus]=useState('')
  const [hints,setHints]=useState(true)
  const title=useRef<HTMLHeadingElement>(null)
  useEffect(()=>{
    const storageKey=defineStorageKey<Work>({name:`french-learning:life-quests:${scope}`,scope:'local',version:1,fallback:initial(),validate:valid})
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWork(browserStorage.read(storageKey))
    setReady(true)
  },[scope])
  const update=(next:Work)=>{setWork(next);setStatus('Modifications non enregistrées.')}
  const save=(next=work)=>{setWork(next);setStatus(browserStorage.write(key,next)?'Défis enregistrés dans ce navigateur.':'Enregistrement indisponible : copie ton texte avant de quitter.')}
  const go=(level:number)=>{save({...work,level});requestAnimationFrame(()=>title.current?.focus())}
  if(!ready)return <FeaturePage><p aria-busy="true">Chargement des défis…</p></FeaturePage>
  const q=quests[work.level], choice=work.choices[String(work.level)], draft=work.drafts[work.level]
  const canBadge=choice===q.answer && draft.trim().length>0 && work.reviews[work.level].length===q.checks.length
  const count=draft.trim()?draft.trim().split(/\s+/u).length:0
  const pending=quests.findIndex((_,i)=>!work.badges.includes(i))
  return <FeaturePage><div lang="fr-CA" className="space-y-6">
    <PageHeader title="La vie en cinq histoires" description="5 défis d’écriture · Français langue seconde · Du concret au texte développé" />
    <section aria-label="Carte des défis" className={`${card} bg-muted/30`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observer → expliquer → inviter → raconter → donner son avis</p>
      <h2 className="mt-2 text-xl font-semibold">Une petite aventure d’écriture à chaque étape</h2>
      <p className="mt-3 text-sm leading-7">Commence au défi 1, puis avance à ton rythme. Les thèmes viennent de la vie quotidienne ; tu peux inventer des détails. Toutes les étapes restent accessibles pour explorer ou recommencer, sans compte à rebours.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm font-medium">{work.badges.length} / 5 badges d’effort</span><progress aria-label="Progression des défis" value={work.badges.length} max={5} className="h-2 w-36 max-w-full" /><Button variant="secondary" size="sm" onClick={()=>go(pending<0?4:pending)}>{pending<0?'Revoir mes défis':'Continuer mon aventure'}</Button></div>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">Un badge reconnaît un essai, une question comprise et une relecture déclarée par toi ; il ne valide pas la qualité du texte. Enregistre avant de fermer. Changer de défi enregistre aussi ton travail localement dans ce navigateur, ce compte et cet espace.</p>
    </section>
    <nav aria-label="Les cinq défis" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{quests.map(({title,icon:Icon,genre,time},i)=><button type="button" key={title} onClick={()=>go(i)} aria-current={work.level===i?'step':undefined} className={`min-w-0 rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${work.level===i?'border-primary bg-muted':'border-border hover:bg-muted/50'}`}><span className="flex items-center gap-2 text-sm font-semibold"><Icon aria-hidden size={18} className="shrink-0" />{i+1}. {title}{work.badges.includes(i)&&<Check aria-label="Badge obtenu" size={16} className="shrink-0" />}</span><span className="mt-2 block text-xs text-muted-foreground">{genre} · {time}</span></button>)}</nav>
    <section key={work.level} aria-labelledby="quest-title" className={`${card} space-y-5`}>
      <p className="text-xs text-muted-foreground">Défi {work.level+1} / 5 · {q.genre} · Repère : {q.length}</p>
      <h2 id="quest-title" ref={title} tabIndex={-1} className="text-xl font-semibold focus:outline-none">{q.title}</h2>
      <p className="text-sm leading-7">{q.mission}</p><p className="text-sm font-medium">Mon superpouvoir à travailler : {q.skill}</p>
      <details className="rounded-lg bg-muted/50 p-4"><summary className="cursor-pointer font-medium">Observer un exemple fictif</summary><p className="mt-3 text-sm leading-7">{q.model}</p><p className="mt-3 text-xs text-muted-foreground">Observe la manière de construire le texte, puis écris tes propres idées. Cet exemple n’est pas à recopier.</p></details>
      <div className="rounded-lg bg-muted/50 p-4 text-sm leading-7"><h3 className="font-semibold">Une phrase qui progresse</h3><p className="mt-2"><strong>Avant :</strong> {q.before}</p><p><strong>Après :</strong> {q.after}</p><p className="mt-2 text-muted-foreground">{q.tip}</p></div>
      <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Mini-défi : {q.question}</legend>{q.options.map((label,i)=><label key={label} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm leading-6"><input className="mt-1" type="radio" name={`life-quiz-${work.level}`} checked={choice===i} onChange={()=>update({...work,choices:{...work.choices,[work.level]:i}})} />{label}</label>)}</fieldset>
      {choice!==undefined&&<p role="status" className="rounded-lg bg-muted/50 p-4 text-sm leading-7">{choice===q.answer?'Bien joué. ':'Essaie encore. '}{q.explanation}</p>}
      <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">Je prépare mes idées</h3><Button variant="ghost" size="sm" aria-pressed={hints} onClick={()=>setHints(v=>!v)}>{hints?'Écrire sans les aides':'Retrouver les aides'}</Button></div>
      {hints&&<div className="space-y-4">{q.prompts.map((label,i)=><div key={label}><label htmlFor={`quest-plan-${i}`} className="mb-2 block text-sm font-medium">{label}</label><textarea id={`quest-plan-${i}`} rows={2} maxLength={4000} className={field} value={work.plans[work.level][i]} onChange={e=>update({...work,plans:work.plans.map((plan,n)=>n===work.level?plan.map((s,j)=>j===i?e.target.value:s):plan)})} /></div>)}<p className="rounded-lg bg-muted/50 p-3 text-sm leading-7"><strong>Boîte à mots :</strong> {q.bank.join(' · ')}</p><p className="text-sm leading-7 text-muted-foreground">Pour démarrer si nécessaire : {q.launch}</p></div>}
      <label htmlFor="quest-draft" className="block font-semibold">Mon texte du défi</label><textarea id="quest-draft" rows={work.level<3?7:11} maxLength={20000} aria-describedby="quest-length" className={field} value={draft} onChange={e=>update({...work,drafts:work.drafts.map((s,i)=>i===work.level?e.target.value:s)})} />
      <p id="quest-length" className="text-xs leading-6 text-muted-foreground">{count} mots environ · Repère : {q.length}. La longueur n’est pas un score et ne bloque pas ta progression.</p>
      <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Je vérifie mon travail</legend>{q.checks.map((label,i)=><label key={label} className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={work.reviews[work.level].includes(i)} onChange={()=>update({...work,reviews:work.reviews.map((a,n)=>n===work.level?a.includes(i)?a.filter(j=>j!==i):[...a,i]:a)})} />{label}</label>)}</fieldset>
      <p className="text-sm leading-7 text-muted-foreground">Lis ton texte à voix haute. Demande à un adulte : « Quelle phrase est claire ? Où manque-t-il une information ? » Choisis une amélioration. Ton texte n’est ni corrigé automatiquement ni envoyé à quelqu’un.</p>
      <div className="flex flex-wrap gap-3 border-t border-border pt-5"><Button variant="secondary" onClick={()=>save()}>Enregistrer mes défis</Button><Button disabled={!canBadge||work.badges.includes(work.level)} onClick={()=>save({...work,badges:[...new Set([...work.badges,work.level])]})}>{work.badges.includes(work.level)?`Badge obtenu : ${q.badge}`:'Obtenir mon badge d’effort'}</Button></div>
      {!work.badges.includes(work.level)&&<p className="text-xs leading-6 text-muted-foreground">Pour ton badge : réponds correctement au mini-défi, écris un essai et coche les trois vérifications. Tu peux visiter la suite sans badge.</p>}
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{status||'Enregistre pour retrouver tes cinq textes ici.'}</p>
      <div className="flex flex-wrap justify-between gap-3"><Button variant="ghost" disabled={work.level===0} onClick={()=>go(work.level-1)}>Défi précédent</Button><Button variant="secondary" disabled={work.level===4} onClick={()=>go(work.level+1)}>Défi suivant</Button></div>
    </section>
    {work.badges.length===5&&<section aria-label="Aventure terminée" className={`${card} bg-muted/30`}><h2 className="text-xl font-semibold">Cinq défis, cinq façons de raconter ta vie !</h2><p className="mt-3 text-sm leading-7">Choisis ton texte préféré et explique ce que tu as amélioré. Pour recommencer, change un détail du sujet : un autre objet, une autre activité ou un autre destinataire. Tes badges restent des traces de tes efforts, pas un classement.</p></section>}
    <aside className={`${card} text-sm leading-7`}><h2 className="font-semibold">Besoin de travailler une phrase ?</h2><p className="mt-2 text-muted-foreground">L’onglet « Bases · De la phrase au texte » conserve les exercices techniques. Tu peux y revenir entre deux défis ; tes anciens essais et tes autres unités restent disponibles.</p></aside>
  </div></FeaturePage>
}
