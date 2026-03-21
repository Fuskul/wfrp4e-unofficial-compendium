// ==========================================
// 1. REGISTRATION (INIT HOOK)
// ==========================================
Hooks.once("init", () => {

    // A. Register the Lore
    game.wfrp4e.config.magicLores["ice"] = "Ice"; 
    game.wfrp4e.config.magicWind["ice"] = "Ice"; 
    
    // Updated Description: Added the "only one gained in this manner" rule and reverted to +10 per condition
    game.wfrp4e.config.loreEffectDescriptions["ice"] = "You inflict 1 @Condition[Chilled] Condition on any target successfully affected by a spell from the Lore of Ice, unless they possess the Arcane Magic (Ice) Talent. A target may only ever have a single @Condition[Chilled] Condition gained in this manner at any one time. If the spell has an Area of Effect (AoE), all affected targets receive this Condition.<br>For every @Condition[Chilled] Condition currently affecting any creature within a number of yards equal to your Willpower Bonus, you gain a +10 bonus to your Channelling (Ice) and Language (Magick) Tests.";

    // B. Register the Condition Text
    game.wfrp4e.config.conditions["chill"] = "Chilled";
    game.wfrp4e.config.conditionDescriptions["chill"] = "For each Chilled Condition you possess, you suffer a –10 penalty to Weapon Skill, Ballistic Skill, Strength, Agility, and Dexterity, and your Movement is reduced by 1 (to a minimum of 1). If any Characteristic is reduced to 0 in this way, you cannot perform any Actions relying on that Characteristic.<br><br><b>Removing Chilled:</b> You may remove one Chilled Condition by spending an Action to pass an Athletics or Endurance Test. Every +1 SL removes an additional Chilled Condition. Gaining an Ablaze Condition removes Chilled on a 1-to-1 basis (and vice versa). Coming into contact with an intense heat source or passing a Consume Alcohol Test to drink strong spirits immediately removes all Chilled Conditions.";

    // C. REGISTER THE LORE EFFECT
    if (!game.wfrp4e.config.loreEffects) {
        game.wfrp4e.config.loreEffects = {};
    }
    
    game.wfrp4e.config.loreEffects["ice"] = {
        name: "Lore of Ice",
        img: "modules/wfrp-4-enemy-within-ru/assets/icons/Lore-of-Ice.jpg",
        flags: {
            wfrp4e: {
                lore: true,
            }
        },
        system: {
            transferData: {
                type: "target"
            },
            scriptData: [
                {
                    trigger: "immediate",
                    label: "@effect.name",
                    script: `
                        let hasIceMagic = this.actor.itemTypes.talent.some(i => i.name.includes("Arcane Magic (Ice)"));
                        let hasLoreChill = this.actor.getFlag("wfrp4e", "loreIceChill");
                        
                        // Only apply if they aren't an Ice Mage AND haven't already received a Chill from the Lore
                        if (!hasIceMagic && !hasLoreChill) {
                            this.actor.addCondition("chill");
                            this.actor.setFlag("wfrp4e", "loreIceChill", true);
                        }
                    `,
                    options: {
                        deleteEffect: true
                    }
                }
            ]
        }
    };
});

// ==========================================
// 2. TOKEN HUD & STATUS EFFECTS (SETUP HOOK)
// ==========================================
Hooks.once("setup", () => {
    
    // --- CHILLED CONDITION ---
    let chillEffect = {
        id: "chill",
        name: "Chilled",
        icon: "modules/wfrp-4-enemy-within-ru/assets/icons/chilled.svg", 
        statuses: ["chill"], 
        flags: {
            wfrp4e: {
                condition: true, 
                value: 1 
            }
        },
        system: {
            condition: {
                value: 1,
                numbered: true 
            },
            scriptData: [
                {
                    label: "Chilled Penalties",
                    trigger: "prepareData", 
                    script: `
                        let stacks = this.effect.conditionValue; 
                        let penalty = stacks * -10;
                        let stats = ["ws", "bs", "s", "ag", "dex"];

                        for (let stat of stats) {
                            this.actor.system.characteristics[stat].modifier += penalty;
                            this.actor.system.characteristics[stat].value += penalty;
                            
                            if (this.actor.system.characteristics[stat].value < 0) {
                                this.actor.system.characteristics[stat].value = 0;
                            }
                        }

                        this.actor.system.details.move.value -= stacks;
                        
                        if (this.actor.system.details.move.value < 1) {
                            this.actor.system.details.move.value = 1;
                        }
                    `
                },
                {
                    label: "Clear Lore Flag",
                    trigger: "deleteEffect",
                    script: `
                        // When all Chilled stacks are gone, clear the flag so the Lore can apply it again later
                        if (this.actor.getFlag("wfrp4e", "loreIceChill")) {
                            this.actor.unsetFlag("wfrp4e", "loreIceChill");
                        }
                    `
                }
            ]
        }
    };

    CONFIG.statusEffects.push(chillEffect);
    if (game.wfrp4e?.config?.statusEffects) {
        game.wfrp4e.config.statusEffects.push(chillEffect);
    }
});

// ==========================================
// 3. LORE ATTRIBUTE: STACKING BONUS
// ==========================================
Hooks.on("wfrp4e:preRollTest", (testData, cardOptions) => {
    if (testData.type !== "cast" && testData.type !== "channelling") return;
    
    let isIceMagic = testData.item?.system?.lore?.value === "ice" || testData.item?.name.includes("Ice");
    if (!isIceMagic) return;

    let actor = testData.actor;
    let wpb = actor.system.characteristics.wp.bonus; 
    let token = actor.getActiveTokens()[0];
    
    if (!token) return;

    let chillStacks = 0;
    let targets = canvas.tokens.placeables.filter(t => t.id !== token.id);
    
    for (let t of targets) {
        let distance = canvas.grid.measureDistance(token, t);
        
        if (distance <= wpb) {
            let chillCondition = t.actor.hasCondition("chill");
            if (chillCondition) {
                // Reverted to counting every single stack
                chillStacks += chillCondition.conditionValue; 
            }
        }
    }

    if (chillStacks > 0) {
        let bonus = chillStacks * 10;
        testData.modifier += bonus;
        testData.modifierOptions.push({
            label: "Lore Attribute: Deadly Chill", 
            value: bonus
        });
    }
});

// ==========================================
// 4. ICE AND FIRE MUTUAL CANCELLATION
// ==========================================
async function balanceFireAndIce(actor) {
    if (!actor) return;
    
    setTimeout(async () => {
        let chill = actor.hasCondition("chill");
        let ablaze = actor.hasCondition("ablaze");

        if (chill && ablaze) {
            let chillVal = chill.conditionValue || 1;
            let ablazeVal = ablaze.conditionValue || 1;
            
            let reduction = Math.min(chillVal, ablazeVal);

            if (reduction > 0) {
                await actor.removeCondition("chill", reduction);
                await actor.removeCondition("ablaze", reduction);
                
                ui.notifications.info(`Ice and Fire have neutralized each other (${reduction} level(s)) on ${actor.name}.`);
            }
        }
    }, 50); 
}

Hooks.on("createActiveEffect", (effect, data, options, userId) => {
    if (game.user.id !== userId) return; 
    
    let isChillOrAblaze = effect.statuses?.has("chill") || effect.statuses?.has("ablaze") || effect.name === "Chilled" || effect.name === "Ablaze";
    if (isChillOrAblaze) {
        balanceFireAndIce(effect.parent);
    }
});

Hooks.on("updateActiveEffect", (effect, data, options, userId) => {
    if (game.user.id !== userId) return; 
    
    let isChillOrAblaze = effect.statuses?.has("chill") || effect.statuses?.has("ablaze") || effect.name === "Chilled" || effect.name === "Ablaze";
    if (isChillOrAblaze) {
        balanceFireAndIce(effect.parent);
    }
});