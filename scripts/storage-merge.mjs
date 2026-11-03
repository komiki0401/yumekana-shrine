const stable = value => JSON.stringify(canonical(value))
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]))
  return value
}
const union = (a, b) => [...new Set([...a, ...b])]
const subset = (a, b) => a.every(x => b.includes(x))

export function planMerge(a, b) {
  const conflicts = []
  const conflict = (path, reason) => conflicts.push({ path, reason })
  const records = (path, left, right) => {
    const map = new Map()
    for (const [source, items] of [['public', left], ['local', right]]) {
      const seen = new Set()
      for (const item of items) {
        if (typeof item.id !== 'string' || !item.id) conflict(path, 'Missing record ID')
        if (seen.has(item.id)) conflict(`${path}/${item.id}`, `Duplicate ID inside ${source}`)
        seen.add(item.id)
        if (map.has(item.id) && stable(map.get(item.id)) !== stable(item)) conflict(`${path}/${item.id}`, 'Same ID has different values; choose explicitly from originals')
        else map.set(item.id, item)
      }
    }
    return [...map.values()]
  }
  const data = structuredClone(a)
  for (const key of ['dreams', 'gratitudes', 'transactions', 'encounters']) data[key] = records(key, a[key], b[key])
  for (const key of ['dailyGoals', 'fortunes']) {
    data[key] = { ...a[key] }
    for (const [date, value] of Object.entries(b[key])) {
      if (!(date in data[key])) data[key][date] = value
      else if (key === 'dailyGoals') {
        data[key][date] = records(`${key}/${date}`, data[key][date], value)
        if (data[key][date].length > 3) conflict(`${key}/${date}`, 'More than three goals; preserve originals and decide explicitly')
      } else if (stable(data[key][date]) !== stable(value)) conflict(`${key}/${date}`, 'Different daily fortunes; choose explicitly')
    }
  }
  // Settings are device preferences, not achievements. Keep public settings.
  data.spiritCredits = {
    dreams: union(a.spiritCredits.dreams, b.spiritCredits.dreams),
    gratitudes: union(a.spiritCredits.gratitudes, b.spiritCredits.gratitudes),
    gratitudeDays: {},
  }
  for (const date of union(Object.keys(a.spiritCredits.gratitudeDays), Object.keys(b.spiritCredits.gratitudeDays))) {
    data.spiritCredits.gratitudeDays[date] = Math.max(a.spiritCredits.gratitudeDays[date] ?? 0, b.spiritCredits.gratitudeDays[date] ?? 0)
  }
  // Totals have no full event ledger. Sum/max cannot reconstruct divergent histories.
  const covers = (x, y) => ['dreams', 'gratitudes'].every(k => subset(y.spiritCredits[k], x.spiritCredits[k]))
    && Object.entries(y.spiritCredits.gratitudeDays).every(([d, n]) => (x.spiritCredits.gratitudeDays[d] ?? 0) >= n)
    && x.spirit.gratitude >= y.spirit.gratitude && x.spirit.expectation >= y.spirit.expectation
  if (covers(a, b)) data.spirit = structuredClone(a.spirit)
  else if (covers(b, a)) data.spirit = structuredClone(b.spirit)
  else conflict('spirit', 'Divergent credit histories: totals must not be added or guessed. Reconcile original credit keys, daily cap and legacy totals first')

  // Independent gratitude submissions can have equal text and different IDs.
  // They are NEVER silently collapsed; require review for a possible re-import.
  for (const key of ['dreams', 'gratitudes']) {
    const aIds = new Set(a[key].map(x => x.id)), bIds = new Set(b[key].map(x => x.id))
    const left = a[key].filter(x => !bIds.has(x.id)), right = b[key].filter(x => !aIds.has(x.id))
    const signature = x => key === 'dreams' ? (x.suggestionId ? `suggestion:${x.suggestionId}` : x.title.normalize('NFKC').replace(/\s+/g, '')) : `${x.date}|${x.text.normalize('NFKC').trim()}`
    const signatures = new Set(left.map(signature))
    for (const entry of right) if (signatures.has(signature(entry))) conflict(`${key}/${entry.id}`, 'Different IDs with matching content: may be separate events or duplicated import; do not auto-collapse')
  }
  const dreamRewards = new Set()
  for (const tx of data.transactions) {
    if (tx.kind === 'earn' && tx.dreamId) {
      if (dreamRewards.has(tx.dreamId)) conflict(`transactions/${tx.id}`, 'Multiple reward IDs for one dream; retain only the confirmed original event after manual review')
      dreamRewards.add(tx.dreamId)
    }
  }
  const aTx = new Set(a.transactions.map(x => x.id)), bTx = new Set(b.transactions.map(x => x.id))
  const leftTx = a.transactions.filter(x => !bTx.has(x.id)), rightTx = b.transactions.filter(x => !aTx.has(x.id))
  // Offers and old goal toggles lack timestamps/idempotency keys. Two branches
  // spending the same coin cannot be distinguished from valid independent use.
  if (leftTx.length && rightTx.length && [...leftTx, ...rightTx].some(x => x.kind !== 'earn' || x.goalId)) {
    conflict('transactions', 'Both sides diverged and include offers/legacy goal toggles. Verify events and spend order; IDs alone cannot prove independent spending')
  }
  for (const tx of data.transactions) {
    if (tx.dreamId !== undefined && typeof tx.dreamId !== 'string') conflict(`transactions/${tx.id}`, 'Invalid dream reference')
    if (tx.goalId !== undefined && typeof tx.goalId !== 'string') conflict(`transactions/${tx.id}`, 'Invalid goal reference')
  }
  const total = data.transactions.reduce((n, x) => n + x.amount, 0)
  if (total < 0) conflict('transactions', 'Negative merged balance; never invent balancing credit')
  return { data, conflicts, summary: {
    public: stats(a), local: stats(b), candidate: stats(data),
    settings: 'Public settings retained; change device sound preference after import if needed',
    deletions: 'No tombstones exist. ID union may restore deleted records; review the complete candidate',
  } }
}
function stats(d) {
  return { dreams: d.dreams.length, gratitudes: d.gratitudes.length,
    transactions: d.transactions.length, offerings: d.transactions.filter(t => t.kind === 'offer').length,
    balance: d.transactions.reduce((n, t) => n + t.amount, 0), spirit: d.spirit }
}
