const localiseActorType = (type) => game.i18n.localize(`TYPES.Actor.${type}`);

// Function to select icons for standard actor types
const getIconForType = (type) => {
    const icons = {
        "character": "fa-user",
        "npc": "fa-user-secret",
        "creature": "fa-paw",
        "vehicle": "fa-ship",
        "party": "fa-users",
        "loot": "fa-gem"
    };
    return icons[type.toLowerCase()] || "fa-id-badge"; // Default icon if type is unknown
};

const changeActorTypeOption = {
  name: "Change Actor Type",
  icon: `<i class="fas fa-exchange-alt"></i>`,
  condition: (target) => {
    const el = target[0] || target;
    const documentId = el.closest("[data-document-id]")?.dataset.documentId || el.dataset.documentId || el.dataset.entryId;
    const actor = game.actors.get(documentId);
    
    return game.user.isGM || (actor && actor.isOwner);
  },
  callback: async (target) => {
    const el = target[0] || target;
    const documentId = el.closest("[data-document-id]")?.dataset.documentId || el.dataset.documentId || el.dataset.entryId;
    const actor = game.actors.get(documentId);
    
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }

    const originalTypeLocalised = localiseActorType(actor.type);
    
    // Gather available types (excluding current) and generate HTML cards
    const availableTypes = Object.keys(CONFIG.Actor.dataModels)
      .filter((t) => t !== actor.type)
      .sort((a, b) => localiseActorType(a).localeCompare(localiseActorType(b)));

    if (availableTypes.length === 0) {
        ui.notifications.warn("No available types for conversion.");
        return;
    }

    const optionsHtml = availableTypes.map((t, index) => {
        const isChecked = index === 0 ? "checked" : ""; // Select the first element by default
        return `
        <label class="type-label">
            <input type="radio" name="convert-type" value="${t}" ${isChecked}>
            <div class="type-card">
                <i class="fas ${getIconForType(t)} type-icon"></i>
                <div class="type-name">${localiseActorType(t)}</div>
            </div>
        </label>`;
    }).join("");

    const content = `
      <style>
        .change-type-app { font-family: var(--font-primary); color: var(--color-text-light-highlight); }
        .change-type-app .current-type { 
            text-align: center; background: rgba(0,0,0,0.2); padding: 8px; 
            border: 1px solid var(--color-border-dark-tertiary); border-radius: 4px; margin-bottom: 12px;
        }
        .change-type-app .type-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;
        }
        .change-type-app .type-label { cursor: pointer; margin: 0; }
        .change-type-app .type-label input[type="radio"] { display: none; }
        .change-type-app .type-card {
            border: 1px solid var(--color-border-light-tertiary);
            border-radius: 5px; background: rgba(0, 0, 0, 0.1);
            padding: 15px 5px; text-align: center; transition: all 0.2s ease;
            height: 100%; box-sizing: border-box;
        }
        .change-type-app .type-card:hover {
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 5px var(--color-shadow-primary);
        }
        .change-type-app .type-label input[type="radio"]:checked + .type-card {
            background: rgba(40, 40, 90, 0.4);
            border-color: var(--color-border-highlight);
            box-shadow: 0 0 8px var(--color-shadow-highlight);
        }
        .change-type-app .type-icon { font-size: 1.8rem; margin-bottom: 8px; color: #a99a86; transition: color 0.2s;}
        .change-type-app .type-label input[type="radio"]:checked + .type-card .type-icon { color: var(--color-text-highlight); }
        .change-type-app .type-name { font-size: 0.95em; font-weight: bold; line-height: 1.1; }
      </style>
      
      <div class="change-type-app">
        <div class="current-type">
          Current type: <strong>${originalTypeLocalised}</strong>
        </div>
        <div style="text-align: center; margin-bottom: 10px; font-size: 0.9em; color: #999;">Select a new actor type:</div>
        <div class="type-grid">
          ${optionsHtml}
        </div>
      </div>
    `;

    const convertType = await foundry.applications.api.DialogV2.prompt({
      window: { title: "Change Actor Type", width: 400 },
      content: content,
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: "Convert",
        callback: (event, button) => button.form.elements["convert-type"].value
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    });

    if (convertType) {
      try {
        await actor.update({ type: convertType, system: actor.system }, { recursive: false });
        ui.notifications.info(`Actor type successfully changed to ${localiseActorType(convertType)}`);
      } catch (e) {
        console.error("Error updating actor type:", e);
        ui.notifications.error("Failed to change actor type.");
      }
    }
  }
};

// Hook for Foundry V13
Hooks.on("getActorContextOptions", (application, menuItems) => {
  menuItems.push(changeActorTypeOption);
});