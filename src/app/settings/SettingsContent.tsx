'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatCalories, formatGrams } from '@/lib/utils/format'
import { useLanguage, type Translations } from '@/lib/i18n'

interface Profile {
  weight_kg: number | null
  height_cm: number | null
  age: number | null
  activity_level: string | null
}

interface Goal {
  goal_type: string
  calories_target: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  rationale: string | null
}

interface Props {
  email: string
  profile: Profile | null
  goal: Goal | null
}

export default function SettingsContent({ email, profile, goal }: Props) {
  const { t } = useLanguage()

  const actLabel = (level: string) =>
    (t[('actLabel_' + level) as keyof Translations] as string) ?? level

  const goalLabel = (type: string) =>
    (t[('goalLabel_' + type) as keyof Translations] as string) ?? type.replace(/_/g, ' ')

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
      <h1 className="text-xl font-bold">{t.settings}</h1>

      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <h2 className="font-semibold text-sm">{t.profile_section}</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>{t.email_label}: {email}</div>
            {profile && (
              <>
                <div>{t.weight}: {profile.weight_kg}kg · {t.height}: {profile.height_cm}cm · {t.age}: {profile.age}</div>
                <div>{t.activity_level}: {profile.activity_level ? actLabel(profile.activity_level) : '—'}</div>
              </>
            )}
          </div>
          <Link href="/onboarding" className="text-sm text-accent underline underline-offset-4">{t.update_profile}</Link>
        </CardContent>
      </Card>

      {goal && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <h2 className="font-semibold text-sm">{t.current_goal_section}</h2>
            <div className="text-sm">
              <span className="font-medium">{goalLabel(goal.goal_type)}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{t.daily_calories}: {formatCalories(goal.calories_target)}</div>
              <div>{t.protein}: {formatGrams(goal.protein_g)} · {t.carbohydrates}: {formatGrams(goal.carbs_g)} · {t.fat_label}: {formatGrams(goal.fat_g)}</div>
            </div>
            {goal.rationale && goal.rationale.length < 200 && <p className="text-xs text-muted-foreground italic">{goal.rationale}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          <h2 className="font-semibold text-sm mb-2">{t.data_section}</h2>
          <p className="text-xs text-muted-foreground">{t.data_export_text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <h2 className="font-semibold text-sm">{t.legal_section}</h2>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-accent underline underline-offset-4">{t.terms_link}</Link>
            <Link href="/privacy" className="text-sm text-accent underline underline-offset-4">{t.privacy_link}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
