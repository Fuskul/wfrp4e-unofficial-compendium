let PolymorphPromptApp;

class Wfrp4ePolymorph {
  static init() {
    game.settings.register("wfrp4e-unofficial-compendium", "enablePolymorph", {
      name: "Enable Polymorph",
      hint: "Adds a Polymorph button to the Token HUD (Right-click a token on the map).",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    const { ApplicationV2 } = foundry.applications.api;
    
    PolymorphPromptApp = class extends ApplicationV2 {
      static DEFAULT_OPTIONS = {
        id: "polymorph-prompt",
        classes: ["wfrp4e", "polymorph-app"],
        tag: "div",
        window: {
          icon: "fas fa-paw",
          resizable: false
        },
        position: { width: 350, height: "auto" }
      };

      constructor(originalActor, tokenDoc) {
        super({ window: { title: `Polymorph: ${originalActor.name}` } });
        this.originalActor = originalActor;
        this.tokenDoc = tokenDoc;
      }

      async _renderHTML(context, options) {
        return `
          <div style="padding: 10px;">
            <p style="text-align: center; margin-bottom: 15px; font-family: 'CaslonAntique', serif; font-size: 16px;">
              Drag and Drop a creature from the sidebar or compendium here.
            </p>
            <div id="polymorph-drop-zone" style="height: 120px; border: 2px dashed #782e22; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; background: rgba(0,0,0,0.05); cursor: pointer; transition: background 0.2s ease-in-out;">
              <span style="color: #555; font-size: 18px; font-weight: bold; font-family: 'CaslonAntique', serif;">
                <i class="fas fa-paw"></i> Drop Actor Here
              </span>
            </div>
          </div>
        `;
      }

      _replaceHTML(result, content, options) {
        content.innerHTML = result;
      }

      _onRender(context, options) {
        super._onRender(context, options);
        
        const dropZone = this.element.querySelector("#polymorph-drop-zone");
        if (dropZone) {
          dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.style.background = "rgba(120, 46, 34, 0.15)";
          });

          dropZone.addEventListener("dragleave", (e) => {
            e.preventDefault();
            dropZone.style.background = "rgba(0,0,0,0.05)";
          });

          dropZone.addEventListener("drop", async (event) => {
            event.preventDefault();
            dropZone.style.background = "rgba(0,0,0,0.05)";
            
            const data = TextEditor.getDragEventData(event);
            
            if (data?.type !== "Actor") {
              ui.notifications.warn("Please drop an Actor.");
              return;
            }
            
            const targetActor = await fromUuid(data.uuid);
            if (targetActor) {
              this.close();
              Wfrp4ePolymorph.transform(this.originalActor, targetActor, this.tokenDoc);
            }
          });
        }
      }
    };

    window.Wfrp4ePolymorph = Wfrp4ePolymorph;
    console.log("Fuskul's Compendium | Polymorph initialized!");
  }

  static promptPolymorph(originalActor, tokenDoc) {
    new PolymorphPromptApp(originalActor, tokenDoc).render({ force: true });
  }

  static async transform(originalActor, targetActor, tokenDoc) {
    if (!game.settings.get("wfrp4e-unofficial-compendium", "enablePolymorph")) return;

    const originalTokenData = tokenDoc.toObject();
    delete originalTokenData.x;
    delete originalTokenData.y;
    delete originalTokenData.elevation;
    delete originalTokenData.rotation;

    const targetData = targetActor.toObject();
    targetData.name = `${originalActor.name} (${targetActor.name})`;
    
    targetData.flags = targetData.flags || {};
    targetData.flags["wfrp4e-unofficial-compendium"] = {
      isPolymorphed: true,
      originalActorId: originalActor.id,
      originalWounds: originalActor.system.status.wounds?.value,
      originalTokenData: originalTokenData
    };

    try {
      const tempActor = await Actor.create(targetData);
      const monsterTokenData = targetActor.prototypeToken.toObject();
      
      delete monsterTokenData.x;
      delete monsterTokenData.y;
      delete monsterTokenData.elevation;
      delete monsterTokenData.rotation;

      monsterTokenData.actorId = tempActor.id;
      // ВАЖНО: Принудительно связываем токен, чтобы удаление работало корректно
      monsterTokenData.actorLink = true; 
      monsterTokenData.name = tempActor.name;
      monsterTokenData.disposition = tokenDoc.disposition;

      await tokenDoc.update(monsterTokenData);
      ui.notifications.info(`${originalActor.name} transformed into ${targetActor.name}!`);
    } catch (err) {
      console.error("Fuskul's Compendium | Polymorph Error:", err);
      ui.notifications.error("Failed to polymorph. Check console for details.");
    }
  }

  static async revert(tempActor, tokenDoc) {
    if (!game.settings.get("wfrp4e-unofficial-compendium", "enablePolymorph")) return;

    const isPolymorphed = tempActor.getFlag("wfrp4e-unofficial-compendium", "isPolymorphed");
    const origActorId = tempActor.getFlag("wfrp4e-unofficial-compendium", "originalActorId");
    const origWounds = tempActor.getFlag("wfrp4e-unofficial-compendium", "originalWounds");
    const origTokenData = tempActor.getFlag("wfrp4e-unofficial-compendium", "originalTokenData");

    if (!isPolymorphed || !origActorId) return;

    const originalActor = game.actors.get(origActorId);
    if (!originalActor) {
      ui.notifications.error("Original actor not found in the world!");
      return;
    }

    // Сохраняем ID временного актера до того, как токен изменится
    const tempActorId = tempActor.id || tokenDoc.actorId;

    if (origWounds !== undefined) {
      await originalActor.update({ "system.status.wounds.value": origWounds });
    }

    if (origTokenData) {
      delete origTokenData.x;
      delete origTokenData.y;
      delete origTokenData.elevation;
      delete origTokenData.rotation;
      
      origTokenData.actorId = originalActor.id;
      await tokenDoc.update(origTokenData);
    } else {
      await tokenDoc.update({
        actorId: originalActor.id,
        name: originalActor.name,
        "texture.src": originalActor.prototypeToken.texture.src,
        width: originalActor.prototypeToken.width,
        height: originalActor.prototypeToken.height
      });
    }

    // ВАЖНО: Удаляем ИМЕННО мирового актера, обходя внутренний токен
    const actorToDelete = game.actors.get(tempActorId);
    if (actorToDelete) {
      await actorToDelete.delete();
    }
    
    ui.notifications.info(`${originalActor.name} reverted to their original form!`);
  }
}

// 1. Initialize
Hooks.once("init", () => {
  Wfrp4ePolymorph.init();
});

// 2. Token HUD Injection
Hooks.on("renderTokenHUD", (hud, html, tokenData) => {
  if (!game.settings.get("wfrp4e-unofficial-compendium", "enablePolymorph")) return;

  const tokenDoc = canvas.scene.tokens.get(tokenData._id);
  const actor = tokenDoc?.actor;
  
  if (!actor || !actor.isOwner) return;

  const isPolymorphed = actor.getFlag("wfrp4e-unofficial-compendium", "isPolymorphed");

  const icon = isPolymorphed ? "fa-user" : "fa-paw";
  const title = isPolymorphed ? "Revert Form" : "Polymorph";

  const btnHtml = `
    <div class="control-icon polymorph-action" title="${title}">
      <i class="fas ${icon}"></i>
    </div>
  `;

  const element = (html instanceof jQuery) ? html[0] : html;
  const rightCol = element.querySelector(".col.right");
  
  if (rightCol) {
    rightCol.insertAdjacentHTML("beforeend", btnHtml);

    const actionBtn = element.querySelector(".polymorph-action");
    if (actionBtn) {
      actionBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isPolymorphed) {
          await Wfrp4ePolymorph.revert(actor, tokenDoc);
        } else {
          Wfrp4ePolymorph.promptPolymorph(actor, tokenDoc);
        }
        
        if (hud) hud.clear();
      });
    }
  }
});