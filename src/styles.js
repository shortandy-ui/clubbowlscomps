export const fontCss = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

  .cc-bracket-scroll::-webkit-scrollbar { width: 12px; height: 12px; }
  .cc-bracket-scroll::-webkit-scrollbar-track { background: #F5EFDD; border-radius: 8px; }
  .cc-bracket-scroll::-webkit-scrollbar-thumb { background: #AC8347; border-radius: 8px; border: 2px solid #F5EFDD; }

  .cc-grass {
    background-image: repeating-linear-gradient(
      100deg,
      rgba(255,255,255,0.05) 0px,
      rgba(255,255,255,0.05) 22px,
      rgba(0,0,0,0.05) 22px,
      rgba(0,0,0,0.05) 44px
    );
  }

  .cc-col-left .cc-match { position: relative; }
  .cc-col-left .cc-match::after {
    content: "";
    position: absolute;
    top: 50%;
    right: -17px;
    width: 17px;
    height: 2px;
    background: #AC8347;
  }
  .cc-col-right .cc-match { position: relative; }
  .cc-col-right .cc-match::before {
    content: "";
    position: absolute;
    top: 50%;
    left: -17px;
    width: 17px;
    height: 2px;
    background: #AC8347;
  }
  .cc-final-col::before,
  .cc-final-col::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 17px;
    height: 2px;
    background: #AC8347;
  }
  .cc-final-col::before { left: -17px; }
  .cc-final-col::after { right: -17px; }

  .cc-jack {
    position: absolute;
    top: -6px;
    left: -6px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #FDFBF6;
    border: 2px solid #AC8347;
  }

  .cc-tcard { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .cc-tcard:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(23,57,42,0.14); }

  .cc-app :focus-visible {
    outline: 3px solid #AC8347;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .cc-tcard { transition: none; }
  }
`;

export const styles = {
  app: {
    minHeight: "100vh",
    background: "#F5EFDD",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#2A2A22",
    paddingBottom: 60,
  },
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#17392A",
    color: "#F5EFDD",
    fontFamily: "system-ui, sans-serif",
  },
  loadingText: { fontSize: 18, letterSpacing: 1 },
  header: { background: "#17392A", padding: "20px 16px", borderBottom: "4px solid #AC8347" },
  headerInner: { display: "flex", alignItems: "center", gap: 14, maxWidth: 1100, margin: "0 auto" },
  crest: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 700,
    fontSize: 13,
    color: "#17392A",
    background: "#AC8347",
    width: 52,
    height: 52,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: -0.5,
    flexShrink: 0,
    lineHeight: 1,
    textAlign: "center",
    border: "2px solid #D9B87A",
  },
  title: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 700,
    fontSize: 20,
    color: "#FFFDF7",
    lineHeight: 1.2,
  },
  subtitle: { color: "#D9B87A", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase" },
  adminToggle: {
    marginLeft: "auto",
    background: "transparent",
    border: "1px solid #D9B87A",
    color: "#D9B87A",
    padding: "8px 14px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  errorBanner: { background: "#8c2f2f", color: "#fff", textAlign: "center", padding: 8, fontSize: 13 },
  centerBox: { display: "flex", justifyContent: "center", padding: 40 },
  card: {
    background: "#FDFBF6",
    borderRadius: 10,
    padding: 24,
    width: 320,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid #e2d9c2",
  },
  cardTitle: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 17, marginBottom: 10, color: "#17392A" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #cfc4a3",
    fontSize: 14,
    boxSizing: "border-box",
  },
  errText: { color: "#a33", fontSize: 13, marginTop: 6 },
  btnPrimary: {
    background: "#17392A",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 600,
  },
  btnAccent: {
    background: "#AC8347",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 600,
  },
  btnGhost: {
    background: "transparent",
    color: "#5a5544",
    border: "1px solid #cfc4a3",
    padding: "10px 16px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
  },
  btnDanger: {
    background: "#8c2f2f",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 600,
  },
  resetBox: { marginTop: 10, background: "#fbeeee", border: "1px solid #e0b8b8", padding: 14, borderRadius: 8, fontSize: 13 },
  grid: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: 16,
  },
  tCard: {
    background: "#FDFBF6",
    border: "1px solid #e2d9c2",
    borderLeft: "5px solid #AC8347",
    borderRadius: 8,
    padding: 18,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  tCardName: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 17, color: "#17392A" },
  tCardMeta: { fontSize: 13, color: "#7a7462", marginTop: 6 },
  tCardChamp: { fontSize: 13, color: "#8c6d1f", marginTop: 8, fontWeight: 600 },
  tournamentView: { maxWidth: 1200, margin: "0 auto", padding: "20px 16px" },
  backLink: { background: "none", border: "none", color: "#17392A", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 10 },
  tHeading: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, color: "#17392A", margin: "0 0 16px" },
  adminPanel: { background: "#FDFBF6", border: "1px solid #e2d9c2", borderRadius: 10, padding: 18, marginBottom: 24 },
  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #cfc4a3",
    fontSize: 14,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  hintText: { fontSize: 12, color: "#8a8371", marginTop: 4 },
  entrantList: { listStyle: "none", margin: "10px 0 0", padding: 0, maxHeight: 220, overflowY: "auto", border: "1px solid #eee0c0", borderRadius: 6 },
  entrantItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 10px",
    fontSize: 14,
    borderBottom: "1px solid #f2ead4",
  },
  entrantRemove: {
    background: "none",
    border: "none",
    color: "#a33",
    cursor: "pointer",
    fontSize: 13,
    padding: "2px 6px",
  },
  emptyState: { background: "#FDFBF6", border: "1px dashed #cfc4a3", borderRadius: 8, padding: 24, color: "#7a7462", fontSize: 14 },
  bracketScroll: {
    overflow: "auto",
    maxHeight: "72vh",
    paddingBottom: 20,
    border: "1px solid #e2d9c2",
    borderRadius: 10,
    background: "#FDFBF6",
    padding: 16,
    scrollbarWidth: "auto",
    scrollbarColor: "#AC8347 #F5EFDD",
  },
  bracketRow: { display: "flex", gap: 28, minWidth: "fit-content" },
  roundCol: { display: "flex", flexDirection: "column", minWidth: 190 },
  finalCol: {
    display: "flex",
    flexDirection: "column",
    minWidth: 190,
    background: "#F9F5E8",
    border: "1px solid #D9B87A",
    borderRadius: 10,
    padding: "10px 14px 16px",
    alignSelf: "center",
  },
  roundLabel: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 700,
    color: "#17392A",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 6,
  },
  roundDates: { textAlign: "center", marginBottom: 10, minHeight: 20 },
  dateLabel: { display: "block", fontSize: 11, color: "#7a7462", marginBottom: 4 },
  dateInput: { fontSize: 12, padding: "4px 6px", borderRadius: 4, border: "1px solid #cfc4a3", width: "100%", boxSizing: "border-box" },
  dateReadout: { fontSize: 11, color: "#7a7462", lineHeight: 1.5 },
  matchesCol: { display: "flex", flexDirection: "column", flex: 1, gap: 14 },
  matchCard: {
    background: "#FDFBF6",
    border: "1px solid #e2d9c2",
    borderRadius: 8,
    padding: "10px 12px",
    position: "relative",
  },
  playerRow: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0" },
  scoreDigit: { fontFamily: "'Space Mono', monospace", fontWeight: 700 },
  vsDivider: { height: 1, background: "#eee0c0", margin: "2px 0" },
  byeTag: { fontSize: 10, color: "#AC8347", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 },
  scoreRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 8 },
  scoreInput: { width: 40, padding: "4px 6px", borderRadius: 4, border: "1px solid #cfc4a3", fontSize: 13, textAlign: "center", fontFamily: "'Space Mono', monospace" },
  scoreBtn: {
    marginLeft: "auto",
    background: "#17392A",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  champBox: {
    background: "linear-gradient(160deg, #1E4530 0%, #17392A 100%)",
    color: "#FFFDF7",
    borderRadius: 8,
    padding: "18px 12px",
    textAlign: "center",
    fontWeight: 700,
    fontSize: 16,
    fontFamily: "'Fraunces', Georgia, serif",
    marginTop: 30,
    border: "1px solid #D9B87A",
    boxShadow: "0 4px 14px rgba(23,57,42,0.25)",
  },
};

Object.assign(styles, {
  logoBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" },
  noteBox: { marginTop: 10, background: "#FBF3DC", border: "1px solid #E4CF8C", borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "#6b5a1e" },
  fieldLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "#3a362c" },
  nameGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginTop: 6 },
  clubRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "10px 0", borderBottom: "1px solid #f2ead4" },
});

Object.assign(styles, {
  bulkBox: { marginTop: 10, background: "#F9F5E8", border: "1px solid #E4D9B8", borderRadius: 8, padding: 12 },
  bulkPreview: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, maxHeight: 130, overflowY: "auto" },
  chip: { background: "#FDFBF6", border: "1px solid #e2d9c2", borderRadius: 14, padding: "3px 10px", fontSize: 12 },
});

Object.assign(styles, {
  joinBox: { marginTop: 10, background: "#FDFBF6", border: "1px solid #E4CF8C", borderRadius: 6, padding: "8px 10px" },
  radioRow: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, padding: "3px 0", cursor: "pointer" },
});

Object.assign(styles, {
  warnBox: { background: "#FBF3DC", border: "1px solid #E4CF8C", borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "#6b4f12", marginBottom: 8 },
});

Object.assign(styles, {
  headerActions: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
  changeClubBtn: {
    background: "#D9B87A", color: "#17392A", border: "none", padding: "8px 14px", borderRadius: 6,
    fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  backBar: { maxWidth: 1100, margin: "0 auto", padding: "14px 16px 0", boxSizing: "border-box" },
});
// the admin button now sits inside headerActions, so it no longer pushes itself right
styles.adminToggle = { ...styles.adminToggle, marginLeft: 0 };

Object.assign(styles, {
  signOutBtn: {
    background: "transparent", color: "#FFFDF7", border: "2px solid #FFFDF7", padding: "7px 13px", borderRadius: 6,
    fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
});

Object.assign(styles, {
  phoneBox: { background: "#FFFDF7", border: "1px solid #e2d9c2", borderRadius: 10, padding: "12px 12px 16px" },
  phoneTabs: { display: "flex", gap: 6, overflowX: "auto", margin: "0 -12px 12px", padding: "0 12px 4px", scrollbarWidth: "none" },
  phoneTab: { flex: "0 0 auto", padding: "8px 12px", border: "1px solid #cfc4a3", borderRadius: 999, background: "#fff", color: "#17392A", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  phoneTabOn: { background: "#17392A", borderColor: "#17392A", color: "#FFFDF7" },
  phoneList: { display: "flex", flexDirection: "column", gap: 10 },
  phoneNote: { marginTop: 10, fontSize: 14, color: "#7a7462" },
});
