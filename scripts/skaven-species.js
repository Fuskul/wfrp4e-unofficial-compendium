// === WFRP4e — Skaven species + clans (fully automated, EN) ===
Hooks.once("init", () => {
  const WFRP4E = game.wfrp4e?.config;
  if (!WFRP4E) return;

  // ---- Species: Skaven ------------------------------------------------------
  WFRP4E.extraSpecies ??= [];
  if (!WFRP4E.extraSpecies.includes("skaven")) WFRP4E.extraSpecies.push("skaven");

  WFRP4E.species ??= {};
  WFRP4E.species["skaven"] = "Skaven";

  WFRP4E.speciesCharacteristics ??= {};
  WFRP4E.speciesCharacteristics["skaven"] = {
    ws:  "2d10+20",
    bs:  "2d10+20",
    s:   "2d10+20",
    t:   "2d10+20",
    i:   "2d10+30",
    ag:  "2d10+25",
    dex: "2d10+25",
    int: "2d10+20",
    wp:  "2d10+10",
    fel: "2d10+15"
  };

  WFRP4E.speciesSkills ??= {};
  WFRP4E.speciesSkills["skaven"] = [
    "Athletics","Climb","Dodge","Endurance","Perception",
    "Stealth (Underground)","Stealth (Urban)","Melee (Basic)",
    "Language (Queekish)","Consume Alcohol"
  ];

  // Ровно 5 талантов: 2 фикс + 3 случайных
  WFRP4E.speciesTalents ??= {};
  WFRP4E.speciesTalents["skaven"] = ["Night Vision","Flee!"];
  WFRP4E.speciesRandomTalents ??= {};
  WFRP4E.speciesRandomTalents["skaven"] = { talents: 3 };

  // Доп. мета (не обязательно, но ок)
  WFRP4E.speciesMovement ??= {};  WFRP4E.speciesMovement["skaven"] = 5;
  WFRP4E.speciesTraits   ??= {};  WFRP4E.speciesTraits["skaven"]   = ["Night Vision"];
  WFRP4E.speciesAge      ??= {};  WFRP4E.speciesAge["skaven"]      = "12+1d10";
  WFRP4E.speciesHeight   ??= {};  WFRP4E.speciesHeight["skaven"]   = { feet: 5, inches: 0, die: "1d10" };

  // ---- Subspecies: Skaven clans (как у humans/dwarfs: объекты с name/skills/talents) ----
  const subs = WFRP4E.subspecies ??= {};
  subs.skaven = {
    // 1) Clan Eshin — assassins & acrobatics
    eshin: {
      name: "Clan Eshin",
      skills: [
        "Stealth (Urban)", "Stealth (Underground)", "Athletics", "Climb",
        "Perception", "Dodge", "Melee (Basic)", "Ranged (Throwing)",
        "Sleight of Hand", "Pick Lock", "Set Trap", "Intimidate"
      ],
      talents: [
        "Shadow",
        "Catfall",
        "Step Aside, Combat Reflexes" // choice = counts as 1
      ],
      randomTalents: { talents: 2 }     // total talents = 5
    },

    // 2) Clan Skryre — warp-tech gunners & tinkerers
    skryre: {
      name: "Clan Skryre",
      skills: [
        "Trade (Engineer)", "Lore (Engineering)", "Evaluate", "Language (Magick)",
        "Perception", "Ranged (Blackpowder)", "Ranged (Crossbow)", "Dodge",
        "Melee (Basic)", "Language (Queekish)", "Trade (Smith)", "Navigation"
      ],
      talents: [
        "Craftsman (Engineering)",
        "Tinker",
        "Marksman, Accurate Shot"
      ],
      randomTalents: { talents: 2 }
    },

    // 3) Clan Pestilens — plague monks & zealots
    pestilens: {
      name: "Clan Pestilens",
      skills: [
        "Theology (Horned Rat)", "Pray", "Heal", "Trade (Apothecary)",
        "Endurance", "Intimidate", "Lore (Medicine)", "Lore (Theology)",
        "Melee (Brawling)", "Stealth (Underground)", "Perception", "Charm"
      ],
      talents: [
        "Resistance (Disease)",
        "Hardy",
        "Pure Soul, Strong Minded"
      ],
      randomTalents: { talents: 2 }
    },

    // 4) Clan Moulder — beast masters
    moulder: {
      name: "Clan Moulder",
      skills: [
        "Animal Care", "Animal Training (Rat Ogre)", "Charm Animal", "Endurance",
        "Intimidate", "Melee (Brawling)", "Melee (Basic)", "Trade (Butcher)",
        "Outdoor Survival", "Perception", "Set Trap", "Drive"
      ],
      talents: [
        "Animal Affinity",
        "Menacing",
        "Strong Back, Sturdy"
      ],
      randomTalents: { talents: 2 }
    },

    // 5) Warlord Clan Mors — heavy line breakers
    mors: {
      name: "Warlord Clan Mors",
      skills: [
        "Leadership", "Intimidate", "Melee (Basic)", "Melee (Polearm)",
        "Melee (Two-Handed)", "Ranged (Throwing)", "Athletics", "Dodge",
        "Endurance", "Perception", "Gamble", "Language (Queekish)"
      ],
      talents: [
        "Commanding Presence",
        "Strike to Stun",
        "Warrior Born, Inspiring"
      ],
      randomTalents: { talents: 2 }
    },

    // 6) Warlord Clan Rictus — fast shock troops
    rictus: {
      name: "Warlord Clan Rictus",
      skills: [
        "Athletics", "Dodge", "Melee (Basic)", "Melee (Two-Handed)",
        "Melee (Flail)", "Ranged (Sling)", "Stealth (Urban)", "Perception",
        "Endurance", "Intimidate", "Set Trap", "Gamble"
      ],
      talents: [
        "Lightning Reflexes",
        "Combat Reflexes",
        "Step Aside, Sprinter"
      ],
      randomTalents: { talents: 2 }
    },

    // 7) Clan Mange — saboteurs & fixers
    mange: {
      name: "Clan Mange",
      skills: [
        "Stealth (Urban)", "Stealth (Underground)", "Sleight of Hand", "Pick Lock",
        "Evaluate", "Haggle", "Bribery", "Charm", "Gossip", "Perception",
        "Set Trap", "Dodge"
      ],
      talents: [
        "Rogue",
        "Dealmaker",
        "Etiquette (Criminals), Schemer"
      ],
      randomTalents: { talents: 2 }
    }
  };

  // (на всякий случай продублируем по метке — некоторые темы смотрят по лейблу)
  WFRP4E.subspecies["Skaven"] = subs.skaven;

  console.log("WFRP4e: Skaven species + clans registered");
});
