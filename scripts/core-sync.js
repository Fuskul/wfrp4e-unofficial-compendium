// Core Sync — actors in this module's compendium carry lightweight copies of WFRP4e Core talents,
// traits and spells (flagged "coreSync"). When such an actor is imported into a world, those copies
// are swapped for the real wfrp4e-core items (with all their automation), keeping each item's
// name, advances, specification and memorisation. Talents that add +5 to a Characteristic are never
// swapped, because the printed NPC profiles already include that bonus.
(() => {
    const MOD = "wfrp4e-unofficial-compendium";

    Hooks.once("init", () => {
        game.settings.register(MOD, "coreSync", {
            name: "Sync NPC items with WFRP4e Core on import",
            hint: "When an actor from Fuskul's Actors is imported into the world, replace its bundled Core talents, traits and spells with the full wfrp4e-core versions (keeps names, advances and ratings).",
            scope: "world", config: true, type: Boolean, default: true
        });
    });

    const officialPacks = () => {
        const packs = game.packs.filter(p => p.documentName === "Item" && p.metadata.packageType === "module"
            && p.metadata.packageName !== MOD && p.metadata.packageName?.startsWith("wfrp4e"));
        // wfrp4e-core first, then any other official content module
        return packs.sort((a, b) => (b.metadata.packageName === "wfrp4e-core") - (a.metadata.packageName === "wfrp4e-core"));
    };

    const baseName = (n) => n.split("(")[0].trim();

    async function findCore(name, types) {
        const packs = officialPacks();
        for (const exact of [true, false]) {
            for (const pack of packs) {
                const index = pack.indexed ? pack.index : await pack.getIndex();
                const hit = index.find(e => types.includes(e.type) && (exact ? e.name === name : baseName(e.name) === baseName(name)));
                if (hit) return pack.getDocument(hit._id);
            }
        }
        return null;
    }

    async function syncActor(actor, { notify = false } = {}) {
        const flagged = actor.items.filter(i => i.getFlag(MOD, "coreSync"));
        if (!flagged.length) {
            if (notify) ui.notifications.info(`${actor.name}: nothing to sync.`);
            return 0;
        }
        const toCreate = [], toDelete = [];
        for (const item of flagged) {
            const { name, type } = item.getFlag(MOD, "coreSync");
            const types = type === "trait" ? ["trait", "psychology"] : [type];
            const core = await findCore(name, types);
            if (!core) continue;
            const data = core.toObject();
            data._id = item.id;
            data.name = item.name;
            data.flags = foundry.utils.mergeObject(data.flags ?? {}, { [MOD]: { coreSynced: core.uuid } });
            data._stats = { compendiumSource: core.uuid };
            if (core.type === "talent") data.system.advances.value = item.system.advances?.value ?? 1;
            if (core.type === "trait") {
                data.system.specification.value = item.system.specification?.value ?? data.system.specification.value;
                if (item.system.qualities?.value?.length) data.system.qualities.value = item.system.qualities.value;
                if (item.system.flaws?.value?.length) data.system.flaws.value = item.system.flaws.value;
                data.system.disabled = item.system.disabled ?? false;
            }
            if (core.type === "spell") data.system.memorized = item.system.memorized;
            toDelete.push(item.id);
            toCreate.push(data);
        }
        if (!toCreate.length) return 0;
        await actor.deleteEmbeddedDocuments("Item", toDelete);
        await actor.createEmbeddedDocuments("Item", toCreate, { keepId: true });
        if (notify) ui.notifications.info(`${actor.name}: synced ${toCreate.length} item(s) with WFRP4e Core.`);
        return toCreate.length;
    }

    Hooks.on("createActor", async (actor, options, userId) => {
        if (userId !== game.user.id || actor.pack || !game.settings.get(MOD, "coreSync")) return;
        if (!actor.items.some(i => i.getFlag(MOD, "coreSync"))) return;
        if (!game.modules.get("wfrp4e-core")?.active) return;
        try { await syncActor(actor); }
        catch (err) { console.error(`${MOD} | Core sync failed for ${actor.name}`, err); }
    });

    Hooks.once("ready", () => {
        const mod = game.modules.get(MOD);
        mod.api = Object.assign(mod.api ?? {}, { syncCore: (actor) => syncActor(actor, { notify: true }) });
    });
})();
