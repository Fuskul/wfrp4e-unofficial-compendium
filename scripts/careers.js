Hooks.once("init", () => {
    
    // 1. ЗАМЕНА КАРЬЕР 
    game.wfrp4e.utility.mergeCareerReplacements({
        "human-kislevite": {
            "Envoy": "Gospodar Legate",
            "Priest": "Priest of Dazh",
            "Warrior Priest": ["Priest of Ursun", "Warrior Priest of Tor"],
            "Witch": ["Ice Witch", "Necromancer"],
            "Witch Hunter": "Chekist",
            "Spy": "Chekist",
            "Wizard": "Ice Witch",
            "Cavalryman": "Ungol Horse Archer"
        }
    });
    // 2. БЛАГОСЛОВЕНИЯ БОГОВ
    const WFRP4E = game.wfrp4e.config;
    WFRP4E.godBlessings = WFRP4E.godBlessings || {};
    
    WFRP4E.godBlessings["ursun"] = [
      "Compendium.wfrp4e-core.items.Item.ElmLfnrXliStS9CP",
      "Compendium.wfrp4e-core.items.Item.0r3moMIHXsBrcOyh",
      "Compendium.wfrp4e-core.items.Item.KSDrXcieyRc37YI7",
      "Compendium.wfrp4e-core.items.Item.eBRjKAF6U0yR0KK8",
      "Compendium.wfrp4e-core.items.Item.GvaOlWY8iD5CO1WB",
      "Compendium.wfrp4e-core.items.Item.2WN0muIB2BFd4kBO"
    ];

    WFRP4E.godBlessings["dazh"] = [
      "Compendium.wfrp4e-core.items.Item.FElNQGNiPzaOwwKT",
      "Compendium.wfrp4e-core.items.Item.C92dpJPRYpkZFsGu",
      "Compendium.wfrp4e-core.items.Item.K5DE9cceinUTIrem",
      "Compendium.wfrp4e-core.items.Item.Jkt465WPdRcejLwl",
      "Compendium.wfrp4e-core.items.Item.Cg2Q3TV66cpmheHS",
      "Compendium.wfrp4e-core.items.Item.2WN0muIB2BFd4kBO"
    ];

    WFRP4E.godBlessings["tor"] = [
      "Compendium.wfrp4e-core.items.Item.ElmLfnrXliStS9CP",
      "Compendium.wfrp4e-core.items.Item.KSDrXcieyRc37YI7",
      "Compendium.wfrp4e-core.items.Item.0r3moMIHXsBrcOyh",
      "Compendium.wfrp4e-core.items.Item.eBRjKAF6U0yR0KK8",
      "Compendium.wfrp4e-core.items.Item.Cg2Q3TV66cpmheHS",
      "Compendium.wfrp4e-core.items.Item.GvaOlWY8iD5CO1WB"
    ];
});