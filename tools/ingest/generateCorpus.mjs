import { RACES } from "../../data/races.js";
import { CLASSES } from "../../data/class.js";
import { CLASS_FEATURES } from "../../data/classFeatures.js";
import { SUBCLASSES } from "../../data/subclasses.js";
import { SKILLS } from "../../data/skills.js";
import { BACKGROUNDS } from "../../data/background.js";
import { ARMOURS } from "../../data/armour.js";
import { WEAPONS } from "../../data/weapon.js";
import { STATS } from "../../data/stats.js";
import { POINT_BUY_COST, POINT_BUY_TOTAL, getAbilityModifier } from "../../data/pointBuy.js";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const OUT = join(import.meta.dirname, "..", "..", "rules-corpus");
mkdirSync(OUT, { recursive: true });

const write = (name, content) => {
  writeFileSync(join(OUT, name), content, "utf-8");
  console.log(`  wrote ${name}`);
};

function formatAbilityBonus(bonus) {
  const parts = [];
  for (const [k, v] of Object.entries(bonus)) {
    if (v === 0) continue;
    const statName = STATS.find(s => s.id === k)?.name || k.toUpperCase();
    parts.push(`${statName} ${v > 0 ? "+" : ""}${v}`);
  }
  return parts.join("，");
}

function formatRaces() {
  let md = "# 种族\n\n";
  for (const race of RACES) {
    md += `## ${race.name}（${race.id}）\n\n`;
    md += `**体型**：${race.size}　**速度**：${race.speed} 尺　**黑暗视觉**：${race.senses.darkvision > 0 ? race.senses.darkvision + " 尺" : "无"}\n\n`;
    md += `**属性加成**：${formatAbilityBonus(race.abilityBonus)}\n\n`;
    md += `**语言**：${race.languages.join("、")}\n\n`;
    if (race.proficiencies.skills.length > 0) {
      md += `**技能熟练**：${race.proficiencies.skills.join("、")}\n\n`;
    }
    if (race.proficiencies.weapons.length > 0) {
      md += `**武器熟练**：${race.proficiencies.weapons.join("、")}\n\n`;
    }
    if (race.proficiencies.tools.length > 0) {
      md += `**工具熟练**：${race.proficiencies.tools.join("、")}\n\n`;
    }
    md += `### 种族特性\n\n`;
    for (const trait of race.traits) {
      md += `**${trait.name}**：${trait.desc}\n\n`;
    }
    if (race.notes.speedRule) {
      md += `**速度规则**：${race.notes.speedRule}\n\n`;
    }
    if (race.notes.innateSpells) {
      md += `**天生施法**：${race.notes.innateSpells.join("；")}\n\n`;
    }
    if (race.options?.draconicAncestry) {
      md += `**龙族血统选项**：${race.options.draconicAncestry.map(d => `${d.name}（${d.damageType}）`).join("、")}\n\n`;
    }
    if (race.options?.flexibleAbilityBonus) {
      const opt = race.options.flexibleAbilityBonus;
      md += `**灵活属性加成**：任选 ${opt.choose} 项属性各 +${opt.amount}（排除 ${opt.exclude.map(s => STATS.find(st => st.id === s)?.name || s).join("、")}）\n\n`;
    }
  }
  write("races.md", md);
}

function formatClasses() {
  let md = "# 职业\n\n";
  for (const cls of CLASSES) {
    md += `## ${cls.name}（${cls.id}）\n\n`;
    md += `**生命骰**：1d${cls.hitDie}　**主要属性**：${cls.primaryAbilities.map(a => STATS.find(s => s.id === a)?.name || a).join("、")}\n\n`;
    md += `**豁免熟练**：${cls.savingThrows.map(a => STATS.find(s => s.id === a)?.name || a).join("、")}\n\n`;
    md += `**护甲熟练**：${cls.proficiencies.armors.join("、") || "无"}\n\n`;
    md += `**武器熟练**：${cls.proficiencies.weapons.join("、") || "无"}\n\n`;
    md += `**工具熟练**：${cls.proficiencies.tools.join("、") || "无"}\n\n`;
    if (cls.skillChoices) {
      const fromDesc = cls.skillChoices.from === "any" ? "任意技能" : cls.skillChoices.from.join("、");
      md += `**技能选择**：从 ${fromDesc} 中选择 ${cls.skillChoices.choose} 项\n\n`;
    }
    md += `**子职业**：${cls.subclass.name}（${cls.subclass.selectAt} 级选择）\n\n`;

    if (cls.spellcasting) {
      const sc = cls.spellcasting;
      md += `### 施法\n\n`;
      md += `**施法属性**：${STATS.find(s => s.id === sc.ability)?.name || sc.ability}　**施法类型**：${sc.preparation === "prepared" ? "准备施法" : sc.preparation === "known" ? "已知施法" : "契约魔法"}\n\n`;
      if (sc.preparation === "prepared" && sc.preparedFormula) {
        md += `**每日准备数量**：${sc.preparedFormula}\n\n`;
      }
      if (sc.ritualCasting) {
        md += `**仪式施法**：可以\n\n`;
      }
      if (sc.focus.length > 0) {
        md += `**法器**：${sc.focus.join("、")}\n\n`;
      }
      if (sc.cantripsKnownByLevel) {
        const samples = [1, 4, 10].map(lv => `${lv}级=${sc.cantripsKnownByLevel[lv]}`).join("，");
        md += `**戏法数量**：${samples}…\n\n`;
      }
      if (sc.spellsKnownByLevel) {
        const samples = [1, 5, 11, 17].map(lv => `${lv}级=${sc.spellsKnownByLevel[lv]}`).join("，");
        md += `**已知法术数量**：${samples}…\n\n`;
      }
      md += `**备注**：${sc.notes.join("；")}\n\n`;
    }

    md += `### 职业特性（1-20级）\n\n`;
    const features = CLASS_FEATURES[cls.id];
    if (features) {
      for (let lv = 1; lv <= 20; lv++) {
        const lvFeatures = features[lv] || [];
        if (lvFeatures.length === 0) continue;
        md += `**${lv} 级**：`;
        md += lvFeatures.map(f => `${f.name}——${f.desc}`).join("；");
        md += "\n\n";
      }
    }
  }
  write("classes.md", md);
}

function formatSubclasses() {
  let md = "# 子职业\n\n";
  for (const sub of SUBCLASSES) {
    const cls = CLASSES.find(c => c.id === sub.classId);
    md += `## ${sub.name}（${sub.id}）\n\n`;
    md += `**所属职业**：${cls?.name || sub.classId}　**选择等级**：${sub.selectAt} 级　**来源**：${sub.source}\n\n`;
    if (sub.alwaysPreparedSpellsByLevel) {
      md += `### 始终准备法术\n\n`;
      for (const [lv, spells] of Object.entries(sub.alwaysPreparedSpellsByLevel)) {
        md += `- ${lv} 环：${spells.join("、")}\n`;
      }
      md += "\n";
    }
    if (sub.expandedSpellsBySpellLevel) {
      md += `### 扩展法术列表\n\n`;
      for (const [lv, spells] of Object.entries(sub.expandedSpellsBySpellLevel)) {
        md += `- ${lv} 环：${spells.join("、")}\n`;
      }
      md += "\n";
    }
    md += `### 子职业特性\n\n`;
    for (let lv = 1; lv <= 20; lv++) {
      const lvFeatures = sub.features[lv] || [];
      if (lvFeatures.length === 0) continue;
      md += `**${lv} 级**：`;
      md += lvFeatures.map(f => {
        let text = `${f.name}——${f.desc}`;
        if (f.choices) {
          text += `（选项：${f.choices.map(c => `${c.name}：${c.desc}`).join("；")}）`;
        }
        return text;
      }).join("；");
      md += "\n\n";
    }
  }
  write("subclasses.md", md);
}

function formatSkills() {
  let md = "# 技能\n\n";
  md += "D&D 5e 共有 18 项技能，每项技能关联一个属性。进行技能检定时掷 d20 + 属性调整值 + 熟练加值（若熟练）。\n\n";
  md += "| 技能 | 英文ID | 关联属性 |\n|------|--------|----------|\n";
  for (const skill of SKILLS) {
    const statName = STATS.find(s => s.id === skill.stat)?.name || skill.stat;
    md += `| ${skill.name} | ${skill.id} | ${statName} |\n`;
  }
  md += "\n";
  write("skills.md", md);
}

function formatBackgrounds() {
  let md = "# 背景\n\n";
  for (const bg of BACKGROUNDS) {
    md += `## ${bg.name}（${bg.id}）\n\n`;
    md += `${bg.description}\n\n`;
    md += `**技能熟练**：${bg.proficiencies.skills.join("、")}\n\n`;
    if (bg.proficiencies.tools.length > 0) {
      md += `**工具熟练**：${bg.proficiencies.tools.join("、")}\n\n`;
    }
    if (bg.proficiencies.languages.length > 0) {
      md += `**语言**：${bg.proficiencies.languages.join("、")}\n\n`;
    }
    md += `**起始装备**：${bg.equipment.join("；")}\n\n`;
  }
  write("backgrounds.md", md);
}

function formatEquipment() {
  let md = "# 装备\n\n";
  md += "## 护甲\n\n";
  md += "| 名称 | 类别 | 基础AC | 敏捷加成 | 力量需求 | 隐匿劣势 | 重量 | 价格 |\n|------|------|--------|----------|----------|----------|------|------|\n";
  for (const a of ARMOURS) {
    const dexDesc = a.dexModifier === "full" ? "全额" : a.dexModifier === "capped" ? `最多 +${a.maxDexBonus}` : "无";
    const cost = a.cost ? `${a.cost.quantity} ${a.cost.unit}` : "—";
    md += `| ${a.name} | ${a.category} | ${a.baseAC ?? a.acBonus ?? "—"} | ${dexDesc} | ${a.strengthRequirement || "—"} | ${a.stealthDisadvantage ? "是" : "否"} | ${a.weight} lb | ${cost} |\n`;
  }
  md += "\n## 武器\n\n";
  md += "| 名称 | 类别 | 伤害 | 属性 | 射程 | 价格 |\n|------|------|------|------|------|------|\n";
  for (const w of WEAPONS) {
    const dmg = w.damage ? `${w.damage.dice} ${w.damage.type}` : "—";
    const props = w.properties.join("、") || "—";
    const range = w.range ? `${w.range.normal}/${w.range.long} 尺` : "—";
    const cost = w.cost ? `${w.cost.quantity} ${w.cost.unit}` : "—";
    md += `| ${w.name} | ${w.category} | ${dmg} | ${props} | ${range} | ${cost} |\n`;
  }
  md += "\n### 武器属性说明\n\n";
  md += "- **弹药**：每次攻击消耗一枚弹药，可回收一半\n";
  md += "- **灵巧**：攻击和伤害可使用敏捷代替力量\n";
  md += "- **重型**：小型生物攻击具有劣势\n";
  md += "- **轻型**：可进行双武器战斗\n";
  md += "- **装填**：每回合只能发射一次（除非有额外攻击特性）\n";
  md += "- **触及**：攻击范围增加 5 尺\n";
  md += "- **投掷**：可投掷，射程见射程列\n";
  md += "- **双手**：必须双手使用\n";
  md += "- **两用**：单手 1dX，双手 1dY（见备注）\n";
  write("equipment.md", md);
}

function formatAbilityScores() {
  let md = "# 属性值与调整值\n\n";
  md += "## 六项属性\n\n";
  md += "| 属性 | 英文 | 缩写 |\n|------|------|------|\n";
  for (const s of STATS) {
    md += `| ${s.name} | ${s.id} | ${s.shortName} |\n`;
  }
  md += "\n## 属性调整值表\n\n";
  md += "| 属性值 | 调整值 |\n|--------|--------|\n";
  for (let score = 1; score <= 30; score++) {
    md += `| ${score} | ${getAbilityModifier(score) >= 0 ? "+" : ""}${getAbilityModifier(score)} |\n`;
  }
  md += "\n## 购点法\n\n";
  md += `总点数：${POINT_BUY_TOTAL} 点。所有属性初始为 8，消耗点数提升。\n\n`;
  md += "| 目标值 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |\n|--------|---|---|----|----|----|----|----|----|\n";
  md += `| 消耗 | ${[8,9,10,11,12,13,14,15].map(v => POINT_BUY_COST[v]).join(" | ")} |\n\n`;
  md += "属性值范围：8-15（不含种族加成）。种族加成在购点完成后叠加。\n";
  write("ability-scores.md", md);
}

console.log("Generating rules corpus...");
formatRaces();
formatClasses();
formatSubclasses();
formatSkills();
formatBackgrounds();
formatEquipment();
formatAbilityScores();
console.log("Done!");
