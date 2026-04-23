export const SKILLS = [
  { id: "athletics", name: "运动", stat: "str" },

  { id: "acrobatics", name: "体操", stat: "dex" },
  { id: "sleight_of_hand", name: "巧手", stat: "dex" },
  { id: "stealth", name: "隐匿", stat: "dex" },

  { id: "arcana", name: "奥秘", stat: "int" },
  { id: "history", name: "历史", stat: "int" },
  { id: "investigation", name: "调查", stat: "int" },
  { id: "nature", name: "自然", stat: "int" },
  { id: "religion", name: "宗教", stat: "int" },

  { id: "animal_handling", name: "驯兽", stat: "wis" },
  { id: "insight", name: "洞悉", stat: "wis" },
  { id: "medicine", name: "医药", stat: "wis" },
  { id: "perception", name: "察觉", stat: "wis" },
  { id: "survival", name: "求生", stat: "wis" },

  { id: "deception", name: "欺瞒", stat: "cha" },
  { id: "intimidation", name: "威吓", stat: "cha" },
  { id: "performance", name: "表演", stat: "cha" },
  { id: "persuasion", name: "游说", stat: "cha" }
];

export const SKILL_IDS = SKILLS.map(skill => skill.id);

export const SKILL_MAP = Object.fromEntries(
  SKILLS.map(skill => [skill.id, skill])
);

export const SKILLS_BY_STAT = Object.fromEntries(
  ["str", "dex", "con", "int", "wis", "cha"].map(statId => [
    statId,
    SKILLS.filter(skill => skill.stat === statId)
  ])
);

export const EMPTY_SKILL_PROFICIENCIES = Object.fromEntries(
  SKILL_IDS.map(id => [id, false])
);