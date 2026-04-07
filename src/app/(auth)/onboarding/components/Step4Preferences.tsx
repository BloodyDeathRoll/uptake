'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { OnboardingData } from '../page'
import { DIETARY_PREFERENCE_OPTIONS } from '@/lib/utils/constants'
import { useLanguage, type Translations } from '@/lib/i18n'

interface Props {
  onNext: (data: Partial<OnboardingData>) => void
  onBack: () => void
  initialData: Partial<OnboardingData>
}

function prefKey(pref: string): keyof Translations {
  return ('pref_' + pref.replace(/-/g, '_').replace(/ /g, '_')) as keyof Translations
}

export default function Step4Preferences({ onNext, onBack, initialData }: Props) {
  const { t } = useLanguage()
  const [preferences, setPreferences] = useState<string[]>(initialData.dietaryPreferences ?? [])
  const [allergies, setAllergies] = useState<string[]>(initialData.allergies ?? [])
  const [allergyInput, setAllergyInput] = useState('')
  const [mealsPerDay, setMealsPerDay] = useState(String(initialData.mealsPerDay ?? 3))

  const toggle = (pref: string) =>
    setPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref])

  const addAllergy = () => {
    const t = allergyInput.trim()
    if (t && !allergies.includes(t)) { setAllergies(prev => [...prev, t]); setAllergyInput('') }
  }

  const handleSkip = () => onNext({ dietaryPreferences: [], allergies: [], mealsPerDay: 3 })

  return (
    <form onSubmit={e => { e.preventDefault(); onNext({ preferences, allergies, mealsPerDay: Number(mealsPerDay) || 3 } as Partial<OnboardingData>) }} className="flex flex-col flex-1 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.your_preferences}</h1>
        <p className="text-muted-foreground mt-1">{t.preferences_subtitle}</p>
      </div>

      <div className="space-y-2">
        <Label>{t.dietary_preferences}</Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_PREFERENCE_OPTIONS.map(pref => (
            <button key={pref} type="button" onClick={() => toggle(pref)}
              className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${preferences.includes(pref) ? 'bg-primary text-primary-foreground border-transparent' : 'border-border text-muted-foreground hover:bg-muted hover:border-border'}`}>
              {(t[prefKey(pref)] as string) ?? pref}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t.allergies_exclusions}</Label>
        <div className="flex gap-2">
          <Input placeholder={t.allergy_placeholder} value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy() } }} />
          <Button type="button" variant="outline" onClick={addAllergy}>{t.add}</Button>
        </div>
        {allergies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {allergies.map(a => (
              <Badge key={a} variant="secondary" className="cursor-pointer" onClick={() => setAllergies(p => p.filter(x => x !== a))}>
                {a} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="meals">{t.meals_per_day}</Label>
        <Input id="meals" type="number" min={1} max={10} value={mealsPerDay} onChange={e => setMealsPerDay(e.target.value)} />
      </div>

      <div className="flex gap-2 mt-auto">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">{t.back}</Button>
        <Button type="button" variant="ghost" onClick={handleSkip} className="px-4">{t.skip}</Button>
        <Button type="submit" className="flex-1">{t.next}</Button>
      </div>
    </form>
  )
}
