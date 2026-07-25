// token-effect-icons.js
// Adds "On the Defensive", "Invisible" and "Blind" to the TOKEN status-effect HUD
// palette (the grid of clickable icons on the token) — WITHOUT listing them in the
// character sheet's conditions column.
//
// Why the ready hook and CONFIG.statusEffects only:
//   WFRP4e (wfrp4e.js) does `CONFIG.statusEffects = game.wfrp4e.config.statusEffects`
//   in its own "ready" hook, so both arrays are the SAME reference. The token HUD
//   reads CONFIG.statusEffects; the sheet's conditions column (_getConditionData)
//   reads game.wfrp4e.config.statusEffects. If we pushed to that shared array the
//   icons would also clutter the sheet. So we run AFTER WFRP4e's ready hook and
//   REPLACE CONFIG.statusEffects with a new array (base + ours), leaving
//   game.wfrp4e.config.statusEffects untouched.
//
// These are plain (non-numbered) status effects, so WFRP4e's toggleStatusEffect
// falls back to Foundry's core toggle: click to apply, click again to remove.
// Each entry is cloned from the matching system effect, so its behaviour is kept
// (e.g. "On the Defensive" still prompts for a defence skill on apply).

Hooks.once("ready", () => {
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
    const extra = [];

    for (const m of MARKERS) {
        // Reuse the real system effect so its behaviour (scriptData) is preserved.
        const source = Object.values(systemEffects).find(e => e?.name === m.name);
        if (!source) {
            console.warn(`WFRP4e | token-effect-icons: system effect "${m.name}" not found — plain marker used.`);
        }

        const base = source ? foundry.utils.deepClone(source) : {};
        const statusEffect = foundry.utils.mergeObject(base, {
            id: m.id,
            _id: m._id,
            name: m.name,
            img: m.img,
            icon: m.img, // older-API compatibility
            statuses: [m.id]
        });

        // Not a numbered condition -> WFRP4e uses core toggle (add on click, remove
        // on next click). This also keeps it out of the sheet's numbered-condition UI.
        foundry.utils.setProperty(statusEffect, "system.condition.numbered", false);
        foundry.utils.setProperty(statusEffect, "flags.wfrp4e.condition", false);

        extra.push(statusEffect);
    }

    // Add ONLY to CONFIG.statusEffects (token HUD). Do NOT touch
    // game.wfrp4e.config.statusEffects (character-sheet conditions column).
    const ourIds = new Set(MARKERS.map(m => m.id));
    CONFIG.statusEffects = CONFIG.statusEffects.filter(e => !ourIds.has(e.id)).concat(extra);

    // --- Keep "Dead" visible on the character sheet ---
    // WFRP4e's sheet (_getConditionData) always DROPS the LAST entry of
    // game.wfrp4e.config.statusEffects (the base list's last entry is "dead").
    // Append a hidden spacer — same minimal shape as a base entry, NO _id — so the
    // sacrifice hits the spacer instead of "Dead". This affects only the sheet list,
    // not the token HUD (which now uses its own CONFIG.statusEffects array above).
    const sheetList = cfg.statusEffects;
    if (Array.isArray(sheetList) && sheetList.length && sheetList[sheetList.length - 1]?.id !== "fuskspacer") {
        // Clone the current last entry (valid schema, incl. a defined name) and only
        // change its id/statuses. Do NOT set _id. It becomes the throwaway last.
        const spacer = foundry.utils.deepClone(sheetList[sheetList.length - 1]);
        delete spacer._id;
        spacer.id = "fuskspacer";
        spacer.statuses = ["fuskspacer"];
        sheetList.push(spacer);
    }
});
