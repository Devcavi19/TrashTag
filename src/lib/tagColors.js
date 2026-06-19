// Canonical color mapping for trash-type tags. Reused anywhere a tag needs a color
// (StatusBadge, PostForm pills, TrashCard strip).
export const TAG_COLORS = {
  Biodegradable: { label: 'Biodegradable', bg: '#eaf5ec', color: '#22863a' },
  Recyclable:    { label: 'Recyclable',    bg: '#e8f0fe', color: '#1966b5' },
  Residual:      { label: 'Residual',      bg: '#fce8e6', color: '#b53419' },
  Mixed:         { label: 'Mixed',         bg: '#f3f0fb', color: '#6b46c1' },
}
