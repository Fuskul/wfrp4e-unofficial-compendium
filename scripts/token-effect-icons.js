// token-effect-icons.js
// Adds "On the Defensive", "Invisible" and "Blind" to the token status-effect
// HUD palette (the grid of clickable icons on the token) so they can be toggled
// straight from the token, like the Ice module adds "Chilled".
//
// Crucially, each palette entry is built ON TOP OF the real WFRP4e "system effect"
// (the one from the sheet's "Select Effect" dropdown), so it keeps that effect's
// behaviour — e.g. "On the Defensive" still prompts you to choose a defence skill.
// We only add an id, a status and (for On the Defensive) a custom icon.

Hooks.once("setup", () => {
    const cfg = game.wfrp4e?.config;
    if (!cfg) {
        console.error("WFRP4e | token-effect-icons: system config not found — cannot add token icons.");
        return;
    }

    // id -> display name + palette icon. _id is a static 16-char document id,
    // required by Foundry v13 for status effects that declare their own statuses.
    const MARKERS = [
        { id: "onthedefensive", _id: "fuskOnDefensive0", name: "On the Defensive", img: "icons/svg/shield.svg" },
        { id: "invisible",      _id: "fuskInvisible000", name: "Invisible",        img: "icons/svg/invisible.svg" },
        { id: "blind",          _id: "fuskBlind0000000", name: "Blind",            img: "icons/svg/blind.svg" }
    ];

    const systemEffects = cfg.systemEffects ?? {};

    for (const m of MARKERS) {
        // 1) Grab the real system effect (carries the skill-selection script, etc.).
        const source = Object.values(systemEffects).find(e => e?.name === m.name);
        if (!source) {
            console.warn(`WFRP4e | token-effect-icons: system effect "${m.name}" not found — adding a plain marker instead.`);
        }

        // 2) Register condition metadata so WFRP4e renders it in the HUD palette.
        cfg.conditions ??= {};
        cfg.conditions[m.id] = m.name;
        cfg.conditionDescriptions ??= {};
        cfg.conditionDescriptions[m.id] ??= `<p><strong>${m.name}</strong></p>`;

        // 3) Build the palette entry from a clone of the system effect (keeps its
        //    scriptData / transferData), then layer our own fields on top.
        const base = source ? foundry.utils.deepClone(source) : {};
        const statuses = new Set(base.statuses ?? []);
        statuses.add(m.id);

        const statusEffect = foundry.utils.mergeObject(base, {
            id: m.id,
            _id: m._id,
            name: m.name,
            img: m.img,
            icon: m.img, // older-API compatibility
            statuses: Array.from(statuses),
            flags: { wfrp4e: { condition: true, value: null } }
        });
        // Non-numbered toggle (no stacking counter), without wiping any scriptData.
        statusEffect.system ??= {};
        statusEffect.system.condition = foundry.utils.mergeObject(
            statusEffect.system.condition ?? {}, { numbered: false }
        );

        // 4) Register in both palettes, replacing any existing entry with the same id.
        const keep = e => e.id !== m.id;

        CONFIG.statusEffects = CONFIG.statusEffects.filter(keep);
        CONFIG.statusEffects.push(statusEffect);

        if (Array.isArray(cfg.statusEffects)) {
            cfg.statusEffects = cfg.statusEffects.filter(keep);
            cfg.statusEffects.push(statusEffect);
        }
    }
});
