import { STATS } from "../../data/stats.js";
import {
  POINT_BUY_COST,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  POINT_BUY_TOTAL,
  DEFAULT_POINT_BUY_STATS,
  POINT_BUY_PRESETS
} from "../../data/pointBuy.js";
import { RACES } from "../../data/races.js";
import { CLASSES } from "../../data/class.js";
import { SUBCLASSES } from "../../data/subclasses.js";
import { BACKGROUNDS } from "../../data/background.js";
import { SKILLS } from "../../data/skills.js";
import { ARMOURS } from "../../data/armour.js";
import { WEAPONS } from "../../data/weapon.js";

const SKILL_ALIAS: Record<string, string> = {
  sleightOfHand: "sleight_of_hand",
  animalHandling: "animal_handling"
};

const ARMOR_ALIAS: Record<string, string> = {
  studded: "studded_leather",
  scale: "scale_mail"
};

const normalizeSkillId = (value: string): string => SKILL_ALIAS[value] ?? value;

const normalizeBackgrounds = () => {
  return BACKGROUNDS.map((background: any) => {
    const rawSkills = background.proficiencies?.skills ?? [];
    return {
      ...background,
      proficiencies: {
        ...background.proficiencies,
        skills: rawSkills.map(normalizeSkillId)
      },
      rawProficiencies: background.proficiencies
    };
  });
};

export class RulesDataService {
  public readonly version = "v1_5e_basic_cn";

  private readonly races: any[] = RACES as any[];
  private readonly classes: any[] = CLASSES as any[];
  private readonly armours: any[] = ARMOURS as any[];

  private findByIdOrName(
    list: any[],
    value: string | undefined
  ): any | undefined {
    if (!value) {
      return undefined;
    }
    return list.find((item) => item.id === value || item.name === value);
  }

  public findRace(value: string | undefined) {
    return this.findByIdOrName(this.races, value);
  }

  public findClass(value: string | undefined) {
    return this.findByIdOrName(this.classes, value);
  }

  public findArmor(value: string | undefined) {
    if (!value || value === "none") {
      return undefined;
    }
    const normalized = ARMOR_ALIAS[value] ?? value;
    return this.findByIdOrName(this.armours, normalized);
  }

  public getBootstrapPayload() {
    return {
      rulesVersion: this.version,
      stats: STATS,
      skills: SKILLS,
      races: RACES,
      classes: CLASSES,
      subclasses: SUBCLASSES,
      backgrounds: normalizeBackgrounds(),
      armours: ARMOURS,
      weapons: WEAPONS,
      pointBuy: {
        min: POINT_BUY_MIN,
        max: POINT_BUY_MAX,
        total: POINT_BUY_TOTAL,
        cost: POINT_BUY_COST,
        defaults: DEFAULT_POINT_BUY_STATS,
        presets: POINT_BUY_PRESETS
      }
    };
  }
}
