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

  // Base characteristics (fallback to 'Independent' stats if no bloodline is chosen)
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

  // FIX: previously listed "Blood Gift (Blood Drain)" and "Blood Gift (Natural
  // Necromancer)" as two separate Talents. That created two broken, wrongly-named
  // "Blood Gift" items instead of the single wrapper Talent, which is supposed to
  // grant Blood Drain and Natural Necromancer itself via its own script. This is
  // the fallback list used when a character is a Vampire without a chosen Bloodline
  // (subspecies) - it should mirror what every Bloodline subspecies grants.
  WFRP4E.speciesTalents ??= {};
  WFRP4E.speciesTalents["vampire"] = [
    "Frightening", "Night Vision", "Blood Gift", "Vampire's Curse"
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
      // NOTE: "Attractive, Warrior Born" is intentional system syntax for a player
      // choice between the two Talents (not "and") - left as-is.
      // FIX: "Vampire's Curse" was missing entirely from this list.
      talents: [
        "Commanding Presence", "Noble Blood", "Read/Write", "Attractive, Warrior Born",
        "Arcane Magic (Necromancy)", "Blood Gift (Von Carstein)", "Night Vision", "Vampire's Curse"
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
        "Arcane Magic (Necromancy)", "Blood Gift (Lahmian)", "Night Vision", "Vampire's Curse"
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
        "Read/Write", "Blood Gift (Blood Dragon)", "Night Vision", "Vampire's Curse"
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
        "Magical Sense", "Blood Gift (Necrarch)", "Night Vision", "Vampire's Curse"
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
        "Tenacious", "Blood Gift (Strigoi)", "Night Vision", "Vampire's Curse"
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
      // NOTE: "Alley Cat, Rover" is intentional system syntax for a player choice
      // between the two Talents (not "and") - left as-is.
      talents: [
        "Alley Cat, Rover", "Arcane Magic (Necromancy)", "Frenzy", "Read/Write",
        "Sixth Sense", "Blood Gift (Independent)", "Night Vision", "Vampire's Curse"
      ]
    }
  };

  WFRP4E.subspecies["Vampire"] = subs.vampire;

  console.log("WFRP4e Unofficial Compendium: Vampire species and bloodlines registered.");
});
// === WFRP4e — Blood Gift: free Bloodline pick on first sheet open ===
// Append this to vampire-species.js (or load alongside it the same way).
// Character Creation's batch item process doesn't reliably let scripted dialogs
// pop up, so instead of trying to force the free Bloodline Gift picker during
// creation, we offer it the first time the player actually opens their new
// character's sheet - which always happens right after Character Creation closes.

const BLOODLINE_GIFTS = {
    "Von Carstein": ["Call Forth Thunder", "Dark Majesty", "Defy the Dawn", "Ethereal Mist", "Persistent Image", "Silvered Blood", "Summon Wolves", "Transfixing Gaze", "Walking Death", "Wolf Form"],
    "Lahmian": ["Noble Blood", "Quick Blood", "Aethyric Cipher", "Corrupted Innocence", "Defy the Dawn", "Domination", "Ethereal Mist", "Familiar Form", "Transfixing Gaze", "Unhallowed Soul"],
    "Blood Dragon": ["Quick Blood", "Blademaster", "Furious Charge", "Iron Sinews", "Piercing Strike", "Terrible Blows", "Unhallowed Soul", "Unholy Regeneration", "Waterwalker", "Wolf Form"],
    "Necrarch": ["Blood-Sated", "Dark Majesty", "Deathsight", "Defy the Dawn", "Mastery Over Flesh", "Nehekharan Scrolls", "Quick Blood", "Silvered Blood", "Summon Ancients", "Wellspring of Dhar"],
    "Strigoi": ["Bat Form", "Blood-Sated", "Curse of the Revenant", "Iron Sinews", "Summon Ghouls", "Summon Vermin", "Unhallowed Soul", "Walking Death", "Waterwalker"]
};

const dedupeByName = (items) => {
    const seen = new Map();
    for (const it of items) {
        const key = it.name.toLowerCase().trim();
        if (!seen.has(key)) seen.set(key, it);
    }
    return [...seen.values()];
};

// Guards against the hook firing multiple times concurrently (e.g. sheet re-renders).
const _bloodGiftPromptInFlight = new Set();

// Foundry v13+ ApplicationV2 sheets emit "renderActorSheetV2"; the old
// "renderActorSheet" never fires for them. Register on both names so this
// works regardless of core version / sheet implementation.
const _onRenderVampireSheet = async (sheet, html, data) => {
    const actor = sheet.actor;
    if (!actor || !actor.isOwner) return;
    if (actor.system.details?.species?.value !== "vampire") return;

    const bgItem = actor.items.find(i => i.type === "talent" && i.name.split("(")[0].trim() === "Blood Gift");
    if (!bgItem) return;
    if (!bgItem.getFlag("world", "bloodGiftInitialized")) return; // mandatory gifts not granted yet, wait
    if (bgItem.getFlag("world", "bloodGiftFreePicked")) return;   // already handled

    if (_bloodGiftPromptInFlight.has(actor.id)) return;
    _bloodGiftPromptInFlight.add(actor.id);

    try {
        const bloodline = bgItem.getFlag("world", "bloodGiftBloodline") ?? bgItem.name.match(/\((.*?)\)/)?.[1]?.trim();
        if (!bloodline) return;

        const bloodlineList = bloodline === "Independent"
            ? [...new Set(Object.values(BLOODLINE_GIFTS).flat())]
            : (BLOODLINE_GIFTS[bloodline] ?? []);
        const bloodlineListLower = bloodlineList.map(n => n.toLowerCase().trim());

        const allGifts = dedupeByName(await warhammer.utility.findAllItems("wfrp4e-unofficial-compendium.bloodgift", "Loading Blood Gifts", true));
        const alreadyOwned = new Set(actor.items.filter(i => i.name).map(i => i.name.toLowerCase().trim()));

        const candidates = allGifts
            .filter(g => bloodlineListLower.includes(g.name.toLowerCase().trim()))
            .filter(g => !alreadyOwned.has(g.name.toLowerCase().trim()));

        if (candidates.length === 0) {
            await bgItem.setFlag("world", "bloodGiftFreePicked", true);
            return;
        }

        const effect = bgItem.effects.contents[0];
        const choice = await ItemDialog.create(candidates, 1, {
            text: `Choose your free ${bloodline} Blood Gift`,
            title: "Blood Gift"
        });

        if (choice.length) {
            await actor.addEffectItems(choice.map(i => i.uuid), effect);
            ui.notifications.info(`${actor.name} gained the ${bloodline} Blood Gift: ${choice[0].name}.`);
            await bgItem.setFlag("world", "bloodGiftFreePicked", true);
        } else {
            ui.notifications.info("You can pick your free Bloodline Blood Gift next time you open this character sheet.");
            // Flag intentionally left unset so the prompt reappears next time the sheet opens.
        }
    } finally {
        _bloodGiftPromptInFlight.delete(actor.id);
    }
};

Hooks.on("renderActorSheetV2", _onRenderVampireSheet);
Hooks.on("renderActorSheet", _onRenderVampireSheet);