/**
 * Fuskul's WFRP4e Unofficial Compendium — Polymorph / Transformation
 * ------------------------------------------------------------------
 * Reworked to behave like the D&D 5e transformation system:
 *   - Triggered by DRAGGING an Actor onto a character sheet (not the Token HUD).
 *   - Opens a fully customizable dialog (keep / merge / other categories + presets)
 *     that lets you choose exactly what carries over from the original form.
 *   - Selectively merges the target creature's data with the original's, based on
 *     those settings, then creates a temporary Actor and retargets the tokens.
 *   - Revert restores the original form (and kept resources) and deletes the temp actor.
 *
 * World defaults, per-drop dialog visibility and permissions are all configurable
 * in the module settings. Nothing is hard-coded: every "keep" choice is optional.
 */

const MODULE_ID = "wfrp4e-unofficial-compendium"; // polymorph rework

// WFRP characteristic groups.
const PHYSICAL_CHARS = ["ws", "bs", "s", "t", "i", "ag", "dex"];
const MENTAL_CHARS = ["int", "wp", "fel"];

// Item types treated as "trappings" (physical gear) for the keep toggle.
const TRAPPING_TYPES = ["weapon", "armour", "trapping", "ammunition", "money", "container", "cargo"];

/* ------------------------------------------------------------------ */
/*  Settings model                                                     */
/* ------------------------------------------------------------------ */

/**
 * The list of configurable categories shown in the dialog. Each entry has a
 * label, an optional hint and a default value. This is the single source of
 * truth — add or remove a line here and the dialog updates automatically.
 */
const TRANSFORM_CONFIG = {
  keep: {
    mental:      { label: "Mental Characteristics (Int, WP, Fel)", hint: "The mind stays yours.", default: true },
    physical:    { label: "Physical Characteristics (WS, BS, S, T, I, Ag, Dex)", hint: "Keep your own body stats instead of the creature's.", default: false },
    wounds:      { label: "Current Wounds", hint: "Carry your current Wounds value into the new form.", default: false },
    fate:        { label: "Fate & Fortune", default: true },
    resilience:  { label: "Resilience & Resolve", default: true },
    corruption:  { label: "Corruption & Sin", default: true },
    experience:  { label: "Experience (XP)", default: true },
    movement:    { label: "Movement", hint: "Keep your own Movement rather than the creature's.", default: false },
    skills:      { label: "Skills", hint: "Keep your own Skills (adds the creature's that you lack).", default: false },
    talents:     { label: "Talents", hint: "Keep your own Talents (adds the creature's that you lack).", default: false },
    magic:       { label: "Magic (Spells & Prayers)", hint: "Keep spellcasting/blessing knowledge.", default: false },
    trappings:   { label: "Trappings (weapons, armour, gear, money)", default: false },
    traits:      { label: "Traits", hint: "Keep your own Traits instead of taking the creature's.", default: false },
    bio:         { label: "Biography & Details", default: true },
    effects:     { label: "Active Effects & Conditions", default: true }
  },
  merge: {
    skills:  { label: "Merge Skills (take the higher advances of both forms)", default: false },
    talents: { label: "Merge Talents (combine both forms, higher rank wins)", default: false }
  },
  other: {
    transformTokens: { label: "Update tokens on the map", default: true },
    keepDisposition: { label: "Keep token disposition (friendly/hostile)", default: true },
    keepTokenSize:   { label: "Keep original token size (only change the image)", default: false }
  }
};

/**
 * Presets. Each preset is a partial settings object applied on top of the
 * defaults when its button is pressed.
 */
const TRANSFORM_PRESETS = {
  fullPolymorph: {
    label: "Full Polymorph",
    icon: "fa-pastafarianism",
    hint: "Become the creature in body, but keep your mind, magic and metacurrencies.",
    settings: { keep: { mental: true, fate: true, resilience: true, corruption: true, experience: true, magic: true, bio: true, effects: true } }
  },
  wereform: {
    label: "Wereform / Beast",
    icon: "fa-paw",
    hint: "A savage shape: keep your mind, skills and talents, but not your magic or gear.",
    settings: { keep: { mental: true, fate: true, resilience: true, corruption: true, experience: true, skills: true, talents: true, bio: true, effects: true } }
  },
  appearance: {
    label: "Appearance Only",
    icon: "fa-eye",
    hint: "An illusion: only your token image and name change, all stats stay yours.",
    settings: {
      keepAll: true,
      other: { keepTokenSize: true }
    }
  },
  fullReplace: {
    label: "Full Replacement",
    icon: "fa-frog",
    hint: "Become the creature completely — nothing of the original carries over.",
    settings: { clearAll: true }
  }
};

/**
 * Build a fresh settings object from the config defaults.
 */
function defaultSettings() {
  const s = { preset: "fullPolymorph", keepName: false, keep: {}, merge: {}, other: {} };
  for (const [cat, entries] of Object.entries(TRANSFORM_CONFIG)) {
    for (const [key, cfg] of Object.entries(entries)) s[cat][key] = !!cfg.default;
  }
  return s;
}

/**
 * Apply a preset (partial settings) on top of a base settings object.
 * Supports the special flags keepAll / clearAll used by the presets above.
 */
function applyPreset(base, presetKey) {
  const preset = TRANSFORM_PRESETS[presetKey];
  if (!preset) return base;
  const out = foundry.utils.deepClone(base);
  out.preset = presetKey;
  const ps = preset.settings ?? {};

  if (ps.clearAll) {
    for (const cat of ["keep", "merge"]) for (const k of Object.keys(out[cat])) out[cat][k] = false;
  }
  if (ps.keepAll) {
    for (const k of Object.keys(out.keep)) out.keep[k] = true;
  } else {
    // A preset defines the exact "keep" set: start from all-false, then enable listed ones.
    if (ps.keep) {
      for (const k of Object.keys(out.keep)) out.keep[k] = false;
      for (const [k, v] of Object.entries(ps.keep)) out.keep[k] = !!v;
    }
    if (ps.merge) {
      for (const k of Object.keys(out.merge)) out.merge[k] = false;
      for (const [k, v] of Object.entries(ps.merge)) out.merge[k] = !!v;
    }
  }
  if (ps.other) for (const [k, v] of Object.entries(ps.other)) out.other[k] = !!v;
  return out;
}

/**
 * Get the effective starting settings for the dialog: world defaults, overridden
 * by the last-used settings if that option is enabled.
 */
function getStartingSettings() {
  const base = defaultSettings();
  try {
    const stored = game.settings.get(MODULE_ID, "polymorphDefaults");
    if (stored && typeof stored === "object") foundry.utils.mergeObject(base, stored, { inplace: true });
  } catch (e) { /* setting not registered yet */ }
  return base;
}

/* ------------------------------------------------------------------ */
/*  Drag-event helper (v13-safe)                                       */
/* ------------------------------------------------------------------ */

function getDragData(event) {
  const TE = foundry.applications?.ux?.TextEditor?.implementation
    ?? globalThis.TextEditor;
  try { return TE.getDragEventData(event); }
  catch (e) {
    try { return JSON.parse(event.dataTransfer.getData("text/plain")); }
    catch (_) { return null; }
  }
}

/* ------------------------------------------------------------------ */
/*  Main class                                                         */
/* ------------------------------------------------------------------ */

let TransformDialog;

class Wfrp4ePolymorph {

  /* ---- Initialization -------------------------------------------- */

  static init() {
    game.settings.register(MODULE_ID, "enablePolymorph", {
      name: "Enable Transformation",
      hint: "Master switch. Lets characters transform by dragging a creature onto their sheet.",
      scope: "world", config: true, type: Boolean, default: true
    });

    game.settings.register(MODULE_ID, "allowPlayerPolymorph", {
      name: "Allow Players to Transform",
      hint: "If enabled, players who own an actor can transform it (requires the 'Create New Actors' permission). If disabled, only the GM can.",
      scope: "world", config: true, type: Boolean, default: true
    });

    game.settings.register(MODULE_ID, "polymorphAlwaysShowDialog", {
      name: "Always Show Transformation Dialog",
      hint: "Show the customization dialog on every transformation. If disabled, the saved world defaults are applied instantly.",
      scope: "world", config: true, type: Boolean, default: true
    });

    game.settings.register(MODULE_ID, "polymorphRevertInHUD", {
      name: "Revert Button in Token HUD",
      hint: "Adds a 'Revert Form' button to the Token HUD (right-click a token) for transformed tokens. Transforming is still done by dragging onto the sheet.",
      scope: "world", config: true, type: Boolean, default: true
    });

    // Stored default settings for the dialog (edited implicitly by using the dialog).
    game.settings.register(MODULE_ID, "polymorphDefaults", {
      scope: "world", config: false, type: Object, default: defaultSettings()
    });

    Wfrp4ePolymorph._defineDialog();

    globalThis.Wfrp4ePolymorph = Wfrp4ePolymorph;
    console.log("Fuskul's Compendium | Polymorph (drag-and-drop) initialized!");
  }

  static canTransform(actor) {
    if (!game.settings.get(MODULE_ID, "enablePolymorph")) return false;
    if (game.user.isGM) return true;
    return actor?.isOwner && game.settings.get(MODULE_ID, "allowPlayerPolymorph");
  }

  /* ---- Entry point: an Actor was dropped on a sheet -------------- */

  static async onDropActor(hostActor, sourceActor) {
    if (!hostActor || !sourceActor) return;
    if (hostActor.uuid === sourceActor.uuid) return; // dropped onto itself
    if (!Wfrp4ePolymorph.canTransform(hostActor)) {
      ui.notifications.warn("You do not have permission to transform this actor.");
      return;
    }

    let settings;
    if (game.settings.get(MODULE_ID, "polymorphAlwaysShowDialog")) {
      settings = await TransformDialog.prompt(hostActor, sourceActor);
      if (!settings) return; // cancelled
      await game.settings.set(MODULE_ID, "polymorphDefaults", settings);
    } else {
      settings = getStartingSettings();
    }

    await Wfrp4ePolymorph.transform(hostActor, sourceActor, settings);
  }

  /* ---- Build the merged actor data ------------------------------- */

  static buildTransformData(originalActor, targetActor, settings) {
    const o = originalActor.toObject();
    const t = targetActor.toObject();

    // Base form: take the creature's data, but keep the ORIGINAL actor's type so
    // the same character sheet is used (e.g. the Vampire / Dark Elf sheet). WFRP
    // actor types share the same core structure (characteristics, status, items),
    // so the creature's data merges cleanly; fields not on the original's type are
    // dropped by the data model and chosen "keep" fields are copied back below.
    const d = foundry.utils.deepClone(t);
    d.type = o.type;

    // Name.
    d.name = settings.keepName ? o.name : `${o.name} (${t.name})`;

    d.system = d.system ?? {};
    d.system.characteristics = d.system.characteristics ?? {};
    d.system.status = d.system.status ?? {};
    d.system.details = d.system.details ?? {};

    // Characteristics.
    const keepChar = (k) => { if (o.system?.characteristics?.[k]) d.system.characteristics[k] = foundry.utils.deepClone(o.system.characteristics[k]); };
    if (settings.keep.mental) MENTAL_CHARS.forEach(keepChar);
    if (settings.keep.physical) PHYSICAL_CHARS.forEach(keepChar);

    // Status resources.
    const copyStatus = (path) => {
      const val = foundry.utils.getProperty(o.system, path);
      if (val !== undefined) foundry.utils.setProperty(d.system, path, foundry.utils.deepClone(val));
    };
    if (settings.keep.wounds) {
      copyStatus("status.wounds.value");
      copyStatus("status.wounds.max");
    }
    if (settings.keep.fate) { copyStatus("status.fate"); copyStatus("status.fortune"); }
    if (settings.keep.resilience) { copyStatus("status.resilience"); copyStatus("status.resolve"); }
    if (settings.keep.corruption) { copyStatus("status.corruption"); copyStatus("status.sin"); }

    // Experience & career-related details.
    if (settings.keep.experience) copyStatus("details.experience");
    if (settings.keep.movement) copyStatus("details.move");
    if (settings.keep.bio) {
      ["details.biography", "details.gmnotes", "details.gender", "details.age",
       "details.height", "details.hair", "details.eyes", "details.distinguishing"].forEach(copyStatus);
    }

    // Items.
    d.items = Wfrp4ePolymorph.mergeItems(o.items ?? [], t.items ?? [], settings);

    // Active effects.
    let effects = foundry.utils.deepClone(t.effects ?? []);
    if (settings.keep.effects) effects = effects.concat(foundry.utils.deepClone(o.effects ?? []));
    d.effects = effects.map(e => { const c = foundry.utils.deepClone(e); delete c._id; return c; });

    // Preserve identity, ownership and — importantly — the original's sheet.
    // We start from the creature's flags, then force the original actor's sheet
    // class (core.sheetClass) so the transformed actor opens with the same sheet
    // type as the character (Vampire / Dark Elf / default, etc.).
    d.ownership = o.ownership;
    d.folder = o.folder ?? null;
    d.flags = foundry.utils.deepClone(t.flags ?? {});
    const originalSheetClass = foundry.utils.getProperty(o.flags ?? {}, "core.sheetClass");
    if (originalSheetClass) foundry.utils.setProperty(d.flags, "core.sheetClass", originalSheetClass);
    else if (d.flags?.core?.sheetClass !== undefined) delete d.flags.core.sheetClass;

    // Transformation flags for revert.
    d.flags[MODULE_ID] = foundry.utils.mergeObject(d.flags[MODULE_ID] ?? {}, {
      isPolymorphed: true,
      originalActorId: originalActor.id,
      originalActorUuid: originalActor.uuid,
      originalName: o.name,
      settings: settings
    });

    // Fresh, empty prototype token base; appearance is filled in below.
    d.prototypeToken = d.prototypeToken ?? {};

    return d;
  }

  /**
   * Merge the original's items with the target creature's items according to
   * the keep/merge settings. Returns a fresh array with new ids.
   */
  static mergeItems(oItems, tItems, settings) {
    const keepTypes = new Set();
    if (settings.keep.skills) keepTypes.add("skill");
    if (settings.keep.talents) keepTypes.add("talent");
    if (settings.keep.magic) { keepTypes.add("spell"); keepTypes.add("prayer"); }
    if (settings.keep.traits) keepTypes.add("trait");
    if (settings.keep.trappings) TRAPPING_TYPES.forEach(x => keepTypes.add(x));

    const mergeTypes = new Set();
    if (settings.merge.skills) mergeTypes.add("skill");
    if (settings.merge.talents) mergeTypes.add("talent");

    const byType = (items) => {
      const map = {};
      for (const it of items) (map[it.type] ??= []).push(it);
      return map;
    };
    const oByType = byType(oItems);
    const tByType = byType(tItems);
    const allTypes = new Set([...Object.keys(oByType), ...Object.keys(tByType)]);

    const advancesOf = (it) => Number(foundry.utils.getProperty(it, "system.advances.value") ?? 0);
    const nameKey = (it) => (it.name ?? "").toLowerCase().trim();

    const result = [];
    for (const type of allTypes) {
      const oList = oByType[type] ?? [];
      const tList = tByType[type] ?? [];

      if (mergeTypes.has(type)) {
        // Union by name, higher advances wins.
        const chosen = new Map();
        for (const it of [...tList, ...oList]) {
          const key = nameKey(it);
          const prev = chosen.get(key);
          if (!prev || advancesOf(it) > advancesOf(prev)) chosen.set(key, it);
        }
        result.push(...chosen.values());
      } else if (keepTypes.has(type)) {
        // Keep the original's items; add the creature's that the original lacks (by name).
        const haveNames = new Set(oList.map(nameKey));
        result.push(...oList);
        result.push(...tList.filter(it => !haveNames.has(nameKey(it))));
      } else {
        // Default: take the creature's items only.
        result.push(...tList);
      }
    }

    // Strip ids so Foundry assigns fresh unique ones (avoids collisions).
    return result.map(it => { const c = foundry.utils.deepClone(it); delete c._id; return c; });
  }

  /* ---- Perform the transformation -------------------------------- */

  static async transform(originalActor, targetActor, settings) {
    if (!Wfrp4ePolymorph.canTransform(originalActor)) return;

    const d = Wfrp4ePolymorph.buildTransformData(originalActor, targetActor, settings);

    // Full token appearance to copy from the creature's prototype token. This
    // includes texture scale/offset/fit and the dynamic ring config, so the art
    // sits inside the token frame correctly (not just the image src + size).
    const proto = targetActor.prototypeToken?.toObject?.() ?? {};
    const APPEARANCE_KEYS = ["width", "height", "alpha", "lockRotation", "ring", "hexagonalShape"];

    let tempActor;
    try {
      tempActor = await Actor.create(d);
    } catch (err) {
      console.error("Fuskul's Compendium | Polymorph create error:", err);
      ui.notifications.error("Failed to create transformed actor (check the 'Create New Actors' permission).");
      return;
    }

    // Retarget placed tokens of the original actor.
    if (settings.other.transformTokens && canvas?.ready) {
      const updatesByScene = {};
      for (const scene of game.scenes) {
        const tokens = scene.tokens.filter(tk => tk.actorId === originalActor.id || tk.actor?.id === originalActor.id);
        for (const tk of tokens) {
          // Snapshot the full current appearance so revert can restore it exactly.
          const snap = tk.toObject();
          const prev = { actorId: snap.actorId, actorLink: snap.actorLink, name: snap.name, texture: snap.texture };
          for (const k of APPEARANCE_KEYS) prev[k] = snap[k];

          const update = {
            _id: tk.id,
            actorId: tempActor.id,
            actorLink: true,
            name: settings.keepName ? originalActor.name : `${originalActor.name} (${targetActor.name})`,
            [`flags.${MODULE_ID}.previousTokenData`]: prev,
            [`flags.${MODULE_ID}.polymorphTempActorId`]: tempActor.id
          };

          if (settings.other.keepTokenSize) {
            // Illusion mode: keep the original size and scaling, only swap the image.
            update["texture.src"] = proto.texture?.src ?? tk.texture?.src;
          } else {
            // Take the creature's full token look: image + scale + offset + fit + ring + size.
            update.texture = foundry.utils.deepClone(proto.texture ?? {});
            for (const k of APPEARANCE_KEYS) if (proto[k] !== undefined) update[k] = foundry.utils.deepClone(proto[k]);
          }
          if (settings.other.keepDisposition) update.disposition = tk.disposition;

          (updatesByScene[scene.id] ??= []).push(update);
        }
      }
      for (const [sceneId, updates] of Object.entries(updatesByScene)) {
        await game.scenes.get(sceneId).updateEmbeddedDocuments("Token", updates);
      }
    }

    ui.notifications.info(`${originalActor.name} transformed into ${targetActor.name}!`);
    tempActor.sheet?.render(true);
    return tempActor;
  }

  /* ---- Revert ---------------------------------------------------- */

  static async revert(tempActor) {
    if (!game.settings.get(MODULE_ID, "enablePolymorph")) return;

    const flags = tempActor.getFlag(MODULE_ID, "isPolymorphed") ? tempActor.flags[MODULE_ID] : null;
    if (!flags?.isPolymorphed) {
      ui.notifications.warn("This actor is not transformed.");
      return;
    }

    const originalActor = game.actors.get(flags.originalActorId);
    if (!originalActor) {
      ui.notifications.error("Original actor not found in the world!");
      return;
    }

    const settings = flags.settings ?? defaultSettings();
    const tempActorId = tempActor.id;

    // Carry kept resources back to the original.
    const update = {};
    if (settings.keep?.wounds) {
      const w = tempActor.system?.status?.wounds?.value;
      if (w !== undefined) update["system.status.wounds.value"] = w;
    }
    if (!foundry.utils.isEmpty(update)) await originalActor.update(update);

    // Restore tokens across all scenes, including full appearance (texture
    // scale/offset/fit, ring, size). Falls back to the original prototype token
    // for any field an older transformation didn't snapshot.
    const oProto = originalActor.prototypeToken.toObject();
    const APPEARANCE_KEYS = ["width", "height", "alpha", "lockRotation", "ring", "hexagonalShape"];
    for (const scene of game.scenes) {
      const tokens = scene.tokens.filter(tk =>
        tk.getFlag(MODULE_ID, "polymorphTempActorId") === tempActorId || tk.actorId === tempActorId);
      if (!tokens.length) continue;
      const updates = tokens.map(tk => {
        const prev = tk.getFlag(MODULE_ID, "previousTokenData") ?? {};
        const u = {
          _id: tk.id,
          actorId: prev.actorId ?? originalActor.id,
          actorLink: prev.actorLink ?? oProto.actorLink,
          name: prev.name ?? originalActor.name,
          texture: foundry.utils.deepClone(prev.texture ?? oProto.texture),
          [`flags.${MODULE_ID}.-=previousTokenData`]: null,
          [`flags.${MODULE_ID}.-=polymorphTempActorId`]: null
        };
        for (const k of APPEARANCE_KEYS) u[k] = prev[k] ?? oProto[k];
        return u;
      });
      await scene.updateEmbeddedDocuments("Token", updates);
    }

    // Delete the temporary transformed actor.
    const toDelete = game.actors.get(tempActorId);
    if (toDelete) await toDelete.delete();

    ui.notifications.info(`${originalActor.name} reverted to their original form!`);
    originalActor.sheet?.render(true);
    return originalActor;
  }

  /* ---- Dialog definition ----------------------------------------- */

  static _defineDialog() {
    const { ApplicationV2 } = foundry.applications.api;

    TransformDialog = class extends ApplicationV2 {
      static DEFAULT_OPTIONS = {
        id: "wfrp-transform-dialog",
        classes: ["wfrp4e", "wfrp-transform-dialog"],
        tag: "form",
        window: { icon: "fas fa-paw", title: "Transformation", resizable: true },
        position: { width: 420, height: "auto" }
      };

      constructor(hostActor, sourceActor, resolve) {
        super();
        this.hostActor = hostActor;
        this.sourceActor = sourceActor;
        this._resolve = resolve;
        this._settings = getStartingSettings();
        this._settings = applyPreset(this._settings, this._settings.preset ?? "fullPolymorph");
      }

      static prompt(hostActor, sourceActor) {
        return new Promise((resolve) => {
          new TransformDialog(hostActor, sourceActor, resolve).render({ force: true });
        });
      }

      _checkbox(cat, key, cfg, checked) {
        const name = `${cat}.${key}`;
        const hint = cfg.hint ? `<span class="wfrp-tf-hint" data-tooltip="${cfg.hint}"><i class="fas fa-circle-info"></i></span>` : "";
        return `<label class="wfrp-tf-row">
          <input type="checkbox" name="${name}" ${checked ? "checked" : ""}/>
          <span>${cfg.label}</span>${hint}
        </label>`;
      }

      _category(title, cat) {
        const rows = Object.entries(TRANSFORM_CONFIG[cat])
          .map(([key, cfg]) => this._checkbox(cat, key, cfg, this._settings[cat][key])).join("");
        return `<fieldset class="wfrp-tf-group"><legend>${title}</legend>${rows}</fieldset>`;
      }

      async _renderHTML() {
        const presets = Object.entries(TRANSFORM_PRESETS).map(([key, p]) => `
          <button type="button" class="wfrp-tf-preset ${this._settings.preset === key ? "active" : ""}" data-preset="${key}" data-tooltip="${p.hint}">
            <i class="fas ${p.icon}"></i> ${p.label}
          </button>`).join("");

        return `
          <div class="wfrp-tf-body">
            <p class="wfrp-tf-lead">
              <b>${this.hostActor.name}</b> → <b>${this.sourceActor.name}</b>
            </p>
            <div class="wfrp-tf-presets">${presets}</div>

            <label class="wfrp-tf-row wfrp-tf-name">
              <input type="checkbox" name="keepName" ${this._settings.keepName ? "checked" : ""}/>
              <span>Keep original name (don't append the creature's)</span>
            </label>

            ${this._category("Keep from original", "keep")}
            ${this._category("Merge", "merge")}
            ${this._category("Options", "other")}

            <div class="wfrp-tf-buttons">
              <button type="button" class="wfrp-tf-confirm"><i class="fas fa-paw"></i> Transform</button>
              <button type="button" class="wfrp-tf-cancel"><i class="fas fa-times"></i> Cancel</button>
            </div>
          </div>
          <style>
            .wfrp-transform-dialog .wfrp-tf-body { padding: 8px 10px; font-family: 'CaslonAntique', serif; }
            .wfrp-transform-dialog .wfrp-tf-lead { text-align: center; font-size: 16px; margin: 2px 0 10px; }
            .wfrp-transform-dialog .wfrp-tf-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
            .wfrp-transform-dialog .wfrp-tf-preset { padding: 6px 4px; cursor: pointer; border: 1px solid #782e22; background: rgba(0,0,0,0.05); border-radius: 5px; font-size: 13px; }
            .wfrp-transform-dialog .wfrp-tf-preset.active { background: rgba(120,46,34,0.25); font-weight: bold; }
            .wfrp-transform-dialog .wfrp-tf-group { border: 1px solid #b5a642; border-radius: 6px; margin: 8px 0; padding: 4px 8px 8px; }
            .wfrp-transform-dialog .wfrp-tf-group legend { font-weight: bold; padding: 0 6px; }
            .wfrp-transform-dialog .wfrp-tf-row { display: flex; align-items: center; gap: 6px; padding: 2px 0; cursor: pointer; }
            .wfrp-transform-dialog .wfrp-tf-row span { flex: 1; }
            .wfrp-transform-dialog .wfrp-tf-hint { flex: 0; color: #782e22; cursor: help; }
            .wfrp-transform-dialog .wfrp-tf-name { margin: 4px 0 2px; }
            .wfrp-transform-dialog .wfrp-tf-buttons { display: flex; gap: 8px; margin-top: 10px; }
            .wfrp-transform-dialog .wfrp-tf-buttons button { flex: 1; padding: 6px; cursor: pointer; }
          </style>
        `;
      }

      _replaceHTML(result, content) {
        content.innerHTML = result;
      }

      // Read the current checkbox state from the DOM into this._settings.
      _readForm() {
        const root = this.element;
        this._settings.keepName = root.querySelector('input[name="keepName"]')?.checked ?? false;
        for (const cat of ["keep", "merge", "other"]) {
          for (const key of Object.keys(TRANSFORM_CONFIG[cat])) {
            const input = root.querySelector(`input[name="${cat}.${key}"]`);
            if (input) this._settings[cat][key] = input.checked;
          }
        }
      }

      _onRender(context, options) {
        super._onRender(context, options);
        const root = this.element;

        root.querySelectorAll(".wfrp-tf-preset").forEach(btn => {
          btn.addEventListener("click", () => {
            this._readForm();                 // preserve any manual tweaks first? presets override keep/merge
            this._settings = applyPreset(this._settings, btn.dataset.preset);
            this.render();                    // re-render with new checkbox states
          });
        });

        root.querySelector(".wfrp-tf-confirm")?.addEventListener("click", () => {
          this._readForm();
          this._settings.preset = null; // manual selection after preset
          const resolve = this._resolve; this._resolve = null;
          this.close();
          resolve?.(this._settings);
        });

        root.querySelector(".wfrp-tf-cancel")?.addEventListener("click", () => {
          const resolve = this._resolve; this._resolve = null;
          this.close();
          resolve?.(null);
        });
      }

      async close(options) {
        if (this._resolve) { const r = this._resolve; this._resolve = null; r(null); }
        return super.close(options);
      }
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

// 1. Initialize settings + dialog.
Hooks.once("init", () => Wfrp4ePolymorph.init());

// 2. Intercept Actor drops on character sheets.
//    We attach a capture-phase 'drop' listener to the sheet root so we run
//    before the sheet's own drop handling, regardless of the system's internal
//    method names. Works for both v13 (renderActorSheetV2) and legacy hooks.
function attachDropInterceptor(sheet, html) {
  const actor = sheet?.actor;
  if (!actor) return;

  const root = (html instanceof jQuery) ? html[0] : (html ?? sheet.element);
  if (!root || root.dataset.wfrpPolymorphBound) return;
  root.dataset.wfrpPolymorphBound = "1";

  root.addEventListener("drop", async (event) => {
    if (!Wfrp4ePolymorph.canTransform(actor)) return;

    // Let WFRP's native systems handle their own actor-drop zones. The Combat
    // tab's mount slot (".mount-drop") sets a mount rather than transforming —
    // don't hijack it. Only actor drops elsewhere on the sheet trigger a
    // transformation. (".container-drop" is item-only, but excluded for safety.)
    if (event.target?.closest?.(".mount-drop, .container-drop")) return;

    const data = getDragData(event);
    if (!data || data.type !== "Actor" || !data.uuid) return;

    // This is an Actor drop outside any handled zone — take it over.
    event.preventDefault();
    event.stopImmediatePropagation();

    const source = await fromUuid(data.uuid);
    if (source) await Wfrp4ePolymorph.onDropActor(actor, source);
  }, true); // capture phase
}

Hooks.on("renderActorSheetV2", attachDropInterceptor);
Hooks.on("renderActorSheet", attachDropInterceptor);

// 3. Revert entry point — sidebar context menu (v13 + legacy hook names).
function addRevertContextOption(app, entryOptions) {
  entryOptions.push({
    name: "Revert to Original Form",
    icon: '<i class="fa-solid fa-backward"></i>',
    condition: (li) => {
      const id = li.dataset?.documentId ?? li.dataset?.entryId ?? li[0]?.dataset?.documentId;
      const actor = game.actors.get(id);
      return !!actor && actor.getFlag(MODULE_ID, "isPolymorphed") && Wfrp4ePolymorph.canTransform(actor);
    },
    callback: (li) => {
      const id = li.dataset?.documentId ?? li.dataset?.entryId ?? li[0]?.dataset?.documentId;
      const actor = game.actors.get(id);
      if (actor) return Wfrp4ePolymorph.revert(actor);
    }
  });
}
Hooks.on("getActorContextOptions", addRevertContextOption);
Hooks.on("getActorDirectoryEntryContext", addRevertContextOption);

// 4. Optional revert-only button in the Token HUD (transform is via sheet drop).
Hooks.on("renderTokenHUD", (hud, html, tokenData) => {
  if (!game.settings.get(MODULE_ID, "enablePolymorph")) return;
  if (!game.settings.get(MODULE_ID, "polymorphRevertInHUD")) return;

  const tokenDoc = canvas.scene?.tokens.get(tokenData._id);
  const actor = tokenDoc?.actor;
  if (!actor || !actor.isOwner) return;
  if (!actor.getFlag(MODULE_ID, "isPolymorphed")) return; // only show for transformed tokens

  const btnHtml = `<div class="control-icon polymorph-revert" data-tooltip="Revert Form" style="display:flex;align-items:center;justify-content:center;"><i class="fas fa-user" style="font-size:20px;margin:0;padding:0;"></i></div>`;
  const element = (html instanceof jQuery) ? html[0] : html;
  const rightCol = element.querySelector(".col.right");
  if (!rightCol) return;

  rightCol.insertAdjacentHTML("beforeend", btnHtml);
  element.querySelector(".polymorph-revert")?.addEventListener("click", async (e) => {
    e.preventDefault(); e.stopPropagation();
    await Wfrp4ePolymorph.revert(actor);
    hud?.clear();
  });
});
