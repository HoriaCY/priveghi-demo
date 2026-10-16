// The nine anchors (docs/vibe/osanda_anchors.gpl) and the prototype's derived neutrals.
// No other colour may appear on the table. Never #000.
export const C = {
  soot: '#171310', // Funingine: base dark
  wax: '#E9DCB5', // Ceara: default light
  lime: '#F2EDE2', // Alb de Var
  voronet: '#2E5E7E', // Albastru de Voronet: the Bride's, day nine only
  red: '#B5342C', // Rosu de Martisor: only with white
  clot: '#6E2320', // Sange Inchegat: old red
  gold: '#C39A3B', // Aur Afumat: flat, never a gradient
  verdigris: '#4F7A66', // Cocleala
  earth: '#4A3B2C', // Pamant Ud
  // derived neutrals (the prototype's)
  woodMid: '#6b5a44',
  woodLight: '#8f7d60',
  linen: '#d8ccab',
  paper: '#e4d7b2',
  paperSoot: '#BAB091',
  waxDim: '#b9ad8c',
  room: '#110e0b',
  nicheDark: '#0c0a08',
  bread: '#a3814f',
  inkDim: '#3b3027', // the prototype's lore ink: the page's small caps
} as const;
