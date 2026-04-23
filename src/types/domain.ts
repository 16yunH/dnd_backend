export type StatId = "str" | "dex" | "con" | "int" | "wis" | "cha";

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CharacterBasic {
  name: string;
  race: string;
  charClass: string;
  background: string;
  level: number;
  customPortrait?: string;
}

export interface CharacterInput {
  basic: CharacterBasic;
  statMethod: "pointBuy" | "roll";
  baseStats: AbilityScores;
  proficiencies: {
    skills: Record<string, boolean>;
  };
  equipment: {
    armor: string;
    shield: boolean;
    weapons: string;
  };
  spells: string;
  specialAttrs: string;
}

export interface DerivedStats {
  profBonus: number;
  initiative: number;
  ac: number;
  hp: number;
  spellDC: number;
  passivePerception: number;
  finalStats: AbilityScores;
  modifiers: AbilityScores;
}

export interface CharacterRecord extends CharacterInput {
  id: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  derived: DerivedStats;
}

export interface UserRecord {
  id: string;
  nickname: string;
  createdAt: string;
}

export type RoomState = "waiting" | "playing" | "ended";

export interface RoomConfig {
  maxPlayers: number;
  isPrivate: boolean;
  password: string;
  expansion: string;
  campaign: string;
}

export interface RoomPlayer {
  id: string;
  userId: string;
  username: string;
  isReady: boolean;
  characterId: string | null;
  joinedAt: string;
}

export interface RoomRecord {
  id: string;
  inviteCode: string;
  hostUserId: string;
  state: RoomState;
  roomVersion: number;
  config: RoomConfig;
  players: RoomPlayer[];
  createdAt: string;
  updatedAt: string;
}

export type RoomMessageRole = "system" | "dm" | "player";

export interface RoomMessageRecord {
  id: string;
  roomId: string;
  seq: number;
  role: RoomMessageRole;
  senderUserId?: string;
  senderName?: string;
  content: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface DbFile {
  users: UserRecord[];
  characters: CharacterRecord[];
  rooms: RoomRecord[];
  roomMessages: RoomMessageRecord[];
  roomSeqById: Record<string, number>;
}
