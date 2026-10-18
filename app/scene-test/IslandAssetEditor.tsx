"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sparkles, useGLTF } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./scene-test.module.css";

const SITE_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteAsset = (path: string) => `${SITE_BASE_PATH}${path}`;

const SCENE_URL = siteAsset("/models/current/base/Base.gltf");
const EDITOR_SAVE_KEY = "heart-island-base-editor-v1";

const ASSET_CATEGORIES = ["Trees", "Camp Retreat"] as const;
type AssetCategory = (typeof ASSET_CATEGORIES)[number];

type AssetDefinition = {
  name: string;
  url: string;
  category: AssetCategory;
  targetHeight: number;
};

const ASSET_CATALOG: readonly AssetDefinition[] = [
  { name: "Ambercrest Maple", url: siteAsset("/models/current/assets/Tree_1.gltf"), category: "Trees", targetHeight: 1.35 },
  { name: "Mossveil Alder", url: siteAsset("/models/current/assets/Tree_2.gltf"), category: "Trees", targetHeight: 1.35 },
  { name: "Sunspire Sapling", url: siteAsset("/models/current/assets/Tree_3.gltf"), category: "Trees", targetHeight: 1.2 },
  { name: "Verdant Crown", url: siteAsset("/models/current/assets/Tree_4.gltf"), category: "Trees", targetHeight: 1.35 },
  { name: "Hearthstone Fire", url: siteAsset("/models/current/assets/Fire%20Wood%20%26%20Stone.gltf"), category: "Camp Retreat", targetHeight: 0.46 },
  { name: "Moonlit Canvas", url: siteAsset("/models/current/assets/Tant_2.gltf"), category: "Camp Retreat", targetHeight: 0.82 },
] as const;

type Position = [number, number, number];

export type PlacedAsset = {
  id: number;
  assetIndex: number;
  position: Position;
  rotation: number;
  scale: number;
};

function normalizePlacedAssets(value: unknown): PlacedAsset[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    const item = candidate as Partial<PlacedAsset>;
    if (
      !Number.isInteger(item.id)
      || !Number.isInteger(item.assetIndex)
      || (item.assetIndex as number) < 0
      || (item.assetIndex as number) >= ASSET_CATALOG.length
      || !Array.isArray(item.position)
      || item.position.length !== 3
      || !item.position.every(Number.isFinite)
      || !Number.isFinite(item.rotation)
    ) return [];
    return [{
      id: item.id as number,
      assetIndex: item.assetIndex as number,
      position: item.position as Position,
      rotation: item.rotation as number,
      scale: Number.isFinite(item.scale) ? THREE.MathUtils.clamp(item.scale as number, 0.6, 1.8) : 1,
    }];
  });
}

export function readSavedBaseDecorations() {
  if (typeof window === "undefined") return [];
  try {
    return normalizePlacedAssets(JSON.parse(window.localStorage.getItem(EDITOR_SAVE_KEY) || "[]"));
  } catch {
    return [];
  }
}

type TexturedMaterial = THREE.Material & {
  color?: THREE.Color;
  map?: THREE.Texture | null;
  alphaMap?: THREE.Texture | null;
  vertexColors?: boolean;
};

function createToonGradient() {
  const gradient = new THREE.DataTexture(
    new Uint8Array([48, 104, 178, 238]),
    4,
    1,
    THREE.RedFormat,
  );
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

function makeToonMaterial(source: THREE.Material, gradientMap: THREE.Texture) {
  const textured = source as TexturedMaterial;
  return new THREE.MeshToonMaterial({
    name: `${source.name || "asset"}-toon`,
    color: textured.color?.clone() ?? new THREE.Color("#ffffff"),
    map: textured.map ?? null,
    alphaMap: textured.alphaMap ?? null,
    gradientMap,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    side: source.side,
    vertexColors: textured.vertexColors ?? false,
    fog: true,
  });
}

function ImportedUnityScene({ onPlace }: { onPlace?: (position: Position) => void }) {
  const { scene } = useGLTF(SCENE_URL);
  const preparedScene = useMemo(() => {
    const clone = scene.clone(true);
    const toonMaterials: THREE.Material[] = [];
    const outlineGeometries: THREE.BufferGeometry[] = [];
    const gradientMap = createToonGradient();

    const outlineMaterial = new THREE.LineBasicMaterial({
      color: "#253b38",
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      toneMapped: false,
    });

    const embeddedSceneHelpers: THREE.Object3D[] = [];
    clone.traverse((child) => {
      if (child instanceof THREE.Camera || child instanceof THREE.Light) {
        embeddedSceneHelpers.push(child);
      }
    });
    embeddedSceneHelpers.forEach((child) => child.parent?.remove(child));

    clone.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 7.4 / Math.max(size.x, size.y, size.z, 0.001);

    clone.position.x -= center.x;
    clone.position.y -= bounds.min.y;
    clone.position.z -= center.z;
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
        const convertedMaterials = sourceMaterials.map((material) => {
          const converted = makeToonMaterial(material, gradientMap);
          toonMaterials.push(converted);
          return converted;
        });
        child.material = Array.isArray(child.material) ? convertedMaterials : convertedMaterials[0];
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.geometry?.attributes.position) {
          const edgeGeometry = new THREE.EdgesGeometry(child.geometry, 34);
          const outline = new THREE.LineSegments(edgeGeometry, outlineMaterial);
          outline.raycast = () => undefined;
          outline.renderOrder = 4;
          child.add(outline);
          outlineGeometries.push(edgeGeometry);
        }
      }
    });

    const group = new THREE.Group();
    group.scale.setScalar(scale);
    group.add(clone);
    return {
      group,
      dispose: () => {
        toonMaterials.forEach((material) => material.dispose());
        outlineGeometries.forEach((geometry) => geometry.dispose());
        outlineMaterial.dispose();
        gradientMap.dispose();
      },
    };
  }, [scene]);

  useEffect(() => () => preparedScene.dispose(), [preparedScene]);

  const placeOnSurface = (event: ThreeEvent<MouseEvent>) => {
    if (!onPlace) return;
    if (event.delta > 4 || !event.face) return;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(event.object.matrixWorld);
    const worldNormal = event.face.normal.clone().applyMatrix3(normalMatrix).normalize();
    if (worldNormal.y < 0.48) return;
    event.stopPropagation();
    onPlace([event.point.x, event.point.y + 0.015, event.point.z]);
  };

  return <primitive object={preparedScene.group} onClick={onPlace ? placeOnSurface : undefined} />;
}

function PreparedPlacedAsset({
  item,
  source,
  selected = false,
  onSelect,
}: {
  item: PlacedAsset;
  source?: THREE.Object3D;
  selected?: boolean;
  onSelect?: (id: number) => void;
}) {
  const assetDefinition = ASSET_CATALOG[item.assetIndex];
  const preparedAsset = useMemo(() => {
    if (!source) return null;

    const clone = source.clone(true);
    const gradientMap = createToonGradient();
    const materials = new Map<THREE.Material, THREE.Material>();
    clone.position.set(0, 0, 0);
    clone.quaternion.identity();
    clone.scale.set(1, 1, 1);
    clone.updateWorldMatrix(true, true);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const convert = (material: THREE.Material) => {
          const existing = materials.get(material);
          if (existing) return existing;
          const converted = makeToonMaterial(material, gradientMap);
          materials.set(material, converted);
          return converted;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(convert)
          : convert(child.material);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.y -= bounds.min.y;
    clone.position.z -= center.z;
    const group = new THREE.Group();
    group.scale.setScalar(assetDefinition.targetHeight / Math.max(size.y, 0.001));
    group.add(clone);
    group.traverse((child) => {
      child.userData.placementAsset = true;
    });

    return {
      group,
      dispose: () => {
        materials.forEach((material) => material.dispose());
        gradientMap.dispose();
      },
    };
  }, [assetDefinition.targetHeight, source]);

  useEffect(() => () => preparedAsset?.dispose(), [preparedAsset]);
  if (!preparedAsset) return null;

  return (
    <group
      position={item.position}
      rotation={[0, item.rotation, 0]}
      scale={item.scale}
      onClick={onSelect ? (event) => {
        if (event.delta > 4) return;
        event.stopPropagation();
        onSelect(item.id);
      } : undefined}
    >
      <primitive object={preparedAsset.group} />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} raycast={() => undefined}>
          <ringGeometry args={[0.5, 0.57, 40]} />
          <meshBasicMaterial color="#fff1a3" transparent opacity={0.92} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function PlacedDecoration({
  item,
  selected,
  onSelect,
}: {
  item: PlacedAsset;
  selected?: boolean;
  onSelect?: (id: number) => void;
}) {
  const assetDefinition = ASSET_CATALOG[item.assetIndex];
  const { scene } = useGLTF(assetDefinition.url);
  return <PreparedPlacedAsset item={item} source={scene.children[0]} selected={selected} onSelect={onSelect} />;
}

function CameraTarget({ target }: { target: Position }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, target]);
  return null;
}

function AssetThumbnail({ assetIndex }: { assetIndex: number }) {
  const item: PlacedAsset = {
    id: -(assetIndex + 1),
    assetIndex,
    position: [0, 0, 0],
    rotation: -0.45,
    scale: 1.05 / ASSET_CATALOG[assetIndex].targetHeight,
  };
  return (
    <Canvas
      orthographic
      dpr={[1, 1.35]}
      camera={{ position: [3, 2.2, 3], zoom: 42, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true }}
    >
      <CameraTarget target={[0, 0.52, 0]} />
      <ambientLight intensity={0.75} color="#eef5df" />
      <hemisphereLight args={["#fff4d5", "#6c8b83", 1.35]} />
      <directionalLight position={[-3, 5, 4]} intensity={2.2} color="#ffd99a" />
      <Suspense fallback={null}>
        <PlacedDecoration item={item} />
      </Suspense>
    </Canvas>
  );
}

function IslandPreviewGroup({
  children,
  offsetY,
  animated,
}: {
  children: React.ReactNode;
  offsetY: number;
  animated: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current || !animated) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.position.y = offsetY + Math.sin(time * 0.62) * 0.055;
    groupRef.current.rotation.y = Math.sin(time * 0.24) * 0.012;
  });
  return <group ref={groupRef} position={[0, offsetY, 0]}>{children}</group>;
}

function HomeIslandAtmosphere({ offsetY }: { offsetY: number }) {
  const auraRef = useRef<THREE.Mesh>(null);
  const auraMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pulse = 1 + Math.sin(time * 0.7) * 0.018;
    auraRef.current?.scale.setScalar(pulse);
    if (auraMaterialRef.current) {
      auraMaterialRef.current.opacity = 0.12 + (Math.sin(time * 0.7) + 1) * 0.025;
    }
  });

  return (
    <group>
      <Sparkles count={46} scale={[7.8, 3.4, 7.8]} position={[0, offsetY + 1.7, 0]} size={2} speed={0.26} opacity={0.5} color="#ffe6a0" />
      <Sparkles count={24} scale={[6.8, 2.8, 6.8]} position={[0, offsetY + 1.35, 0]} size={1.45} speed={0.2} opacity={0.38} color="#a9ead7" />
      <Sparkles count={12} scale={[5.8, 2.3, 5.8]} position={[0, offsetY + 1.85, 0]} size={2.6} speed={0.12} opacity={0.42} color="#ffffff" />
      <mesh ref={auraRef} position={[0, offsetY + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
        <ringGeometry args={[3.72, 3.79, 96]} />
        <meshBasicMaterial
          ref={auraMaterialRef}
          color="#dff6c7"
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function EditorOrbitControls({ fitSignal }: { fitSignal: number }) {
  const { camera } = useThree();
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);

  useEffect(() => {
    if (fitSignal === 0 || !controlsRef.current) return;
    camera.position.set(11.8, 9.2, 11.8);
    controlsRef.current.target.set(0, 1.05, 0);
    controlsRef.current.update();
  }, [camera, fitSignal]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      minDistance={7}
      maxDistance={24}
      minPolarAngle={0.42}
      maxPolarAngle={1.45}
      target={[0, 1.15, 0]}
    />
  );
}

export function BaseIslandPreviewScene({
  items = [],
  offsetY = 0,
  animated = false,
  atmosphere = false,
  shadowOpacity = 0.32,
}: {
  items?: PlacedAsset[];
  offsetY?: number;
  animated?: boolean;
  atmosphere?: boolean;
  shadowOpacity?: number;
}) {
  return (
    <>
      <CameraTarget target={[0, 1.05, 0]} />
      <ambientLight intensity={0.32} color="#e8f2df" />
      <hemisphereLight args={["#fff1cf", "#537182", 1.15]} />
      <directionalLight position={[-6, 10, 7]} intensity={3.1} color="#ffd99a" />
      <directionalLight position={[7, 5, -8]} intensity={1.05} color="#9ed2ff" />
      <Suspense fallback={null}>
        <IslandPreviewGroup offsetY={offsetY} animated={animated}>
          <ImportedUnityScene />
          {items.map((item) => <PlacedDecoration key={item.id} item={item} />)}
        </IslandPreviewGroup>
        {atmosphere && <HomeIslandAtmosphere offsetY={offsetY} />}
      </Suspense>
      <ContactShadows
        position={[0, offsetY - 0.02, 0]}
        opacity={shadowOpacity}
        scale={atmosphere ? 10 : 11}
        blur={atmosphere ? 3.4 : 2.2}
        far={7}
        color="#324e55"
      />
    </>
  );
}

useGLTF.preload(SCENE_URL);
ASSET_CATALOG.forEach((asset) => useGLTF.preload(asset.url));

export default function IslandAssetEditor({
  embedded = false,
  onChange,
}: {
  embedded?: boolean;
  onChange?: (items: PlacedAsset[]) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("Trees");
  const [selectedAsset, setSelectedAsset] = useState(0);
  const [selectedPlacedId, setSelectedPlacedId] = useState<number | null>(null);
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);
  const [editorHydrated, setEditorHydrated] = useState(false);
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);
  const [layoutPreview, setLayoutPreview] = useState(false);
  const nextAssetId = useRef(1);
  const visibleAssets = ASSET_CATALOG
    .map((asset, index) => ({ asset, index }))
    .filter(({ asset }) => asset.category === activeCategory);

  const selectCategory = (category: AssetCategory) => {
    setActiveCategory(category);
    const firstAsset = ASSET_CATALOG.findIndex((asset) => asset.category === category);
    if (firstAsset >= 0) setSelectedAsset(firstAsset);
  };

  const placeAsset = useCallback((position: Position) => {
    const id = nextAssetId.current++;
    setPlacedAssets((items) => [
      ...items,
      {
        id,
        assetIndex: selectedAsset,
        position,
        rotation: (id * 2.399) % (Math.PI * 2),
        scale: 1,
      },
    ]);
    setSelectedPlacedId(id);
  }, [selectedAsset]);

  const undoPlacement = () => {
    setPlacedAssets((items) => items.slice(0, -1));
    setSelectedPlacedId(null);
  };
  const clearPlacements = () => {
    setPlacedAssets([]);
    setSelectedPlacedId(null);
  };
  const updateSelected = (update: (item: PlacedAsset) => PlacedAsset) => {
    if (selectedPlacedId === null) return;
    setPlacedAssets((items) => items.map((item) => item.id === selectedPlacedId ? update(item) : item));
  };
  const rotateSelected = (direction: -1 | 1) => updateSelected((item) => ({
    ...item,
    rotation: item.rotation + direction * Math.PI / 8,
  }));
  const scaleSelected = (amount: number) => updateSelected((item) => ({
    ...item,
    scale: THREE.MathUtils.clamp(item.scale + amount, 0.6, 1.8),
  }));
  const removeSelected = () => {
    if (selectedPlacedId === null) return;
    setPlacedAssets((items) => items.filter((item) => item.id !== selectedPlacedId));
    setSelectedPlacedId(null);
  };
  const confirmSave = () => {
    window.localStorage.setItem(EDITOR_SAVE_KEY, JSON.stringify(placedAssets));
    setSaveConfirmed(true);
    window.setTimeout(() => setSaveConfirmed(false), 1600);
  };
  const openLayoutPreview = () => {
    setSelectedPlacedId(null);
    setLayoutPreview(true);
    setFitSignal((value) => value + 1);
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(EDITOR_SAVE_KEY);
      if (saved) {
        const valid = normalizePlacedAssets(JSON.parse(saved));
        setPlacedAssets(valid);
        nextAssetId.current = Math.max(0, ...valid.map((item) => item.id)) + 1;
      }
    } catch {
      window.localStorage.removeItem(EDITOR_SAVE_KEY);
    }
    setEditorHydrated(true);
  }, []);

  useEffect(() => {
    if (!editorHydrated) return;
    window.localStorage.setItem(EDITOR_SAVE_KEY, JSON.stringify(placedAssets));
    onChange?.(placedAssets);
  }, [editorHydrated, onChange, placedAssets]);

  useEffect(() => {
    if (!layoutPreview) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLayoutPreview(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [layoutPreview]);

  const selectedPlaced = placedAssets.find((item) => item.id === selectedPlacedId);

  return (
    <main className={`${styles.page} ${embedded ? styles.embedded : ""} ${layoutPreview && !embedded ? styles.previewMode : ""}`}>
      {!embedded && !layoutPreview && <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>3 · DECORATE MODE</span>
          <h1>Make the island yours</h1>
          <p>Choose an item, place it on the island, then save your layout.</p>
        </div>
        <a className={styles.backLink} href="/">Back to Island</a>
      </header>}

      <section className={styles.viewer} aria-label="Stylized island scene with placeable items">
        <div className={styles.canvasStage}>
          <Canvas
          shadows
          dpr={[1, 1.8]}
          camera={{ position: [9.3, 7.2, 9.3], fov: 40, near: 0.1, far: 100 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <color attach="background" args={["#c8ded2"]} />
          <ambientLight intensity={0.32} color="#e8f2df" />
          <hemisphereLight args={["#fff1cf", "#537182", 1.15]} />
          <directionalLight
            position={[-6, 10, 7]}
            intensity={3.4}
            color="#ffd99a"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.035}
          />
          <directionalLight position={[7, 5, -8]} intensity={1.15} color="#9ed2ff" />
          <directionalLight position={[1, -2, 5]} intensity={0.35} color="#ffb77d" />
          <Suspense fallback={null}>
            <ImportedUnityScene onPlace={layoutPreview ? undefined : placeAsset} />
            {placedAssets.map((item) => (
              <PlacedDecoration
                key={item.id}
                item={item}
                selected={!layoutPreview && item.id === selectedPlacedId}
                onSelect={layoutPreview ? undefined : setSelectedPlacedId}
              />
            ))}
          </Suspense>
          <ContactShadows position={[0, -0.02, 0]} opacity={0.42} scale={11} blur={1.8} far={7} color="#324e55" />
          <EditorOrbitControls fitSignal={fitSignal} />
          </Canvas>
        </div>

        {!layoutPreview && <div className={styles.objectControls} aria-label="Selected item editing tools">
          <button type="button" className={styles.fitButton} onClick={() => setFitSignal((value) => value + 1)} aria-label="Fit the whole island in view" title="Show the whole island">Fit</button>
          <button type="button" disabled={!selectedPlaced} onClick={() => rotateSelected(-1)} aria-label="Rotate left" title="Rotate left">↶</button>
          <button type="button" disabled={!selectedPlaced} onClick={() => rotateSelected(1)} aria-label="Rotate right" title="Rotate right">↷</button>
          <button type="button" disabled={!selectedPlaced} onClick={() => scaleSelected(-0.1)} aria-label="Scale down" title="Scale down">−</button>
          <button type="button" disabled={!selectedPlaced} onClick={() => scaleSelected(0.1)} aria-label="Scale up" title="Scale up">＋</button>
          <button type="button" disabled={!selectedPlaced} className={styles.deleteButton} onClick={removeSelected} aria-label="Remove item" title="Remove item">×</button>
        </div>}

        {!layoutPreview && <div className={styles.assetPanel}>
          <div className={styles.assetPanelHeader}>
            <div className={styles.assetPanelTitle}>
              <small>ISLAND COLLECTION</small>
              <strong>Place your item</strong>
            </div>
            <div className={styles.assetPanelSummary}>
              <span>{placedAssets.length} placed</span>
              <div className={styles.historyActions}>
                <button type="button" onClick={undoPlacement} disabled={placedAssets.length === 0}>Undo</button>
                <button type="button" onClick={clearPlacements} disabled={placedAssets.length === 0}>Clear</button>
              </div>
            </div>
          </div>
          <div className={styles.categoryTabs} role="tablist" aria-label="Item categories">
            {ASSET_CATEGORIES.map((category) => (
              <button
                type="button"
                role="tab"
                key={category}
                className={activeCategory === category ? styles.categoryActive : undefined}
                onClick={() => selectCategory(category)}
                aria-selected={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>
          <div className={styles.assetList} role="list" aria-label={`${activeCategory} item list`}>
            {visibleAssets.map(({ asset, index }) => {
              const placedCount = placedAssets.filter((item) => item.assetIndex === index).length;
              const active = selectedAsset === index;
              return (
                <button
                  type="button"
                  key={asset.url}
                  className={active ? styles.assetActive : undefined}
                  onClick={() => setSelectedAsset(index)}
                  aria-pressed={active}
                >
                  <span className={styles.assetPreview}><AssetThumbnail assetIndex={index} /></span>
                  <span className={styles.assetLabel}>
                    <strong>{asset.name}</strong>
                    <small>{active ? "Selected" : placedCount ? `On the island ×${placedCount}` : "Ready to place"}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>}

        {layoutPreview && !embedded && (
          <button type="button" className={styles.previewExit} onClick={() => setLayoutPreview(false)}>
            Back to Edit
          </button>
        )}
      </section>

      {!embedded && !layoutPreview && <footer className={styles.footer}>
        <button type="button" onClick={confirmSave} className={saveConfirmed ? styles.saved : undefined}>
          {saveConfirmed ? "Layout Saved" : "Save Island Layout"}
        </button>
        <button type="button" className={styles.previewButton} onClick={openLayoutPreview}>
          Preview Full Island
        </button>
      </footer>}
    </main>
  );
}
