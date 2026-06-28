// === WFRP4e — Autonomous Blood Gifts Item Type (English) ===

/** Data Model for Blood Gifts */
class BloodGiftModel extends GenericAspectModel {
  // We use "talents" placement to prevent WFRP4e core engine crashes.
  // Our render hook will automatically move it to the correct custom tab visually.
  static placement = "talents"; 
  static label = "WFRP4E.BloodGift";
  static plural = "WFRP4E.BloodGifts";
  static LOCALIZATION_PREFIXES = ["WH.Models.bloodgift"];

  static defineSchema() {
    const schema = super.defineSchema();
    schema.bloodline = new foundry.data.fields.StringField({initial: "Universal"});
    return schema;
  }

  static get compendiumBrowserFilters() {
    return new Map([
      ...Array.from(super.compendiumBrowserFilters),
      [
        "bloodline", { 
          label: "Bloodline", 
          type: "text", 
          config: { keyPath: "system.bloodline" } 
        }
      ]
    ]);
  }

  get usable() { 
    return true; 
  }
  
  get tags() { 
    return super.tags.add("bloodgift"); 
  }

  async _performUsage({} = {}) {
    const actor = this.parent.actor;
    if (!actor) return null;

    let whisper = [];
    if (game.settings.get("core", "rollMode") !== CONST.DICE_ROLL_MODES.PUBLIC) {
      whisper = game.users.filter(u => u.isGM).map(u => u.id);
    }

    let content = `
      <b>Blood Gift – ${this.parent.name}</b><br>
      <b>Bloodline:</b> ${this.bloodline || "Universal"}<br>
      ${this.description.value}
    `;

    content += await foundry.applications.handlebars.renderTemplate(
      "modules/warhammer-lib/templates/partials/effect-buttons.hbs", 
      this.parent
    );

    await ChatMessage.create({
      type: "wfrp4e-unofficial-compendium.bloodgift",
      speaker: ChatMessage.getSpeaker({actor}),
      whisper, 
      content,
      system: { 
        actorUuid: actor.uuid, 
        itemUuid: this.parent.uuid 
      },
    });
    
    return null;
  }

  async expandData(htmlOptions) {
    let data = await super.expandData(htmlOptions);
    let properties = [];
    if (this.bloodline) properties.push(`<b>Bloodline:</b> ${this.bloodline}`);
    data.properties = properties.filter(p => !!p);
    return data;
  }

  async toEmbed(config, options = {}) {
    let html = "";
    let heading = config.element ?? `h4`;
    let noToc = config.noToc ? "no-toc" : "";
    
    html += `<${heading} class="${noToc}">@UUID[${this.parent.uuid}]{${config.label || this.parent.name}}</${heading.split(" ")[0]}>`;
    html += `<b>Bloodline:</b> ${this.bloodline || "Universal"}<br/>`;

    if (game.user.isGM) html += this.gmdescription?.value || "";
    html += this.description?.value || "";

    return $(await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      `<div style="${config.style || ""}">${html}</div>`,
      {relativeTo: this, async: true, secrets: options.secrets},
    ))[0];
  }
}

/** Standalone Item Sheet for Blood Gifts */
class BloodGiftSheet extends BaseWFRP4eItemSheet {
  static type = "bloodgift";
  
  static DEFAULT_OPTIONS = { 
    classes: [this.type] 
  };
  
  static PARTS = {
    header: { 
      scrollable: [""],
      template: "systems/wfrp4e/templates/sheets/item/item-header.hbs", 
      classes: ["sheet-header"] 
    },
    tabs: { scrollable: [""], template: "systems/wfrp4e/templates/sheets/item/item-tabs.hbs" },
    description: { scrollable: [""], template: "systems/wfrp4e/templates/sheets/item/tabs/item-description.hbs" },
    details: { scrollable: [""], template: `modules/wfrp4e-unofficial-compendium/templates/bloodgift-details.hbs` },
    effects: { scrollable: [""], template: "systems/wfrp4e/templates/sheets/item/tabs/item-effects.hbs" },
  };
}

/** Chat Message Model for Blood Gifts */
class BloodGiftMessageModel extends WarhammerMessageModel {
  static defineSchema() {
    let fields = foundry.data.fields;
    let schema = {};
    schema.actorUuid = new fields.StringField();
    schema.itemUuid = new fields.StringField();
    return schema;
  }
  
  get actor() { return fromUuidSync(this.actorUuid); }
  get item() { return fromUuidSync(this.itemUuid); }
}

/** Inject "Blood Gifts" tab into the Actor Sheet dynamically */
Hooks.on("renderActorSheet", (sheet, html, data) => {
  if (!sheet.actor || !["character", "npc", "creature"].includes(sheet.actor.type)) return;

  const bloodGifts = sheet.actor.items.filter(i => i.type === "wfrp4e-unofficial-compendium.bloodgift");

  // Clean up original placements to avoid duplicates in the generic talents tab
  bloodGifts.forEach(bg => {
    html.find(`.item[data-item-id="${bg.id}"]`).remove();
  });

  const tabs = html.find('.sheet-tabs.tabs[data-group="primary"]');
  if (tabs.length === 0) return;
  
  tabs.append(`<a class="item" data-tab="bloodgifts">Blood Gifts</a>`);

  // Dynamically display the appropriate cost directly on the character sheet tab
  const actorSubspecies = (sheet.actor.system.details.species?.subspecies || "").toLowerCase().trim().replace(/\s+/g, '');
  
  let itemsHtml = bloodGifts.map(bg => {
    let displayCost = 400; 
    const giftBloodline = (bg.system.bloodline || "Universal").toLowerCase().trim().replace(/\s+/g, '');

    if (actorSubspecies === "independent") {
      displayCost = 600;
    } else if (giftBloodline !== "universal" && giftBloodline !== actorSubspecies) {
      displayCost = 800;
    }

    return `
    <li class="item" data-item-id="${bg.id}">
      <div class="content">
        <div class="item-name">
          <div class="image item-image" style="background-image: url('${bg.img}')"></div>
          <a class="name">${bg.name}</a>
        </div>
        <div class="item-type" style="flex: 1; text-align: center;">${bg.system.bloodline || "-"}</div>
        <div class="item-type" style="flex: 1; text-align: center;">${displayCost} XP</div>
        <div class="item-controls">
          <a class="item-post" title="Post to chat"><i class="fas fa-comment"></i></a>
          <a class="item-edit" title="Edit Item"><i class="fas fa-edit"></i></a>
          <a class="item-delete" title="Delete Item"><i class="fas fa-trash"></i></a>
        </div>
      </div>
    </li>`;
  }).join('');

  const tabHtml = `
  <div class="tab" data-tab="bloodgifts">
    <div class="inventory-header item list-header">
      <span class="name">Name</span>
      <span class="item-type" style="flex: 1; text-align: center;">Bloodline</span>
      <span class="item-type" style="flex: 1; text-align: center;">XP Value</span>
      <span class="item-controls"></span>
    </div>
    <ol class="inventory-list directory-list">${itemsHtml}</ol>
  </div>`;

  html.find('.sheet-body').append(tabHtml);

  const newTab = html.find('.tab[data-tab="bloodgifts"]');
  
  newTab.find('.item-edit').click(ev => {
    sheet.actor.items.get($(ev.currentTarget).parents('.item').data('item-id'))?.sheet.render(true);
  });
  
  newTab.find('.item-delete').click(ev => {
    sheet.actor.deleteEmbeddedDocuments("Item", [$(ev.currentTarget).parents('.item').data('item-id')]);
  });
  
  newTab.find('.item-name .name, .item-image').click(ev => {
    sheet._onItemSummary(ev);
  });
  
  newTab.find('.item-post').click(ev => {
    const item = sheet.actor.items.get($(ev.currentTarget).parents('.item').data('item-id'));
    item?.system?._performUsage ? item.system._performUsage() : item?.postItem();
  });
});

/** Registration Hook */
Hooks.on("init", () => {
  Object.assign(CONFIG.Item.dataModels, {
    "wfrp4e-unofficial-compendium.bloodgift": BloodGiftModel,
  });
  Object.assign(CONFIG.ChatMessage.dataModels, {
    "wfrp4e-unofficial-compendium.bloodgift": BloodGiftMessageModel,
  });
  
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "wfrp4e-unofficial-compendium", BloodGiftSheet, {
    types: ["wfrp4e-unofficial-compendium.bloodgift"],
    makeDefault: true,
  });
  
  console.log("WFRP4e Unofficial Compendium: Blood Gift Item Type registered.");
});