// ============================================================================
//  Redesigned inventory / container UI for the WFRP4e character sheet.
//
//  We don't fork the system templates. Instead we wrap the base sheet classes'
//  `_onRender` (AppV2) and rebuild the already-rendered DOM of the
//  Trappings/Inventory tab and the container item window into a compact,
//  column-aligned layout with a search box, category filter pills, a proper
//  scroll region, and click-to-collapse category sections. Because we patch
//  the *base* prototype (`ActorSheetWFRP4eCharacter`), this applies to every
//  character sheet, including the module's own Vampire / Dark-Elf subclasses,
//  which call `super._onRender`.
//
//  Real system DOM this relies on (system v9.x, static/templates/sheets/...):
//    section.tab[data-tab="inventory"]
//      .encumbrance-section
//      .sheet-list.currency               > .list-header / .list-content > .list-row[data-uuid]
//      .sheet-list.inventory.<category>   > .list-header / .list-content > .list-row[data-uuid]
//      .sheet-list.inventory.container    > ...
//    Rows:  .row-content > .list-name (img + a.label) , a.small (qty), .small (enc), .list-controls
//    Item window: .sheet-header > .header-fields ; section.tab[data-tab="details"]
// ============================================================================

(() => {
"use strict";

const MODULE_ID = "wfrp4e-unofficial-compendium";

/** Read a module setting, defaulting to enabled if it isn't registered yet. */
function setting(key) {
    try { return game.settings.get(MODULE_ID, key); }
    catch { return true; }
}

Hooks.once("init", () => {
    game.settings.register(MODULE_ID, "inventoryUi", {
        name: "Redesigned inventory",
        hint: "Search box, category filter pills and collapsible sections on the Trappings tab. Takes effect the next time a sheet is opened.",
        scope: "client", config: true, type: Boolean, default: true
    });
    game.settings.register(MODULE_ID, "magicWindFilters", {
        name: "Magic tab: wind filters",
        hint: "Search box and filter pills by wind (lore) on the Magic tab. Takes effect the next time a sheet is opened.",
        scope: "client", config: true, type: Boolean, default: true
    });
});

/* -------------------------------------------------------------------------- */
/*  Prototype patching helper                                                  */
/* -------------------------------------------------------------------------- */

/** Wrap an async prototype method so `after(this)` runs once the original has
 *  finished (DOM is ready). Idempotent: never double-wraps. */
function wrapOnRender(proto, after) {
    if (!proto || proto.__wucInvWrapped) return;
    const original = proto._onRender;
    proto._onRender = async function (...args) {
        const result = await original?.apply(this, args);
        try { after.call(this); }
        catch (err) { console.error(`${MODULE_ID} | inventory UI failed`, err); }
        return result;
    };
    proto.__wucInvWrapped = true;
}

Hooks.once("ready", () => {
    if (typeof ActorSheetWFRP4eCharacter !== "undefined") {
        wrapOnRender(ActorSheetWFRP4eCharacter.prototype, function () {
            if (setting("inventoryUi")) enhanceInventoryTab(this);
            if (setting("magicWindFilters")) enhanceMagicTab(this);
        });
    } else {
        console.warn(`${MODULE_ID} | ActorSheetWFRP4eCharacter not found; inventory UI disabled`);
    }

    const containerCfg = CONFIG.Item?.sheetClasses?.container ?? {};
    const entry = Object.values(containerCfg).find(e => e.default) ?? Object.values(containerCfg)[0];
    const ItemSheetCls = entry?.cls;
    if (ItemSheetCls) {
        wrapOnRender(ItemSheetCls.prototype, function () {
            if ((this.document ?? this.item)?.type === "container") enhanceContainerWindow(this);
        });
    } else {
        console.warn(`${MODULE_ID} | container item sheet class not found; container UI disabled`);
    }
});

/* -------------------------------------------------------------------------- */
/*  Inventory tab                                                              */
/* -------------------------------------------------------------------------- */

/** Per-tab filter state (kept on the sheet so it survives re-renders). */
function getTabState(sheet, key) {
    sheet._wucTabState ??= {};
    return sheet._wucTabState[key] ??= { search: "", active: "all" };
}

function enhanceInventoryTab(sheet) {
    const root = sheet.element;                 // AppV2 element is a native HTMLElement
    if (!root?.querySelector) return;
    const tab = root.querySelector('section.tab[data-tab="inventory"], section.tab[data-tab="trappings"]');
    if (!tab) return;

    tab.classList.add("wuc-inventory");

    const sections = [...tab.querySelectorAll(".sheet-list")];
    if (!sections.length) return;

    const state = getTabState(sheet, "inventory");
    buildToolbar(sheet, tab, sections, state);
    installScrollRegion(sheet, root, tab, sections);
    setupCollapsibleSections(sections);
    applyListFilter(sections, state);
}

/** Lore/wind keys present in a spell's `system.lore.value` (supports multi-wind
 *  values, e.g. an array or a delimited string like "ice,hag"). */
function spellWindKeys(loreValue) {
    const raw = String(loreValue ?? "").toLowerCase().trim();
    if (!raw) return [];
    const known = Object.keys(game.wfrp4e?.config?.magicLores ?? {});
    const found = known.filter(k => k && raw.includes(k.toLowerCase()));
    return found.length ? found : [raw];        // unknown lore -> its own bucket
}

/** Display name for a wind/lore key. */
function windLabel(key) {
    const cfg = game.wfrp4e?.config ?? {};
    return cfg.magicWind?.[key] ?? cfg.magicLores?.[key] ?? (key.charAt(0).toUpperCase() + key.slice(1));
}

/** Magic tab: search box + filter pills by WIND (a spell may match several). */
function enhanceMagicTab(sheet) {
    const root = sheet.element;
    if (!root?.querySelector) return;
    const tab = root.querySelector('section.tab[data-tab="magic"]');
    if (!tab) return;
    const actor = sheet.document;
    if (!actor?.items) return;

    tab.classList.add("wuc-inventory");

    // Map each spell row to its wind key(s) and collect the winds present.
    const rows = [...tab.querySelectorAll(".list-row[data-uuid]")];
    const rowWinds = new Map();
    const present = new Set();
    for (const row of rows) {
        const id = row.dataset.uuid?.split(".").pop();
        const it = actor.items.get(id);
        const loreVal = it?.system?.lore?.value;   // spells AND cants (any lore-bearing item)
        if (loreVal === undefined || loreVal === null || loreVal === "") { rowWinds.set(row, null); continue; }
        const winds = spellWindKeys(loreVal);
        rowWinds.set(row, new Set(winds));
        winds.forEach(w => present.add(w));
    }

    const state = getTabState(sheet, "magic");
    buildMagicToolbar(sheet, tab, rows, rowWinds, present, state);
    setupCollapsibleSections([...tab.querySelectorAll(".sheet-list")]);
    applyMagicFilter(tab, rows, rowWinds, state);
}

function buildMagicToolbar(sheet, tab, rows, rowWinds, present, state) {
    tab.querySelector(".wuc-inv-toolbar")?.remove();

    const bar = document.createElement("div");
    bar.className = "wuc-inv-toolbar";

    const search = document.createElement("input");
    search.type = "text";
    search.className = "wuc-inv-search";
    search.placeholder = "Search…";
    search.value = state.search ?? "";
    search.addEventListener("input", () => {
        state.search = search.value;
        applyMagicFilter(tab, rows, rowWinds, state);
    });
    bar.appendChild(search);

    // Wind pills only when spells of more than one wind are present.
    if (present.size >= 2) {
        const pills = document.createElement("div");
        pills.className = "wuc-inv-filters";
        const makePill = (label, key) => {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "wuc-inv-pill";
            pill.textContent = label;
            if ((state.active ?? "all") === key) pill.classList.add("active");
            pill.addEventListener("click", () => {
                state.active = key;
                pills.querySelectorAll(".wuc-inv-pill").forEach(p => p.classList.toggle("active", p === pill));
                applyMagicFilter(tab, rows, rowWinds, state);
            });
            return pill;
        };
        pills.appendChild(makePill(game.i18n.localize("All") || "All", "all"));
        const isNone = (key) => key === "none" || key === "" || /^none$/i.test(windLabel(key));
        [...present].sort((a, b) => {
            const aNone = isNone(a), bNone = isNone(b);
            if (aNone !== bNone) return aNone ? 1 : -1;         // "None" always last
            return windLabel(a).localeCompare(windLabel(b));
        }).forEach(w => pills.appendChild(makePill(windLabel(w), w)));
        bar.appendChild(pills);
    } else {
        state.active = "all";
    }

    const enc = tab.querySelector(".encumbrance-section");
    if (enc && enc.nextSibling) tab.insertBefore(bar, enc.nextSibling);
    else if (enc) tab.appendChild(bar);
    else tab.prepend(bar);
}

function applyMagicFilter(tab, rows, rowWinds, state) {
    const query = (state.search ?? "").toLowerCase().trim();
    const active = state.active ?? "all";

    for (const row of rows) {
        const nameEl = row.querySelector(".list-name .label") ?? row.querySelector(".list-name") ?? row;
        const name = (nameEl.textContent ?? "").toLowerCase();
        const winds = rowWinds.get(row);
        const windOk = active === "all" || (winds && winds.has(active));
        const textOk = !query || name.includes(query);
        row.style.display = (windOk && textOk) ? "" : "none";
    }

    // Hide sections that end up empty (but keep header/control-only sections).
    tab.querySelectorAll(".sheet-list").forEach(sec => {
        const hasRows = sec.querySelector(".list-row");
        const anyVisible = [...sec.querySelectorAll(".list-row")].some(r => r.style.display !== "none");
        sec.style.display = (!hasRows || anyVisible) ? "" : "none";
    });
}

/** Human label for a `.sheet-list` section, used on the filter pills. */
function sectionLabel(section) {
    if (section.classList.contains("currency"))
        return game.i18n.localize("WFRP4E.TrappingType.Money") || "Money";
    if (section.classList.contains("container"))
        return game.i18n.localize("WFRP4E.TrappingType.Container") || "Containers";
    const nameEl = section.querySelector(".list-header .list-name");
    return (nameEl ? nameEl.textContent.trim() : "") || "Items";
}

function buildToolbar(sheet, tab, sections, state) {
    tab.querySelector(".wuc-inv-toolbar")?.remove();

    const bar = document.createElement("div");
    bar.className = "wuc-inv-toolbar";

    const search = document.createElement("input");
    search.type = "text";
    search.className = "wuc-inv-search";
    search.placeholder = "Search…";
    search.value = state.search ?? "";
    search.addEventListener("input", () => {
        state.search = search.value;
        applyListFilter(sections, state);
    });
    bar.appendChild(search);

    const pills = document.createElement("div");
    pills.className = "wuc-inv-filters";

    const makePill = (label, key) => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "wuc-inv-pill";
        pill.dataset.section = key;
        pill.textContent = label;
        if ((state.active ?? "all") === key) pill.classList.add("active");
        pill.addEventListener("click", () => {
            state.active = key;
            pills.querySelectorAll(".wuc-inv-pill").forEach(p => p.classList.toggle("active", p === pill));
            applyListFilter(sections, state);
        });
        return pill;
    };

    pills.appendChild(makePill(game.i18n.localize("All") || "All", "all"));
    sections.forEach((sec, i) => pills.appendChild(makePill(sectionLabel(sec), String(i))));
    bar.appendChild(pills);

    // Toolbar sits below the encumbrance bar (or at the very top).
    const enc = tab.querySelector(".encumbrance-section");
    if (enc && enc.nextSibling) tab.insertBefore(bar, enc.nextSibling);
    else if (enc) tab.appendChild(bar);
    else tab.prepend(bar);
}

/**
 * Move the category sections into a dedicated scroll container whose height is
 * pinned to the sheet window, so the list scrolls while the encumbrance bar and
 * the toolbar stay fixed on top. Independent of the system's own layout.
 */
function installScrollRegion(sheet, root, tab, sections) {
    tab.querySelector(".wuc-inv-scroll")?.remove();

    const scroll = document.createElement("div");
    scroll.className = "wuc-inv-scroll";
    sections.forEach(sec => scroll.appendChild(sec));   // relocates the sections
    tab.appendChild(scroll);

    const windowContent = root.querySelector(".window-content") ?? root;
    const recompute = () => {
        if (!scroll.isConnected) return;
        const sRect = scroll.getBoundingClientRect();
        if (sRect.top === 0 && sRect.height === 0) return;   // tab hidden — skip
        const wcRect = windowContent.getBoundingClientRect();
        const avail = Math.max(120, Math.floor(wcRect.bottom - sRect.top - 10));
        const px = `${avail}px`;
        if (scroll.style.maxHeight !== px) scroll.style.maxHeight = px;
    };
    recompute();

    // Recompute on window resize AND when the tab is shown/hidden (observing the
    // tab makes the height correct even if the sheet opened on another tab).
    sheet._wucResizeObserver?.disconnect();
    const ro = new ResizeObserver(() => recompute());
    ro.observe(windowContent);
    ro.observe(tab);
    sheet._wucResizeObserver = ro;
}

/** Search-by-name + one-category filter pill (shared by inventory & magic). */
function applyListFilter(sections, state) {
    const query = (state.search ?? "").toLowerCase().trim();
    const active = state.active ?? "all";

    sections.forEach((section, i) => {
        const sectionAllowed = active === "all" || active === String(i);
        if (!sectionAllowed) { section.style.display = "none"; return; }

        let anyVisible = false;
        const match = (name) => !query || (name ?? "").toLowerCase().includes(query);

        section.querySelectorAll(".list-content .list-row").forEach(row => {
            const nameEl = row.querySelector(".list-name .label") ?? row.querySelector(".list-name") ?? row;
            const name = nameEl.textContent ?? "";
            const ok = match(name);
            row.style.display = ok ? "" : "none";
            anyVisible = anyVisible || ok;
        });
        section.querySelectorAll(".list-content .collapsed-icon").forEach(icon => {
            const ok = match(icon.dataset.tooltip);
            icon.style.display = ok ? "" : "none";
            anyVisible = anyVisible || ok;
        });

        section.style.display = (query && !anyVisible) ? "none" : "";
    });
}

/** Click a category header to collapse it (client-side). */
function setupCollapsibleSections(sections) {
    sections.forEach(section => {
        const header = section.querySelector(".list-header");
        if (!header || header.dataset.wucCollapsible) return;
        header.dataset.wucCollapsible = "1";
        header.addEventListener("click", (event) => {
            if (event.target.closest("a, button, input, select, .list-controls")) return;
            section.classList.toggle("wuc-collapsed");
        });
    });
}

/* -------------------------------------------------------------------------- */
/*  Container item window                                                      */
/* -------------------------------------------------------------------------- */

function enhanceContainerWindow(sheet) {
    const root = sheet.element;
    if (!root?.querySelector) return;
    const item = sheet.document ?? sheet.item;
    if (!item) return;

    root.classList.add("wuc-container");

    // --- capacity bar in the header, styled like the actor Encumbrance bar ---
    const headerFields = root.querySelector(".sheet-header .header-fields");
    if (headerFields) {
        headerFields.querySelector(".wuc-capacity")?.remove();

        const max = Number(item.system?.carries?.value ?? 0);
        const current = Number(item.system?.carries?.current ?? countStoredEnc(item));
        const ratio = max > 0 ? current / max : 0;
        const pct = Math.min(100, Math.round(ratio * 100));
        const state = ratio >= 1 ? "max" : ratio >= 0.75 ? "high" : ratio > 0.5 ? "partial" : "none";

        // Reuse the system's .encumbrance-section markup + classes so it matches
        // the character sheet; our CSS provides a fallback in case the system's
        // rules don't reach the item window.
        const enc = document.createElement("div");
        enc.className = "encumbrance-section wuc-capacity";
        const label = game.i18n.localize("SHEET.Encumbrance") || game.i18n.localize("Encumbrance") || "Encumbrance";
        enc.innerHTML =
            `<div class="header"><label>${label}</label>` +
            `<div class="counter"><div class="value">${current}</div><div>/</div><div class="max">${max}</div></div></div>` +
            `<div class="bar ${state}" style="width:${pct}%"></div>`;
        headerFields.appendChild(enc);
    }

    // --- contents panel shown in its own "Contents" tab, with drag in/out ---
    const owned = item.parent instanceof Actor;
    const contents = getContainerContents(item);

    const panel = document.createElement("div");
    panel.className = "wuc-container-contents";

    const list = document.createElement("div");
    list.className = "wuc-contents-list";

    if (!contents.length) {
        const empty = document.createElement("div");
        empty.className = "wuc-contents-empty";
        empty.textContent = owned ? "—" : "";
        list.appendChild(empty);
    }

    // Tracks a drag that STARTED from a row in this panel, so the panel doesn't
    // grab its own item back (which used to make the item impossible to drag out
    // and could leave the window in a stuck drag state).
    let selfDrag = false;

    for (const entry of contents) {
        const row = document.createElement("div");
        row.className = "wuc-contents-row";
        if (entry.isContainer) row.classList.add("is-container");
        if (entry.level) row.style.marginLeft = `${entry.level * 14}px`;   // indent nested items

        const img = document.createElement("img");
        img.src = entry.img;
        img.alt = "";
        const nameSpan = document.createElement("span");
        nameSpan.className = "wuc-contents-name";
        nameSpan.textContent = entry.name;                 // textContent = safe
        const qty = document.createElement("span");
        qty.className = "wuc-contents-qty";
        qty.textContent = `×${entry.quantity}`;
        const enc = document.createElement("span");
        enc.className = "wuc-contents-enc";
        enc.textContent = entry.enc;
        row.append(img, nameSpan, qty, enc);

        if (entry.open) {
            img.classList.add("clickable");
            nameSpan.classList.add("clickable");
            img.addEventListener("click", () => entry.open());
            nameSpan.addEventListener("click", () => entry.open());
        }

        if (entry.uuid && owned) {
            // Take-out button: reliably removes the item from the container.
            const remove = document.createElement("a");
            remove.className = "wuc-contents-remove";
            remove.dataset.tooltip = game.i18n.localize("SHEET.RemoveItem") || "Remove from container";
            remove.innerHTML = `<i class="fa-solid fa-arrow-up-from-bracket"></i>`;
            remove.addEventListener("click", (ev) => {
                ev.stopPropagation();
                removeFromContainer(entry.uuid);
            });
            row.appendChild(remove);

            // Drag OUT: drag the row onto another sheet / container.
            row.setAttribute("draggable", "true");
            row.addEventListener("dragstart", (ev) => {
                selfDrag = true;
                ev.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid: entry.uuid }));
                ev.dataTransfer.effectAllowed = "move";
            });
            row.addEventListener("dragend", () => { selfDrag = false; panel.classList.remove("drop-hover"); });
        }

        list.appendChild(row);
    }
    panel.appendChild(list);

    // Drag IN: dropping an *external* Item onto the panel puts it in this container.
    if (owned) {
        panel.addEventListener("dragover", (ev) => {
            if (selfDrag) return;                      // don't capture our own item
            ev.preventDefault();
            panel.classList.add("drop-hover");
        });
        panel.addEventListener("dragleave", () => panel.classList.remove("drop-hover"));
        panel.addEventListener("drop", (ev) => {
            panel.classList.remove("drop-hover");
            if (selfDrag) return;
            onContainerDrop(item, ev);
        });
    }

    placeContentsTab(sheet, root, panel);
}

/**
 * Insert a dedicated "Contents" tab (before "Details") into the container item
 * window and move the contents panel into it. Re-run on every render, so the
 * tab is re-created after the system regenerates its own template parts.
 */
function placeContentsTab(sheet, root, panel) {
    const detailsLink = root.querySelector('[data-action="tab"][data-tab="details"]');
    const detailsSection = root.querySelector('section.tab[data-tab="details"]');
    if (!detailsLink || !detailsSection) {
        // No standard tabs found — fall back to putting it in Details if present.
        detailsSection?.prepend(panel);
        return;
    }

    const nav = detailsLink.parentElement;
    const body = detailsSection.parentElement;
    const group = detailsLink.dataset.group || detailsSection.dataset.group || "primary";

    // Remove any previous injection (in case nav/body persisted across renders).
    root.querySelector(".wuc-contents-tab")?.remove();
    root.querySelector("section.tab.wuc-contents-section")?.remove();

    // Nav link styled like the other tabs, placed before Details.
    const navLink = document.createElement("a");
    navLink.className = `${detailsLink.className.replace(/\bactive\b/g, "").trim()} wuc-contents-tab`;
    navLink.dataset.action = "tab";
    navLink.dataset.group = group;
    navLink.dataset.tab = "contents";
    navLink.innerHTML = `<label>${game.i18n.localize("Contents") || "Contents"}</label>`;
    nav.insertBefore(navLink, detailsLink);

    // Content section, placed before Details.
    const section = document.createElement("section");
    section.className = "tab wuc-contents-section";
    section.dataset.group = group;
    section.dataset.tab = "contents";
    section.appendChild(panel);
    body.insertBefore(section, detailsSection);

    // Self-contained tab switching (queries fresh each click to avoid stale
    // references after re-renders). Attached once per nav element.
    if (!nav.dataset.wucTabHandler) {
        nav.dataset.wucTabHandler = "1";
        nav.addEventListener("click", (ev) => {
            const link = ev.target.closest('[data-action="tab"]');
            if (!link || !nav.contains(link)) return;
            const tabId = link.dataset.tab;
            const rootEl = link.closest(".window-content, form, .application") ?? document;
            nav.querySelectorAll('[data-action="tab"]')
                .forEach(a => a.classList.toggle("active", a === link));
            rootEl.querySelectorAll("section.tab")
                .forEach(s => s.classList.toggle("active", s.dataset.tab === tabId));
            if (sheet.tabGroups) sheet.tabGroups[link.dataset.group || group] = tabId;
        });
    }

    // Preserve the Contents selection across re-renders.
    if (sheet.tabGroups?.[group] === "contents") {
        nav.querySelectorAll('[data-action="tab"]')
            .forEach(a => a.classList.toggle("active", a === navLink));
        body.querySelectorAll("section.tab")
            .forEach(s => s.classList.toggle("active", s === section));
    }
}

/** Remove an item from its container (send it back to the actor's top level). */
async function removeFromContainer(uuid) {
    try {
        const it = await fromUuid(uuid);
        if (it) await it.update({ "system.location.value": "" });
    } catch (err) { console.error(`${MODULE_ID} | remove from container failed`, err); }
}

/** Handle an Item dropped onto the open container window. */
async function onContainerDrop(container, event) {
    event.preventDefault();
    let data;
    try { data = JSON.parse(event.dataTransfer.getData("text/plain") || "{}"); }
    catch { return; }
    if (data?.type !== "Item") return;

    const actor = container.parent;
    if (!(actor instanceof Actor)) return;

    let dropped;
    try {
        dropped = data.uuid ? await fromUuid(data.uuid) : await Item.implementation.fromDropData(data);
    } catch { /* ignore */ }
    if (!dropped) return;

    // Only physical, containable items (they carry a `location` field).
    if (!dropped.system?.location) {
        ui.notifications?.warn(game.i18n.localize("Only physical items can go into a container.") || "Only physical items can go into a container.");
        return;
    }
    // No cycles: can't drop a container into itself or into one of its own descendants.
    if (dropped.id === container.id) return;
    if (dropped.type === "container" && ancestorIds(actor, container.id).includes(dropped.id)) {
        ui.notifications?.warn("Cannot put a container inside itself.");
        return;
    }

    try {
        if (dropped.parent === actor) {
            if (String(dropped.system.location.value ?? "") === String(container.id)) return;   // already here
            await dropped.update({ "system.location.value": container.id });
        } else {
            const src = dropped.toObject();
            delete src._id;
            if (src.flags?.[MODULE_ID]) delete src.flags[MODULE_ID];
            foundry.utils.setProperty(src, "system.location.value", container.id);
            await actor.createEmbeddedDocuments("Item", [src]);
        }
    } catch (err) { console.error(`${MODULE_ID} | drop into container failed`, err); }
}

/** Ids of a container and every container up its location chain. */
function ancestorIds(actor, startId) {
    const ids = [];
    let id = startId ? String(startId) : "";
    let guard = 0;
    while (id && guard++ < 100) {
        const it = actor.items.get(id);
        if (!it) break;
        ids.push(it.id);
        id = it.system?.location?.value;
    }
    return ids;
}

/** Sum stored encumbrance from the snapshot flag (used when unowned). */
function countStoredEnc(item) {
    const stored = item.getFlag?.(MODULE_ID, "contents")?.items ?? [];
    return stored.reduce((sum, i) => sum + Number(foundry.utils.getProperty(i, "system.encumbrance.value") ?? 0), 0);
}

/**
 * Resolve the container's contents for display. When owned we compute them
 * directly from the actor's items via the `location` link (this is always
 * up to date and always carries a uuid, unlike the system's derived
 * `system.carrying`, which may be empty on a re-render of the item window).
 * For an unowned world/compendium item we fall back to the stored snapshot.
 */
function getContainerContents(item) {
    const out = [];
    const seen = new Set();
    const actor = item.parent;

    // Owned: recurse the actor's items via the `location` link (nested included).
    if (actor instanceof Actor && actor.items) {
        const walk = (parentId, level) => {
            if (level > 20) return;
            for (const it of actor.items.filter(i => String(i.system?.location?.value ?? "") === String(parentId))) {
                if (seen.has(it.id)) continue;
                seen.add(it.id);
                out.push({
                    level,
                    uuid: it.uuid,
                    img: it.img,
                    name: it.name,
                    quantity: it.system?.quantity?.value ?? 1,
                    enc: it.system?.encumbrance?.total ?? it.system?.encumbrance?.value ?? 0,
                    open: () => it.sheet?.render(true),
                    isContainer: it.type === "container"
                });
                if (it.type === "container") walk(it.id, level + 1);
            }
        };
        walk(item.id, 0);
        return out;
    }

    // Unowned: rebuild the tree from the stored snapshot flag.
    const flag = item.getFlag?.(MODULE_ID, "contents");
    const stored = flag?.items ?? [];
    if (!stored.length) return out;
    const walkStored = (parentId, level) => {
        if (level > 20) return;
        for (const src of stored.filter(s => String(foundry.utils.getProperty(s, "system.location.value") ?? "") === String(parentId))) {
            if (seen.has(src._id)) continue;
            seen.add(src._id);
            out.push({
                level,
                uuid: null,
                img: src.img,
                name: src.name,
                quantity: foundry.utils.getProperty(src, "system.quantity.value") ?? 1,
                enc: foundry.utils.getProperty(src, "system.encumbrance.value") ?? 0,
                open: null,
                isContainer: src.type === "container"
            });
            if (src.type === "container") walkStored(src._id, level + 1);
        }
    };
    walkStored(flag.rootId, 0);
    return out;
}

})();
