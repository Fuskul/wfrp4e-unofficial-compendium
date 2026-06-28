// === WFRP4e — Vampire Species & Bloodlines (English) ===
Hooks.once("init", () => {
  const WFRP4E = game.wfrp4e?.config;
  if (!WFRP4E) return;

  // ---- Species: Vampire ----
  WFRP4E.extraSpecies ??= [];
  if (!WFRP4E.extraSpecies.includes("vampire")) {
    WFRP4E.extraSpecies.push("vampire");
  }

  WFRP4E.species ??= {};
  WFRP4E.species["vampire"] = "Vampire";

  // Base characteristics (Fallback to 'Independent' stats if no bloodline is chosen)
  WFRP4E.speciesCharacteristics ??= {};
  WFRP4E.speciesCharacteristics["vampire"] = {
    ws:  "2d10+40", bs:  "2d10+20", s:   "2d10+30", t:   "2d10+30",
    i:   "2d10+30", ag:  "2d10+30", dex: "2d10+30", int: "2d10+20",
    wp:  "2d10+40", fel: "2d10+20"
  };

  WFRP4E.speciesSkills ??= {};
  WFRP4E.speciesSkills["vampire"] = [
    "Athletics", "Lore (Vampires)", "Channelling (Dhar)", "Charm", "Evaluate",
    "Melee (Basic)", "Stealth (Any)", "Gossip", "Ranged (Any)", "Cool",
    "Language (Magick)", "Language (Any)"
  ];

  WFRP4E.speciesTalents ??= {};
  WFRP4E.speciesTalents["vampire"] = [
    "Frightening", "Blood Gift (Blood Drain)", "Blood Gift (Natural Necromancer)"
  ];

  WFRP4E.speciesRandomTalents ??= {};
  WFRP4E.speciesRandomTalents["vampire"] = { talents: 0 };

  WFRP4E.speciesFate ??= {};
  WFRP4E.speciesFate["vampire"] = 0;

  WFRP4E.speciesRes ??= {};
  WFRP4E.speciesRes["vampire"] = 3;

  WFRP4E.speciesExtra ??= {};
  WFRP4E.speciesExtra["vampire"] = 1;

  WFRP4E.speciesMovement ??= {};  
  WFRP4E.speciesMovement["vampire"] = 5;
  
  WFRP4E.speciesTraits ??= {};  
  WFRP4E.speciesTraits["vampire"] = ["Weapon (Bite) +3", "Vampiric"];
  
  WFRP4E.speciesAge ??= {};  
  WFRP4E.speciesAge["vampire"] = "18+5d100";
  
  WFRP4E.speciesHeight ??= {};  
  WFRP4E.speciesHeight["vampire"] = { feet: 5, inches: 5, die: "1d10" };

  // ---- Subspecies: Bloodlines ----
  const subs = WFRP4E.subspecies ??= {};
  subs.vampire = {
    voncarstein: {
      name: "Von Carstein",
      movement: 6,
      fate: 0,
      resilience: 3,
      extra: 1,
      characteristics: {
        ws: "2d10+50", bs: "2d10+20", s: "2d10+40", t: "2d10+40",
        i: "2d10+40", ag: "2d10+40", dex: "2d10+40", int: "2d10+20",
        wp: "2d10+50", fel: "2d10+30"
      },
      skills: [
        "Lore (Necromancy)", "Lore (Von Carstein)", "Intimidate", "Leadership",
        "Channelling (Dhar)", "Charm", "Evaluate", "Melee (Basic)",
        "Melee (Fencing)", "Gossip", "Cool", "Language (Magick)"
      ],
      talents: [
        "Commanding Presence", "Noble Blood", "Read/Write", "Attractive, Warrior Born",
        "Arcane Magic (Necromancy)", "Blood Gift (Von Carstein)","Night Vision"
      ]
    },
    lahmian: {
      name: "Lahmian",
      movement: 6,
      fate: 0,
      resilience: 3,
      extra: 1,
      characteristics: {
        ws: "2d10+40", bs: "2d10+20", s: "2d10+40", t: "2d10+40",
        i: "2d10+50", ag: "2d10+40", dex: "2d10+40", int: "2d10+20",
        wp: "2d10+50", fel: "2d10+40"
      },
      skills: [
        "Art (Any)", "Sleight of Hand", "Lore (Lahmian Sisterhood)", "Lore (Necromancy)",
        "Intuition", "Channelling (Dhar)", "Charm", "Bribery", "Melee (Fencing)",
        "Gossip", "Cool", "Language (Magick)"
      ],
      talents: [
        "Read/Write", "Attractive", "Schemer", "Public Speaking, Gregarious",
        "Arcane Magic (Necromancy)", "Blood Gift (Lahmian)","Night Vision","Vampire's Curse"
      ]
    },
    blooddragon: {
      name: "Blood Dragon",
      movement: 6,
      fate: 0,
      resilience: 3,
      extra: 1,
      characteristics: {
        ws: "2d10+50", bs: "2d10+20", s: "2d10+40", t: "2d10+40",
        i: "2d10+40", ag: "2d10+40", dex: "2d10+40", int: "2d10+20",
        wp: "2d10+50", fel: "2d10+20"
      },
      skills: [
        "Athletics", "Ride (Horse)", "Intimidate", "Lore (Blood Dragons)",
        "Lore (Necromancy)", "Channelling (Dhar)", "Leadership", "Melee (Cavalry)",
        "Melee (Any)", "Melee (Basic)", "Cool", "Language (Magick)"
      ],
      talents: [
        "Arcane Magic (Necromancy)", "Acute Hearing", "Seasoned Traveller", "Warrior Born",
        "Read/Write", "Blood Gift (Blood Dragon)","Night Vision","Vampire's Curse"
      ]
    },
    necrarch: {
      name: "Necrarch",
      movement: 6,
      fate: 0,
      resilience: 3,
      extra: 1,
      characteristics: {
        ws: "2d10+30", bs: "2d10+20", s: "2d10+40", t: "2d10+40",
        i: "2d10+40", ag: "2d10+20", dex: "2d10+40", int: "2d10+50",
        wp: "2d10+50", fel: "2d10+10"
      },
      skills: [
        "Lore (Any)", "Lore (Necrarchs)", "Lore (Necromancy)", "Research",
        "Channelling (Dhar)", "Evaluate", "Trade (Apothecary)", "Trade (Embalmer)",
        "Melee (Basic)", "Cool", "Language (Classical)", "Language (Nehekharan)", "Language (Magick)"
      ],
      talents: [
        "Aethyric Attunement", "Arcane Magic (Necromancy)", "Read/Write", "Second Sight",
        "Magical Sense", "Blood Gift (Necrarch)","Night Vision","Vampire's Curse"
      ]
    },
    strigoi: {
      name: "Strigoi",
      movement: 6,
      fate: 0,
      resilience: 3,
      extra: 1,
      characteristics: {
        ws: "2d10+50", bs: "2d10+20", s: "2d10+50", t: "2d10+40",
        i: "2d10+40", ag: "2d10+50", dex: "2d10+40", int: "2d10+20",
        wp: "2d10+40", fel: "2d10+10"
      },
      skills: [
        "Athletics", "Intimidate", "Outdoor Survival", "Lore (Strigoi)",
        "Lore (Necromancy)", "Channelling (Dhar)", "Climb", "Perception",
        "Melee (Brawling)", "Stealth (Rural)", "Cool", "Language (Magick)"
      ],
      talents: [
        "Arcane Magic (Necromancy)", "Warrior Born", "Rover", "Read/Write",
        "Tenacious", "Blood Gift (Strigoi)","Night Vision","Vampire's Curse"
      ]
    },
    independent: {
      name: "Independent",
      movement: 5,
      fate: 0,
      resilience: 3,
      extra: 1,
      characteristics: {
        ws: "2d10+40", bs: "2d10+20", s: "2d10+30", t: "2d10+30",
        i: "2d10+30", ag: "2d10+30", dex: "2d10+30", int: "2d10+20",
        wp: "2d10+40", fel: "2d10+20"
      },
      skills: [
        "Athletics", "Lore (Vampires)", "Channelling (Dhar)", "Charm", "Evaluate",
        "Melee (Basic)", "Stealth (Any)", "Gossip", "Ranged (Any)", "Cool",
        "Language (Magick)", "Language (Any)"
      ],
      talents: [
        "Alley Cat, Rover", "Arcane Magic (Necromancy)", "Frenzy", "Read/Write",
        "Sixth Sense", "Blood Gift (Independent)","Night Vision","Vampire's Curse"
      ]
    }
  };

  WFRP4E.subspecies["Vampire"] = subs.vampire;
  
  console.log("WFRP4e Unofficial Compendium: Vampire species and bloodlines registered.");
});