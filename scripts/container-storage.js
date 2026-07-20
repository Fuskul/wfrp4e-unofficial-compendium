// ============================================================================
//  Persistent container contents for WFRP4e.
//
//  Problem: in wfrp4e a container's "contents" are NOT embedded inside the
//  container item. They are ordinary sibling items on the same actor, linked
//  to the container only by `system.location.value === <containerId>`
//  (nested containers chain the same way). So when a container item is dragged
//  to another actor, only the container travels — its contents are left behind.
//
//  Fix (copy semantics — the sender keeps their copy):
//    * We keep a *snapshot* of the whole container subtree in a flag on the
//      container itself: flags[MODULE].contents = { rootId, items: [...] }.
//      The snapshot is kept in sync whenever the container's contents change.
//    * Because the flag is plain data, it travels with the container on any
//      copy (actor→actor, sidebar, compendium, world export).
//    * On the receiving side, the `createItem` hook unpacks the snapshot:
//      it recreates every stored item on the new actor, generating fresh ids
//      and rewiring each `location` link (including nested containers) to the
//      new container's id.
//
//  All follow-up writes are performed only by the user who triggered the hook
//  (`userId === game.user.id`), so exactly one client acts and it already has
//  the needed permissions.
// ============================================================================

(() => {
"use strict";

const MODULE_ID = "wfrp4e-unofficial-compendium";
const FLAG_KEY = "contents";
const SUPPRESS = `${MODULE_ID}_suppress`;   // options flag to mute our own bulk writes

/* -------------------------------------------------------------------------- */
/*  Tree helpers                                                               */
/* -------------------------------------------------------------------------- */

const locOf = (item) => {
    const v = item?.system?.location?.value;
    return (v === undefined || v === null || v === "") ? "" : String(v);
};

/** All descendant items of a container (every nesting level), as documents. */
function collectDescendants(actor, containerId) {
    const out = [];
    const queue = actor.items.filter(i => locOf(i) === String(containerId));
    let guard = 0;
    while (queue.length && guard++ < 5000) {
        const it = queue.shift();
        out.push(it);
        if (it.type === "container")
            queue.push(...actor.items.filter(c => locOf(c) === String(it.id)));
    }
    return out;
}

/** Rebuild + store the snapshot flag for one container. No-op if unchanged. */
async function refreshSnapshot(container) {
    const actor = container.parent;
    if (!actor?.items) return;

    const items = collectDescendants(actor, container.id).map(doc => {
        const src = doc.toObject();
        if (src.flags?.[MODULE_ID]) delete src.flags[MODULE_ID];   // keep snapshots lean
        return src;
    });

    const next = { rootId: container.id, items };
    const current = container.getFlag(MODULE_ID, FLAG_KEY);
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    await container.setFlag(MODULE_ID, FLAG_KEY, next);
}

/** Refresh every container up the location chain from a given container id. */
async function refreshAncestors(actor, startId) {
    const seen = new Set();
    let id = startId ? String(startId) : "";
    let guard = 0;
    while (id && !seen.has(id) && guard++ < 100) {
        seen.add(id);
        const container = actor.items.get(id);
        if (!container || container.type !== "container") break;
        await refreshSnapshot(container);
        id = locOf(container);
    }
}

/** Refresh all containers on an actor (cheap: few containers per actor). */
async function refreshAllContainers(actor) {
    for (const c of actor.items.filter(i => i.type === "container")) await refreshSnapshot(c);
}

/* -------------------------------------------------------------------------- */
/*  Unpack a freshly-created container from its snapshot                        */
/* -------------------------------------------------------------------------- */

async function unpackContainer(container) {
    const actor = container.parent;
    const flag = container.getFlag(MODULE_ID, FLAG_KEY);
    if (!actor?.items || !flag?.items?.length) return;

    const packed = foundry.utils.deepClone(flag.items);

    // Map every old id (root + descendants) to a fresh id.
    const idMap = { [String(flag.rootId)]: container.id };
    for (const src of packed) {
        if (!src._id) src._id = foundry.utils.randomID();
        idMap[String(src._id)] = foundry.utils.randomID();
    }

    // Rewire ids + parent links; strip our flag so children don't self-unpack.
    for (const src of packed) {
        const newId = idMap[String(src._id)];
        const oldLoc = String(foundry.utils.getProperty(src, "system.location.value") ?? "");
        const newLoc = idMap[oldLoc] ?? container.id;
        src._id = newId;
        foundry.utils.setProperty(src, "system.location.value", newLoc);
        if (src.flags?.[MODULE_ID]) delete src.flags[MODULE_ID];
    }

    await actor.createEmbeddedDocuments("Item", packed, { keepId: true, [SUPPRESS]: true });
    await refreshSnapshot(container);   // re-store the snapshot with the new ids
}

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                       */
/* -------------------------------------------------------------------------- */

Hooks.on("createItem", async (item, options, userId) => {
    if (game.user.id !== userId || options?.[SUPPRESS]) return;
    if (!(item.parent instanceof Actor)) return;
    try {
        if (item.type === "container" && item.getFlag(MODULE_ID, FLAG_KEY)?.items?.length)
            await unpackContainer(item);
        const loc = locOf(item);
        if (loc) await refreshAncestors(item.parent, loc);
    } catch (err) { console.error(`${MODULE_ID} | createItem handling failed`, err); }
});

Hooks.on("updateItem", async (item, changes, options, userId) => {
    if (game.user.id !== userId || options?.[SUPPRESS]) return;
    if (!(item.parent instanceof Actor)) return;

    // Ignore updates that only touch our own snapshot flag (prevents loops).
    const flat = foundry.utils.flattenObject(changes);
    const onlyOurFlag = Object.keys(flat).every(k => k === "_id" || k.startsWith(`flags.${MODULE_ID}`));
    if (onlyOurFlag) return;

    try {
        if ("system.location.value" in flat) {
            // Membership changed: previous parent is unknown, so refresh all.
            await refreshAllContainers(item.parent);
        } else {
            const loc = locOf(item);
            if (loc) await refreshAncestors(item.parent, loc);
        }
    } catch (err) { console.error(`${MODULE_ID} | updateItem handling failed`, err); }
});

Hooks.on("deleteItem", async (item, options, userId) => {
    if (game.user.id !== userId || options?.[SUPPRESS]) return;
    if (!(item.parent instanceof Actor)) return;
    try {
        const loc = locOf(item);
        if (loc) await refreshAncestors(item.parent, loc);
        if (item.type === "container") await refreshAllContainers(item.parent);
    } catch (err) { console.error(`${MODULE_ID} | deleteItem handling failed`, err); }
});

})();
