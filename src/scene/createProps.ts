import * as THREE from 'three';

/**
 * Klimatyczne rekwizyty przy KRAWĘDZIACH stołu.
 * Środek i większość mapy zostają wolne pod przyszły gameplay
 * (karty, kości, pionki, ekonomia).
 */
export function createProps(topY: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'props';

  const brass = new THREE.MeshStandardMaterial({ color: 0x8a6b2f, roughness: 0.35, metalness: 0.9 });
  const ironDark = new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.55, metalness: 0.8 });
  const glassInk = new THREE.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.15, metalness: 0.1 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a3, roughness: 0.95 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.8 });
  const waxMat = new THREE.MeshStandardMaterial({ color: 0x6e1423, roughness: 0.5 });

  const put = (m: THREE.Mesh, x: number, z: number, yOff = 0) => {
    m.position.x += x;
    m.position.z += z;
    m.position.y += topY + yOff;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  // 1. Mosiężny docisk do mapy — LEŻY na zachodniej krawędzi arkusza
  // (trzyma papier; krawędź, nie centrum — celowo na mapie).
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.05, 16), brass);
  weight.position.y = 0.025;
  put(weight, -1.08, -0.6);

  // 2. Kałamarz + gęsie pióro — wolny pas na wschód od mapy.
  const inkwell = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.09, 12), glassInk);
  inkwell.position.y = 0.045;
  put(inkwell, 1.32, -0.7);
  const quillShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.34, 6), paperMat);
  quillShaft.rotation.z = 1.1;
  quillShaft.rotation.y = 0.5;
  quillShaft.position.y = 0.05;
  put(quillShaft, 1.18, -0.6);
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.16, 6), paperMat);
  feather.rotation.z = -0.7;
  feather.position.y = 0.12;
  put(feather, 1.08, -0.55);

  // 3. Zwinięty pergamin — wschodnia krawędź, związany sznurkiem.
  const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 12), paperMat);
  scroll.rotation.z = Math.PI / 2;
  scroll.rotation.y = 0.25;
  scroll.position.y = 0.035;
  put(scroll, 1.25, 0.45);
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.006, 6, 14), leatherMat);
  cord.rotation.y = Math.PI / 2 + 0.25;
  cord.position.y = 0.035;
  put(cord, 1.25, 0.45);

  // 4. Pieczęć lakowa + moneta — wolny pas na zachód od mapy.
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14), waxMat);
  seal.position.y = 0.01;
  put(seal, -1.4, 0.35);
  const sealStamp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.05, 10), ironDark);
  sealStamp.rotation.z = Math.PI / 2 - 0.15;
  sealStamp.position.y = 0.025;
  put(sealStamp, -1.4, 0.52);
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.005, 16), brass);
  coin.position.y = 0.003;
  put(coin, -1.41, 0.18);

  // 5. Zamknięta księga / notes — wschodni pas stołu, poza mapą.
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.32), leatherMat);
  book.rotation.y = 0.3;
  book.position.y = 0.025;
  put(book, 1.27, -0.02);
  const bookBand = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.052, 0.06), ironDark);
  bookBand.rotation.y = 0.3;
  bookBand.position.y = 0.025;
  put(bookBand, 1.27, -0.02);

  // 6. Mała świeca stołowa (emisja, bez własnego światła) — północno-zachodni róg.
  const tableCandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.14, 10),
    new THREE.MeshStandardMaterial({ color: 0xe6d9b8, roughness: 0.6 }),
  );
  tableCandle.position.y = 0.07;
  put(tableCandle, -1.42, -0.78);
  const tableFlame = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb45c, emissiveIntensity: 3 }),
  );
  tableFlame.scale.set(0.8, 1.6, 0.8);
  tableFlame.position.y = 0.165;
  tableFlame.name = 'table-flame';
  put(tableFlame, -1.42, -0.78);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.015, 14), brass);
  holder.position.y = 0.008;
  put(holder, -1.42, -0.78);

  return group;
}
