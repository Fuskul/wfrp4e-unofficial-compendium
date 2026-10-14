// Lets the system find this module's RollTables (e.g. the Dark Elf career table used by Character
// Creation, or Dark Magic Complications) straight from the compendium, without importing them into
// the world. A world table with the same key/column always takes priority.
(() => {
    const MOD = "wfrp4e-unofficial-compendium";
    let cache = [];

    Hooks.once("ready", async () => {
        try {
            const pack = game.packs.get(`${MOD}.fuskul-rolltables`);
            if (pack) cache = (await pack.getDocuments()).filter(t => t.getFlag("wfrp4e", "key"));
        } catch (err) {
            console.error(`${MOD} | could not load module roll tables`, err);
        }

        const tables = game.wfrp4e?.tables;
        if (!tables?.findTable || tables.findTable._fuskulWrapped) return;
        const original = tables.findTable;
        const wrapped = function (key, column) {
            let table = original.call(this, key, column);
            const mine = cache.find(t => t.getFlag("wfrp4e", "key") === key && (column ? t.getFlag("wfrp4e", "column") === column : true));
            if (!mine) return table;
            // No world table, or the system fell back to a table for a different column
            if (!table || (column && typeof table.getFlag === "function" && table.getFlag("wfrp4e", "column") !== column)) return mine;
            return table;
        };
        wrapped._fuskulWrapped = true;
        tables.findTable = wrapped;
    });

    // Sea of Claws' "Seafarers" class (used by the Corsair career): borrow Riverfolk class trappings if no module defines it
    Hooks.once("ready", () => {
        const ct = game.wfrp4e?.config?.classTrappings;
        if (ct && !ct["Seafarers"] && ct["Riverfolk"]) ct["Seafarers"] = ct["Riverfolk"];
    });
})();
