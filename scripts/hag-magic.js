Hooks.once("setup", () => {
    // Registers the "Hag" tradition as a proper Lore, the same way ice-magic.js
    // registers the "Ice" tradition, so it shows up correctly (not as a raw key)
    // in the spell sheet's Lore dropdown and in Channelling (Hag) / Arcane Magic (Hag).
    game.wfrp4e.config.magicLores["hag"] = "Hag";
    game.wfrp4e.config.magicWind["hag"] = "Hag";

    game.wfrp4e.config.loreEffectDescriptions["hag"] =
        "The spirits of the Kislev wilds that answer a Znakharka's call are ancient, proud, and easily insulted. They will lend real power to a working, but pushing your luck with them never comes free." +
        "<br><br><b>Ingredient Reroll:</b> If you cast a spell from the Lore of the Hag while spending an ingredient (an offering to the spirits), you may reroll the Casting result once, for free, regardless of what it was. That new result can no longer be improved by spending a Fortune or Fate Point afterwards &mdash; the spirits have already had their say." +
        "<br><br><b>Round Numbers:</b> The spirits despise a boastful working. In addition to the normal Miscast on a double (11, 22, 33...) or on 100, a Casting or Channelling roll from the Lore of the Hag that ends in a round ten (10, 20, 30...90) is also treated as a Miscast.";

    // Purely a passive display entry on the character sheet, like Hedgecraft's
    // (no target-rider ActiveEffect) - the real mechanics are handled below
    // via the wfrp4e:rollCastTest hook, since they affect the caster's own roll
    // rather than something that transfers onto a target.
    game.wfrp4e.config.loreEffects["hag"] = {
        name: "Lore of the Hag",
        img: "modules/wfrp4e-core/icons/spells/curse-of-ill-fortune.png",
        flags: { wfrp4e: { lore: true } },
        system: {
            transferData: { type: "other" }
        }
    };

    // Mechanical automation for the two Hag-specific casting rules above.
    Hooks.on("wfrp4e:rollCastTest", async (test, chatOptions) => {
        try {
            if (!test.item?.lore?.value?.includes("hag")) {
                return;
            }

            let roll = test.result?.roll;

            // Round-number Miscast: 10/20/30/.../90, in addition to the normal
            // doubles (roll % 11 === 0) and 100 rule the core system already checks.
            if (typeof roll === "number" && roll % 10 === 0 && roll % 11 !== 0 && roll !== 100) {
                test.result.color_red = true;
                let note = "<li>The Hag spirits take offense at a round number - treat this as a Miscast.</li>";
                if (typeof test.result.tooltips?.miscast === "string" && test.result.tooltips.miscast.includes("</ul>")) {
                    test.result.tooltips.miscast = test.result.tooltips.miscast.replace("</ul>", note + "</ul>");
                } else if (test.result.tooltips) {
                    test.result.tooltips.miscast = "<ul style='text-align: left'>" + note + "</ul>";
                }
            }

            // Free ingredient reroll: once per test, blocks any further Fortune/Fate reroll
            // because test.reroll() sets context.reroll = true, the same flag the system
            // itself uses to prevent a test from being reworked twice.
            if (test.preData?.ingredientMode && test.preData.ingredientMode !== "none" && !test.context.reroll) {
                let useReroll = await Dialog.confirm({
                    title: game.wfrp4e.config.loreEffects["hag"].name,
                    content: "<p>Spend the offering to the spirits and reroll this Casting result for free? The new result cannot later be improved by spending Fortune or Fate.</p>",
                    defaultYes: false
                });
                if (useReroll) {
                    await test.reroll();
                }
            }
        } catch (err) {
            console.error("Lore of the Hag effect error:", err);
        }
    });
});
