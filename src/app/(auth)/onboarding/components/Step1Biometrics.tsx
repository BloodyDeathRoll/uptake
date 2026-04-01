'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OnboardingData } from '../page'
import { ftInToCm, lbsToKg } from '@/lib/utils/format'

interface Props {
  onNext: (data: Partial<OnboardingData>) => void
}

export default function Step1Biometrics({ onNext }: Props) {
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [heightCm, setHeightCm] = useState('175')
  const [heightFt, setHeightFt] = useState('5')
  const [heightIn, setHeightIn] = useState('9')
  const [weight, setWeight] = useState('70')
  const [age, setAge] = useState('30')
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    onNext({ heightCm: h, weightKg: w, age: Number(age), sex: (sex || null) as OnboardingData['sex'] })
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your body stats</h1>
        <p className="text-muted-foreground mt-1">Used to calculate personalized nutrition targets</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Height</Label>
          <UnitToggle options={['cm', 'ft']} value={heightUnit} onChange={v => setHeightUnit(v as 'cm' | 'ft')} />
        </div>
        {heightUnit === 'cm' ? (
          <Input type="number" placeholder="178" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
        ) : (
          <div className="flex gap-2">
            <Input type="number" placeholder="5 ft" value={heightFt} onChange={e => setHeightFt(e.target.value)} />
            <Input type="number" placeholder="10 in" value={heightIn} onChange={e => setHeightIn(e.target.value)} />
          </div>
        )}
        {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Weight</Label>
          <UnitToggle options={['kg', 'lbs']} value={weightUnit} onChange={v => setWeightUnit(v as 'kg' | 'lbs')} />
        </div>
        <Input type="number" placeholder={weightUnit === 'kg' ? '80' : '176'} value={weight} onChange={e => setWeight(e.target.value)} />
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

      <Button type="submit" className="w-full mt-auto">Start</Button>
    </form>
  )
}
