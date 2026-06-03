export const BASELINE_QUESTIONS = [
  { id: 'wardrobeSize' as const, question: 'How would you describe your current wardrobe size?', options: [
    { value: 'minimal', label: 'Minimal', description: 'I own only what I need and wear regularly' },
    { value: 'moderate', label: 'Moderate', description: 'I have a balanced selection with some variety' },
    { value: 'extensive', label: 'Extensive', description: 'I have many items, including pieces I rarely wear' },
  ]},
  { id: 'shoppingFrequency' as const, question: 'How often do you acquire new clothing items?', options: [
    { value: 'rarely', label: 'Rarely', description: 'Only when I truly need to replace something' },
    { value: 'occasionally', label: 'Occasionally', description: 'A few times per season when I find something I like' },
    { value: 'frequently', label: 'Frequently', description: 'I enjoy shopping and add new items regularly' },
  ]},
  { id: 'disposalHabit' as const, question: 'How often do you get rid of clothing you no longer wear?', options: [
    { value: 'rarely', label: 'Rarely', description: 'I keep most things for a long time' },
    { value: 'periodically', label: 'Periodically', description: 'Seasonal clear-outs a few times per year' },
    { value: 'regularly', label: 'Regularly', description: 'Ongoing process of removing unworn items' },
  ]},
  { id: 'primaryDriver' as const, question: 'What primarily drives your clothing decisions?', options: [
    { value: 'function', label: 'Functionality', description: 'Comfort, durability, and practicality matter most' },
    { value: 'emotion', label: 'Personal Value', description: 'How clothing makes me feel and personal memories' },
    { value: 'social', label: 'Social Context', description: 'How I am perceived and expressing my identity' },
  ]},
];
