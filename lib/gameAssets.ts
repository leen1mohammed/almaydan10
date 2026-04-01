// lib/gameAssets.ts

export const GAME_ASSETS: Record<string, { title: string; header: string }> = {
  valorant: {
    title: "VALORANT",
    header: "/games/valorant.png",
  },
  warzone: {
    title: "CALL OF DUTY: WARZONE",
    header: "/games/warzone.png",
  },

  // (جهزيها لاحقًا لما تضيفين صورها)
  "league-of-legends": {
    title: "LEAGUE OF LEGENDS",
    header: "/games/league-of-legends.png",
  },
  
  pubg: {
    title: "PUBG",
    header: "/games/pubg.png",
  },
  fc24: {
    title: "EA SPORTS FC 24",
    header: "/games/fc24.png",
  },

  // اختلافات محتملة من PandaScore (احتياط)
  fifa: {
    title: "EA SPORTS FC 24",
    header: "/games/fc24.png",
  },
  "ea-sports-fc-24": {
    title: "EA SPORTS FC 24",
    header: "/games/fc24.png",
  },
  "call-of-duty": {
    title: "CALL OF DUTY",
    header: "/games/warzone.png",
  },
  "call-of-duty-warzone": {
    title: "CALL OF DUTY: WARZONE",
    header: "/games/warzone.png",
  },
    // ===== NEW: games showing without headers =====
  "dota-2": {
    title: "DOTA 2",
    header: "/games/dota-2.png",
  },
  kog: {
    title: "KOG",
    header: "/games/kog.png",
  },
  "starcraft-2": {
    title: "STARCRAFT II",
    header: "/games/starcraft-2.png",
  },

  // CS:GO / CS2 (نغطي أكثر من شكل)
  "cs-go": {
    title: "COUNTER-STRIKE 2",
    header: "/games/csgo.png",
  },
  csgo: {
    title: "COUNTER-STRIKE 2",
    header: "/games/csgo.png",
  },

};
