Hooks.on("init", () => {
    const WFRP4E = game.wfrp4e.config;
    
    // --- ВОТ ОН, СЕКРЕТНЫЙ ИНГРЕДИЕНТ ДЛЯ ГЕНЕРАТОРА ПЕРСОНАЖЕЙ ---
    if (!WFRP4E.extraSpecies) {
        WFRP4E.extraSpecies = [];
    }
    if (!WFRP4E.extraSpecies.includes("delf")) {
        WFRP4E.extraSpecies.push("delf");
    }

    // Регистрируем саму расу
    WFRP4E.species["delf"] = "Dark Elf";

    WFRP4E.speciesCharacteristics["delf"] = {
        "ws": "2d10+30", "bs": "2d10+30", "s": "2d10+20", "t": "2d10+20",
        "i": "2d10+40", "ag": "2d10+30", "dex": "2d10+30", "int": "2d10+30",
        "wp": "2d10+30", "fel": "2d10+20"
    };

    WFRP4E.speciesSkills["delf"] = [
        "Bribery", "Charm", "Cool", "Dodge", "Evaluate", "Gossip", 
        "Intuition", "Language (Eltharin)", "Melee (Basic)", "Navigation", 
        "Perception", "Stealth (Any)"
    ];

    WFRP4E.speciesTalents["delf"] = [
        "Acute Sense (Sight)", "Hatred (High Elves)", "Night Vision", 
        "Read/Write", "Savvy, Schemer", "Second Sight, Sixth Sense", 0
    ];

    WFRP4E.speciesFate["delf"] = 0;
    WFRP4E.speciesRes["delf"] = 0;
    WFRP4E.speciesExtra["delf"] = 2;
    WFRP4E.speciesMovement["delf"] = 5;
    WFRP4E.speciesAge["delf"] = "10d10 + 30";
    WFRP4E.speciesHeight["delf"] = { feet: 6, inches: 0, die: "1d10" };

    // --- ЗАГРУЗКА ИМЁН ---
    const modulePath = "modules/wfrp-4-enemy-within-ru/names";
    
    if (!game.wfrp4e.names) {
        game.wfrp4e.names = {};
    }

    fetch(`${modulePath}/dark_elf_start.txt`).then(r => r.text()).then(nameText => {
        game.wfrp4e.names.delf_start = nameText.split(/\r?\n/).filter(i => i.trim()).map(i => [i.trim()]);
    });
    fetch(`${modulePath}/dark_elf_connectors.txt`).then(r => r.text()).then(nameText => {
        game.wfrp4e.names.delf_connectors = nameText.split(/\r?\n/).filter(i => i.trim()).map(i => [i.trim()]);
    });
    fetch(`${modulePath}/dark_elf_end.txt`).then(r => r.text()).then(nameText => {
        game.wfrp4e.names.delf_end = nameText.split(/\r?\n/).filter(i => i.trim()).map(i => [i.trim()]);
    });
    fetch(`${modulePath}/dark_elf_surnames.txt`).then(r => r.text()).then(nameText => {
        game.wfrp4e.names.delf_surnames = nameText.split(/\r?\n/).filter(i => i.trim()).map(i => [i.trim()]);
    });

    game.wfrp4e.names.delf = {
        forename() {
            let start = game.wfrp4e.names.RollArray("delf_start") || "";
            let connector = Math.random() > 0.5 ? (game.wfrp4e.names.RollArray("delf_connectors") || "") : "";
            let end = game.wfrp4e.names.RollArray("delf_end") || "";
            let name = start + connector + end;
            return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        },
        surname() {
            let sur = game.wfrp4e.names.RollArray("delf_surnames") || "";
            return sur.charAt(0).toUpperCase() + sur.slice(1).toLowerCase();
        }
    };
});