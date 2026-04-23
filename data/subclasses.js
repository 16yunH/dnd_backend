const F = (id, name, desc, extra = {}) => ({ id, name, desc, ...extra });

const levelFeatures = (featuresByLevel) =>
  Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => [
      index + 1,
      featuresByLevel[index + 1] || []
    ])
  );

export const SUBCLASSES = [
  {
    id: "berserker",
    classId: "barbarian",
    name: "狂战士之道",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 3,
    features: levelFeatures({
      3: [
        F(
          "frenzy",
          "狂乱",
          "当你进入狂暴时，可以选择同时进入狂乱。若如此做，则在该次狂暴持续期间，你可以在自己每个回合用附赠动作额外进行一次近战武器攻击；但当这次狂暴结束时，你会承受 1 级力竭。"
        )
      ],
      6: [
        F(
          "mindless_rage",
          "无心狂怒",
          "当你处于狂暴中时，你免疫魅惑与恐惧。若你在进入狂暴前已处于魅惑或恐惧状态，则该效果在狂暴期间被压制，待狂暴结束后恢复。"
        )
      ],
      10: [
        F(
          "intimidating_presence",
          "威吓气势",
          "你可以用动作威慑 30 尺内一个能看见你的生物，迫使其进行感知豁免；失败则在下个回合结束前对你陷入恐惧。你可以在之后的回合继续用动作维持此效果，目标也可在其回合结束时再次豁免。"
        )
      ],
      14: [
        F(
          "retaliation",
          "报复反击",
          "当一个位于你 5 尺内且你能看见的生物对你造成伤害时，你可以用反应立刻对其进行一次近战武器攻击。"
        )
      ]
    })
  },

  {
    id: "college_of_lore",
    classId: "bard",
    name: "学识学院",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 3,
    features: levelFeatures({
      3: [
        F(
          "bonus_proficiencies",
          "额外熟练",
          "你额外获得任意 3 项技能熟练。"
        ),
        F(
          "cutting_words",
          "讥刺之语",
          "当你看见的一个生物在 60 尺内进行攻击检定、属性检定或伤害掷骰时，你可以用反应消耗一次吟游激励，对其掷出的结果减去你的吟游激励骰。该生物必须能听见你，且不能免疫魅惑。"
        )
      ],
      6: [
        F(
          "additional_magical_secrets",
          "额外魔法秘密",
          "从任意职业的法术列表中再学会 2 个你能够施放环阶的法术（或戏法）。这些法术视为吟游诗人法术，且不计入你已知吟游诗人法术数量。"
        )
      ],
      14: [
        F(
          "peerless_skill",
          "无双技艺",
          "当你进行一次属性检定时，可以消耗一次吟游激励，把吟游激励骰加到这次检定上。你可以在看到 d20 结果后、知道成败前再决定是否使用。"
        )
      ]
    })
  },

  {
    id: "life_domain",
    classId: "cleric",
    name: "生命领域",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 1,
    alwaysPreparedSpellsByLevel: {
      1: ["祝福术", "治疗伤口"],
      3: ["次级复原术", "灵体武器"],
      5: ["希望信标", "回生术"],
      7: ["防死结界", "信仰守卫"],
      9: ["群体治疗伤口", "死者复活术"]
    },
    features: levelFeatures({
      1: [
        F(
          "bonus_proficiency",
          "额外熟练",
          "你获得重甲熟练。"
        ),
        F(
          "disciple_of_life",
          "生命门徒",
          "当你用 1 环或更高环位的法术为生物恢复生命值时，该生物额外恢复 2 + 法术环阶 的生命值。"
        )
      ],
      2: [
        F(
          "preserve_life",
          "引导神力：保全生命",
          "你可以用动作展示圣徽并引导治愈能量，恢复总计等于 5 × 牧师等级 的生命值，并将这些生命值分配给 30 尺内任意生物。该能力不能把目标恢复到其生命值上限的一半以上，且不能治疗不死生物或构装生物。"
        )
      ],
      6: [
        F(
          "blessed_healer",
          "祝福疗愈者",
          "当你以 1 环或更高法术为其他生物恢复生命值时，你自己也恢复 2 + 法术环阶 的生命值。"
        )
      ],
      8: [
        F(
          "divine_strike",
          "神圣打击",
          "你每回合一次用武器攻击命中时，可额外造成 1d8 光耀伤害。到 14 级时，该额外伤害提升为 2d8。"
        )
      ],
      17: [
        F(
          "supreme_healing",
          "至上治疗",
          "当你用法术恢复生命值时，凡是本应掷出的治疗骰都改为取最大值。"
        )
      ]
    })
  },

  {
    id: "circle_of_the_moon",
    classId: "druid",
    name: "月之结社",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 2,
    progression: {
      circleFormsMaxCrFormula: "2级起可变形成 CR 1 野兽；6级起改为 CR = floor(druid_level / 3)",
      elementalWildShapeForms: ["气元素", "土元素", "火元素", "水元素"]
    },
    features: levelFeatures({
      2: [
        F(
          "combat_wild_shape",
          "战斗野形",
          "你可以用附赠动作而非动作发动野形态。此外，当你处于野形态时，可用附赠动作消耗一个法术位，为自己恢复 1d8 × 法术环阶 的生命值。"
        ),
        F(
          "circle_forms",
          "结社形态",
          "你可通过野形态变形成挑战等级更高的野兽：2 级时最高 CR 1，且仍不能飞行或游泳；6 级起可变形成最高 CR 等于你德鲁伊等级三分之一（向下取整）的野兽。"
        )
      ],
      6: [
        F(
          "primal_strike",
          "原始打击",
          "你在野形态下的兽形攻击，在克服对非魔法攻击和伤害的抗性与免疫时，视为魔法攻击。"
        )
      ],
      10: [
        F(
          "elemental_wild_shape",
          "元素野形",
          "你可以一次消耗 2 次野形态使用次数，将自己变形成气、土、火或水元素。"
        )
      ],
      14: [
        F(
          "thousand_forms",
          "千面万相",
          "你可以随意施放变身术（alter self），且无需消耗法术位。"
        )
      ]
    })
  },

  {
    id: "champion",
    classId: "fighter",
    name: "冠军",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 3,
    features: levelFeatures({
      3: [
        F(
          "improved_critical",
          "强化重击",
          "你的武器攻击在 d20 掷出 19 或 20 时便会造成重击。"
        )
      ],
      7: [
        F(
          "remarkable_athlete",
          "卓越运动员",
          "凡是你未加入熟练加值的力量、敏捷、体质检定，都可以加入一半熟练加值（向上取整）。此外，你进行助跑跳远时，距离额外增加等于你力量调整值的尺数。"
        )
      ],
      10: [
        F(
          "additional_fighting_style",
          "额外战斗风格",
          "你再从战斗风格特性中选择一种战斗风格。"
        )
      ],
      15: [
        F(
          "superior_critical",
          "高等重击",
          "你的武器攻击在 d20 掷出 18–20 时都会造成重击。"
        )
      ],
      18: [
        F(
          "survivor",
          "幸存者",
          "在你的每个回合开始时，若你生命值不高于一半且仍大于 0，则恢复 5 + 体质调整值 的生命值。"
        )
      ]
    })
  },

  {
    id: "way_of_the_open_hand",
    classId: "monk",
    name: "散手之道",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 3,
    features: levelFeatures({
      3: [
        F(
          "open_hand_technique",
          "散手技法",
          "当你使用连击并以其中一次攻击命中目标时，可额外施加以下一种效果：令目标敏捷豁免失败则倒地；令目标力量豁免失败则被你推开 15 尺；或令其直到你下回合结束前无法进行反应。"
        )
      ],
      6: [
        F(
          "wholeness_of_body",
          "身心如一",
          "你可以用动作恢复等于 3 × 武僧等级 的生命值。使用一次后需完成长休才能再次使用。"
        )
      ],
      11: [
        F(
          "tranquility",
          "宁静",
          "每当你完成一次长休后，获得一个等同于 sanctuary 的效果，持续到你下一次长休开始，或按该法术的通常方式提前结束。其豁免 DC 为 8 + 熟练加值 + 感知调整值。"
        )
      ],
      17: [
        F(
          "quivering_palm",
          "震颤掌",
          "当你以徒手打击命中一个生物时，可消耗 3 点气在其体内埋入无形震动，持续天数等于你的武僧等级。之后你可用动作引爆该震动：目标进行体质豁免，失败则生命值直接降为 0，成功则改为承受 10d10 死灵伤害。你同一时间只能维持一个目标上的此效果。"
        )
      ]
    })
  },

  {
    id: "oath_of_devotion",
    classId: "paladin",
    name: "奉献誓言",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 3,
    alwaysPreparedSpellsByLevel: {
      3: ["防护善恶", "圣域术"],
      5: ["次级复原术", "真言区域"],
      9: ["希望信标", "解除魔法"],
      13: ["行动自如", "信仰守卫"],
      17: ["通神术", "焰击术"]
    },
    features: levelFeatures({
      3: [
        F(
          "sacred_weapon",
          "引导神力：圣武器",
          "你可以用动作为手中的一把武器灌注神圣能量，持续 1 分钟。期间你以该武器进行的攻击检定获得等于魅力调整值的加值（至少 +1），武器会发光，若其原本不是魔法武器，则在持续期间视为魔法武器。"
        ),
        F(
          "turn_the_unholy",
          "引导神力：驱斥亵渎",
          "你可以用动作展示圣徽并驱斥 30 尺内能看见或听见你的邪魔与不死生物。目标进行感知豁免，失败则被驱斥 1 分钟或直到受到伤害。"
        )
      ],
      7: [
        F(
          "aura_of_devotion",
          "奉献灵光",
          "只要你保持意识，你与 10 尺内友方生物都不会陷入魅惑状态。18 级时范围提升至 30 尺。"
        )
      ],
      15: [
        F(
          "purity_of_spirit",
          "灵魂纯净",
          "你始终处于 protection from evil and good 的效果之下。"
        )
      ],
      20: [
        F(
          "holy_nimbus",
          "神圣辉光",
          "你可以用动作让自己放射神圣日光，持续 1 分钟。期间 30 尺内明亮光照、其外 30 尺昏暗光照；敌人在明亮光照区域内开始回合时承受 10 点光耀伤害，且你对邪魔或不死生物施放法术所造成的效果更具压制性。使用后需完成长休才能再次使用。"
        )
      ]
    })
  },

  {
    id: "hunter",
    classId: "ranger",
    name: "猎人",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 3,
    features: levelFeatures({
      3: [
        F(
          "hunters_prey",
          "猎手猎物",
          "3 级时从下列选项中选择 1 个。",
          {
            choices: [
              {
                id: "colossus_slayer",
                name: "巨像屠戮",
                desc: "当你以武器攻击命中一个已受伤的生物时，可额外造成 1d8 伤害。每回合仅一次。"
              },
              {
                id: "giant_killer",
                name: "巨人杀手",
                desc: "当一个大型或更大体型、位于你 5 尺内且你看得见的生物攻击你后，你可用反应立刻对其进行一次攻击。"
              },
              {
                id: "horde_breaker",
                name: "破群者",
                desc: "你每回合一次在以武器攻击一个目标后，可对另一个位于原目标 5 尺内、且仍在武器射程内的生物再进行一次攻击。"
              }
            ]
          }
        )
      ],
      7: [
        F(
          "defensive_tactics",
          "防御战术",
          "7 级时从下列选项中选择 1 个。",
          {
            choices: [
              {
                id: "escape_the_horde",
                name: "脱离蜂群",
                desc: "对你进行的借机攻击具有劣势。"
              },
              {
                id: "multiattack_defense",
                name: "多重攻击防御",
                desc: "当一个生物以攻击命中你后，在该回合剩余时间里，它对你后续的攻击检定都承受 -4。"
              },
              {
                id: "steel_will",
                name: "钢铁意志",
                desc: "你对抗恐惧的豁免具有优势。"
              }
            ]
          }
        )
      ],
      11: [
        F(
          "multiattack",
          "多重攻击",
          "11 级时从下列选项中选择 1 个。",
          {
            choices: [
              {
                id: "volley",
                name: "齐射",
                desc: "你可以用动作，对武器射程内一个可见点周围 10 尺内任意数量的生物各进行一次远程攻击；每个目标分别掷攻击检定。"
              },
              {
                id: "whirlwind_attack",
                name: "旋风攻击",
                desc: "你可以用动作，对 5 尺内任意数量的生物各进行一次近战攻击；每个目标分别掷攻击检定。"
              }
            ]
          }
        )
      ],
      15: [
        F(
          "superior_hunters_defense",
          "高等猎手防御",
          "15 级时从下列选项中选择 1 个。",
          {
            choices: [
              {
                id: "evasion",
                name: "闪避反射",
                desc: "当你进行敏捷豁免以承受半伤效果时，成功则不受伤害，失败则只受一半伤害。"
              },
              {
                id: "stand_against_the_tide",
                name: "借力反击",
                desc: "当一个敌对生物近战攻击未命中你时，你可以用反应迫使它对你指定的另一目标重复这次攻击。"
              },
              {
                id: "uncanny_dodge",
                name: "直觉闪避",
                desc: "当一个你看见的攻击者命中你时，你可以用反应将这次攻击对你造成的伤害减半。"
              }
            ]
          }
        )
      ]
    })
  },

  {
    id: "thief",
    classId: "rogue",
    name: "窃贼",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 3,
    features: levelFeatures({
      3: [
        F(
          "fast_hands",
          "快手",
          "你可以把灵巧动作提供的附赠动作，用来进行巧手检定、使用盗贼工具拆除陷阱或开锁，或执行 Use an Object 动作。"
        ),
        F(
          "second_story_work",
          "飞檐走壁",
          "你攀爬不再额外消耗移动；而且助跑跳跃时，跳跃距离额外增加等于你敏捷调整值的尺数。"
        )
      ],
      9: [
        F(
          "supreme_sneak",
          "高等潜行",
          "若你在同一回合中的移动速度不超过一半，则你进行敏捷（隐匿）检定具有优势。"
        )
      ],
      13: [
        F(
          "use_magic_device",
          "使用魔法装置",
          "你忽略职业、种族、等级以及法术要求对魔法物品的使用限制。"
        )
      ],
      17: [
        F(
          "thiefs_reflexes",
          "盗贼反射",
          "在每场战斗的第一轮中，你会在正常先攻值和先攻值 -10 各行动一次；若你措手不及，则无法获得该额外回合。"
        )
      ]
    })
  },

  {
    id: "draconic_bloodline",
    classId: "sorcerer",
    name: "龙脉血统",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 1,
    options: {
      dragonAncestor: [
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
    },
    features: levelFeatures({
      1: [
        F(
          "dragon_ancestor",
          "龙族先祖",
          "选择一种龙作为你的血脉源头。你获得龙语的说、读、写能力；当你与龙互动并进行魅力检定时，若你已具有该检定的熟练，则你的熟练加值翻倍。后续特性所涉及的伤害类型也由此决定。"
        ),
        F(
          "draconic_resilience",
          "龙脉韧性",
          "你的生命值上限增加 1，并在此后每提升 1 级术士再额外增加 1。若你未穿护甲，则 AC 变为 13 + 敏捷调整值。"
        )
      ],
      6: [
        F(
          "elemental_affinity",
          "元素亲和",
          "当你施展一个造成与你龙脉对应伤害类型相同的法术时，可将魅力调整值加到其中一次伤害掷骰上；同时你可以花费 1 点源力点，在 1 小时内获得对此伤害类型的抗性。"
        )
      ],
      14: [
        F(
          "dragon_wings",
          "龙翼",
          "你可以用附赠动作从背后生出一对龙翼，并获得等于当前速度的飞行速度；用附赠动作可将其收回。"
        )
      ],
      18: [
        F(
          "draconic_presence",
          "龙威",
          "你可以花费 5 点源力点，用动作释放龙族威压，在 60 尺内制造敬畏或恐惧灵光（由你选择），持续 1 分钟并需要专注。范围内敌对生物每当首次进入或在回合开始时，需进行感知豁免，失败则陷入被魅惑或恐惧状态。"
        )
      ]
    })
  },

  {
    id: "the_fiend",
    classId: "warlock",
    name: "邪魔宗主",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 1,
    expandedSpellsBySpellLevel: {
      1: ["燃烧之手", "命令术"],
      2: ["目盲/耳聋术", "灼热射线"],
      3: ["火球术", "臭云术"],
      4: ["火焰护盾", "火墙术"],
      5: ["焰击术", "圣居术"]
    },
    features: levelFeatures({
      1: [
        F(
          "dark_ones_blessing",
          "黑暗之主的恩赐",
          "当你将一个敌对生物的生命值降至 0 时，你获得临时生命值，数值等于你的魅力调整值 + 邪术师等级（至少为 1）。"
        )
      ],
      6: [
        F(
          "dark_ones_own_luck",
          "黑暗之主的好运",
          "当你进行属性检定或豁免时，可以在看到原始掷骰后、结果生效前额外加上 1d10。使用后需完成一次短休或长休才能再次使用。"
        )
      ],
      10: [
        F(
          "fiendish_resilience",
          "邪魔韧性",
          "每次短休或长休结束时，选择一种伤害类型；直到你再次更换前，你对该伤害类型具有抗性。魔法武器和银制武器造成的伤害会无视此抗性。"
        )
      ],
      14: [
        F(
          "hurl_through_hell",
          "投入地狱",
          "当你以攻击命中一个生物时，可将其瞬间放逐到下层位面。目标在你下个回合结束时返回原处或最近的未占据空间；若目标不是邪魔，则会因恐怖经历承受 10d10 心灵伤害。使用后需完成长休才能再次使用。"
        )
      ]
    })
  },

  {
    id: "school_of_evocation",
    classId: "wizard",
    name: "塑能学派",
    source: "Basic Rules 2014 / PHB 2014",
    selectAt: 2,
    features: levelFeatures({
      2: [
        F(
          "evocation_savant",
          "塑能专精",
          "将塑能法术抄录进法术书时，所需金钱和时间减半。"
        ),
        F(
          "sculpt_spells",
          "塑法",
          "当你施展一个会影响你看得见生物的塑能法术时，可以选择数量等于 1 + 法术环阶 的生物。被选中的生物会自动在该法术的豁免上成功，且若该法术成功豁免本会承受一半伤害，则这些生物改为完全不受伤害。"
        )
      ],
      6: [
        F(
          "potent_cantrip",
          "强效戏法",
          "当一个生物成功豁免你的伤害型戏法时，它仍会承受该戏法一半伤害，但不会受到额外效果。"
        )
      ],
      10: [
        F(
          "empowered_evocation",
          "强化塑能",
          "你施展法师塑能法术时，可以将智力调整值加到其中一次伤害掷骰上。"
        )
      ],
      14: [
        F(
          "overchannel",
          "过载施法",
          "当你施展一个 1–5 环且会造成伤害的法师法术时，可以令其伤害直接取最大值。每次长休中的第一次使用无副作用；若在同一次长休前再次使用，则你在施法后承受每法术环阶 2d12 的死灵伤害，之后每多用一次，每环阶伤害再增加 1d12。该伤害无视抗性与免疫。"
        )
      ]
    })
  }
];

export const SUBCLASS_IDS = SUBCLASSES.map(subclass => subclass.id);

export const SUBCLASS_MAP = Object.fromEntries(
  SUBCLASSES.map(subclass => [subclass.id, subclass])
);

export const SUBCLASSES_BY_CLASS = Object.fromEntries(
  Array.from(new Set(SUBCLASSES.map(subclass => subclass.classId))).map(classId => [
    classId,
    SUBCLASSES.filter(subclass => subclass.classId === classId)
  ])
);

export const SUBCLASS_NAME_MAP = Object.fromEntries(
  SUBCLASSES.map(subclass => [subclass.name, subclass])
);

export const getSubclassFeaturesUpToLevel = (subclassId, level) => {
  const subclass = SUBCLASS_MAP[subclassId];
  if (!subclass) return [];

  const results = [];
  for (let lv = 1; lv <= level; lv++) {
    const features = subclass.features[lv] || [];
    features.forEach(feature => {
      results.push({ level: lv, ...feature });
    });
  }
  return results;
};