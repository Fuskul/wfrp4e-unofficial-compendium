Hooks.once("setup", () => {
    game.wfrp4e.config.magicLores["ice"] = "Ice"; 
    game.wfrp4e.config.magicWind["ice"] = "Ice"; 
    
    game.wfrp4e.config.loreEffectDescriptions["ice"] = "You inflict 1 @Condition[Chilled] Condition on any target successfully affected by a spell from the Lore of Ice. A target may only ever have a single @Condition[Chilled] Condition gained in this manner at any one time.<br>For every @Condition[Chilled] Condition currently affecting any creature within a number of yards equal to your Willpower Bonus, you gain a +10 bonus to your Channelling (Ice) and Language (Magick) Tests.";

    // --- CLEANUP 1: Remove old "chill" and insert "icechill" ---
    const oldConditions = game.wfrp4e.config.conditions;
    const newConditions = {};
    
    for (let key in oldConditions) {
        if (key === "chill") continue; // Удаляем старый статус из системы
        if (key === "prone") newConditions["icechill"] = "Chilled";
        newConditions[key] = oldConditions[key];
    }
    if (!newConditions["icechill"]) newConditions["icechill"] = "Chilled";
    game.wfrp4e.config.conditions = newConditions; 
    
    game.wfrp4e.config.conditionDescriptions["icechill"] = "For each Chilled Condition you possess, you suffer a –10 penalty to Weapon Skill, Ballistic Skill, Strength, Agility, and Dexterity, and your Movement is reduced by 1 (to a minimum of 1).<br><br><b>Removing Chilled:</b> You may remove one Chilled Condition by spending an Action to pass an Athletics or Endurance Test. Gaining an Ablaze Condition removes Chilled on a 1-to-1 basis (and vice versa).";

    if (!game.wfrp4e.config.loreEffects) game.wfrp4e.config.loreEffects = {};
    
    game.wfrp4e.config.loreEffects["ice"] = {
        name: "Lore of Ice",
        img: "modules/wfrp-4-enemy-within-ru/assets/icons/Lore-of-Ice.jpg",
        flags: { wfrp4e: { lore: true } },
        system: {
            transferData: { type: "target" },
            scriptData: [{
                trigger: "immediate",
                label: "@effect.name",
                script: `
                    let hasIceMagic = this.actor.itemTypes.talent.some(i => i.name.includes("Arcane Magic (Ice)"));
                    let hasLoreChill = this.actor.getFlag("wfrp4e", "loreIceChill");
                    if (!hasIceMagic && !hasLoreChill) {
                        this.actor.addCondition("icechill");
                        this.actor.setFlag("wfrp4e", "loreIceChill", true);
                    }
                `,
                options: { deleteEffect: true }
            }]
        }
    };

    let chillEffect = {
        id: "icechill", 
        name: "Chilled",
        img: "modules/wfrp-4-enemy-within-ru/assets/icons/chilled.svg", 
        icon: "modules/wfrp-4-enemy-within-ru/assets/icons/chilled.svg", 
        statuses: ["icechill"], 
        flags: { wfrp4e: { condition: true, value: 1 } }, 
        system: {
            condition: { value: 1, numbered: true },
            scriptData: [
                {
                    label: "Chilled Penalties",
                    trigger: "prepareData", 
                    script: `
                        let stacks = this.effect.conditionValue || this.effect.system?.condition?.value || 1; 
                        let penalty = stacks * -10;
                        let stats = ["ws", "bs", "s", "ag", "dex"];
                        
                        for (let stat of stats) {
                            this.actor.system.characteristics[stat].modifier += penalty;
                            this.actor.system.characteristics[stat].value += penalty;
                            if (this.actor.system.characteristics[stat].value < 0) this.actor.system.characteristics[stat].value = 0;
                        }
                        
                        this.actor.system.details.move.value -= stacks;
                        if (this.actor.system.details.move.value < 1) this.actor.system.details.move.value = 1;
                    `
                },
                {
                    label: "Clear Lore Flag",
                    trigger: "deleteEffect",
                    script: `if (this.actor.getFlag("wfrp4e", "loreIceChill")) this.actor.unsetFlag("wfrp4e", "loreIceChill");`
                }
            ]
        }
    };

    // --- CLEANUP 2: Remove old "chill" from Token HUD Menu ---
    CONFIG.statusEffects = CONFIG.statusEffects.filter(e => e.id !== "chill");
    if (game.wfrp4e?.config?.statusEffects) {
        game.wfrp4e.config.statusEffects = game.wfrp4e.config.statusEffects.filter(e => e.id !== "chill");
    }

    let proneIndex = CONFIG.statusEffects.findIndex(e => e.id === "prone");
    if (proneIndex !== -1) CONFIG.statusEffects.splice(proneIndex, 0, chillEffect);
    else CONFIG.statusEffects.push(chillEffect);

    if (game.wfrp4e?.config?.statusEffects) {
        let wfrpProneIndex = game.wfrp4e.config.statusEffects.findIndex(e => e.id === "prone");
        if (wfrpProneIndex !== -1) game.wfrp4e.config.statusEffects.splice(wfrpProneIndex, 0, chillEffect);
        else game.wfrp4e.config.statusEffects.push(chillEffect);
    }
});

async function reduceOrRemove(effectDocument, amountToRemove) {
    let currentVal = effectDocument.conditionValue ?? effectDocument.system?.condition?.value ?? effectDocument.flags?.wfrp4e?.value ?? 1;
    let newVal = currentVal - amountToRemove;
    
    if (newVal <= 0) {
        await effectDocument.delete();
    } else {
        await effectDocument.update({ 
            "system.condition.value": newVal,
            "flags.wfrp4e.value": newVal
        });
    }
}

Hooks.on("preCreateActiveEffect", (effect, data, options, userId) => {
    if (game.user.id !== userId) return;
    const actor = effect.parent;
    if (!actor) return;

    const isAblaze = effect.statuses?.has("ablaze") || effect.name === "Ablaze";
    const isChill = effect.statuses?.has("icechill") || effect.name === "Chilled";

    if (isAblaze) {
        let existingChill = actor.effects.find(e => e.statuses?.has("icechill") || e.name === "Chilled");
        if (existingChill) {
            let existingVal = existingChill.conditionValue ?? existingChill.system?.condition?.value ?? 1;
            let incomingVal = effect.system?.condition?.value ?? 1;
            let reduction = Math.min(existingVal, incomingVal);

            if (reduction > 0) {
                reduceOrRemove(existingChill, reduction);
                let leftover = incomingVal - reduction;
                
                if (leftover <= 0) {
                    ui.notifications.info(`Ice and Fire instantly neutralized each other!`);
                    return false; 
                } else {
                    effect.updateSource({ "system.condition.value": leftover, "flags.wfrp4e.value": leftover });
                }
            }
        }
    }

    if (isChill) {
        let existingAblaze = actor.effects.find(e => e.statuses?.has("ablaze") || e.name === "Ablaze");
        if (existingAblaze) {
            let existingVal = existingAblaze.conditionValue ?? existingAblaze.system?.condition?.value ?? 1;
            let incomingVal = effect.system?.condition?.value ?? 1;
            let reduction = Math.min(existingVal, incomingVal);

            if (reduction > 0) {
                reduceOrRemove(existingAblaze, reduction);
                let leftover = incomingVal - reduction;
                
                if (leftover <= 0) {
                    ui.notifications.info(`Fire and Ice instantly neutralized each other!`);
                    return false; 
                } else {
                    effect.updateSource({ "system.condition.value": leftover, "flags.wfrp4e.value": leftover });
                }
            }
        }
    }
});

Hooks.on("preUpdateActiveEffect", (effect, changes, options, userId) => {
    if (game.user.id !== userId) return;
    const actor = effect.parent;
    if (!actor) return;

    let newVal = changes.system?.condition?.value;
    if (newVal === undefined) return;

    const isAblaze = effect.statuses?.has("ablaze") || effect.name === "Ablaze";
    const isChill = effect.statuses?.has("icechill") || effect.name === "Chilled";

    if (isAblaze) {
        let existingChill = actor.effects.find(e => e.statuses?.has("icechill") || e.name === "Chilled");
        if (existingChill) {
            let existingChillVal = existingChill.conditionValue ?? existingChill.system?.condition?.value ?? 1;
            let oldAblazeVal = effect.conditionValue ?? effect.system?.condition?.value ?? 1;
            let addedBlaze = newVal - oldAblazeVal;
            
            if (addedBlaze > 0) {
                let reduction = Math.min(existingChillVal, addedBlaze);
                reduceOrRemove(existingChill, reduction);
                
                let actualNewAblazeVal = oldAblazeVal + (addedBlaze - reduction);
                changes.system.condition.value = actualNewAblazeVal;
                
                ui.notifications.info(`Additional stacks neutralized!`);
                if (actualNewAblazeVal <= 0) {
                    effect.delete();
                    return false;
                }
            }
        }
    }

    if (isChill) {
        let existingAblaze = actor.effects.find(e => e.statuses?.has("ablaze") || e.name === "Ablaze");
        if (existingAblaze) {
            let existingAblazeVal = existingAblaze.conditionValue ?? existingAblaze.system?.condition?.value ?? 1;
            let oldChillVal = effect.conditionValue ?? effect.system?.condition?.value ?? 1;
            let addedChill = newVal - oldChillVal;
            
            if (addedChill > 0) {
                let reduction = Math.min(existingAblazeVal, addedChill);
                reduceOrRemove(existingAblaze, reduction);
                
                let actualNewChillVal = oldChillVal + (addedChill - reduction);
                changes.system.condition.value = actualNewChillVal;
                
                ui.notifications.info(`Additional stacks neutralized!`);
                if (actualNewChillVal <= 0) {
                    effect.delete();
                    return false;
                }
            }
        }
    }
});

Hooks.on("wfrp4e:preRollTest", (testData) => {
    if (testData.type !== "cast" && testData.type !== "channelling") return;
    
    let isIceMagic = testData.item?.system?.lore?.value === "ice" || testData.item?.name?.toLowerCase().includes("ice");
    if (!isIceMagic) return;

    let actor = testData.actor;
    if (!actor) return;
    
    let wpb = actor.system.characteristics.wp.bonus; 
    let token = actor.getActiveTokens()[0] || canvas.tokens.controlled[0];
    if (!token) return;

    let chillStacks = 0;
    let targets = canvas.tokens.placeables.filter(t => t.id !== token.id && t.actor);
    
    for (let t of targets) {
        let distanceInPixels = Math.hypot(token.center.x - t.center.x, token.center.y - t.center.y);
        let distanceInYards = (distanceInPixels / canvas.grid.size) * canvas.scene.grid.distance;
        
        if (distanceInYards <= wpb) {
            let chillCondition = t.actor.effects.find(e => e.statuses?.has("icechill") || e.name === "Chilled");
            if (chillCondition) {
                chillStacks += (chillCondition.conditionValue || chillCondition.system?.condition?.value || 1);
            }
        }
    }

    if (chillStacks > 0) {
        let bonus = chillStacks * 10;
        testData.modifier += bonus;
        
        if (!testData.modifierOptions) testData.modifierOptions = [];
        testData.modifierOptions.push({ label: "Deadly Chill (Lore of Ice)", value: bonus });
        ui.notifications.info(`Deadly Chill bonus applied: +${bonus} (${chillStacks} stacks nearby).`);
    }
});