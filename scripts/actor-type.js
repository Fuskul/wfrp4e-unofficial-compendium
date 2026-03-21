const localiseActorType = (type) => game.i18n.localize(`TYPES.Actor.${type}`);

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
    
    const options = Object.keys(CONFIG.Actor.dataModels)
      .filter((t) => t !== actor.type)
      .sort((a, b) => localiseActorType(a).localeCompare(localiseActorType(b)))
      .map((t) => `<option value="${t}">${localiseActorType(t)}</option>`)
      .join("");

    const convertType = await foundry.applications.api.DialogV2.prompt({
      window: { title: "Change Actor Type" },
      content: `
        <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
          <p style="flex: 1; margin: 0; font-weight: bold;" class="section-title">${originalTypeLocalised}</p>
          <span style="flex: 0 0 auto; text-align: center">&#8594;</span>
          <select style="flex: 1" name="convert-type">
            ${options}
          </select>
        </div>`,
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: "Confirm",
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
        console.error("EW [RU] | Ошибка при обновлении типа:", e);
        ui.notifications.error("Failed to change actor type.");
      }
    }
  }
};

// Хук для Foundry V13
Hooks.on("getActorContextOptions", (application, menuItems) => {
  menuItems.push(changeActorTypeOption);
});

// Хук для совместимости со старыми окнами/модулями
Hooks.on("getActorDirectoryEntryContext", (html, options) => {
  options.push(changeActorTypeOption);
});