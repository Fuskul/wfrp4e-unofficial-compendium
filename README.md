# Fuskul's WFRP4e Unofficial Compendium

![Foundry Version](https://img.shields.io/badge/Foundry-v14-green)
![System](https://img.shields.io/badge/System-WFRP4e-darkred)

**Fuskul's WFRP4e Unofficial Compendium** is a massive unofficial expansion for the Warhammer Fantasy Roleplay 4th Edition system in Foundry VTT.

The module adds a wealth of new content, with a special focus on **Kislev**, alongside new mechanics, species, spells, sheet quality-of-life improvements, and convenient tools for the Game Master.

---

## 🌟 Key Features

### ❄️ Kislev Expansion & Ice Magic
* **Kislevite Careers:** Ice Witch, Chekist, Gospodar Legate, Ungol Horse Archer, Kossar, Winged Lancer (Pancerny), Streltsi, Bear Tamer, Hag Witches (Koldunja → Vorozheja → Znarkharja → Baba), and Priests of Dazh, Tor, and Ursun.
* **God Blessings:** A full 6-miracle set for Ursun, Dazh, and Tor, from personal buffs and healing up to capstone area-of-effect miracles (Maw of Winter, Wrath of Dazh, Wrath of the Thunderer).
* **Lore of Ice & Lore of the Hag:** Full automation for both traditions. Ice Magic includes interaction mechanics for the *Chilled* and *Ablaze* conditions (ice and fire neutralize each other) as well as Channelling bonuses for every frozen target near the caster.

### 😈 Chaos & Cults
* **Cultist Careers:** Full 4-level cultist career paths for Slaanesh, Khorne, and Nurgle (Tzeentch is left to the official core careers). Each runs from a hidden Cult Acolyte up to an Exalted Lord commanding their own Chaos Cult.
* **Necromancer & Assassin:** Standalone 4-level career paths for players who'd rather work in shadows than in service of the Ruinous Powers.

### 🧛 Vampires & Dark Elves
* **Vampires:** Playable species with Bloodline subspecies (Von Carstein, Lahmian, Blood Dragon, Necrarch, Strigoi), a 47-item Blood Gift system, and an automatic free Bloodline gift prompt the first time a new vampire's sheet is opened.
* **Dark Elves:** A species with its own characteristics, skills, and a built-in, lore-friendly name generator.
* **Themed Character Sheets:** Vampire and Dark Elf actor sheets pick up their own visual theme automatically — gothic red-and-black for Vampires, cold purple-and-silver for Dark Elves — no extra setup required.

### 🖤 Temple of Spite — Dark Elves of the Black Ark *(new in 1.6.0)*
* **Lore of Dark Magic:** All 24 spells, with automation where it makes sense (magic missiles, armour-ignoring damage, Fatigued/Broken/Entangled riders, Power of Darkness buffs, Word of Pain penalties, Soul Stealer drain…). Dark Magic rules are automated: every Miscast becomes Major unless the caster has *Instinctive Diction*, ingredients don't help, an 8 on the units die causes a Major Miscast and a Corruption point, and casting more than +4 SL over the CN links the new **Dark Magic Complications** table.
* **Talents:** *Soul Pact* (with all Sorceress Pacts) and *Gifts of Khaine* — each Gift as its own talent, with roll-dialog toggles for Touch of Khaine, Dance of Doom and Dagger of Khaine.
* **Druchii Equipment:** Spineblade, Soultaker, Vambrace Blades, Net, Repeater Crossbow & Handbow, Reaper Bolt Thrower, Sky Reaper, Ravager Harpoon, Sea Dragon Cloak, Druchii armour, and the poisons and draughts (Manbane, Sildru, Valikh, Vrasha, Zha'Kheril, Hushalta, Barvalk, Witchbrew) with applicable effects. New qualities: *Slash* and *Barbed Bolt*.
* **Templates:** All 17 Druchii NPC templates as system Template items — drop one onto a base profile to build a warrior, corsair, shade, assassin, sorceress, witch elf and more.
* **Actors (67):** Base dark elf profiles, Druchii Anointed, Doomfire Warlock, 20 ready-made Druchii (Bleaksword, Darkshard, Cold One Knight, Reaver Captain, Witch Elf, Supreme Sorceress…), beasts and mounts (Dark Steed, Dark Pegasus, Cold One, Kharibdyss, War Hydra, Harpy, Helldrakes, Sea Dragon), all of the book's named NPCs, and the dark elf ships and chariots as vehicles.
* **Core Sync:** NPCs carry light copies of Core talents, traits and spells; on import they are swapped for the full `wfrp4e-core` items (toggle in settings, plus a *Sync Actors with WFRP4e Core* macro for already-imported actors).

### 🧙‍♂️ New Playable Species & Subspecies
* **Skaven:** Fully automated species with clan selection (Eshin, Pestilens, Moulder, Skryre, Mors, Rictus, Mange). Each clan grants unique skills and talents.
* **Abundant Subspecies:** Added specific origins for Humans (Kislevite, Arabyan, Strigany, Border Princes), Dwarfs (Karak Kadrin, Karak Norn, etc.), and High Elves (Chrace).

### 🎒 Sheet Quality-of-Life *(new in 1.5.0)*
* **Redesigned Inventory:** The Trappings tab gains a search box, category filter pills, collapsible sections and a proper scroll region for a cleaner, faster inventory.
* **Persistent Containers:** A container now remembers what is inside it. Give or trade a full container to another character and its contents travel with it, nested containers included.
* **Container Contents Tab:** Container item windows gain a dedicated **Contents** tab with a capacity bar (styled like the Encumbrance bar), a recursive view of nested contents, and drag-and-drop plus quick "remove" buttons to move items in and out.
* **Magic Wind Filters:** The Magic tab gains a search box and filter pills by wind (lore); spells with more than one wind appear under each of them.
* **Career Completion Helper:** When your current career meets its advancement requirements, the *Complete* box is ticked automatically and a readout at the top of the Careers section shows what is still missing (skills X/8, characteristics, talent).

### 🐾 Advanced Polymorph System
Tired of manually changing stats for druids or mutants? The module includes a unique transformation system via the Token HUD:
* Right-click a token on the canvas and click the paw icon 🐾.
* Drag & Drop any monster from your sidebar or compendium into the pop-up window.
* The token instantly takes the beast's form, preserving original settings. A dedicated button reverts to the true form in one click.

### 🛠️ GM Tools & More
* **Actor Type Converter:** A convenient dialog to quickly convert an actor's sheet type (e.g., from NPC to Creature or Character) without losing data.
* **Rich Compendiums:** Built-in folders packed with ready-to-use Actors (monsters, NPCs), Items, Macros, and RollTables.

---

## ⚙️ Settings

The new quality-of-life features can be toggled under **Configure Settings → Fuskul's WFRP4e Unofficial Compendium**:

| Setting | Scope | Default |
|---|---|---|
| Redesigned inventory | Per-player | On |
| Magic tab: wind filters | Per-player | On |
| Auto-complete careers | World (GM) | On |
| Sync NPC items with WFRP4e Core on import | World (GM) | On |

Changes apply the next time a sheet is opened.

---

## 📦 Installation

1. Open Foundry VTT and go to the **Add-on Modules** tab.
2. Click **Install Module**.
3. Paste the following link into the *Manifest URL* field:
   `https://github.com/Fuskul/wfrp4e-unofficial-compendium/releases/latest/download/module.json`
4. Click **Install**.
5. Open your world and enable **Fuskul's WFRP4e Unofficial Compendium** in the module settings.

**Requires:** the [WFRP4e system](https://foundryvtt.com/packages/wfrp4e) (Core module).

*(Note: for the Polymorph feature to work seamlessly for players, ensure they have the "Create New Actors" permission enabled in Foundry's core permission settings.)*

---

## 🤝 Feedback & Support
If you find a bug or have suggestions for new content (especially Kislev-related!), feel free to reach out:
* **Discord:** `fuskul`
* Or simply open an **Issue** right here on GitHub!
