// Temple of Spite — Lore of Dark Magic, Druchii weapon qualities and Dark Magic casting rules.
// Registers the "dark" Lore (wind: Dhar) the same way ice-magic.js / hag-magic.js register theirs.
Hooks.once("setup", () => {
    const cfg = game.wfrp4e.config;
    const MOD = "wfrp4e-unofficial-compendium";

    // ------------------------------------------------------------------ Lore of Dark Magic
    if (!cfg.magicLores["dark"]) cfg.magicLores["dark"] = "Dark Magic";
    cfg.magicWind["dark"] = cfg.magicWind["dark"] || "Dhar";
    if (cfg.loreWind) cfg.loreWind["dark"] = "dhar";

    cfg.loreEffectDescriptions["dark"] =
        "Any target who takes damage from a Lore of Dark Magic Spell experiences the sorceress's spite. If the caster causes Damage and casts with 3+ SL over the CN, she may choose an additional effect based on her <b>Soul Pacts</b> (see the Soul Pact Talent). This may be combined with Overcasting." +
        "<br><b>Corruption and Miscasts:</b> Miscasts when casting from this Lore or Channelling (<i>Dhar</i>) are always Major unless the caster has <i>Instinctive Diction</i>; ingredients do not reduce Miscasts. Rolling an 8 on the units die causes a Major Miscast and 1 Corruption point." +
        "<br><b>Complications:</b> if a Casting Test beats the CN by more than +4 SL, roll on the Dark Magic Complications table.";

    cfg.loreEffects["dark"] = {
        name: "Lore of Dark Magic",
        img: `modules/${MOD}/assets/icons/dark-magic.svg`,
        flags: { wfrp4e: { lore: true } },
        system: { transferData: { type: "other" } }
    };

    // ------------------------------------------------------------------ New weapon qualities
    const addQuality = (key, label, description, hasValue = false, effect = null) => {
        if (!cfg.weaponQualities[key]) cfg.weaponQualities[key] = label;
        if (!cfg.qualityDescriptions[key]) cfg.qualityDescriptions[key] = description;
        if (cfg.propertyHasValue[key] === undefined) cfg.propertyHasValue[key] = hasValue;
        if (effect && !cfg.propertyEffects[key]) cfg.propertyEffects[key] = effect;
    };

    addQuality("slash", "Slash",
        "Slash weapons open up gaping wounds. If you cause Critical Damage with the weapon, the target takes a <b>Bleeding</b> Condition in addition to any other effects of the critical hit. You may lose Advantage to have your opponent suffer 1 additional <b>Bleeding</b> Condition.",
        false,
        {
            name: "Slash", img: "systems/wfrp4e/icons/blank.png",
            system: {
                transferData: { documentType: "Item" },
                scriptData: [{
                    label: "Slash", trigger: "rollWeaponTest",
                    script: "if (args.test.result.critical) args.test.result.other.push(`<b>Slash</b>: the target also gains 1 @Condition[Bleeding] (lose Advantage for +1 more).`)"
                }]
            }
        });

    addQuality("barbedBolt", "Barbed Bolt",
        "A Barbed Bolt can lodge in its target if they take Damage from the hit. The target rolls a <b>Challenging (+0) Dodge</b> Test to avoid it. If failed, the target falls <b>Prone</b> and is dragged 1d10 yards towards the Scourgerunner in the chariot's combat round, taking dragging Damage (<i>Enemy in Shadows Companion</i>, p.26). A <b>Hard (−20)</b> Test is needed to pull the harpoon free, which inflicts an additional Wound.",
        false,
        {
            name: "Barbed Bolt", img: "systems/wfrp4e/icons/blank.png",
            system: {
                transferData: { documentType: "Item" },
                scriptData: [{
                    label: "Barbed Bolt", trigger: "rollWeaponTest",
                    script: "if (args.test.succeeded) args.test.result.other.push(`<b>Barbed Bolt</b>: if the target takes Damage it must pass a Challenging (+0) Dodge Test or fall @Condition[Prone] and be dragged 1d10 yards.`)"
                }]
            }
        });

    // Ship weapon qualities from Sea of Claws / Up in Arms — only registered if no other module did.
    addQuality("salvo", "Salvo", "The weapon can fire a hail of shots at once (see <i>Sea of Claws</i>). The number is the shots fired in a Salvo; a Salvo uses the lower Damage listed for the weapon.", true);
    addQuality("crewed", "Crewed", "The weapon needs the listed number of crew to operate at full effectiveness (see <i>Sea of Claws</i>).", true);
    if (!cfg.weaponFlaws["unbalanced"] && !cfg.weaponQualities["unbalanced"]) {
        cfg.weaponFlaws["unbalanced"] = "Unbalanced";
        cfg.flawDescriptions["unbalanced"] = cfg.flawDescriptions["unbalanced"] || "The weapon is awkward to wield (see <i>Up in Arms</i>).";
        if (cfg.propertyHasValue["unbalanced"] === undefined) cfg.propertyHasValue["unbalanced"] = false;
    }
});

// ---------------------------------------------------------------------- Casting & Channelling rules
(() => {
    const MOD = "wfrp4e-unofficial-compendium";

    const isDark = (test) => {
        const lore = test.item?.system?.lore?.value ?? test.item?.lore?.value;
        if (Array.isArray(lore) ? lore.includes("dark") : lore === "dark") return true;
        const skillName = test.skill?.name ?? test.item?.system?.skill?.value ?? "";
        return typeof skillName === "string" && skillName.includes("Dhar") && test.constructor?.name?.toLowerCase().includes("channel");
    };

    const hasTalent = (actor, name) => actor?.itemTypes?.talent?.some(t => t.name.startsWith(name));

    const applyDarkRules = (test, { casting }) => {
        try {
            if (!isDark(test)) return;
            const r = test.result;
            if (!r) return;
            const actor = test.actor;
            const majorLabel = game.i18n.localize("ROLL.MajorMis");
            const notes = [];
            const diction = hasTalent(actor, "Instinctive Diction");
            let gainCorruption = false;

            // Ingredients have no effect on Miscasts from Dark Magic
            if (r.nullminormis) { delete r.nullminormis; r.minormis = game.i18n.localize("ROLL.MinorMis"); notes.push("Ingredients cannot soften a Dark Magic Miscast."); }
            if (r.nullmajormis) { delete r.nullmajormis; r.majormis = majorLabel; }

            // All Miscasts are Major unless the caster has Instinctive Diction
            if (r.minormis && !diction) {
                delete r.minormis;
                r.majormis = majorLabel;
                notes.push("Dark Magic: the Miscast is <b>Major</b>.");
            }

            // An 8 on the units die: Major Miscast and 1 Corruption point
            const roll = Number(r.roll);
            if (!isNaN(roll) && roll % 10 === 8) {
                delete r.minormis;
                if (!r.catastrophicmis) r.majormis = majorLabel;
                r.color_red = true;
                notes.push("Dark Magic: an 8 on the units die — <b>Major Miscast</b> and <b>1 Corruption</b> point.");
                gainCorruption = true;
            }

            if (casting && r.castOutcome === "success") {
                const slOver = Number(r.slOver ?? (Number(r.SL) - Number(test.item?.cn?.value ?? 0)));
                if (slOver > 4) notes.push("Dark Magic Complication! @Table[dark-complications]{Roll on Dark Magic Complications}");
                if (slOver >= 3 && hasTalent(actor, "Soul Pact") && (test.item?.system?.magicMissile?.value || test.item?.system?.damage?.value))
                    notes.push("If the Spell causes Damage, a <b>Soul Pact</b> effect may be invoked (see the Soul Pact Talent).");
            }

            if (notes.length) {
                r.other = r.other || [];
                r.other.push(...notes);
                if (typeof r.tooltips?.miscast === "string" && r.tooltips.miscast.includes("</ul>"))
                    r.tooltips.miscast = r.tooltips.miscast.replace("</ul>", notes.filter(n => n.includes("Miscast")).map(n => `<li>${n}</li>`).join("") + "</ul>");
            }
            // Hooks.call does not await handlers, so the chat card data is edited synchronously above
            // and the Corruption point is applied afterwards.
            if (gainCorruption && actor?.isOwner) {
                const cur = Number(actor.system.status?.corruption?.value || 0);
                actor.update({ "system.status.corruption.value": cur + 1 });
            }
        } catch (err) {
            console.error(`${MOD} | Dark Magic rules error`, err);
        }
    };

    Hooks.on("wfrp4e:rollCastTest", (test) => applyDarkRules(test, { casting: true }));
    Hooks.on("wfrp4e:rollChannelTest", (test) => applyDarkRules(test, { casting: false }));
})();
