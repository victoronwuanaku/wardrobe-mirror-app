export const GARMENT_OPTIONS = [
  { label: 'T-Shirt', value: 't-shirt', icon: '👕' },
  { label: 'Jacket/Coat', value: 'jacket-coat', icon: '🧥' },
  { label: 'Jeans/Trousers', value: 'jeans-trousers', icon: '👖' },
  { label: 'Blazer', value: 'blazer', icon: '🤵' },
  { label: 'Shorts', value: 'shorts', icon: '🩳' },
  { label: 'Dress', value: 'dress', icon: '👗' },
  { label: 'Sweater/Jumper', value: 'sweater-jumper', icon: '🧶' },
  { label: 'Shirt/Blouse', value: 'shirt-blouse', icon: '👔' },
  { label: 'Other', value: 'other', icon: '✨' }
];

export function getGarmentIcon(garmentType?: string): string {
  const garment = GARMENT_OPTIONS.find(g => g.value === garmentType);
  if (garment) return garment.icon;

  // If not found in options, it's a custom "other" garment - match to appropriate icon
  if (garmentType && garmentType !== 'other' && garmentType !== 'other-skipped' && garmentType !== 'skipped') {
    const type = garmentType.toLowerCase();

    // Match keywords to appropriate emojis
    if (type.includes('scarf')) return '🧣';
    if (type.includes('hat') || type.includes('cap') || type.includes('beanie')) return '🧢';
    if (type.includes('sweater') || type.includes('cardigan') || type.includes('jumper')) return '🧥';
    if (type.includes('dress')) return '👗';
    if (type.includes('skirt')) return '👚';
    if (type.includes('shoe') || type.includes('sneaker') || type.includes('boot')) return '👟';
    if (type.includes('sock')) return '🧦';
    if (type.includes('glove') || type.includes('mitten')) return '🧤';
    if (type.includes('tie')) return '👔';
    if (type.includes('belt')) return '🔗';
    if (type.includes('bag') || type.includes('purse') || type.includes('backpack')) return '👜';
    if (type.includes('glasses') || type.includes('sunglass')) return '🕶️';
    if (type.includes('watch')) return '⌚';
    if (type.includes('ring') || type.includes('necklace') || type.includes('jewelry') || type.includes('bracelet')) return '💍';
    if (type.includes('underwear') || type.includes('brief') || type.includes('boxer')) return '🩲';
    if (type.includes('bra')) return '👙';
    if (type.includes('vest') || type.includes('tank')) return '🎽';
    if (type.includes('hoodie')) return '🧥';
    if (type.includes('coat') || type.includes('jacket')) return '🧥';
    if (type.includes('suit')) return '🤵';
    if (type.includes('jean') || type.includes('pant') || type.includes('trouser')) return '👖';
  }

  // Default for unknown custom garments
  return '👕';
}

export function getGarmentLabel(garmentType?: string): string {
  const garment = GARMENT_OPTIONS.find(g => g.value === garmentType);
  if (garment) return garment.label;
  // If not found in options, it's a custom "other" garment - use the actual entered value
  if (garmentType && garmentType !== 'other' && garmentType !== 'other-skipped' && garmentType !== 'skipped') {
    // Capitalize first letter and return custom name
    return garmentType.charAt(0).toUpperCase() + garmentType.slice(1);
  }
  return 'Garment';
}
