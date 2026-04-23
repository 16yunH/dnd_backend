export const RACES = [
  {
    id: "human",
    name: "人类",
    abilityBonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    size: "中型",
    speed: 30,
    languages: ["通用语", "任选一种语言"],
    proficiencies: {
      skills: [],
      tools: [],
      weapons: [],
      armors: []
    },
    senses: {
      darkvision: 0
    },
    traits: [
      {
        id: "human_ability_score_increase",
        name: "属性值加成",
        desc: "你的全部属性值各加1。"
      }
    ],
    notes: {},
    subraces: []
  },
  {
    id: "elf",
    name: "精灵",
    abilityBonus: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
    size: "中型",
    speed: 30,
    languages: ["通用语", "精灵语"],
    proficiencies: {
      skills: ["perception"],
      tools: [],
      weapons: [],
      armors: []
    },
    senses: {
      darkvision: 60
    },
    traits: [
      {
        id: "darkvision",
        name: "黑暗视觉",
        desc: "你在黑暗和微光光照下拥有超常视力。微光下60尺内视为明亮光照，黑暗中60尺内视为微光光照。你无法在黑暗中分辨颜色，只能看到灰度的黑白画面。"
      },
      {
        id: "keen_senses",
        name: "敏锐感官",
        desc: "你拥有察觉技能的熟练项。"
      },
      {
        id: "fey_ancestry",
        name: "妖精血统",
        desc: "你进行对抗魅惑的豁免时具有优势，并且不会因魔法效应而陷入睡眠。"
      },
      {
        id: "trance",
        name: "出神",
        desc: "精灵不需要睡眠，而是以4小时冥想获得相当于人类8小时睡眠的休息效果。"
      }
    ],
    notes: {},
    subraces: []
  },
  {
    id: "dwarf",
    name: "矮人",
    abilityBonus: { str: 0, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    size: "中型",
    speed: 25,
    languages: ["通用语", "矮人语"],
    proficiencies: {
      skills: [],
      tools: ["铁匠工具", "酿酒工具", "石匠工具（任选其一）"],
      weapons: ["战斧", "手斧", "轻锤", "战锤"],
      armors: []
    },
    senses: {
      darkvision: 60
    },
    traits: [
      {
        id: "darkvision",
        name: "黑暗视觉",
        desc: "你习惯地下生活，在黑暗和微光环境下有良好视力。微光下60尺内视为明亮光照，黑暗中60尺内视为微光光照。你无法在黑暗中分辨颜色，只能看到灰度的黑白画面。"
      },
      {
        id: "dwarven_resilience",
        name: "矮人体魄",
        desc: "你进行对抗毒素的豁免时具有优势，并且拥有毒素伤害抗性。"
      },
      {
        id: "dwarven_combat_training",
        name: "矮人战斗训练",
        desc: "你具有战斧、手斧、轻锤和战锤的熟练项。"
      },
      {
        id: "tool_proficiency",
        name: "工具熟练项",
        desc: "你获得一个工匠工具的熟练项，从铁匠工具、酿酒工具或石匠工具中任选其一。"
      },
      {
        id: "stonecunning",
        name: "石中精妙",
        desc: "每当你对一件石制品的起源做智力（历史）检定时，你视为具有历史技能熟练，并可加入双倍熟练加值。"
      }
    ],
    notes: {
      speedRule: "你的速度不会因穿着重甲而减慢。"
    },
    subraces: []
  },
  {
    id: "halfling",
    name: "半身人",
    abilityBonus: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
    size: "小型",
    speed: 25,
    languages: ["通用语", "半身人语"],
    proficiencies: {
      skills: [],
      tools: [],
      weapons: [],
      armors: []
    },
    senses: {
      darkvision: 0
    },
    traits: [
      {
        id: "lucky",
        name: "幸运",
        desc: "当攻击检定、属性检定以及豁免检定掷出1时，你可以再重掷一次，但必须使用重掷的结果。"
      },
      {
        id: "brave",
        name: "勇气",
        desc: "你进行对抗恐慌的豁免时具有优势。"
      },
      {
        id: "halfling_nimbleness",
        name: "半身人灵巧",
        desc: "你可以穿越任何体型比你大的生物所在空间。"
      }
    ],
    notes: {},
    subraces: []
  },
  {
    id: "tiefling",
    name: "提夫林",
    abilityBonus: { str: 0, dex: 0, con: 0, int: 1, wis: 0, cha: 2 },
    size: "中型",
    speed: 30,
    languages: ["通用语", "炼狱语"],
    proficiencies: {
      skills: [],
      tools: [],
      weapons: [],
      armors: []
    },
    senses: {
      darkvision: 60
    },
    traits: [
      {
        id: "darkvision",
        name: "黑暗视觉",
        desc: "得益于炼狱先祖的遗传，你在黑暗和微光光照下有着超出常人的视力。"
      },
      {
        id: "hellish_resistance",
        name: "炎狱抗性",
        desc: "你对火焰伤害具有抗性。"
      },
      {
        id: "infernal_legacy",
        name: "地狱遗赠",
        desc: "你习得戏法奇术。3级后可免费施展一次炼狱叱喝，5级后可免费施展一次黑暗术；完成长休后恢复。其施法属性为魅力。"
      }
    ],
    notes: {
      innateSpells: [
        "戏法：奇术 thaumaturgy",
        "3级：炼狱叱喝 hellish rebuke（每长休一次）",
        "5级：黑暗术 darkness（每长休一次）",
        "施法属性：魅力"
      ]
    },
    subraces: []
  },
  {
    id: "dragonborn",
    name: "龙裔",
    abilityBonus: { str: 2, dex: 0, con: 0, int: 0, wis: 0, cha: 1 },
    size: "中型",
    speed: 30,
    languages: ["通用语", "龙语"],
    proficiencies: {
      skills: [],
      tools: [],
      weapons: [],
      armors: []
    },
    senses: {
      darkvision: 0
    },
    traits: [
      {
        id: "draconic_ancestry",
        name: "龙族血统",
        desc: "你拥有巨龙的血统。选择一个龙种，以决定你的吐息武器形式和伤害抗性。"
      },
      {
        id: "breath_weapon",
        name: "吐息武器",
        desc: "你可以用动作呼出破坏性能量。豁免 DC 为 8 + 体质调整值 + 熟练加值。初始伤害 2d6，6级为3d6，11级为4d6，16级为5d6。使用后需完成短休或长休才能再次使用。"
      },
      {
        id: "damage_resistance",
        name: "伤害抗性",
        desc: "你的龙族血统会赋予你对应伤害类型的抗性。"
      }
    ],
    notes: {},
    subraces: [],
    options: {
      draconicAncestry: [
        { id: "black", name: "黑龙", damageType: "强酸" },
        { id: "blue", name: "蓝龙", damageType: "闪电" },
        { id: "brass", name: "黄铜龙", damageType: "火焰" },
        { id: "bronze", name: "青铜龙", damageType: "闪电" },
        { id: "copper", name: "赤铜龙", damageType: "强酸" },
        { id: "gold", name: "金龙", damageType: "火焰" },
        { id: "green", name: "绿龙", damageType: "毒素" },
        { id: "red", name: "红龙", damageType: "火焰" },
        { id: "silver", name: "银龙", damageType: "寒冷" },
        { id: "white", name: "白龙", damageType: "寒冷" }
      ]
    }
  },
  {
    id: "gnome",
    name: "侏儒",
    abilityBonus: { str: 0, dex: 0, con: 0, int: 2, wis: 0, cha: 0 },
    size: "小型",
    speed: 25,
    languages: ["通用语", "侏儒语"],
    proficiencies: {
      skills: [],
      tools: [],
      weapons: [],
      armors: []
    },
    senses: {
      darkvision: 60
    },
    traits: [
      {
        id: "darkvision",
        name: "黑暗视觉",
        desc: "你习惯地下生活，在黑暗和微光光照下有良好视力。"
      },
      {
        id: "gnome_cunning",
        name: "侏儒狡黠",
        desc: "你进行对抗魔法的智力、感知和魅力豁免时具有优势。"
      }
    ],
    notes: {},
    subraces: []
  },
  {
  id: "half_elf",
  name: "半精灵",
  abilityBonus: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 2 },
  size: "中型",
  speed: 30,
  languages: ["通用语", "精灵语", "任选一种语言"],
  proficiencies: {
    skills: [],
    tools: [],
    weapons: [],
    armors: []
  },
  senses: {
    darkvision: 60
  },
  traits: [
    {
      id: "darkvision",
      name: "黑暗视觉",
      desc: "得益于你的精灵血统，你在黑暗和微光光照下拥有超常视力。微光下60尺内视为明亮光照，黑暗中60尺内视为微光光照。你无法在黑暗中分辨颜色，只能看到灰度的黑白画面。"
    },
    {
      id: "fey_ancestry",
      name: "妖精血统",
      desc: "你进行对抗魅惑的豁免时具有优势，并且不会因魔法效应而陷入睡眠。"
    },
    {
      id: "skill_versatility",
      name: "多才多艺",
      desc: "你获得两项自选技能的熟练项。"
    }
  ],
  notes: {},
  subraces: [],
  options: {
    flexibleAbilityBonus: {
      choose: 2,
      amount: 1,
      exclude: ["cha"]
    }
  }
},
  {
    id: "half_orc",
    name: "半兽人",
    abilityBonus: { str: 2, dex: 0, con: 1, int: 0, wis: 0, cha: 0 },
    size: "中型",
    speed: 30,
    languages: ["通用语", "兽人语"],
    proficiencies: {
      skills: ["intimidation"],
      tools: [],
      weapons: [],
      armors: []
    },
    senses: {
      darkvision: 60
    },
    traits: [
      {
        id: "darkvision",
        name: "黑暗视觉",
        desc: "得益于你的兽人血统，你在黑暗和微光光照下有超出常人的视力。"
      },
      {
        id: "menacing",
        name: "凶恶",
        desc: "你获得威吓技能的熟练项。"
      },
      {
        id: "relentless_endurance",
        name: "坚韧不屈",
        desc: "当你生命值降至0而没有立即死亡时，可以改为降至1。此特质生效后必须完成一次长休后才能再次使用。"
      },
      {
        id: "savage_attacks",
        name: "凶蛮攻击",
        desc: "使用近战武器攻击造成重击时，你可以额外掷一个该武器的伤害骰，并将其数值加入重击额外伤害。"
      }
    ],
    notes: {},
    subraces: []
  }
];

export const RACE_MAP = Object.fromEntries(
  RACES.map(race => [race.id, race])
);