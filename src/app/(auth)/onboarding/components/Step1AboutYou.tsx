'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { OnboardingData } from '../page'
import { ftInToCm, lbsToKg } from '@/lib/utils/format'
import { DIETARY_PREFERENCE_OPTIONS } from '@/lib/utils/constants'

interface Props {
  onNext: (data: Partial<OnboardingData>) => void
}

const UnitToggle = ({ options, value, onChange }: { options: [string, string]; value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-1">
    {options.map(opt => (
      <button key={opt} type="button" onClick={() => onChange(opt)}
        className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${value === opt ? 'bg-neutral-200 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
        {opt}
      </button>
    ))}
  </div>
)

export default function Step1AboutYou({ onNext }: Props) {
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [heightCm, setHeightCm] = useState('175')
  const [heightFt, setHeightFt] = useState('5')
  const [heightIn, setHeightIn] = useState('9')
  const [weight, setWeight] = useState('70')
  const [age, setAge] = useState('30')
  const [sex, setSex] = useState<'male' | 'female' | ''>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [allergies, setAllergies] = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState('')
  const [preferences, setPreferences] = useState<string[]>([])

  const togglePref = (pref: string) =>
    setPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref])

  const addAllergy = () => {
    const t = allergyInput.trim()
    if (t && !allergies.includes(t)) { setAllergies(prev => [...prev, t]); setAllergyInput('') }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    const h = heightUnit === 'cm' ? Number(heightCm) : ftInToCm(Number(heightFt), Number(heightIn))
    const w = weightUnit === 'kg' ? Number(weight) : lbsToKg(Number(weight))
    const a = Number(age)
    if (!h || h < 50 || h > 300) errs.height = 'Enter a valid height (50–300 cm)'
    if (!w || w < 10 || w > 500) errs.weight = 'Enter a valid weight'
    if (!a || a < 1 || a > 120) errs.age = 'Enter a valid age (1–120)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const h = heightUnit === 'cm' ? Number(heightCm) : ftInToCm(Number(heightFt), Number(heightIn))
    const w = weightUnit === 'kg' ? Number(weight) : lbsToKg(Number(weight))
    onNext({
      heightCm: h, weightKg: w, age: Number(age),
      sex: (sex || null) as OnboardingData['sex'],
      dietaryPreferences: preferences,
      allergies,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">About you</h1>
        <p className="text-muted-foreground mt-1">Your stats & food preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-4" style={{ scrollbarWidth: 'none' }}>

        {/* Body stats */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Height</Label>
              <UnitToggle options={['cm', 'ft']} value={heightUnit} onChange={v => setHeightUnit(v as 'cm' | 'ft')} />
            </div>
            {heightUnit === 'cm' ? (
              <Input type="number" placeholder="175" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
            ) : (
              <div className="flex gap-2">
                <Input type="number" placeholder="5 ft" value={heightFt} onChange={e => setHeightFt(e.target.value)} />
                <Input type="number" placeholder="9 in" value={heightIn} onChange={e => setHeightIn(e.target.value)} />
              </div>
            )}
            {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Weight</Label>
              <UnitToggle options={['kg', 'lbs']} value={weightUnit} onChange={v => setWeightUnit(v as 'kg' | 'lbs')} />
            </div>
            <Input type="number" placeholder={weightUnit === 'kg' ? '70' : '154'} value={weight} onChange={e => setWeight(e.target.value)} />
            {errors.weight && <p className="text-xs text-destructive">{errors.weight}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" placeholder="30" value={age} onChange={e => setAge(e.target.value)} />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
          </div>

          <div className="space-y-2">
            <Label>Sex <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map(s => (
                <button key={s} type="button" onClick={() => setSex(prev => prev === s ? '' : s)}
                  className={`flex-1 py-2.5 text-sm rounded-xl border font-medium capitalize transition-all ${sex === s ? 'bg-neutral-200 text-foreground border-transparent' : 'border-border text-muted-foreground hover:bg-neutral-50 hover:border-border'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Diet <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_PREFERENCE_OPTIONS.map(pref => (
                <button key={pref} type="button" onClick={() => togglePref(pref)}
                  className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${preferences.includes(pref) ? 'bg-neutral-200 text-foreground border-transparent' : 'border-border text-muted-foreground hover:bg-neutral-50 hover:border-border'}`}>
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allergies <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <div className="flex gap-2">
              <Input placeholder="e.g. peanuts" value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy() } }} />
              <Button type="button" variant="outline" onClick={addAllergy}>Add</Button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allergies.map(a => (
                  <Badge key={a} variant="secondary" className="cursor-pointer" onClick={() => setAllergies(p => p.filter(x => x !== a))}>
                    {a} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full mt-4 shrink-0">Start</Button>
    </form>
  )
}
