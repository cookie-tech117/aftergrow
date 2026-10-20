"use client";

export const dynamic = "force-static";

import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sparkles, useGLTF } from "@react-three/drei";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Onboarding from "./onboarding/Onboarding";
import { starterPlan } from "./onboarding/flow";
import HomeDashboard from "./home/HomeDashboard";
import GroupHub from "./group/GroupHub";
import TalkWithLin from "./wellbeing/TalkWithLin";
import Diary from "./wellbeing/Diary";
import type { DiaryView } from "./wellbeing/model";
import HomeWeatherLighting from "./home/HomeWeatherLighting";
import { nextWeather } from "./home/weather";
import IslandAssetEditor, {
  BaseIslandPreviewScene,
  readSavedBaseDecorations,
  type PlacedAsset,
} from "./scene-test/IslandAssetEditor";

const SITE_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteAsset = (path: string) => `${SITE_BASE_PATH}${path}`;

type TabId = "home" | "group" | "talk" | "island" | "journal" | "profile";
type RecoveryOrigin = "home" | "group" | "talk" | "journal";
type IslandId = "beach" | "snow" | "forest" | "meadow";
type RewardId =
  | "surfboard" | "shell" | "starfish" | "lounger" | "parasol" | "palm" | "tropical_plant" | "bottle"
  | "beach_bag" | "beach_blanket" | "camper_van"
  | "snowboard" | "skis" | "ski_poles" | "snowman" | "fire_bowl" | "snow_pine" | "ice_lantern" | "cocoa"
  | "backpack" | "hiking_poles" | "tent" | "campfire" | "fir_tree" | "mushrooms" | "camp_lantern" | "flowerpot"
  | "bicycle" | "water_bottle" | "bench" | "picnic_blanket" | "small_tree" | "flowers" | "potted_plant" | "night_light";
type WeatherId = "sunrise" | "sunny" | "rain" | "snow" | "fog" | "night";
type ChatRole = "lin" | "user";
type InventoryFilter = "all" | "gear" | "nature" | "comfort";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type PlacedItem = {
  id: string;
  type: RewardId;
  island: IslandId;
  x: number;
  z: number;
  rotation: number;
};

type SessionRecord = {
  id: string;
  date: string;
  mood: string;
  focus: string;
  reward: RewardId;
  exp?: number;
  createdAt?: number;
  goalId?: string;
  minutes?: number;
};

type Inventory = Record<RewardId, number>;

type PersonalizationProfile = {
  displayName: string;
  activity: string;
  postActivity: string;
  currentState: string;
  support: string;
  dailyTime: string;
  checkInTime: string;
};

type SaveData = {
  inventory: Inventory;
  placedItems: PlacedItem[];
  sessions: SessionRecord[];
  weather: WeatherId;
  island: IslandId;
  dailyGoals?: { date: string; completed: string[] };
};

const HOME_PARTICLES = [
  [8, 28, 6, 4.8, -1.1], [15, 58, 4, 5.6, -3.4], [24, 19, 5, 4.2, -0.8],
  [28, 73, 7, 6.1, -2.7], [38, 31, 4, 4.6, -1.9], [44, 14, 6, 5.3, -4.2],
  [50, 55, 5, 4.1, -2.2], [57, 76, 4, 5.8, -0.5], [63, 23, 7, 4.9, -3.1],
  [70, 46, 4, 5.1, -1.4], [76, 67, 6, 4.4, -2.5], [84, 22, 5, 6.3, -4.8],
  [90, 42, 7, 5.5, -1.7], [87, 76, 4, 4.3, -3.7], [11, 79, 5, 5.9, -2.9],
  [21, 43, 4, 4.7, -0.2], [34, 55, 6, 5.2, -4.5], [68, 80, 5, 4.5, -2.1],
] as const;

const REWARDS: Record<
  RewardId,
  { name: string; subtitle: string; note: string; icon: string; color: string; island: IslandId; category: Exclude<InventoryFilter, "all"> }
> = {
  surfboard: { name: "Sunrise Surfboard", subtitle: "Beach gear", note: "A bright reminder that every wave eventually settles.", icon: "🏄", color: "#ee7b59", island: "beach", category: "gear" },
  shell: { name: "Quiet Shell", subtitle: "Shore treasure", note: "A small place to keep a calm thought.", icon: "🐚", color: "#f2b696", island: "beach", category: "nature" },
  starfish: { name: "Tide Star", subtitle: "Shore treasure", note: "Five gentle points of light from the waterline.", icon: "★", color: "#ef8b63", island: "beach", category: "nature" },
  lounger: { name: "Resting Lounger", subtitle: "Beach comfort", note: "Permission to stop, breathe, and let the day be enough.", icon: "▰", color: "#66b7bd", island: "beach", category: "comfort" },
  parasol: { name: "Coral Parasol", subtitle: "Beach comfort", note: "A soft pocket of shade for slower moments.", icon: "☂", color: "#f07366", island: "beach", category: "comfort" },
  palm: { name: "Little Palm", subtitle: "Tropical nature", note: "A resilient tree that bends without breaking.", icon: "🌴", color: "#68a764", island: "beach", category: "nature" },
  tropical_plant: { name: "Tropical Planter", subtitle: "Tropical nature", note: "New growth, gathered in one warm corner.", icon: "🪴", color: "#78ae67", island: "beach", category: "nature" },
  bottle: { name: "Drift Bottle", subtitle: "Beach memory", note: "A message can wait safely until you are ready.", icon: "⌁", color: "#72b7c8", island: "beach", category: "gear" },
  beach_bag: { name: "Daytrip Bag", subtitle: "Beach gear", note: "Carry only what makes the day feel lighter.", icon: "▣", color: "#9b6546", island: "beach", category: "gear" },
  beach_blanket: { name: "Blue Tide Blanket", subtitle: "Beach comfort", note: "A soft place to pause beside the water.", icon: "▦", color: "#5798c9", island: "beach", category: "comfort" },
  camper_van: { name: "Coral Camper", subtitle: "Beach landmark", note: "A tiny moving home for slow coastal adventures.", icon: "▰", color: "#e86753", island: "beach", category: "comfort" },

  snowboard: { name: "Aurora Snowboard", subtitle: "Snow gear", note: "A clean line through fresh snow.", icon: "▱", color: "#df6e76", island: "snow", category: "gear" },
  skis: { name: "Twin Skis", subtitle: "Snow gear", note: "Two steady tracks moving in the same direction.", icon: "Ⅱ", color: "#699ac3", island: "snow", category: "gear" },
  ski_poles: { name: "Trail Poles", subtitle: "Snow gear", note: "Support for the next small step.", icon: "⌁", color: "#778ca3", island: "snow", category: "gear" },
  snowman: { name: "Friendly Snowman", subtitle: "Snow companion", note: "A quiet companion for bright winter days.", icon: "☃", color: "#d8ecf2", island: "snow", category: "comfort" },
  fire_bowl: { name: "Ember Bowl", subtitle: "Winter comfort", note: "Warmth held carefully in the cold.", icon: "♨", color: "#e88a49", island: "snow", category: "comfort" },
  snow_pine: { name: "Snow Pine", subtitle: "Winter nature", note: "Evergreen strength under a soft white layer.", icon: "▲", color: "#477b70", island: "snow", category: "nature" },
  ice_lantern: { name: "Ice Lantern", subtitle: "Winter light", note: "A clear light for a quiet night.", icon: "◇", color: "#92d4e4", island: "snow", category: "comfort" },
  cocoa: { name: "Warm Cocoa", subtitle: "Winter comfort", note: "Something warm to hold while feelings cool.", icon: "☕", color: "#a36c52", island: "snow", category: "comfort" },

  backpack: { name: "Trail Backpack", subtitle: "Forest gear", note: "Carry only what helps you continue.", icon: "🎒", color: "#bd6e48", island: "forest", category: "gear" },
  hiking_poles: { name: "Hiking Poles", subtitle: "Forest gear", note: "A little support makes steep ground kinder.", icon: "Ⅱ", color: "#8a6547", island: "forest", category: "gear" },
  tent: { name: "Safe Haven Tent", subtitle: "Forest shelter", note: "A place to pause without explaining or rushing anywhere.", icon: "⛺", color: "#e4a76e", island: "forest", category: "comfort" },
  campfire: { name: "Campfire", subtitle: "Forest comfort", note: "A shared glow for thoughts that need time.", icon: "♨", color: "#e87548", island: "forest", category: "comfort" },
  fir_tree: { name: "Forest Fir", subtitle: "Forest nature", note: "Deep roots, soft needles, steady growth.", icon: "▲", color: "#4f8660", island: "forest", category: "nature" },
  mushrooms: { name: "Mushroom Cluster", subtitle: "Forest nature", note: "Small lives appearing after rain.", icon: "♣", color: "#c87563", island: "forest", category: "nature" },
  camp_lantern: { name: "Camp Lantern", subtitle: "Forest light", note: "Enough light for the next few steps.", icon: "▣", color: "#e4bd69", island: "forest", category: "comfort" },
  flowerpot: { name: "Wildflower Pot", subtitle: "Forest nature", note: "A handful of color beside the trail.", icon: "✿", color: "#d58da2", island: "forest", category: "nature" },

  bicycle: { name: "Meadow Bicycle", subtitle: "Meadow gear", note: "Move at the pace that feels like yours.", icon: "🚲", color: "#6fa6a2", island: "meadow", category: "gear" },
  water_bottle: { name: "Water Bottle", subtitle: "Meadow gear", note: "A simple refill for body and mind.", icon: "◒", color: "#6eaec0", island: "meadow", category: "gear" },
  bench: { name: "Pause Bench", subtitle: "Meadow comfort", note: "A seat with no task attached.", icon: "▰", color: "#a77a50", island: "meadow", category: "comfort" },
  picnic_blanket: { name: "Picnic Blanket", subtitle: "Meadow comfort", note: "A soft square for unhurried afternoons.", icon: "▦", color: "#e49a84", island: "meadow", category: "comfort" },
  small_tree: { name: "Young Tree", subtitle: "Meadow nature", note: "Growth does not need to be rushed.", icon: "♧", color: "#73a75f", island: "meadow", category: "nature" },
  flowers: { name: "Meadow Flowers", subtitle: "Meadow nature", note: "Different colors can grow side by side.", icon: "✿", color: "#d88fab", island: "meadow", category: "nature" },
  potted_plant: { name: "Leafy Planter", subtitle: "Meadow nature", note: "Care becomes visible one leaf at a time.", icon: "🪴", color: "#6f9c65", island: "meadow", category: "nature" },
  night_light: { name: "Firefly Light", subtitle: "Meadow light", note: "A small glow is still enough to find home.", icon: "✦", color: "#e7c663", island: "meadow", category: "comfort" },
};

const PROVIDED_REWARD_COPY: Partial<Record<RewardId, { name: string; subtitle: string }>> = {
  shell: { name: "Shore Rock", subtitle: "Supplied beach model" },
  starfish: { name: "Beach Flower", subtitle: "Supplied nature model" },
  lounger: { name: "Coastal Blanket", subtitle: "Supplied beach model" },
  parasol: { name: "Tall Beach Palm", subtitle: "Supplied beach model" },
  snowboard: { name: "Snowy Peak", subtitle: "Supplied nature model" },
  skis: { name: "Winter Pine", subtitle: "Supplied nature model" },
  ski_poles: { name: "Bare Winter Tree", subtitle: "Supplied nature model" },
  snowman: { name: "Snowfield Rock", subtitle: "Supplied nature model" },
  fire_bowl: { name: "Winter Campfire", subtitle: "Supplied nature model" },
  ice_lantern: { name: "Ice Peak", subtitle: "Supplied nature model" },
  cocoa: { name: "Winter Bush", subtitle: "Supplied nature model" },
  hiking_poles: { name: "Forest Fence", subtitle: "Supplied nature model" },
  camp_lantern: { name: "Trail Log", subtitle: "Supplied nature model" },
  flowerpot: { name: "Flower Shrub", subtitle: "Supplied nature model" },
  bicycle: { name: "Meadow Tree", subtitle: "Supplied nature model" },
  bench: { name: "Resting Log", subtitle: "Supplied nature model" },
  night_light: { name: "Lily Pad Bloom", subtitle: "Supplied nature model" },
};

Object.entries(PROVIDED_REWARD_COPY).forEach(([id, copy]) => {
  if (copy) REWARDS[id as RewardId] = { ...REWARDS[id as RewardId], ...copy };
});

const REWARD_ORDER = Object.keys(REWARDS) as RewardId[];
const ISLANDS: Record<IslandId, { name: string; short: string; icon: string; top: string; side: string; water: string; accent: string }> = {
  beach: { name: "Tideglass Cay", short: "Beach", icon: "☀", top: "#edcf78", side: "#ba8252", water: "#6fc7c9", accent: "#ef8168" },
  snow: { name: "Stillpeak", short: "Snow", icon: "❄", top: "#d9edf0", side: "#89b4c4", water: "#87c8d6", accent: "#709ac9" },
  forest: { name: "Mosswood", short: "Forest", icon: "▲", top: "#6e9b59", side: "#6d543c", water: "#5f9ca0", accent: "#648c61" },
  meadow: { name: "Softfield", short: "Meadow", icon: "✿", top: "#a8c96a", side: "#98704c", water: "#76bfc4", accent: "#d58e78" },
};
const ISLAND_ORDER = Object.keys(ISLANDS) as IslandId[];
const REWARDS_BY_ISLAND = Object.fromEntries(
  ISLAND_ORDER.map((island) => [island, REWARD_ORDER.filter((id) => REWARDS[id].island === island)]),
) as Record<IslandId, RewardId[]>;
const ISLAND_TIMES: Array<{ id: WeatherId; label: string; icon: string }> = [
  { id: "sunrise", label: "Sunrise", icon: "◒" },
  { id: "sunny", label: "Sunny", icon: "☀" },
  { id: "rain", label: "Rain", icon: "☂" },
  { id: "snow", label: "Snow", icon: "❄" },
  { id: "fog", label: "Fog", icon: "≋" },
  { id: "night", label: "Night", icon: "☾" },
];
const EMPTY_INVENTORY = Object.fromEntries(REWARD_ORDER.map((id) => [id, 0])) as Inventory;
const SAVE_KEY = "heart-island-chat-v3";
const ONBOARDING_KEY = "afterglow-onboarding-svg-v1";
const HOME_TOUR_KEY = "heart-island-home-tour-v2";
const PERSONALIZATION_KEY = "heart-island-personalization-v1";

const EMPTY_PERSONALIZATION: PersonalizationProfile = {
  displayName: "",
  activity: "",
  postActivity: "",
  currentState: "",
  support: "",
  dailyTime: "",
  checkInTime: "",
};

const PERSONALIZED_HOME_COPY: Record<string, string> = {
  "Clear and calm": "Your energy feels steady today. Let’s protect that calm with one gentle step.",
  "Up and down a lot": "Your feelings can move like the weather. Let’s find one small moment of steadiness.",
  "Clear and focused": "Your energy feels steady today. Let’s protect that clarity with one gentle step.",
  "A little stressed": "Your island is holding a quieter space for you today. We can begin with one slow breath.",
  "Emotionally tired": "You do not need to push today. Let’s choose something small and restorative.",
  "Anxious or overwhelmed": "We can make the next moment simpler. Start with the smallest step that feels safe.",
  "Calm but unmotivated": "There is no need to rush. A tiny action can help your island begin moving again.",
  "Feeling strong": "You have some strength to work with today. Let’s use it without spending all of it.",
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "welcome-1", role: "lin", text: "Hi, I’m Lin. Nothing here needs to be solved right away." },
  { id: "welcome-2", role: "lin", text: "Tell me, which feeling feels closest to you right now?" },
];

const MOOD_RESPONSES: Record<string, string> = {
  "A little tired": "That sounds hard. Noticing your tiredness is already a way of caring for yourself.",
  "My mind feels messy": "We do not have to untangle everything. Let’s start with the thought that feels loudest.",
  "A little low": "Feeling low does not mean you did anything wrong. It may simply mean this matters to you.",
  "I just want to talk": "Of course. I’m here to listen, and your words do not have to come out perfectly.",
};

const BODY_RESPONSES: Record<string, string> = {
  "Neck & shoulders": "Let your shoulders settle, as if you were setting down what you carried today.",
  "Chest": "Place a hand gently on your chest. Nothing needs to change; just notice your breath passing through.",
  "Breathing": "Let’s slow the breath a little. It does not need to be deep, only comfortable.",
  "Hard to tell": "That is okay. Your body may know before words do. Let’s be still together for a few seconds.",
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Water({ weather, island = "meadow" }: { weather: WeatherId; island?: IslandId }) {
  const colors: Record<WeatherId, string> = {
    sunrise: "#efb49a",
    sunny: ISLANDS[island].water,
    snow: "#9bcfd9",
    fog: "#a8c2c0",
    night: "#35496d",
    rain: "#aebbb0",
  };

  return (
    <mesh position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[18, 64]} />
      <meshStandardMaterial color={colors[weather]} roughness={1} />
    </mesh>
  );
}

const BEACH_MODEL_URL = siteAsset("/models/058-beach.glb");
const TERRAIN_MODEL_URL = siteAsset("/models/terrain-blocks.glb");
const NATURE_MODEL_URL = siteAsset("/models/nature-decor.glb");
const BEACH_MODEL_NODES: Partial<Record<RewardId, string[]>> = {
  surfboard: ["Surf", "Surf001", "Surf002"],
  shell: ["Rock", "Rock001", "Rock002", "Rock003", "Rock004"],
  lounger: ["Blanket"],
  parasol: ["Palm", "Palm001"],
  palm: ["Palm", "Palm001"],
  bottle: ["Bottle"],
  beach_bag: ["Bag"],
  beach_blanket: ["Blanket"],
  camper_van: ["Van"],
  backpack: ["Bag"],
  water_bottle: ["Bottle"],
  picnic_blanket: ["Blanket"],
};
const BEACH_MODEL_SIZE: Partial<Record<RewardId, number>> = {
  surfboard: 1.8,
  shell: 0.72,
  lounger: 1.55,
  parasol: 2.9,
  palm: 2.9,
  bottle: 0.72,
  beach_bag: 0.92,
  beach_blanket: 1.55,
  camper_van: 2.9,
  backpack: 0.92,
  water_bottle: 0.72,
  picnic_blanket: 1.55,
};
const NATURE_MODEL_NODES: Partial<Record<RewardId, string[]>> = {
  starfish: ["flowerRed", "flowerWhite", "flowerBlue"],
  tropical_plant: ["plant4", "plant4_red", "plant3_purple"],
  snowboard: ["mountain", "mountain1", "mountain2", "mountain3"],
  skis: ["PineTree", "PineTree1", "PineTree2"],
  ski_poles: ["bareTree", "bareTree1", "bareTree2"],
  snowman: ["rock3", "rock4", "rock5", "rock6"],
  fire_bowl: ["Campfire"],
  snow_pine: ["PineTree1001", "PineTree1", "PineTree2"],
  ice_lantern: ["mountain", "mountain1", "rock4", "rock5"],
  cocoa: ["bush", "bush1", "bush2", "bush3"],
  hiking_poles: ["Fence", "Fence_Modular", "Fence_Modular1"],
  tent: ["tent", "tent1"],
  campfire: ["Campfire"],
  fir_tree: ["PineTree", "PineTree1", "PineTree2"],
  mushrooms: ["mushroom", "mushroom1", "mushroom2", "mushroom3", "mushroom4", "mushroom5", "mushroom6", "mushroom7"],
  camp_lantern: ["log1", "log2", "log3"],
  flowerpot: ["plant2_blue", "plant2_purple1", "plant2_red1", "shrubbery_Blue", "shrubbery_Red"],
  bicycle: ["tree", "tree1", "tree2", "tree3"],
  bench: ["log1", "log2", "log3"],
  small_tree: ["tree", "tree1", "tree2", "tree3", "tree4", "tree5", "tree6"],
  flowers: ["tulip_blue", "tulip_red", "tulip_white", "flowerBlue", "flowerRed", "flowerWhite"],
  potted_plant: ["plant", "plant1", "plant2_blue", "plant2_purple1", "plant2_red1"],
  night_light: ["LilyPadFlower", "LilyPadFlower2", "LilyPad", "LilyPad2"],
};
const NATURE_MODEL_SIZE: Partial<Record<RewardId, number>> = {
  starfish: 0.72,
  tropical_plant: 1.25,
  snowboard: 1.75,
  skis: 2.55,
  ski_poles: 1.8,
  snowman: 0.95,
  fire_bowl: 1.25,
  snow_pine: 2.75,
  ice_lantern: 1.1,
  cocoa: 0.9,
  hiking_poles: 1.55,
  tent: 2.25,
  campfire: 1.25,
  fir_tree: 2.7,
  mushrooms: 0.72,
  camp_lantern: 1.15,
  flowerpot: 1.05,
  bicycle: 2.45,
  bench: 1.35,
  small_tree: 2.6,
  flowers: 0.85,
  potted_plant: 1.1,
  night_light: 0.9,
};
const PROVIDED_MODEL_LIBRARY: Record<RewardId, "beach" | "nature"> = {
  surfboard: "beach", shell: "beach", starfish: "nature", lounger: "beach", parasol: "beach", palm: "beach",
  tropical_plant: "nature", bottle: "beach", beach_bag: "beach", beach_blanket: "beach", camper_van: "beach",
  snowboard: "nature", skis: "nature", ski_poles: "nature", snowman: "nature", fire_bowl: "nature",
  snow_pine: "nature", ice_lantern: "nature", cocoa: "nature", backpack: "beach", hiking_poles: "nature",
  tent: "nature", campfire: "nature", fir_tree: "nature", mushrooms: "nature", camp_lantern: "nature",
  flowerpot: "nature", bicycle: "nature", water_bottle: "beach", bench: "nature", picnic_blanket: "beach",
  small_tree: "nature", flowers: "nature", potted_plant: "nature", night_light: "nature",
};

type TerrainTileKind = "grass" | "sand" | "soil" | "stone" | "water" | "snow" | "ice";

const TERRAIN_TILE_SOURCE: Record<TerrainTileKind, string> = {
  grass: "立方体",
  sand: "立方体",
  soil: "立方体002",
  stone: "立方体005",
  water: "立方体005",
  snow: "立方体005",
  ice: "立方体006",
};
const MODULAR_GRID = [
  [-1, -2], [0, -2], [1, -2],
  [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
  [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
  [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
  [-1, 2], [0, 2], [1, 2],
] as const;
const TERRAIN_PATTERNS: Record<IslandId, TerrainTileKind[]> = {
  beach: ["sand", "water", "sand", "sand", "stone", "stone", "stone", "soil", "water", "stone", "stone", "stone", "sand", "sand", "stone", "stone", "stone", "water", "soil", "sand", "grass"],
  snow: ["snow", "ice", "snow", "ice", "stone", "stone", "stone", "snow", "snow", "stone", "stone", "stone", "ice", "snow", "stone", "stone", "stone", "snow", "ice", "snow", "snow"],
  forest: ["grass", "soil", "grass", "water", "stone", "stone", "stone", "grass", "soil", "stone", "stone", "stone", "grass", "grass", "stone", "stone", "stone", "water", "soil", "grass", "grass"],
  meadow: ["grass", "water", "grass", "soil", "stone", "stone", "stone", "grass", "grass", "stone", "stone", "stone", "water", "grass", "stone", "stone", "stone", "soil", "grass", "grass", "sand"],
};
const TERRAIN_PALETTES: Record<IslandId, Record<TerrainTileKind, string>> = {
  beach: { grass: "#b9cf4c", sand: "#efc45e", soil: "#9f613d", stone: "#eadbc2", water: "#78cbd0", snow: "#f6f3e8", ice: "#a9dce0" },
  snow: { grass: "#93b5a4", sand: "#d9d2bd", soil: "#76909a", stone: "#c5d4d5", water: "#72bccb", snow: "#f2faf8", ice: "#98d6e1" },
  forest: { grass: "#7da654", sand: "#c9ad68", soil: "#86583c", stone: "#b9aea1", water: "#70aaa5", snow: "#e8f0df", ice: "#94c8c5" },
  meadow: { grass: "#a9c85d", sand: "#d7bd6e", soil: "#a66d48", stone: "#dfccb2", water: "#7bc5c0", snow: "#edf2dc", ice: "#98cfcc" },
};

function stringHash(value: string) {
  return [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function BeachDecorationModel({ type, instanceId }: { type: RewardId; instanceId: string }) {
  const { scene } = useGLTF(BEACH_MODEL_URL);
  const object = useMemo(() => {
    const variants = BEACH_MODEL_NODES[type];
    if (!variants?.length) return null;
    const source = scene.getObjectByName(variants[stringHash(instanceId) % variants.length]);
    if (!source) return null;
    const clone = source.clone(true);
    clone.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const targetSize = BEACH_MODEL_SIZE[type] ?? 1.2;
    const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001);
    clone.position.x -= center.x;
    clone.position.y -= bounds.min.y;
    clone.position.z -= center.z;
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const centered = new THREE.Group();
    centered.scale.setScalar(scale);
    centered.add(clone);
    return centered;
  }, [instanceId, scene, type]);

  return object ? <primitive object={object} /> : null;
}

function NatureDecorationModel({ type, instanceId }: { type: RewardId; instanceId: string }) {
  const { scene } = useGLTF(NATURE_MODEL_URL);
  const object = useMemo(() => {
    const variants = NATURE_MODEL_NODES[type];
    if (!variants?.length) return null;
    const source = scene.getObjectByName(variants[stringHash(instanceId) % variants.length]);
    if (!source) return null;
    const clone = source.clone(true);
    clone.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const targetSize = NATURE_MODEL_SIZE[type] ?? 1.2;
    const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001);
    clone.position.x -= center.x;
    clone.position.y -= bounds.min.y;
    clone.position.z -= center.z;
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const centered = new THREE.Group();
    centered.scale.setScalar(scale);
    centered.add(clone);
    return centered;
  }, [instanceId, scene, type]);

  return object ? <primitive object={object} /> : null;
}

function ModularTerrainBase({
  island,
  moveMode,
  onGroundClick,
}: {
  island: IslandId;
  moveMode: boolean;
  onGroundClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const { scene } = useGLTF(TERRAIN_MODEL_URL);
  const tiles = useMemo(() => {
    const group = new THREE.Group();
    MODULAR_GRID.forEach(([gridX, gridZ], index) => {
      const kind = TERRAIN_PATTERNS[island][index];
      const source = scene.getObjectByName(TERRAIN_TILE_SOURCE[kind]);
      if (!source) return;
      const clone = source.clone(true);
      clone.updateWorldMatrix(true, true);
      const bounds = new THREE.Box3().setFromObject(clone);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      clone.position.x -= center.x;
      clone.position.y -= bounds.min.y;
      clone.position.z -= center.z;
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          const recolored = materials.map((material) => {
            const next = material.clone();
            if (next instanceof THREE.MeshStandardMaterial) {
              next.color.set(TERRAIN_PALETTES[island][kind]);
              next.roughness = kind === "water" || kind === "ice" ? 0.3 : 0.92;
              next.metalness = 0;
              if (kind === "water") {
                next.transparent = true;
                next.opacity = 0.82;
              }
            }
            return next;
          });
          child.material = Array.isArray(child.material) ? recolored : recolored[0];
          child.castShadow = kind !== "water";
          child.receiveShadow = true;
        }
      });
      const tile = new THREE.Group();
      const raised = (index + ISLAND_ORDER.indexOf(island) * 2) % 8 === 0 ? 0.11 : 0;
      tile.position.set(gridX * 1.52, -0.5 + raised, gridZ * 1.52);
      tile.scale.set(1.46 / Math.max(size.x, 0.001), 0.5 / Math.max(size.y, 0.001), 1.46 / Math.max(size.z, 0.001));
      tile.add(clone);
      group.add(tile);
    });
    return group;
  }, [island, scene]);

  return (
    <group>
      <primitive object={tiles} />
      <mesh
        position={[0, 0.12, 0]}
        onClick={onGroundClick}
        onPointerOver={() => {
          if (onGroundClick) document.body.style.cursor = moveMode ? "move" : "copy";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[7.75, 0.08, 7.75]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload(BEACH_MODEL_URL);
useGLTF.preload(TERRAIN_MODEL_URL);
useGLTF.preload(NATURE_MODEL_URL);

function RewardModel({ type, instanceId = type }: { type: RewardId; instanceId?: string }) {
  if (PROVIDED_MODEL_LIBRARY[type] === "beach") return <BeachDecorationModel type={type} instanceId={instanceId} />;
  return <NatureDecorationModel type={type} instanceId={instanceId} />;
}

function Rain() {
  const group = useRef<THREE.Group>(null);
  const drops = useMemo(
    () =>
      Array.from({ length: 45 }, (_, index) => ({
        x: ((index * 37) % 100) / 10 - 5,
        y: 1 + ((index * 53) % 55) / 10,
        z: ((index * 71) % 100) / 10 - 5,
      })),
    [],
  );

  useFrame((_, delta) => {
    group.current?.children.forEach((drop) => {
      drop.position.y -= delta * 5;
      if (drop.position.y < 0) drop.position.y += 5.5;
    });
  });

  return (
    <group ref={group}>
      {drops.map((drop, index) => (
        <mesh key={index} position={[drop.x, drop.y, drop.z]} rotation={[0.16, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.28, 3]} />
          <meshBasicMaterial color="#d1e8eb" transparent opacity={0.62} />
        </mesh>
      ))}
    </group>
  );
}

function Snowfall() {
  const group = useRef<THREE.Group>(null);
  const flakes = useMemo(
    () => Array.from({ length: 58 }, (_, index) => ({
      x: ((index * 31) % 100) / 10 - 5,
      y: 1 + ((index * 47) % 55) / 10,
      z: ((index * 67) % 100) / 10 - 5,
      s: 0.035 + (index % 4) * 0.012,
    })),
    [],
  );
  useFrame((state, delta) => {
    group.current?.children.forEach((flake, index) => {
      flake.position.y -= delta * (0.55 + (index % 5) * 0.08);
      flake.position.x += Math.sin(state.clock.elapsedTime + index) * delta * 0.08;
      if (flake.position.y < 0) flake.position.y += 5.5;
    });
  });
  return (
    <group ref={group}>
      {flakes.map((flake, index) => (
        <mesh key={index} position={[flake.x, flake.y, flake.z]} scale={flake.s}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#f6ffff" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function FogBanks() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.position.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.7;
  });
  return (
    <group ref={group} position={[0, 0.55, 0]}>
      {[-4.2, -2, 0.4, 2.8, 4.6].map((x, index) => (
        <mesh key={x} position={[x, 0.35 + (index % 2) * 0.35, index % 2 ? -2 : 2]} scale={[2.2, 0.35, 0.75]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshBasicMaterial color="#edf3ed" transparent opacity={0.17} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function IslandWorld({
  items,
  island = "meadow",
  compact = false,
  weather,
  transparentBackdrop = false,
  selectedId = null,
  moveMode = false,
  onGroundClick,
  onSelect,
}: {
  items: PlacedItem[];
  island?: IslandId;
  compact?: boolean;
  weather: WeatherId;
  transparentBackdrop?: boolean;
  selectedId?: string | null;
  moveMode?: boolean;
  onGroundClick?: (x: number, z: number) => void;
  onSelect?: (id: string) => void;
}) {
  const backgroundColors: Record<WeatherId, string> = {
    sunrise: "#efb7a2",
    sunny: "#f2d982",
    rain: "#a8b4a6",
    snow: "#c9dfe3",
    fog: "#c5d0c8",
    night: "#35486d",
  };
  const background = backgroundColors[weather];
  const theme = ISLANDS[island];
  const lightIntensity = weather === "night" ? 1.25 : weather === "rain" || weather === "fog" ? 1.75 : 2.65;
  const ambientIntensity = weather === "night" ? 0.85 : weather === "rain" || weather === "fog" ? 1.35 : 1.85;
  const lightColor = weather === "sunrise"
    ? "#ffd1aa"
    : weather === "night"
        ? "#9db7e8"
        : "#fff4d5";
  const slots = [
    [-2.55, -2.15], [0, -2.35], [2.55, -1.95], [-2.7, 0.2],
    [2.7, 0.2], [-2.45, 2.1], [0, 2.35], [2.45, 2.05],
  ] as const;

  const handleGroundClick = (event: ThreeEvent<MouseEvent>) => {
    if (!onGroundClick) return;
    event.stopPropagation();
    const target = slots.reduce((nearest, slot) => {
      const distance = Math.hypot(event.point.x - slot[0], event.point.z - slot[1]);
      return distance < nearest.distance ? { slot, distance } : nearest;
    }, { slot: slots[0], distance: Number.POSITIVE_INFINITY });
    if (target.distance <= 1.6) onGroundClick(target.slot[0], target.slot[1]);
  };

  return (
    <>
      {!transparentBackdrop && <color attach="background" args={[background]} />}
      {!transparentBackdrop && <fog attach="fog" args={[background, 15, 28]} />}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={weather === "sunrise" ? [-7, 6, 5] : weather === "night" ? [-4, 8, 6] : [7, 11, 6]}
        intensity={lightIntensity}
        color={lightColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      {!transparentBackdrop && <Water weather={weather} island={island} />}
      <group>
        <ModularTerrainBase island={island} moveMode={moveMode} onGroundClick={handleGroundClick} />

        {slots.map(([x, z]) => {
          const occupied = items.some((item) => Math.hypot(item.x - x, item.z - z) < 0.25);
          return (
            <mesh key={`${x}-${z}`} position={[x, 0.13, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.56, 0.62, 20]} />
              <meshBasicMaterial color={occupied ? theme.accent : "#fff7d6"} transparent opacity={occupied ? 0.18 : 0.42} depthWrite={false} />
            </mesh>
          );
        })}

        {items.map((item) => (
          <group
            key={item.id}
            position={[item.x, 0.13, item.z]}
            rotation={[0, item.rotation, 0]}
            onClick={(event) => {
              if (!onSelect) return;
              event.stopPropagation();
              onSelect(item.id);
            }}
            onPointerOver={(event) => {
              if (!onSelect) return;
              event.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "default";
            }}
          >
            <RewardModel type={item.type} instanceId={item.id} />
            {selectedId === item.id && (
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.58, 0.7, 24]} />
                <meshBasicMaterial color="#fff0a4" depthTest={false} />
              </mesh>
            )}
          </group>
        ))}
      </group>
      {weather === "rain" && <Rain />}
      {weather === "snow" && <Snowfall />}
      {weather === "fog" && <FogBanks />}
      {!["rain", "snow", "fog"].includes(weather) && (
        <Sparkles
          count={weather === "night" ? (compact ? 34 : 58) : compact ? 16 : 28}
          scale={[9, weather === "night" ? 6 : 4, 9]}
          size={weather === "night" ? 3 : 2}
          color={weather === "night" ? "#dbe7ff" : "#fff0b6"}
          speed={weather === "night" ? 0.1 : 0.18}
        />
      )}
      <ContactShadows position={[0, 0.05, 0]} opacity={0.5} scale={11} blur={0.85} far={4.2} color="#4f5134" />
      {!compact && (
        <OrbitControls
          makeDefault
          enablePan={false}
          minZoom={46}
          maxZoom={78}
          minPolarAngle={0.55}
          maxPolarAngle={1.18}
          target={[0, 0.2, 0]}
        />
      )}
    </>
  );
}

function LinAvatar({ mood = "calm" }: { mood?: "calm" | "happy" | "wave" }) {
  return <img src={siteAsset(`/assets/lin-${mood}.png`)} alt="Lin, your recovery companion" />;
}

function BottomNav({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  const nav = [
    { id: "home" as const, label: "Home" },
    { id: "group" as const, label: "Group" },
    { id: "talk" as const, label: "Talk with Lin" },
    { id: "journal" as const, label: "Diary" },
    { id: "profile" as const, label: "Profile" },
  ];

  // The supplied artwork contains four 394 × 66 navigation states, spaced
  // 89 units apart. Lin is a persistent action, so it does not need a
  // separate selected-state frame.
  const artworkOffset = {
    home: 0,
    group: 89,
    journal: 178,
    profile: 267,
  }[tab] ?? 0;

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <svg
        className="bottom-nav-artwork"
        viewBox={`0 ${artworkOffset} 394 66`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <image href={siteAsset("/assets/navigation-bar.svg")} width="394" height="342" />
      </svg>
      <div className="bottom-nav-actions">
      {nav.map((item) => (
        <button
          key={item.id}
          type="button"
          className={tab === item.id ? "selected" : ""}
          onClick={() => onChange(item.id)}
          aria-label={item.label}
          aria-current={tab === item.id ? "page" : undefined}
        >
          <span className="visually-hidden">{item.label}</span>
        </button>
      ))}
      </div>
    </nav>
  );
}

function AppHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="app-header">
      <div>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}


const RECOVERY_GUIDES: Record<string, { icon: string; subtitle: string; instruction: string; duration: string }> = {
  Breathing: { icon: "≋", subtitle: "Let your body slow down", instruction: "Follow the circle. Breathe in slowly, pause, then exhale gently.", duration: "3 min" },
  Stretching: { icon: "✥", subtitle: "Release your neck and shoulders", instruction: "Move within a comfortable range. Roll your shoulders slowly without pushing.", duration: "5 min" },
  Meditation: { icon: "✦", subtitle: "Give your thoughts some space", instruction: "Return your attention to the breath and let passing thoughts drift away like clouds.", duration: "5 min" },
  Music: { icon: "♫", subtitle: "Notice the rhythm of this moment", instruction: "Put on your headphones and let your body soften with the gentle rhythm.", duration: "8 min" },
  Focus: { icon: "◎", subtitle: "Do just one thing", instruction: "Silence other reminders and give your attention to one clear, manageable goal.", duration: "15 min" },
  Journal: { icon: "▣", subtitle: "Leave one honest sentence", instruction: "It does not have to be complete. Simply record what feels most true right now.", duration: "1 min" },
  Hydrate: { icon: "♧", subtitle: "Notice a small signal from your body", instruction: "Take a few slow sips and notice the temperature and movement as you swallow.", duration: "1 min" },
  Walk: { icon: "♟", subtitle: "Let your body move gently", instruction: "You do not need to go far. Notice each step meeting the ground.", duration: "10 min" },
  Custom: { icon: "＋", subtitle: "A recovery moment of your own", instruction: "Choose a small action that helps you feel safe and at ease.", duration: "Custom" },
};

const RECOVERY_EXP: Record<string, number> = {
  breathing: 5,
  stretch: 8,
  meditation: 5,
  music: 5,
  focus: 10,
  check: 5,
  journal: 5,
  water: 3,
  walk: 5,
  custom: 5,
};

type RecoveryStage = "intro" | "ready" | "running" | "checkin" | "reflect" | "result";

function RecoveryIntro({
  goal,
  weather,
  items,
  island,
  onStart,
  onSkip,
  onChooseAnother,
}: {
  goal: { id: string; label: string };
  weather: WeatherId;
  items: PlacedItem[];
  island: IslandId;
  onStart: () => void;
  onSkip: () => void;
  onChooseAnother: () => void;
}) {
  const guide = RECOVERY_GUIDES[goal.label] ?? RECOVERY_GUIDES.Custom;
  const exp = RECOVERY_EXP[goal.id] ?? 5;

  return (
    <div className="recovery-intro-backdrop" role="dialog" aria-modal="true" aria-label={`${goal.label} activity details`}>
      <section className="recovery-intro-sheet">
        <div className="recovery-intro-handle" />
        <header>
          <span>{guide.icon}</span>
          <div><h2>{goal.label}</h2><small>Daily recovery activity</small></div>
          <button type="button" onClick={onSkip} aria-label="Close activity details">×</button>
        </header>
        <div className="recovery-intro-island">
          <img
            src={siteAsset("/assets/recovery-activity-island.svg")}
            alt="Lin standing on a restored Heart Island"
          />
        </div>
        <p>{guide.instruction}</p>
        <div className="recovery-intro-facts">
          <div><span>◷</span><p>Duration: <strong>{guide.duration}</strong></p></div>
          <div><span>✣</span><p>You will earn <strong>+{exp} EXP</strong> and grow your island</p></div>
        </div>
        <button className="recovery-intro-start" type="button" onClick={onStart}>Let&apos;s Try This Activity</button>
        <div className="recovery-intro-actions">
          <button type="button" onClick={onSkip}>Skip</button>
          <button type="button" onClick={onChooseAnother}>Choose Another</button>
        </div>
      </section>
    </div>
  );
}

function RecoverySession({
  goal,
  stage,
  onStage,
  onComplete,
  onClose,
}: {
  goal: { id: string; label: string };
  stage: RecoveryStage;
  onStage: (stage: RecoveryStage) => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  const guide = RECOVERY_GUIDES[goal.label] ?? RECOVERY_GUIDES.Custom;
  const running = stage === "running";

  if (stage === "checkin" || stage === "reflect" || stage === "result") {
    return (
      <div className={`screen recovery-checkin-screen stage-${stage}`}>
        <button className="checkin-close" type="button" onClick={onClose}>×</button>
        {stage !== "result" && <div className="checkin-lin"><LinAvatar mood={stage === "reflect" ? "calm" : "happy"} /></div>}
        <section className="checkin-sheet">
          {stage === "checkin" && (
            <>
              <h1>Take a moment to notice</h1>
              <p>You just completed this recovery session. Well done.</p>
              <button type="button" onClick={() => onStage("reflect")}>I’m Ready</button>
              <button className="checkin-secondary" type="button" onClick={onClose}>Maybe Next Time</button>
            </>
          )}
          {stage === "reflect" && (
            <>
              <h1>How do you feel now?</h1>
              <p>Do not overthink it. Choose the option that feels closest.</p>
              <div className="feeling-options">
                {["Relaxed and a little lighter", "Challenged, but willing to continue", "Still finding it difficult and tiring", "I cannot tell yet"].map((item) => (
                  <button key={item} type="button" onClick={() => onStage("result")}>{item}</button>
                ))}
              </div>
            </>
          )}
          {stage === "result" && (
            <>
              <div className="result-lin"><LinAvatar mood="happy" /></div>
              <h1>I’m glad you shared that, Cookie.</h1>
              <p>Your island feels a little brighter. A soft light has appeared along the shore.</p>
              <div className="exp-earned"><span>☺</span>You earned <strong>+{RECOVERY_EXP[goal.id] ?? 5} EXP</strong></div>
              <button type="button" onClick={onComplete}>Continue</button>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="screen direct-recovery-screen">
      <header>
        <button type="button" onClick={onClose}>×</button>
        <div><h1>{goal.label}</h1><p>{guide.duration} · Today’s recovery goal</p></div>
        <span>ⓘ</span>
      </header>
      <div className={`recovery-focus ${running ? "running" : ""}`}>
        <div className="focus-rays" />
        <button type="button" onClick={() => onStage(running ? "checkin" : "running")}>
          <i>{running ? "✓" : guide.icon}</i>
        </button>
      </div>
      <section className="recovery-guide-copy">
        <small>{running ? "SESSION IN PROGRESS" : "BEGIN WHEN YOU’RE READY"}</small>
        <h2>{guide.subtitle}</h2>
        <p>{guide.instruction}</p>
      </section>
      <div className="recovery-session-footer">
        <div><span>00:00</span><i><b className={running ? "moving" : ""} /></i><span>{guide.duration}</span></div>
        <button type="button" onClick={() => onStage(running ? "checkin" : "running")}>
          {running ? "Complete Session" : "Start Session"}
        </button>
        <small>Complete this session to earn EXP and an island keepsake</small>
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<TabId>("home");
  const [islandReturnTab, setIslandReturnTab] = useState<RecoveryOrigin>("home");
  const [recoveryReturnTab, setRecoveryReturnTab] = useState<RecoveryOrigin>("home");
  const [diaryEntryView, setDiaryEntryView] = useState<DiaryView>("overview");
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [homeTourStep, setHomeTourStep] = useState(-1);
  const [inventory, setInventory] = useState<Inventory>(EMPTY_INVENTORY);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [baseDecorations, setBaseDecorations] = useState<PlacedAsset[]>([]);
  const [personalization, setPersonalization] = useState<PersonalizationProfile>(EMPTY_PERSONALIZATION);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [weather, setWeather] = useState<WeatherId>("sunny");
  const [island, setIsland] = useState<IslandId>("meadow");
  const [selectedReward, setSelectedReward] = useState<RewardId | null>(null);
  const [selectedPlaced, setSelectedPlaced] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [completedGoals, setCompletedGoals] = useState<string[]>([]);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [activeRecoveryGoal, setActiveRecoveryGoal] = useState<{ id: string; label: string } | null>(null);
  const [recoveryStage, setRecoveryStage] = useState<RecoveryStage>("ready");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [chatStage, setChatStage] = useState(0);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedFocus, setSelectedFocus] = useState("");
  const [draft, setDraft] = useState("");
  const [isBreathing, setIsBreathing] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [lastReward, setLastReward] = useState<RewardId>("small_tree");
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const breathTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      setBaseDecorations(readSavedBaseDecorations());
      const savedPersonalization = window.localStorage.getItem(PERSONALIZATION_KEY);
      if (savedPersonalization) {
        try {
          setPersonalization({ ...EMPTY_PERSONALIZATION, ...JSON.parse(savedPersonalization) });
        } catch {
          window.localStorage.removeItem(PERSONALIZATION_KEY);
        }
      }
      const previewParams = new URLSearchParams(window.location.search);
      const replayOnboarding = previewParams.get("onboarding") === "1";
      const replayHomeTour = previewParams.get("tour") === "1";
      setOnboardingStep(!replayOnboarding && window.localStorage.getItem(ONBOARDING_KEY) ? -1 : 0);
      if (replayHomeTour || (!window.localStorage.getItem(HOME_TOUR_KEY) && window.localStorage.getItem(ONBOARDING_KEY))) {
        if (replayHomeTour) setOnboardingStep(-1);
        setHomeTourStep(0);
      }
      const saved = window.localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as Partial<SaveData>;
        if (data.dailyGoals?.date === new Date().toDateString() && Array.isArray(data.dailyGoals.completed)) {
          setCompletedGoals(data.dailyGoals.completed.filter((id) => typeof id === "string" && id in RECOVERY_EXP));
        }
        if (data.inventory) setInventory({ ...EMPTY_INVENTORY, ...data.inventory });
        if (Array.isArray(data.placedItems)) {
          setPlacedItems(data.placedItems
            .filter((item) => REWARD_ORDER.includes(item.type as RewardId))
            .map((item) => ({ ...item, island: item.island || REWARDS[item.type].island })));
        }
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions
            .filter((session) => REWARD_ORDER.includes(session.reward as RewardId))
            .map((session) => ({
              ...session,
              date: /[\u3400-\u9fff]/.test(session.date) ? "Previous session" : session.date,
              mood: /[\u3400-\u9fff]/.test(session.mood) ? "Previous check-in" : session.mood,
              focus: /[\u3400-\u9fff]/.test(session.focus) ? "Recovery goal" : session.focus,
            })));
        }
        if (data.weather) {
          const savedWeather = data.weather as string;
          if (["day", "morning", "afternoon", "dusk", "sunset"].includes(savedWeather)) setWeather("sunny");
          else if (ISLAND_TIMES.some((item) => item.id === savedWeather)) setWeather(savedWeather as WeatherId);
        }
        if (data.island && ISLAND_ORDER.includes(data.island)) setIsland(data.island);
      }
    } catch {
      window.localStorage.removeItem(SAVE_KEY);
    }
    setHydrated(true);
  }, []);

  const finishOnboarding = () => {
    window.localStorage.setItem(ONBOARDING_KEY, "done");
    window.localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(personalization));
    setOnboardingStep(-1);
    setHomeTourStep(0);
    setTab("home");
  };

  const updatePersonalization = (update: Partial<PersonalizationProfile>) => {
    setPersonalization((current) => ({ ...current, ...update }));
  };

  const finishHomeTour = () => {
    window.localStorage.setItem(HOME_TOUR_KEY, "done");
    setHomeTourStep(-1);
  };

  useEffect(() => {
    if (!hydrated) return;
    const save: SaveData = { inventory, placedItems, sessions, weather, island, dailyGoals: { date: new Date().toDateString(), completed: completedGoals } };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [hydrated, inventory, placedItems, sessions, weather, island, completedGoals]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(personalization));
  }, [hydrated, personalization]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(
    () => () => {
      if (breathTimer.current) window.clearTimeout(breathTimer.current);
    },
    [],
  );

  const islandSessionCount = sessions.filter((session) => REWARDS[session.reward]?.island === island).length;
  const homeGoals = useMemo(() => {
    const plan = starterPlan(personalization);
    if (!plan.some((goal) => goal.id === "focus")) plan.splice(2, 0, { id: "focus", title: "Focus for 15 min", icon: "◎", label: "Focus", minutes: 15, exp: 10, note: "begin with one small intention" });
    else plan.splice(2, 0, { id: "stretch", title: "Neck & Shoulder Release", icon: "✥", label: "Stretching", minutes: 5, exp: 8, note: "reduce body tension" });
    return plan.map((goal) => goal.id === "breathing" ? { ...goal, title: "Breathing" } : goal);
  }, [personalization]);
  const totalHomeExp = sessions.reduce((sum, session) => sum + (Number.isFinite(session.exp) && session.exp! >= 0 ? session.exp! : 5), 0);
  const nextReward = REWARDS_BY_ISLAND[island][islandSessionCount % REWARDS_BY_ISLAND[island].length];
  const placedCounts = useMemo(() => {
    return REWARD_ORDER.reduce(
      (result, id) => ({ ...result, [id]: placedItems.filter((item) => item.type === id).length }),
      {} as Inventory,
    );
  }, [placedItems]);
  const activePlacedItems = placedItems.filter((item) => item.island === island);
  const collectedCount = REWARDS_BY_ISLAND[island].filter((id) => inventory[id] + placedCounts[id] > 0).length;
  const visibleRewards = REWARDS_BY_ISLAND[island].filter(
    (id) => inventoryFilter === "all" || REWARDS[id].category === inventoryFilter,
  );

  const resetChat = () => {
    if (breathTimer.current) window.clearTimeout(breathTimer.current);
    setMessages(INITIAL_MESSAGES);
    setChatStage(0);
    setSelectedMood("");
    setSelectedFocus("");
    setDraft("");
    setIsBreathing(false);
  };

  const openTalk = () => {
    setRecoveryReturnTab("home");
    if (chatStage === 4) resetChat();
    setActiveRecoveryGoal(null);
    setRecoveryStage("ready");
    setTab("talk");
  };

  const openIsland = (from: "home" | "group") => {
    setIslandReturnTab(from);
    setTab("island");
  };

  const startRecoveryGoal = (id: string, label: string, from: RecoveryOrigin = "home") => {
    setRecoveryReturnTab(from);
    setActiveRecoveryGoal({ id, label });
    setRecoveryStage("intro");
    setGoalSheetOpen(false);
    setTab(from);
  };

  const completeRecoveryGoal = () => {
    if (!activeRecoveryGoal) return;
    const reward = nextReward;
    const record: SessionRecord = {
      id: uid("recovery"),
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date()),
      mood: activeRecoveryGoal.label,
      focus: "Recovery goal",
      reward,
      exp: RECOVERY_EXP[activeRecoveryGoal.id] ?? 5,
      createdAt: Date.now(),
      goalId: activeRecoveryGoal.id,
      minutes: homeGoals.find((goal) => goal.id === activeRecoveryGoal.id)?.minutes ?? 3,
    };
    setCompletedGoals((current) =>
      current.includes(activeRecoveryGoal.id) ? current : [...current, activeRecoveryGoal.id],
    );
    setSessions((current) => [record, ...current]);
    setInventory((current) => ({ ...current, [reward]: current[reward] + 1 }));
    setLastReward(reward);
    setRewardOpen(true);
    setRecoveryStage("ready");
    setActiveRecoveryGoal(null);
    setTab(recoveryReturnTab);
  };

  const chooseMood = (mood: string) => {
    setSelectedMood(mood);
    setMessages((current) => [
      ...current,
      { id: uid("user"), role: "user", text: mood },
      { id: uid("lin"), role: "lin", text: MOOD_RESPONSES[mood] },
      { id: uid("lin"), role: "lin", text: "Which part of your body would most appreciate some gentle care right now?" },
    ]);
    setChatStage(1);
  };

  const chooseFocus = (focus: string) => {
    setSelectedFocus(focus);
    setMessages((current) => [
      ...current,
      { id: uid("user"), role: "user", text: focus },
      { id: uid("lin"), role: "lin", text: BODY_RESPONSES[focus] },
      { id: uid("lin"), role: "lin", text: "If you would like, we can take one short breathing pause together. It does not have to be perfect." },
    ]);
    setChatStage(2);
  };

  const finishBreathing = useCallback(() => {
    if (breathTimer.current) window.clearTimeout(breathTimer.current);
    breathTimer.current = null;
    setIsBreathing(false);
    setChatStage(3);
    setMessages((current) => [
      ...current,
      { id: uid("lin"), role: "lin", text: "Well done. You do not need to feel better immediately. A little more space than before is enough." },
    ]);
  }, []);

  const startBreathing = () => {
    if (isBreathing) {
      finishBreathing();
      return;
    }
    setIsBreathing(true);
    breathTimer.current = window.setTimeout(finishBreathing, 9000);
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      { id: uid("user"), role: "user", text: value },
      {
        id: uid("lin"),
        role: "lin",
        text: selectedMood
          ? "Thank you for continuing to share. You do not need to prove that this feeling is valid. I can hold it here with you."
          : "Thank you for telling me. We do not need to analyze it yet. Let these words rest here for a moment.",
      },
    ]);
    setDraft("");
    if (chatStage === 0) setChatStage(1);
  };

  const completeSession = () => {
    if (chatStage < 3 || chatStage === 4) return;
    const reward = nextReward;
    const record: SessionRecord = {
      id: uid("session"),
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date()),
      mood: selectedMood || "Wanted to talk",
      focus: selectedFocus || "Emotions",
      reward,
    };
    setSessions((current) => [record, ...current]);
    setInventory((current) => ({ ...current, [reward]: current[reward] + 1 }));
    setLastReward(reward);
    setRewardOpen(true);
    setChatStage(4);
  };

  const goDecorateReward = () => {
    setIslandReturnTab(recoveryReturnTab);
    setRewardOpen(false);
    setSelectedReward(lastReward);
    setSelectedPlaced(null);
    setMoveMode(false);
    setTab("island");
    setToast(`Tap an open spot to place ${REWARDS[lastReward].name}`);
  };

  const handleIslandGround = useCallback(
    (x: number, z: number) => {
      if (moveMode && selectedPlaced) {
        setPlacedItems((current) =>
          current.map((item) => (item.id === selectedPlaced ? { ...item, x, z } : item)),
        );
        setMoveMode(false);
        setToast("Item moved");
        return;
      }
      if (!selectedReward) {
        setToast("Choose an item from your keepsakes first");
        return;
      }
      if (inventory[selectedReward] <= 0) {
        setToast("Complete a recovery session to unlock a new decoration");
        return;
      }
      if (REWARDS[selectedReward].island !== island) {
        setToast(`Open ${ISLANDS[REWARDS[selectedReward].island].name} to place this item`);
        return;
      }
      const occupied = placedItems.some((item) => item.island === island && Math.hypot(item.x - x, item.z - z) < 0.25);
      if (occupied) {
        setToast("That display spot is already in use");
        return;
      }
      const placed: PlacedItem = { id: uid(selectedReward), type: selectedReward, island, x, z, rotation: 0 };
      setPlacedItems((current) => [...current, placed]);
      setInventory((current) => ({ ...current, [selectedReward]: current[selectedReward] - 1 }));
      setSelectedPlaced(placed.id);
      setToast(`${REWARDS[selectedReward].name} is now on your island`);
    },
    [inventory, island, moveMode, placedItems, selectedPlaced, selectedReward],
  );

  const rotatePlaced = () => {
    if (!selectedPlaced) {
      setToast("Select an item on the island first");
      return;
    }
    setPlacedItems((current) =>
      current.map((item) =>
        item.id === selectedPlaced ? { ...item, rotation: item.rotation + Math.PI / 4 } : item,
      ),
    );
  };

  const removePlaced = () => {
    const item = placedItems.find((placed) => placed.id === selectedPlaced);
    if (!item) {
      setToast("Select an item on the island first");
      return;
    }
    setPlacedItems((current) => current.filter((placed) => placed.id !== item.id));
    setInventory((current) => ({ ...current, [item.type]: current[item.type] + 1 }));
    setSelectedPlaced(null);
    setMoveMode(false);
    setToast(`${REWARDS[item.type].name} returned to your keepsakes`);
  };

  return (
    <main className="app-stage">
      <div className="ambient-orb ambient-one" />
      <div className="ambient-orb ambient-two" />
      <section className="phone-app">
        {tab === "home" && onboardingStep === -1 && (
          <HomeDashboard
            name={personalization.displayName.trim() || "Cookie"}
            day={Math.max(1, new Set(sessions.map((session) => session.date.split(",")[0])).size)}
            weather={weather}
            totalExp={totalHomeExp}
            goals={homeGoals}
            completed={completedGoals}
            onWeather={() => setWeather((current) => nextWeather(current))}
            onDecorate={() => openIsland("home")}
            onTalk={openTalk}
            onGoal={startRecoveryGoal}
            onAddGoal={() => { setRecoveryReturnTab("home"); setGoalSheetOpen(true); }}
            tourStep={homeTourStep}
            onTourStep={setHomeTourStep}
            onTourFinish={finishHomeTour}
            scene={<Canvas orthographic camera={{ position: [8, 8.5, 8], zoom: 39, near: 0.1, far: 100 }} dpr={[1, 1.45]} gl={{ antialias: true, alpha: true }}>
              <BaseIslandPreviewScene items={baseDecorations} offsetY={-1.18} animated atmosphere shadowOpacity={0.15} />
              <HomeWeatherLighting weather={weather} />
            </Canvas>}
          />
        )}

        {tab === "talk" && activeRecoveryGoal && recoveryStage !== "intro" && (
          <RecoverySession
            goal={activeRecoveryGoal}
            stage={recoveryStage}
            onStage={setRecoveryStage}
            onComplete={completeRecoveryGoal}
            onClose={() => {
              setRecoveryStage("ready");
              setActiveRecoveryGoal(null);
              setTab(recoveryReturnTab);
            }}
          />
        )}

        {tab === "talk" && (!activeRecoveryGoal || recoveryStage === "intro") && (
          <TalkWithLin name={personalization.displayName.trim() || "Cookie"} sessions={sessions}
            onClose={() => setTab("home")}
            onRecovery={(id, label) => startRecoveryGoal(id, label, "talk")}
            onDiary={(view) => { setDiaryEntryView(view); setTab("journal"); }} />
        )}

        {tab === "group" && (
          <GroupHub
            name={personalization.displayName.trim() || "Cookie"}
            totalExp={totalHomeExp}
            goals={homeGoals}
            completed={completedGoals}
            onDecorate={() => openIsland("group")}
            onGoal={(id, label) => startRecoveryGoal(id, label, "group")}
            scene={<Canvas orthographic camera={{ position: [8, 8.5, 8], zoom: 39, near: 0.1, far: 100 }} dpr={[1, 1.45]} gl={{ antialias: true, alpha: true }}>
              <BaseIslandPreviewScene items={baseDecorations} offsetY={-1.18} animated atmosphere shadowOpacity={0.15} />
              <HomeWeatherLighting weather={weather} />
            </Canvas>}
          />
        )}

        {tab === "island" && (
          <div className="screen island-screen base-editor-app-screen">
            <div className="island-toolbar base-editor-app-toolbar">
              <button className="island-back" type="button" onClick={() => setTab(islandReturnTab)}>‹</button>
              <div>
                <small>BASE ISLAND · FREE PLACEMENT</small>
                <h1>Island Studio</h1>
              </div>
              <button type="button" onClick={() => setTab(islandReturnTab)}>Done</button>
            </div>
            <div className="base-editor-app-body">
              <IslandAssetEditor embedded onChange={setBaseDecorations} />
            </div>
          </div>
        )}

        {tab === "journal" && (
          <Diary name={personalization.displayName.trim() || "Cookie"} goals={homeGoals} completed={completedGoals}
            sessions={sessions} initialView={diaryEntryView}
            onRecovery={(id, label) => { setDiaryEntryView("tasks"); startRecoveryGoal(id, label, "journal"); }} />
        )}

        {tab === "profile" && (
          <div className="screen simple-section-screen">
            <div className="simple-scroll">
              <AppHeader eyebrow="YOUR RECOVERY SPACE" title="Profile" />
              <section className="profile-card">
                <span><LinAvatar mood="happy" /></span>
                <div><h2>Cookie</h2><p>Recovery journey · Day {Math.max(1, sessions.length + 1)}</p><small>Island Lv. {Math.floor(sessions.length / 3) + 1} · {collectedCount} keepsakes collected</small></div>
              </section>
              <div className="simple-heading"><h2>Devices & Data</h2></div>
              <button className="settings-row" type="button"><i>◉</i><span><strong>Smartwatch</strong><small>Connect activity, heart rate, and sleep data</small></span><b>Not Connected ›</b></button>
              <div className="simple-heading"><h2>Preferences</h2></div>
              {["Reminders & Notifications", "Privacy & On-Device Data", "Island Weather Preference"].map((label, index) => (
                <button className="settings-row compact" type="button" key={label}><i>{["♢", "⌁", "☀"][index]}</i><span><strong>{label}</strong></span><b>›</b></button>
              ))}
              <button
                className="replay-onboarding"
                type="button"
                onClick={() => {
                  window.localStorage.removeItem(ONBOARDING_KEY);
                  window.localStorage.removeItem(HOME_TOUR_KEY);
                  setOnboardingStep(0);
                }}
              >
                Replay Onboarding
              </button>
            </div>
          </div>
        )}

        {toast && <div className="toast"><span>✦</span>{toast}</div>}

        {goalSheetOpen && (
          <div className="goal-sheet-backdrop" onClick={() => setGoalSheetOpen(false)}>
            <section className="goal-picker" onClick={(event) => event.stopPropagation()}>
              <div><h2>Add a Goal</h2><button type="button" onClick={() => setGoalSheetOpen(false)}>×</button></div>
              <div className="goal-grid">
                {[
                  ["breathing", "≋", "Breathing"], ["stretch", "✥", "Stretching"], ["meditation", "✦", "Meditation"],
                  ["music", "♫", "Music"], ["focus", "◎", "Focus"], ["journal", "▣", "Journal"],
                  ["water", "♧", "Hydrate"], ["walk", "♟", "Walk"], ["custom", "＋", "Custom"],
                ].map(([id, icon, label]) => (
                  <button key={id} type="button" onClick={() => startRecoveryGoal(id, label, recoveryReturnTab)}>
                    <i>{icon}</i><span>{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeRecoveryGoal && recoveryStage === "intro" && (
          <RecoveryIntro
            goal={activeRecoveryGoal}
            weather={weather}
            items={activePlacedItems}
            island={island}
            onStart={() => {
              setRecoveryStage("ready");
              setTab("talk");
            }}
            onSkip={() => {
              setActiveRecoveryGoal(null);
              setRecoveryStage("ready");
              setTab(recoveryReturnTab);
            }}
            onChooseAnother={() => {
              setActiveRecoveryGoal(null);
              setRecoveryStage("ready");
              setGoalSheetOpen(true);
              setTab(recoveryReturnTab);
            }}
          />
        )}

        {rewardOpen && (
          <div className="reward-overlay" role="dialog" aria-modal="true" aria-label="New Heart Island keepsake">
            <div className="reward-rays" />
            <div className="reward-modal">
              <small>RECOVERY KEEPSAKE · NEW</small>
              <h2>This feeling grew into a gift</h2>
              <div className="reward-art" style={{ "--reward-color": REWARDS[lastReward].color } as React.CSSProperties}>
                <span>{REWARDS[lastReward].icon}</span>
              </div>
              <em>{REWARDS[lastReward].subtitle}</em>
              <h3>{REWARDS[lastReward].name}</h3>
              <p>{REWARDS[lastReward].note}</p>
              <button type="button" onClick={goDecorateReward}>Place It on My Island</button>
              <button className="reward-later" type="button" onClick={() => setRewardOpen(false)}>Decorate Later</button>
            </div>
          </div>
        )}

        {onboardingStep !== null && onboardingStep >= 0 ? (
          <Onboarding
            step={onboardingStep}
            setStep={setOnboardingStep}
            finish={finishOnboarding}
            profile={personalization}
            updateProfile={updatePersonalization}
          />
        ) : activeRecoveryGoal && recoveryStage !== "intro" ? null : (
          <BottomNav
            tab={tab}
            onChange={(nextTab) => {
              if (nextTab === "journal") setDiaryEntryView("overview");
              if (nextTab !== "talk") {
                setActiveRecoveryGoal(null);
                setRecoveryStage("ready");
              }
              setTab(nextTab);
            }}
          />
        )}
      </section>
    </main>
  );
}
