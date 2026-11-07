import type { Metadata } from 'next'
import { FrenchLearningPage } from '@/features/french-learning/components/FrenchLearningPage'

export const metadata: Metadata = {
  title: 'French Learning — DeepTutor',
  description: 'Des activités de français pour la 5e année du primaire au Québec.',
}

export default function Page() {
  return <FrenchLearningPage />
}
