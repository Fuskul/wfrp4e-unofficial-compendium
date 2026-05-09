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
    return icons[type.toLowerCase()] || "fa-id-badge"; 
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
    
    const availableTypes = Object.keys(CONFIG.Actor.dataModels)
      .filter((t) => t !== actor.type)
      .sort((a, b) => localiseActorType(a).localeCompare(localiseActorType(b)));

    if (availableTypes.length === 0) {
        ui.notifications.warn("No available types for conversion.");
        return;
    }

    const optionsHtml = availableTypes.map((t, index) => {
        const isChecked = index === 0 ? "checked" : ""; 
        return `
        <label class="grim-type-row">
            <input type="radio" name="convert-type" value="${t}" ${isChecked}>
            <div class="row-content">
                <i class="fas ${getIconForType(t)}"></i>
                <span>${localiseActorType(t)}</span>
            </div>
        </label>`;
    }).join("");

    const content = `
      <style>
        .grim-change-type {
            font-family: 'CaslonAntique', serif;
            padding: 5px 0;
        }
        .grim-change-type .current-status {
            background: rgba(15, 15, 15, 0.8);
            border: 1px solid #3d2b2b;
            border-radius: 4px;
            padding: 10px;
            text-align: center;
            margin-bottom: 15px;
            color: #c9bda8;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
        }
        .grim-change-type .current-status strong {
            color: #a83232;
            font-size: 1.15em;
            letter-spacing: 0.5px;
        }
        .grim-change-type .types-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 260px;
            overflow-y: auto;
            padding-right: 5px;
        }
        /* Custom Scrollbar */
        .grim-change-type .types-container::-webkit-scrollbar { width: 5px; }
        .grim-change-type .types-container::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .grim-change-type .types-container::-webkit-scrollbar-thumb { background: #4a3e31; border-radius: 3px; }
        
        .grim-change-type .grim-type-row {
            cursor: pointer;
            margin: 0;
            display: block;
        }
        .grim-change-type .grim-type-row input {
            display: none;
        }
        .grim-change-type .row-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 15px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #4a3e31;
            border-radius: 4px;
            color: #b5a48b;
            font-size: 1.1em;
            transition: all 0.2s ease;
        }
        .grim-change-type .row-content i {
            font-size: 1.1em;
            width: 24px;
            text-align: center;
            color: #5c4d3c;
            transition: color 0.2s ease;
        }
        .grim-change-type .grim-type-row:hover .row-content {
            background: rgba(40, 20, 20, 0.6);
            border-color: #8a3434;
            color: #e6d8c3;
        }
        .grim-change-type .grim-type-row:hover .row-content i {
            color: #a83232;
        }
        .grim-change-type .grim-type-row input:checked + .row-content {
            background: rgba(60, 15, 15, 0.8);
            border-color: #a83232;
            color: #ffffff;
            box-shadow: 0 0 8px rgba(168, 50, 50, 0.4);
        }
        .grim-change-type .grim-type-row input:checked + .row-content i {
            color: #ff5252;
            text-shadow: 0 0 5px rgba(255, 82, 82, 0.5);
        }
      </style>
      
      <div class="grim-change-type">
        <div class="current-status">
          Current type: <br><strong>${originalTypeLocalised}</strong>
        </div>
        <div class="types-container">
          ${optionsHtml}
        </div>
      </div>
    `;

    const convertType = await foundry.applications.api.DialogV2.prompt({
      window: { 
        title: "Change Actor Type", 
        width: 320, 
        icon: "fas fa-exchange-alt" 
      },
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
        // ИСПРАВЛЕНИЕ ДЛЯ V14: 
        // Мы передаем только { type: convertType }. 
        // Модель данных Foundry сама отфильтрует старые поля и сгенерирует новые по умолчанию, 
        // сохранив все универсальные характеристики (например, stats).
        await actor.update({ type: convertType });
        ui.notifications.info(`Actor type successfully changed to ${localiseActorType(convertType)}`);
      } catch (e) {
        console.error("Error updating actor type:", e);
        ui.notifications.error("Failed to change actor type.");
      }
    }
  }
};

Hooks.on("getActorContextOptions", (application, menuItems) => {
  menuItems.push(changeActorTypeOption);
});