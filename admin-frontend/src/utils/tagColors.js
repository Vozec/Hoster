const TAG_COLORS = ['#6366f1', '#22d3ee', '#4ade80', '#fbbf24', '#f87171', '#a78bfa'];

export function tagColor(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}

export { TAG_COLORS };
