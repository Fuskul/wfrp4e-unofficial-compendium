// ============================================================================
//  Auto-complete a character's CURRENT career when its advancement conditions
//  are met, ticking the "complete" checkbox in the careers section.
//
//  Conditions (threshold = 5 x career level):
//    * at least 8 of the career's skills advanced to >= threshold,
//    * every career characteristic advanced to >= threshold,
//    * at least 1 of the career's talents taken (advances >= 1).
//
//  Behaviour: one-directional — it only ticks the box when the conditions are
//  met; it never un-ticks (so a GM can still complete a career early by hand).
//  Only the current career is evaluated. A toast is shown on auto-completion.
//
//  Data model (system v9, confirmed from static templates + template.json):
//    career.system.level.value        (String)   career level
//    career.system.current.value      (Boolean)  is the active career
//    career.system.complete.value     (Boolean)  completed flag (the checkbox)
//    career.system.skills             (String[]) skill names
//    career.system.talents            (String[]) talent names
//    career.system.characteristics    ({key:Boolean}) which characteristics
//    skill.system.advances.value      (Number)
//    talent.system.advances.value     (Number)
//    actor.system.characteristics.<abbr>.advances (Number)
// ============================================================================

(() => {
"use strict";

const MODULE_ID = "wfrp4e-unofficial-compendium";
const PER_LEVEL = 5;            // advances required per level
const SKILLS_REQUIRED = 8;      // number of career skills that must reach the threshold

const enabled = () => {
    try { return game.settings.get(MODULE_ID, "careerAutoComplete"); }
    catch { return true; }
};

Hooks.once("init", () => {
    game.settings.register(MODULE_ID, "careerAutoComplete", {
        name: "Auto-complete careers",
        hint: "Ticks the 'complete' box on the current career when its requirements are met, and shows a requirements readout at the top of the Careers section.",
        scope: "world", config: true, type: Boolean, default: true
    });
});

/* -------------------------------------------------------------------------- */

const norm = (s) => String(s ?? "").trim().toLowerCase();

/** Match a career entry name against an owned item name, honouring "(Any)". */
function nameMatches(careerName, itemName) {
    const c = norm(careerName);
    const a = norm(itemName);
    if (!c) return false;
    if (c === a) return true;
    const any = c.match(/^(.*?)\s*\((any|аny|любой|раздел)\)\s*$/);
    if (any) {
        const base = any[1].trim();
        return a === base || a.startsWith(base + " (");
    }
    return false;
}

/** Best (max) advances among owned items of a type matching `name`. */
function bestAdvances(items, name) {
    let best = 0;
    for (const it of items) {
        if (nameMatches(name, it.name)) best = Math.max(best, Number(it.system?.advances?.value ?? 0));
    }
    return best;
}

/** The character's active career item, or null. */
function getCurrentCareer(actor) {
    const careers = actor.itemTypes?.career ?? actor.items.filter(i => i.type === "career");
    return careers.find(c => c.system?.current?.value) ?? null;
}

/** Detailed completion status for a career (used by the check and the readout). */
function careerStatus(actor, career) {
    const level = Number(career.system?.level?.value) || 1;
    const threshold = PER_LEVEL * level;

    // Skills: at least SKILLS_REQUIRED (or all listed, if fewer) at threshold.
    const careerSkills = career.system?.skills ?? [];
    const skillItems = actor.items.filter(i => i.type === "skill");
    const haveSkills = careerSkills.filter(n => bestAdvances(skillItems, n) >= threshold).length;
    const needSkills = Math.min(SKILLS_REQUIRED, careerSkills.length);
    const skillsOk = needSkills > 0 && haveSkills >= needSkills;

    // Characteristics: EVERY career characteristic at threshold.
    const chars = career.system?.characteristics ?? {};
    const careerChars = Object.entries(chars).filter(([, v]) => v).map(([k]) => k);
    const charAdv = (abbr) => Number(actor.system?.characteristics?.[abbr]?.advances ?? 0);
    const missingChars = careerChars.filter(a => charAdv(a) < threshold);
    const charsOk = careerChars.length > 0 && missingChars.length === 0;

    // Talents: at least one career talent actually taken.
    const careerTalents = career.system?.talents ?? [];
    const talentItems = actor.items.filter(i => i.type === "talent");
    const talentsOk = careerTalents.some(n => bestAdvances(talentItems, n) >= 1);

    return {
        level, threshold,
        haveSkills, needSkills, skillsOk,
        missingChars, charsOk,
        talentsOk,
        complete: skillsOk && charsOk && talentsOk
    };
}

/** Evaluate whether the given career meets its completion conditions. */
function isCareerComplete(actor, career) {
    return careerStatus(actor, career).complete;
}

/** Check the current career and tick "complete" if the conditions are met. */
async function checkAndComplete(actor) {
    if (!enabled()) return;
    if (!actor || actor.type !== "character") return;
    const career = getCurrentCareer(actor);
    if (!career || career.system?.complete?.value) return;      // none / already complete
    if (!isCareerComplete(actor, career)) return;
    try {
        await career.update({ "system.complete.value": true });
        ui.notifications?.info(`${actor.name}: career "${career.name}" completed — requirements met.`);
    } catch (err) {
        console.error(`${MODULE_ID} | career auto-complete failed`, err);
    }
}

/* -------------------------------------------------------------------------- */
/*  Triggers: re-check whenever advancement-relevant data changes.             */
/* -------------------------------------------------------------------------- */

const RELEVANT_TYPES = new Set(["skill", "talent", "career"]);

function onItemChange(item, userId) {
    if (game.user.id !== userId) return;
    if (!(item.parent instanceof Actor)) return;
    if (!RELEVANT_TYPES.has(item.type)) return;
    checkAndComplete(item.parent);
}

Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (game.user.id !== userId) return;
    // Only bother when characteristics (which hold advances) changed.
    if (!foundry.utils.hasProperty(changes, "system.characteristics")) return;
    checkAndComplete(actor);
});

Hooks.on("updateItem", (item, changes, options, userId) => onItemChange(item, userId));
Hooks.on("createItem", (item, options, userId) => onItemChange(item, userId));
Hooks.on("deleteItem", (item, options, userId) => onItemChange(item, userId));

/* -------------------------------------------------------------------------- */
/*  Sheet readout + on-open check                                              */
/* -------------------------------------------------------------------------- */

const escapeText = (s) => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const charLabel = (abbr) => game.wfrp4e?.config?.characteristicsAbbrev?.[abbr] ?? String(abbr).toUpperCase();

/** Insert a status line at the top of the Careers section of a character sheet. */
function injectCareerStatus(sheet) {
    const root = sheet.element;
    const actor = sheet.document;
    if (!root?.querySelector || actor?.type !== "character") return;

    root.querySelector(".wuc-career-status")?.remove();
    if (!enabled()) return;

    const career = getCurrentCareer(actor);
    if (!career) return;

    // Locate the career rows on the sheet (language-independent, via uuid).
    const careerUuids = new Set((actor.itemTypes?.career ?? []).map(c => c.uuid));
    const rows = [...root.querySelectorAll(".list-row[data-uuid]")];
    const anchor = rows.find(r => r.dataset.uuid === career.uuid) ?? rows.find(r => careerUuids.has(r.dataset.uuid));
    if (!anchor) return;

    const st = careerStatus(actor, career);
    const bar = document.createElement("div");
    bar.className = "wuc-career-status" + (st.complete ? " complete" : "");

    if (st.complete) {
        bar.innerHTML = `<span class="wuc-cs-title">${escapeText(career.name)}:</span> career requirements met ✓`;
    } else {
        const parts = [];
        parts.push(`Skills <b>${st.haveSkills}/${st.needSkills}</b>`);
        parts.push(st.missingChars.length
            ? `Characteristics: <b>${st.missingChars.map(a => escapeText(charLabel(a))).join(", ")}</b>`
            : "Characteristics ✓");
        parts.push(st.talentsOk ? "Talent ✓" : "Talent: <b>1 needed</b>");
        bar.innerHTML =
            `<span class="wuc-cs-title">To complete ${escapeText(career.name)} (lvl ${st.level}):</span> ` +
            parts.join(" · ");
    }

    anchor.parentElement.insertBefore(bar, anchor);
}

// Patch the base character-sheet _onRender to inject the readout and run an
// on-open completion check (separate guard from the inventory UI patch).
Hooks.once("ready", () => {
    if (typeof ActorSheetWFRP4eCharacter === "undefined") return;
    const proto = ActorSheetWFRP4eCharacter.prototype;
    if (proto.__wucCareerWrapped) return;
    const original = proto._onRender;
    proto._onRender = async function (...args) {
        const result = await original?.apply(this, args);
        try {
            injectCareerStatus(this);
            if (this.document?.isOwner) checkAndComplete(this.document);
        } catch (err) { console.error(`${MODULE_ID} | career readout failed`, err); }
        return result;
    };
    proto.__wucCareerWrapped = true;
});

})();
