# Atrybucja assetów — projekt 1600 (War Room)

Wszystkie zewnętrzne assety znajdują się **lokalnie** w `public/` — aplikacja
nie pobiera nic z sieci w trakcie działania.

Narzędzie do ponownego pobrania assetów CC0: `tools/fetch_assets.py`
(weryfikuje sumy md5 z API Poly Haven).

## Tekstury PBR (Poly Haven, CC0)

Licencja: https://polyhaven.com/license (CC0 — domena publiczna).

| Asset | Autor | URL | Użycie | Pliki lokalne |
|---|---|---|---|---|
| Medieval Wall 02 | Rob Tuytel | https://polyhaven.com/a/medieval_wall_02 | kamień: ściana N+E, portal kominka | `public/textures/pbr/medieval_wall_02/` (diff/nor/rough 2K) |
| Medieval Wall 01 | Rob Tuytel | https://polyhaven.com/a/medieval_wall_01 | tynk: ściana S+W, sufit | `public/textures/pbr/medieval_wall_01/` (diff/nor/rough 2K) |
| Monastery Stone Floor | Amal Kumar | https://polyhaven.com/a/monastery_stone_floor | posadzka | `public/textures/pbr/monastery_stone_floor/` (diff/nor/rough 2K) |
| Medieval Wood | Rob Tuytel | https://polyhaven.com/a/medieval_wood | belki, drzwi, nogi/apron stołu, półka | `public/textures/pbr/medieval_wood/` (diff/nor/rough 2K) |

## Modele 3D (Poly Haven, CC0)

| Asset | Autor | URL | Użycie | Pliki lokalne |
|---|---|---|---|---|
| Wooden Crate 01 | James Ray Cock | https://polyhaven.com/a/wooden_crate_01 | kufer przy kominku | `public/models/wooden_crate_01/` (glTF 1K + tekstury) |
| Book Encyclopedia Set 01 | John Malcolm | https://polyhaven.com/a/book_encyclopedia_set_01 | 1 książka na stole + stos 3 na półce (pojedyncze węzły) | `public/models/book_encyclopedia_set_01/` (glTF 1K + tekstury) |
| Brass Candleholders | Tina | https://polyhaven.com/a/brass_candleholders | 1 świecznik na kufrze (`brass_candleholder_01`) | `public/models/brass_candleholders/` (glTF 1K + tekstury) |

## Mapa (domena publiczna)

- **Vaugondy, „Royaume de Pologne” 1778** — skan z aukcji OneBid
  (https://onebid.pl/pl/mapy-mapa-vaugondy-robert-de-royaume-de-pologne-1778/1736982),
  oryginał XVIII-wieczny — domena publiczna.
- Plik: `public/textures/board-map.jpg`. Setting gry (ok. 1600–1650) jest
  wcześniejszy — mapa to świadomy materiał wizualny planszy.

## Sketchfab — NIE POBRANO (wymagane logowanie)

Poniższe assety (wszystkie CC BY) nie mogły zostać pobrane automatycznie —
API Sketchfab odpowiada `Authentication credentials were not provided`.
Zastąpiono je ulepszoną geometrią proceduralną + PBR (stół: toczone nogi,
kandelabr: obręcz/kielichy/łańcuchy, kominek: łukowy portal, szabla: extrude
sylwetki głowni). Szyszak husarski pominięto (akcent polski: szabla + księgi).

| Asset | Autor | URL | Licencja |
|---|---|---|---|
| Old Wooden Table — Game Ready Asset | Alex Krush (@Alex_Krush) | https://sketchfab.com/3d-models/old-wooden-table-game-ready-asset-d06d49bdb23c45d5b1fe33bab4b04374 | CC BY |
| Medieval Table (fallback) | — | https://sketchfab.com/3d-models/medieval-table-400fd0bd1a0748f99ebb0d15ac41e104 | CC BY |
| Medieval Chandelier | Kevin.Popescu | https://sketchfab.com/3d-models/medieval-chandelier-dd8b8bd637b5420badb323d5ec82a948 | CC BY |
| Medieval Fireplace (Free) | wolfgar74 | https://sketchfab.com/3d-models/medieval-fireplace-free-36b73510064943d2b7a08918339dfb99 | CC BY |
| Saber (Sabre) Sword | Sparkykun (@royzhang) | https://sketchfab.com/3d-models/saber-sabre-sword-e1fce8b2078749c0a7e99eed609eee5f | CC BY |
| Hussar helmet | Virtual Museums of Małopolska (@WirtualneMuzeaMalopolski) | https://sketchfab.com/3d-models/hussar-helmet-2a38228eba00455b8024b2da324366d7 | CC BY |

## Proceduralne (własne, brak licencji zewnętrznej)

- Blat stołu (`getOakTopTexture`), szum papieru (`getPaperBump`), sprite
  płomienia (`getFlameTexture`) — generowane w `src/assets/AssetManager.ts`.
