// Dedicated character sheet class for Vampires, following the exact same
// pattern as the Dwarf/High Elf companion-module sheets already installed
// in this world (register a sheet subclass tagged with its own CSS class,
// auto-assign it to new actors of the matching species). Unlike those two,
// this doesn't add a new mechanic (no Grudge-equivalent) - it exists purely
// so custom-styles.css has a reliable ".vampire" root class to theme against,
// the same hook those other modules' CSS uses for their parchment redesigns.
class VampireCharacterSheet extends ActorSheetWFRP4eCharacter {
    static DEFAULT_OPTIONS = {
        classes: ["vampire"]
    }

    get title() {
        return this.document.name;
    }

    async _onRender(options) {
        await super._onRender(options);
        try {
            this.element.querySelector("[data-action='toggleControls']").dataset.tooltip = "Seal of Command";
            this.element.querySelector("[data-action='close']").dataset.tooltip = "Seal of the Grave";
            this.element.querySelector("[data-action='copyUuid']").dataset.tooltip = "Mark of Blood";
        } catch (e) {
            // Optional cosmetic touches only - fine if the target controls aren't present.
        }
    }
}

Hooks.on("init", () => {
    foundry.applications.apps.DocumentSheetConfig.registerSheet(
        CONFIG.Actor.documentClass, "wfrp4e", VampireCharacterSheet,
        { types: ["character"], label: "Vampire Character Sheet" }
    );
});

Hooks.on("createActor", (actor) => {
    if (actor.type === "character" && actor.system.details?.species?.value?.toLowerCase() === "vampire") {
        actor.update({ "flags.core.sheetClass": "wfrp4e.VampireCharacterSheet" });
    }
});
