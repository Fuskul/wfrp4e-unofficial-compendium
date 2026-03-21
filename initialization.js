// initialization.js — FIXED
Hooks.once("init", () => {
  const WFRP4E = game.wfrp4e?.config;
  if (!WFRP4E) {
    console.error("WFRP4e system not loaded — cannot apply custom subspecies.");
    return;
  }
  applyCustomSubspecies(WFRP4E);
});

function applyCustomSubspecies(WFRP4E) {
  // ensure buckets exist
  const subs = WFRP4E.subspecies ??= {};
  subs.human ??= {};
  subs.dwarf ??= {};
  subs.helf  ??= {}; // High Elf

  // --- HUMAN SUBSPECIES ---
  subs.human["arabyan"] = {
    name: "Arabyan",
    skills: [
      "Charm", "Cool", "Dodge", "Evaluate", "Gossip", "Intuition", "Language (Arabyan)",
      "Melee (Basic)", "Outdoor Survival", "Ride", "Stealth (Rural)", "Trade (Any)"
    ],
    talents: [
      "Savvy, Suave",
      "Coolheaded",
      "Seasoned Traveller, Orientation"
    ],
    randomTalents: { talents: 2 }
  };

  subs.human["border_princeser"] = {
    name: "Border Princeser",
    skills: [
      "Charm","Cool","Dodge","Endurance","Gamble","Haggle",
      "Intimidate","Lore (Border Princes)","Melee (Basic)","Outdoor Survival","Perception","Stealth (Rural)"
    ],
    talents: [
      "Very Resilient, Coolheaded",
      "Suave, Savvy",
      "Seasoned Traveller, Strong-minded"
    ],
    randomTalents: { talents: 2 }
  };

  subs.human["bretonnian"] = {
    name: "Bretonnian",
    skills: [
      "Charm", "Cool", "Evaluate", "Gossip", "Leadership", "Ride (Horse)", "Animal Care",
      "Language (Bretonnian)", "Language (Estalian)", "Lore (Bretonnia)", "Melee (Basic)", "Ranged (Bow)"
    ],
    talents: [
      "Trick Riding, Read/Write",
      "Warrior Born, Suave"
    ],
    randomTalents: { talents: 3 }
  };

  subs.human["estalian"] = {
    name: "Estalian",
    skills: [
      "Charm", "Cool", "Dodge", "Evaluate", "Gossip", "Haggle", "Intuition",
      "Language (Estalian)", "Language (Tilean)", "Leadership", "Lore (Estalia)", "Melee (Fencing)"
    ],
    talents: [
      "Luck",
      "Warrior Born, Suave"
    ],
    randomTalents: { talents: 3 }
  };

  subs.human["kislevite"] = {
    name: "Kislevite",
    skills: [
      "Endurance","Outdoor Survival","Animal Care","Ride (Horse)","Language (Norse)",
      "Language (Gospodarinyi)","Lore (Kislev)","Melee (Basic)","Ranged (Bow)","Cool","Intuition","Gossip"
    ],
    talents: [
      "Warrior Born, Very Resilient",
      "Doomed, Hardy",
      "Strong Back, Strong-minded"
    ],
    randomTalents: { talents: 1 }
  };

  subs.human["strigany"] = {
    name: "Strigany",
    skills: [
      "Animal Care", "Augury", "Charm", "Consume Alcohol", "Endurance",
      "Gossip", "Haggle", "Intuition", "Language (Strigany)",
      "Ride (Horse)", "Stealth (Rural)", "Evaluate"
    ],
    talents: [
      "Sharp, Very Dexterous",
      "Carouser, Cat-tongued"
    ],
    randomTalents: { talents: 3 }
  };
  // --- HIGH ELF SUBSPECIES ---
  subs.helf["chrace"] = {
    name: "Chrace",
    skills: [
      "Cool","Endurance","Entertain (Singing)","Evaluate","Heal","Language (Eltharin)",
      "Leadership","Melee (Basic)","Navigation","Outdoor Survival","Perception","Ranged (Bow)","Set Trap"
    ],
    talents: [
      "Acute Sense (Sight)",
      "Hardy, Hunter’s Eye",
      "Read/Write",
      "Night Vision",
      "Sixth Sense",
      "Strider (Woodlands)"
    ]
  }
}
