// Dedicated character sheet class for Dark Elves, following the exact same
// pattern as the Dwarf/High Elf companion-module sheets already installed
// in this world (register a sheet subclass tagged with its own CSS class,
// auto-assign it to new actors of the matching species). See vampire-sheet.js
// for the matching Vampire version - both exist purely to give
// custom-styles.css a reliable root class (".delf") to theme against.
class DelfCharacterSheet extends ActorSheetWFRP4eCharacter {
    static DEFAULT_OPTIONS = {
        classes: ["delf"]
    }

    get title() {
        return this.document.name;
    }

    async _onRender(options) {
        await super._onRender(options);
        try {
            this.element.querySelector("[data-action='toggleControls']").dataset.tooltip = "Ward of Dominion";
            this.element.querySelector("[data-action='close']").dataset.tooltip = "Rune of Exile";
            this.element.querySelector("[data-action='copyUuid']").dataset.tooltip = "Sigil of Malice";
        } catch (e) {
            // Optional cosmetic touches only - fine if the target controls aren't present.
        }
    }
}

Hooks.on("init", () => {
    foundry.applications.apps.DocumentSheetConfig.registerSheet(
        CONFIG.Actor.documentClass, "wfrp4e", DelfCharacterSheet,
        { types: ["character"], label: "Dark Elf Character Sheet" }
    );
});

Hooks.on("createActor", (actor) => {
    if (actor.type === "character" && actor.system.details?.species?.value?.toLowerCase() === "delf") {
        actor.update({ "flags.core.sheetClass": "wfrp4e.DelfCharacterSheet" });
    }
});
