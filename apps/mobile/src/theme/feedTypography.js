import { families } from './fonts';

// Social-feed typography. Playfair Display only for editorial titles; Inter for everything else.
const inter = (family) => ({ fontFamily: family });

export const feedTypography = Object.freeze({
  authorLabel: { ...inter(families.semibold), fontSize: 10, lineHeight: 15, letterSpacing: 0.9 },
  authorName: { ...inter(families.semibold), fontSize: 14, lineHeight: 20, letterSpacing: -0.1 },
  authorMeta: { ...inter(families.body), fontSize: 12, lineHeight: 18, letterSpacing: 0 },
  tag: { ...inter(families.semibold), fontSize: 10, lineHeight: 15, letterSpacing: 0.9 },
  title: { fontFamily: families.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  body: { ...inter(families.body), fontSize: 14, lineHeight: 21, letterSpacing: 0 },
  price: {
    ...inter(families.semibold),
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: { fontFamily: families.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  highlightTitle: {
    fontFamily: families.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  composeTitle: { fontFamily: families.display, fontSize: 18, lineHeight: 25, letterSpacing: -0.2 },
  fieldLabel: { ...inter(families.medium), fontSize: 13, lineHeight: 19, letterSpacing: 0 },
  input: { ...inter(families.body), fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  action: { ...inter(families.medium), fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  filter: { ...inter(families.medium), fontSize: 13, lineHeight: 19, letterSpacing: 0 },
});
