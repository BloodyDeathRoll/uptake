const UNIT_HE: Record<string, string> = {
  g: 'גרם',
  kg: 'ק"ג',
  mg: 'מ"ג',
  ml: 'מ"ל',
  l: "ל'",
  oz: 'אונקיה',
  lb: 'ליברה',
  cup: 'כוס',
  cups: 'כוסות',
  tbsp: 'כף',
  tsp: 'כפית',
  serving: 'מנה',
  servings: 'מנות',
  piece: 'יחידה',
  pieces: 'יחידות',
  slice: 'פרוסה',
  slices: 'פרוסות',
  handful: 'חופן',
  medium: 'בינוני',
  large: 'גדול',
  small: 'קטן',
}

export function translateUnit(unit: string, lang: string): string {
  if (lang !== 'he') return unit
  return UNIT_HE[unit.toLowerCase()] ?? unit
}
