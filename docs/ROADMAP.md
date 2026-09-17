# Grid & Asphalt — Roadmap & Handoff

> **Ovo je glavni referentni dokument.** Ako nastavljaš u novom chatu, priloži ovaj fajl + cijeli zip projekta i reci "nastavljamo raditi na Grid & Asphalt".

---

## 🔴 HANDOFF — gdje smo stali

**Status u trenutku prijelaza:** Nema aktivnog poznatog bug-a. U ovoj sesiji riješeno je (redom):

1. **Vizualni "teleport" itema na kutovima** — item vise NE resetira progress na 0 pri prijelazu na sljedeci segment. `ConveyorSegment.push()` sad prima `startProgress` (preneseni visak s prethodnog segmenta) i `entryDir` (stvarni smjer ulaska), a `update()` racuna taj visak umjesto da ga baca (`conveyor.js`). Render (`tileRenderer.js`, PASS 3) crta item kroz **sredinu tile-a**: 0→0.5 od stvarnog ulaznog ruba do centra koristeci `item.entryDir`, 0.5→1 od centra do stvarnog fizickog polozaja `.next` tile-a (ne nominalnog `.direction`) — nuzno jer se kod "koljena" `.next` cesto fizicki ne poklapa s vlastitim direction poljem.
2. **Statička strelica (fallback prikaz)** rotira se na simetralu (45°) izmedju vlastitog i `.next`-ovog NOMINALNOG smjera kad se radi o koljenu — vizualno "koljeno" kao u Factoriju.
3. **UKLONJEN auto-bridge preko dijagonalne praznine** (bio pokušaj u ovoj sesiji, korisnik ga je eksplicitno odbio) — `_placeConveyorLine` je vracen na izvornu logiku: spaja SAMO direktno susjedne (edge-to-edge) tile-ove, nikad ne stvara i ne naplacuje dodatni tile bez izricite igraceve gradnje.
4. **Conveyor sprite sustav** — `conveyor_straight`/`conveyor_corner` asset kljucevi, `tileRenderer.js` sam bira i rotira/zrcali `conveyor_corner` za svih 8 ulaz/izlaz kombinacija — ne treba poseban sprite po smjeru.
5. **Odluka: OSTAJEMO na custom JS/Canvas engineu, NE prelazimo na Godot** — korisnik zeli igrati na tabletu bez instalacije; Godot web export je preteži/nepouzdaniji na tablet browserima, a buduci da kod pise Claude, "lakse se pise u Godotu" argument otpada.
6. **Bridge (most)** i **manji kamioni s desnostranom vožnjom (lane offset)** — oba implementirana i testirana (jsdom), vidi "Bridge (most) — NOVO" i "Manji kamioni... — NOVO" sekcije ispod.
7. **Dogovoren veliki paket OpenTTD-inspiriranih nadogradnji** (grupe kamiona, dijeljene rute, operating cost, cargo mass, custom truck nadogradnje, signali, event ticker, nova industrija drvo, vise isprepletenih recepata, vlakovi kasnije) — **JOS NIJE ZAPOCETO KODIRANJE**, samo isplanirano u "OpenTTD-inspirirane nadogradnje" sekciji ispod, s fazama/ovisnostima.
8. **PNG asset pipeline (NOVO, ova sesija)** — korisnik je odlucio prijeci s SVG-u-JSON na PNG-u-JSON. `CONFIG.ASSET_FORMAT` toggle i SVG rasterizacija (`_rasterizeSVG`) su UKLONJENI — sad je JEDAN format: JSON manifest (`assets/<key>.json`) koji referencira PNG(ove) preko `image` polja (relativno na mapu manifesta). Vidi "Asset sustav" sekciju za pun opis + `anim.type: "scroll"` (novi tip, za pokretne strelice na traci, zamjenjuje CSS-u-SVG pokusaj koji vjerojatno ne bi radio kroz canvas). Korisnikov stari `extractor.json` (SVG) je rasterizirian u PNG i dan kao gotov template u novom formatu (`assets/sprites/extractor.json` + `extractor/base.png` + `extractor/rotor.png`).

**⚠️ KRITIČNO za crtanje `conveyor_corner`/`conveyor_straight` asseta (npr. preko Geminija ili rucno):**
- `conveyor_corner`: **ulaz odozgora, izlaz udesno** (zavoj dolje→desno gledano odozgo) — inace ce auto-rotacija ispasti krivo zarotirana/zrcaljena. `conveyor_straight`: ulaz lijevo, izlaz desno.
- Ako zele POKRETNE strelice (scroll): slika tog sloja MORA biti bešavno poplocana po širini (lijevi rub se nastavlja na desni).
- **`truck.json` (ako/kad se doradi): pretpostavka je da je nacrtan gledajuci UDESNO (istok)** — sprite se rotira prema smjeru voznje (`entityRenderer.js`).
- `cornerTransform()` u `tileRenderer.js` je matematicki testiran (jsdom) za svih 8 kombinacija, ali JOS NIJE vizualno provjeren sa stvarnim spriteom.

**Ako se u novom chatu i dalje čini da nešto "ne valja" s conveyor kutovima**, prvo provjeri (prije nego pretpostaviš bug):
1. Je li novi red POCEO tocno na tile-u za koji vrijedi `noviPrviTile - noviSmjer == staroZadnjiTile`? Ako da, spaja se; ako ne, ostaje odvojeno.
2. Je li postojeći belt na koji se pokušavaš spojiti **već imao `.next` postavljen** prije? Ako da — treba **Merger mod (tipka `0`)**.
3. Krivo zarotiran sprite na nekim kutovima a na drugima dobro — provjeri kanonsku orijentaciju u samom asset fajlu, ne `cornerTransform()`.

**Sljedeći korak koji NISMO stigli obraditi (po prioritetu za tablet cilj):**
1. **Touch input** — najveca prepreka za igranje na tabletu, trenutno POTPUNO nedostaje
2. Korisnik (uz pomoc Geminija) crta ostale PNG assete (novi format, vidi gore) — jos ni jedan osim extractora nije gotov/testiran u pravom canvasu
3. Bridge i lane-offset kamioni testirani samo jsdom/matematicki — trebaju live test u pravom browseru
4. Kad se krene na OpenTTD paket (tocka 7 gore) — pitaj korisnika redoslijed unutar Faze A prije pisanja koda, dira vise datoteka odjednom (`TruckPanel`, `Truck`, `engine.js`, `wallet`)

**⚙️ Pravilo za isporuku (korisnikov eksplicitan zahtjev, vrijedi za SVE buduce zadatke):** kad se isporucuje kod, zip smije sadrzavati SAMO izmijenjene/nove datoteke (ne cijeli projekt), ali MORA cuvati punu putanju/strukturu mapa (npr. `src/rendering/tileRenderer.js`, ne samo `tileRenderer.js`) tako da korisnik moze doslovno drag&drop-ati sadrzaj zipa u svoj projektni folder i sve sjedne na svoje mjesto bez trazenja gdje sto ide.
**NOVO (ova sesija) — dogovoren veliki paket OpenTTD-inspiriranih nadogradnji, JOS NIJE ZAPOCETO KODIRANJE.** Puni popis s fazama/ovisnostima je u "⏳ PREOSTALO ZA NAPRAVITI" → "OpenTTD-inspirirane nadogradnje". Ukratko, dogovoreni opseg:
- Grupe kamiona + dijeljene/template rute + operating cost (Faza A, temelj za sve ostalo)
- Cargo mass sustav + custom truck nadogradnje (prikolica/veci prostor, ovjes/motor PO GRUPI, ne globalno) (Faza B, ovisi o A)
- Signali na raskrizjima — auto on/off po broju vozila (4-5+), zeleno kad nema prometa (Faza C, gradi se na `heading`/`_isNextTileBlocked` lane sustavu)
- Event ticker SAMO za povecanu/smanjenu proizvodnju na extractorima (ne opci news sustav) (Faza D)
- Nova industrija: drvo + vise recepata po industriji s isprepletenim lancima izmedju industrija na kasnijim tierovima (Faza D)
- Vlakovi TEK nakon energetske infrastrukture, kopirati OpenTTD dizajn direktno (signali/depoi/pruge), ne izmisljati novo (Faza E, eksplicitno "kasnije")
- Eksplicitno ODBIJENO: AI kompanije, vehicle breakdown sustav

Kad se nastavi rad, pitaj korisnika koji dio Faze A prvo (grupe pa rute pa cost, ili sve odjednom) prije nego se pocne pisati kod — ovo je veci feature koji dira `TruckPanel`, `Truck` klasu, `engine.js` truck-update petlju i `wallet` istovremeno.

---

## ✅ POTPUNO GOTOVO — sve implementirano i testirano

### Svijet i generacija
- Proceduralna generacija otoka: multi-octave (fbm) noise za nazubljenu obalu
- Multi-island podrška (nekoliko odvojenih kopna na istoj mapi)
- Plaža (BFS prsten 2 tile-a oko svake vode)
- 5 veličina mape: 120×80 (legacy) do 1600×1600
- Home screen: odabir veličine, broj otoka, broj portova (skalirano po veličini mape), seed (prazno = nasumično)
- Svih 5 tipova resursa garantirano prisutno na mapi (`_ensureAllTypesPresent`)
- **Poznato ograničenje:** generacija je sinkrona (blokira UI). 400×400 ≈ 0.8s, 800×800 ≈ 4.5s, **1600×1600 ≈ 23s zamrzavanja** — nije riješeno, treba Web Worker ili chunked/async generacija (vidi TODO niže)

### Port
- 3 tile-a širok footprint, dubina = koliko je plaža duboka na tom mjestu
- Nasumično dodijeljen **dock** (kozmetički toranj, 3 tile-a u more) i **input** (funkcionalna dostavna točka, na najudaljenijem redu od mora — dodiruje travu)
- Orijentacija (`_seaDirection`) bira smjer s najduljim nizom vode — pouzdano na nazubljenoj obali
- Retry logika (do 25 pokušaja) izbjegava mini-otočiće i mjesta bez pune širine

### Pathfinding i kamioni
- A* po brzini terena (ne udaljenosti), binarni heap
- Kamion se kreće po centrima tileova (ne kutovima)
- **Multi-point rute** — proizvoljan broj waypointa, kamion beskonačno kruži kroz sve redom, prava A* putanja (ne ravne linije) prikazana uživo i tijekom kreiranja i gotova
- Kolizija kamiona (ne mogu se preklopiti) — **poznato ograničenje:** može doći do deadlocka ako se dva kamiona sretnu licem u lice na uskoj cesti bez prostora za zaobilazak
- Manualno upravljanje: klik odabire kamion, "Create Route" gumb pa klikovi dodaju waypointe, Enter/gumb završava
- Buy Truck ($300) / Sell Truck (+$150)
- Utovar/istovar radi s zgradama (dedicirane ćelije), warehouseom, i portovima

### Zgrade — footprint sustav
- **Extractor**: 2×2, snap-na-node (4 rotacije biraju koji kut footprinta sadrži node), `R` rotira
- **Smelter**: isključivo 2×2 (NE 2×3/3×2 kako je prvi pokušaj bio)
- **Factory** (bivši dio Assemblera, sad zaseban): 3×4 čist pravokutnik (NE L-oblik kako je prvi pokušaj bio)
- **Assembler**: zaseban od Factoryja, 2×2, 1 input → 1 komponenta (default: iron_ingot→gear)
- **Rotacija (`R`)**: mijenja koja je STRANA input/output (top/right/bottom/left), NE veličinu zgrade. Factory je iznimka jer je pravokutnik pa mu se dimenzije prirodno mijenjaju uz rotaciju (3×4 ↔ 4×3)
- **Jedan dedicirani input, jedan dedicirani output** po zgradi (ne cijeli rub) — funkcionalno provedeno u routeru, conveyor feed/drain, i truck dostavi (samo ta točna ćelija prihvaća/izbacuje)
- Vizual: finalna zgrada ima **segmentirane trake** (plava input, narančasta output, po jedna traka po tileu širine s razmakom, poluprozirno da ne prekrije buduće assete); **ghost preview** (dok postavljaš) umjesto toga prikazuje **krugove** na točnoj poziciji input/output ćelije
- Extractor tooltip pokazuje popunjenost: `Iron Extractor (7/10)`
- Demolish briše cijeli footprint klikom na bilo koju ćeliju

### Warehouse
- 2 veličine: Small (2 slota, 2×2, $120, 100 kapacitet/slot), Large (5 slotova, 2×5, $400, 150 kapacitet/slot)
- 1 dedicirana input ćelija (prima bilo koji tip koji odgovara nekom konfiguriranom slotu)
- N output ćelija, svaka zasebno konfigurabilna — **klik otvara modalni izbornik** sa svim resursima (boja = placeholder dok korisnik ne napravi ikone), klik na resurs postavlja i zatvara
- Više output slotova može imati isti tip (paralelno hranjenje više assemblera istim resursom)

### Conveyor sustav (puno bug-fixinga ovdje, pažljivo pročitaj)
- **Drag-based gradnja** (kao cesta), ali strogo ravno — dijagonalni drag se automatski "lijepi" na dominantnu os
- Živi preview (cyan boja) sa strelicom smjera dok vučeš
- Strelica smjera i na gotovom, izgrađenom segmentu (vidljiva čak i bez tereta na traci)
- Bez paddinga — vizualno spojeni izgled
- `ITEM_SPACING = 0.55` → **garantirano max 2 itema po tileu**, s vidljivim razmakom
- **Auto-spajanje odvojenih drag operacija (koljeno/elbow):**
  - Ako se novi belt nastavlja na **slijepi kraj** postojećeg (koji još nikamo ne vodi) — automatski se spaja, radi u BILO KOJOJ kombinaciji smjerova (pravi kut, Factorio-stil)
  - Ako se novi belt završava **ispred** postojećeg (feed IN smjer) — uvijek se automatski spaja kao dodatni izvor (sigurno, ne dira postojeći tok)
  - Ako bi spajanje **oduzelo** već-tekući belt (prepisalo njegov `.next`) — to se **ne događa automatski**, treba eksplicitni **Merger mod (tipka `0`)**
- **Vizualni kut na spoju** — kad `.next` fizicki nije ondje gdje bi vlastiti `.direction` ocekivao (koljeno), tile prikazuje `conveyor_corner` sprite umjesto `conveyor_straight`, auto-rotiran/zrcaljen (`cornerTransform()`); fallback bez spritea: strelica na simetrali (45°). Ne mijenja logiku spajanja, samo prikaz.
- **Nema auto-bridge-a preko praznine** — ako igrač namjerno preskoci tile(ove) izmedju dva belta, ta praznina ostaje prazna zauvijek dok je igrac sam ne popuni; sustav NIKAD ne stvara i ne naplacuje dodatni tile bez izricite igraceve akcije (namjerna odluka, ne ogranicenje)
- **Kontinuirano kretanje kroz kut, bez teleporta**: item vise ne resetira progress na 0 pri prijelazu izmedju segmenata. `push()` prima preneseni visak (`startProgress`) i stvarni ulazni smjer (`entryDir`); renderer crta putanju kroz sredinu tile-a (0→0.5 od stvarnog ulaznog ruba do centra, 0.5→1 od centra do stvarnog fizickog polozaja `.next`-a, ne nominalnog smjera)
- **Merger** — isti drag mehanizam kao Conveyor, ista cijena, jedina razlika: prisilno prepisuje `.next` čak i ako je taj belt već negdje vodio. NIJE vizualno drugačija zgrada (koristi isti `ConveyorSegment`), samo drukčije pravilo povezivanja pri postavljanju
- **Round-robin fairness na spojevima** — kad 2+ izvora hrani isti tile, striktan red čekanja (`incomingSources` niz + `turnIndex`) garantira jednaku podjelu tokom vremena (testirano: omjer 1.00 na 1000 tickova). **Poznato ograničenje:** strog round-robin znači da ako je "na redu" izvor koji trenutno nema ništa spremno, tile čeka njega umjesto da propusti drugog — namjerna žrtva radi garantirane pravednosti
- **Z-order fix**: rendering je u 3 prolaza (teren → building pozadine/strelice → conveyor itemi) da itemi nikad ne budu prekriveni susjednim tileom
- Direktna prodaja conveyor→port **isključena defaultno** (`CONFIG.ALLOW_DIRECT_CONVEYOR_SALE = false`) — spremno za Settings UI kad se napravi

### Bridge (most) — NOVO
- Odvojen sustav od cesta — `TERRAIN.BRIDGE_WOOD/CONCRETE/STEEL`, tier-progresija identična cestama (`_placeBridge()` u `buildMenu.js`, isti obrazac kao `_upgradeRoad()`), ali SAMO nad `TERRAIN.WATER`; most se ne moze postaviti na kopno, cesta se ne moze "nadograditi" u most
- Brzina po tieru ista kao odgovarajuci road tier (0.5/1.0/2.0) — lako promjenjivo u `terrain.js` ako treba drugaciji balans
- Pathfinding radi BEZ IKAKVE dodatne izmjene — `PathGrid` cita `tile.terrain` uzivo, pa cim je terrain most (speed>0) automatski je walkable
- Demolish most vraca terrain na `WATER` (ne `GRASS` kao kod ceste)
- Hotkey `B`, cijena 40 (2x cijena ceste), drag-to-build kao i cesta (bresenham linija)
- Rendering: fallback boje po tieru gotove (`spriteAtlas.js`); asset kljucevi pripremljeni (`terrain_bridge_wood/concrete/steel`) ali sprite jos ne postoji — isti fallback-first princip kao svugdje drugdje
- Testirano (jsdom): tier progresija, blokiranje na kopnu, blokiranje ceste na vodi (regresija), pathfinding walkability prije/poslije, demolish natrag na vodu

### Manji kamioni + desnostrana vožnja (lane offset) — NOVO
- `Truck` sad ima `.heading` polje (`{dx,dy}`, grid-osi vektor) — postavlja se u `update()` iz trenutnog path segmenta, OSTAJE postavljen i kad kamion stane (koristi se kao "zadnji poznati smjer")
- **Kolizija/blokiranje** (`_isNextTileBlocked` u `engine.js`) sad usporeduje SMJER: dva kamiona na istom tileu blokiraju se SAMO ako voze istim smjerom (ista traka); suprotan ili okomit smjer = razlicita traka = ne blokira. Time 2 kamiona STVARNO mogu dijeliti tile (ne samo vizualno)
- **Rendering** (`entityRenderer.js`): kamion manji (`TRUCK_SIZE_RATIO = 0.32`, bilo 0.5), i vizualno pomaknut na desnostranu traku (`LANE_OFFSET = 0.2`, formula `rightHandOffset(dx,dy) = (-dy,dx)`) - pomak je SAMO vizualni, `truck.position` (logika/pathfinding/arrival) je netaknut
- **Sprite rotacija** — ako je `truck` sprite ucitan, sad se rotira prema `heading`-u (`Math.atan2(dy,dx)`). **Pretpostavka: truck.json crtan gledajuci UDESNO (istok)** kao kanonska orijentacija — ako je nacrtan drugacije, promijeni kut u `renderTrucks()`
- Testirano (jsdom): ista traka blokira, suprotna traka NE blokira, formula offseta za sva 4 smjera, puna simulacija (spawn+300 tickova+render) bez greske

### Ekonomija i questovi
- Wallet (start $1500), Market (s `marketPriceMultiplier` iz tech treeja)
- Quest sustav: dual-timer (Accept/Execution window), auto-spawn po lukama, difficulty-svjesna raspodjela nagrada (Easy/Normal/Hard iz GDD tablice)
- Recepti: iron_ingot, copper_ingot (Smelter) / steel, motor, circuit (Factory) / gear, wire (Assembler)
- **RecipePanel** — klik na izgrađeni Assembler/Factory otvara izbor recepta

### Tech Tree
- 4 grane: Logistics, Infrastructure, Industry, Management
- **Retroaktivni efekti** (ctx sad ima pristup `state`) — npr. Extended Hoppers (+10 extractor buffer) i Bulk Storage Racks (+50 warehouse kapacitet) primjenjuju se odmah i na već postojeće zgrade, ne samo buduće
- Čvorovi: brzina extractora/procesora/assemblera, kapacitet/brzina kamiona, jeftinije ceste, veći warehouse kapacitet, više aktivnih questova, bolje cijene na tržištu
- **Odgođeno:** podjela u tabove po kategoriji (korisnik je tražio "kasnije")

### UI / UX
- HUD (novac, RP, mod, status kamiona)
- Quest panel, Tech panel, Recipe panel, Warehouse menu, Truck panel, Shop panel — svi funkcionalni
- Pause meni (ESC) — Resume/Exit rade, Settings/Save-Load su placeholderi (disabled)
- `Space` pauzira/nastavlja direktno, `ESC` je progresivan (otkaži build mod → deselect kamion → otvori meni → zatvori meni)
- Vrijeme: x1/x2/x3 ubrzanje
- Hover grid overlay (200px radius, fade-out, `G` toggle)
- Ghost preview za sve footprint zgrade (zeleno/crveno + X za nevaljano)
- Tooltip na hover (resurs, zgrada, port, extractor s popunjenošću)
- Drag-to-build za ceste i rušenje, s live preview

### Asset sustav
- **PNG + JSON manifest, jedini format** (SVG-u-JSON i `CONFIG.ASSET_FORMAT` toggle su UKLONJENI ove sesije — sad je uvijek PNG, referenciran iz manifesta)
- Svaki asset = JSON manifest na `assets/<key>.json` (npr. `assets/sprites/extractor.json`) + jedan ili vise PNG-ova. Putanje u manifestu (`image` polje) su relativne na MAPU manifesta, ne na cwd stranice — npr. `"image": "extractor/base.png"` iz `sprites/extractor.json` cita `assets/sprites/extractor/base.png`
- **Jednostavan (jednodijelni) sprite:** `{ "width": N, "height": N, "image": "ime.png" }` — koristi za sve sto se ne animira (terrain, resursi, port, warehouse...)
- **Multi-part animirani sprite-ovi:** `{ "width": N, "height": N, "parts": [...] }`, svaki dio `{ "id", "image", "pivot", "anim" }`. Podržani `anim.type`: `static` / `rotate` / `shake` / `rotate+shake` / **`scroll`** (NOVO — vidi nize)
- Proceduralni dust efekt (5 čestica, ne dio asseta) dok extractor aktivno vadi
- **Gotov, testiran primjer:** `assets/sprites/extractor.json` + `extractor/base.png` + `extractor/rotor.png` (rasterizirano iz korisnikovog starog SVG-a, dano korisniku kao gotov template — vidi HANDOFF)
- **`anim.type: "scroll"` (NOVO)** — beskonacno vodoravno "klizanje" teksture unutar vlastite pravokutne povrsine (bez rotacije/pivota), koristi se za strelice na conveyor traci. `anim.speed` = px/s u izvornim (nerazvucenim) koordinatama slike, `anim.direction: "left"` za obrnuti smjer (default desno). **Slika MORA biti bešavno poplocana po širini** (lijevi rub se glatko nastavlja na desni) - inace se vidi "šav" na svakom ponavljanju. Kad `animState.active` nije `true` (npr. conveyor bez struje kad se doda power sustav), animacija se zamrzava na pocetnoj poziciji, ne nestaje
- **Conveyor sprite-ovi** — samo DVA asseta potrebna: `assets/sprites/conveyor_straight.json` i `assets/sprites/conveyor_corner.json`. Mogu biti jednostavni (1 staticna slika) ili multi-part s `scroll` slojem za animirane strelice. Engine sam rotira/zrcali `conveyor_corner` u bilo koju od 8 mogucih ulaz/izlaz kombinacija — **ne treba** poseban sprite po smjeru. **Kanonska orijentacija za crtanje `conveyor_corner`: ulaz odozgora, izlaz udesno** (zavoj dolje→desno gledano odozgo); `conveyor_straight`: ulaz lijevo, izlaz desno. Vidi HANDOFF za detalje
- **Nedostaje:** korisnik radi ostale assete (smelter, factory, assembler, warehouse, truck, port, teren, resursi, conveyor_straight/conveyor_corner) uz pomoć Geminija, sad u PNG formatu — nijedan od ovih jos nije dan/testiran u pravom canvasu

### Power priprema (SAMO priprema, bez stvarne logike)
- `Extractor`, `Processor` (Smelter/Factory/Assembler), `ConveyorSegment` svi imaju `requiresPower=true` i `powered=true` polja
- `update()` guard: `if (this.requiresPower && !this.powered) return;`
- **Trenutno nema efekta** (uvijek `powered=true`) — kad se napravi elektrana/baterije/dalekovodi, sustav samo treba postavljati `building.powered` po mreži, bez drugih izmjena

---

## ⏳ PREOSTALO ZA NAPRAVITI (puni popis)

### Visoki prioritet (spomenuto više puta, korisnik čeka)
1. **Performance fix za velike mape** — 1600×1600 blokira 23s. Riješiti s Web Workerom (generacija u pozadinskoj niti) ili chunked/async generacijom (generiraj dio, pusti frame, ponovi) s progress barom na home screenu
2. ~~**Bridge (most)**~~ ✅ GOTOVO (vidi ispod)
3. ~~**Manji kamioni + desnostrana vožnja**~~ ✅ GOTOVO (vidi ispod)
4. **UI redizajn** — build meni gore lijevo u tabovima (npr. Buildings/Roads/Tech), glass/blur efekt. **Čeka korisnikove vlastite assete** prije nego ima smisla raditi finalni izgled
5. **Touch input** — trenutno POTPUNO nedostaje (samo mousedown/mousemove/mouseup u `input.js`). Preduvjet da igra uopće radi na tabletu — korisnikov izričit cilj (vidi HANDOFF)
6. ~~**Conveyor scroll-animacija**~~ ✅ GOTOVO (vidi "Asset sustav" — `anim.type: "scroll"`)

### OpenTTD-inspirirane nadogradnje (NOVO, dogovoreno — vidi HANDOFF za redoslijed/ovisnosti)

**Faza A — kamionski management (temelj za sve ostalo s kamionima)**
7. **Grupe kamiona** — rename, boja/livery po grupi, bulk akcije (prodaj sve iz grupe, pošalji sve u depo). Nadovezuje se na `TruckPanel`/`truck-panel` koji trenutno prikazuje samo 1 selektirani kamion — treba prošireni popis svih kamiona s grupiranjem
8. **Dijeljene/template rute** — ruta se definira JEDNOM i dodijeli cijeloj grupi odjednom, umjesto ručnog klikanja waypointa po kamionu. Ovisi o (7)
9. **Operating cost** — trošak po tick-u/distanci za svaki kamion (odbija se iz wallet-a kontinuirano, ne samo cijena kupnje). Nezavisno, ali logično ide uz (7)/(8) jer se prikazuje po kamionu/grupi

**Faza B — teret i nadogradnje kamiona (ovisi o Fazi A)**
10. **Cargo mass sustav** — svaki resurs ima različitu masu, utječe na brzinu/trošak kamiona koji ga vozi
11. **Custom truck upgrade sustav** — modularne nadogradnje umjesto samo tier-kamiona: prikolica (veći teretni prostor), ovjes/motor (kompenzira masu tereta, ali povećava operating cost). Nadogradnje se biraju PO GRUPI, ne globalno — ovisi o (7) i (10)

**Faza C — promet**
12. **Signali na raskrižjima** — auto on/off: ako na raskrižju ima 4-5+ vozila odjednom, signali se aktiviraju (naizmjenično puštaju promet); ako nema prometa, sve je zeleno (bez signala). Gradi se na postojećem lane-offset sustavu (`heading`/`_isNextTileBlocked` u `engine.js`)

**Faza D — sadržaj i ekonomija**
13. **Event ticker (samo proizvodni eventi)** — NE opći news sustav, samo "povećana/smanjena proizvodnja" notifikacije na extractorima (npr. kad resource node počne presušivati ili radi bonus)
14. **Nova industrija: drvo** — novi resource node tip + recepti koji ga koriste
15. **Više recepata po industriji, isprepleteni lanci** — kasniji tier-ovi svake industrije ovise o proizvodu neke DRUGE industrije (ne samo lančano unutar sebe), potiče igrača da širi na više resursa umjesto jedne linije

**Faza E — kasnije (korisnik eksplicitno rekao "kasnije")**
16. **Vlakovi** — ide TEK nakon energetske infrastrukture (elektrana/baterije/dalekovod, vidi sekciju ispod). Korisnik: "ne bih ništa posebno radio, to bih kopirao direktno iz OpenTTD" — znači kopirati OpenTTD-ov postojeći dizajn (signali, depoi, pruge, raspored), ne izmišljati novo

### Energetska infrastruktura (korisnik eksplicitno rekao "kasnije", ali priprema je gotova)
17. Elektrana (power plant) — proizvodi struju
18. Baterije — spremaju struju
19. Dalekovod — klik povlači žicu, klik na zgradu/drugi dalekovod spaja
20. Kad se ovo napravi, samo treba postaviti `building.powered` ovisno o mreži — sva ostala logika već postoji (guard klauzule u update() metodama)

### Cargo/Building validacija
21. **Building footprint & cargo validation** iz starog roadmapa — sad je djelomično riješeno (svaka zgrada ima TOČNO 1 input/output, pa krivi tip jednostavno ne prođe kroz `acceptInput()` provjeru recepta), ali **nema vizualne/UI povratne informacije** kad kamion pokuša dostaviti krivi resurs (samo tiho ne uspije). Ako korisnik želi eksplicitnu grešku/vizualni efekt, to treba dodati

### Postavke i spremanje
22. **Settings UI** — pause meni ima disabled "Settings" gumb. Treba: toggle za `ALLOW_DIRECT_CONVEYOR_SALE`, i vjerojatno druge postavke kako se budu pojavljivale
23. **Save/Load** — pause meni ima disabled "Save/Load" gumb. Nema NIKAKVE perzistencije trenutno — sve se gubi na refresh. Treba dizajnirati format snapshot-a (world + sve entitete + wallet + tech tree state) i localStorage ili file-based save

### Tech tree
24. Podjela u tabove po kategoriji (Logistics/Infrastructure/Industry/Management kao odvojeni tabovi umjesto svih na jednom ekranu)

### Multiplayer (samo koncept, ništa implementirano)
25. Server-authoritative model (dijeljeni otok) — WebSocket server drži jedinu simulaciju, klijenti šalju inpute
26. Odvajanje trenutne "sve-u-jednom" `Engine` klase na server-simulaciju + client-rendering sloj
27. Claim/lock sustav za resource node-ove i questove
28. Ping/marker komunikacijski sustav

### Manji/kozmetički TODO-ovi spomenuti usput
29. Exit → Start Again ne čisti stare `window` keydown listenere (gomilaju se ako više puta izađeš/uđeš u istoj sesiji bez punog reloada stranice) — treba `Engine.destroy()` metoda koja uklanja sve svoje listenere
30. ~~Prava Splitter/Merger zgrada~~ ✅ GOTOVO — Merger je sad prava 1x1 zgrada s eksplicitnim ulaznim stranama (vidi "Merger — NOVO" sekciju). Splitter (1-u-više izlaza) i dalje ne postoji, isti obrazac bi se mogao ponoviti kad zatreba
31. Multi-tile buildings (Factory, Warehouse) trenutno nemaju drag-rotate preview koji prati kursor uživo za odabir orijentacije prije klika — rotacija se bira PRIJE postavljanja (`R` tipka), ne tijekom hover-a
32. **NOVO OTKRIVENO (nije popravljeno, nizak prioritet):** `_placeConveyorLine(a,b)` s `a===b` (0-duljinska linija, npr. drag-klik bez pomicanja miša) uzrokuje da belt dobije `.next` sam na sebe (self-reference) jer "after" provjera vidi TEK POSTAVLJENI belt na vlastitoj poziciji. Rijedak edge-case (treba klik bez pomaka tijekom drag-builda), otkriven slucajno kroz testiranje, nije jos popravljen niti potvrdjen da se stvarno desava u pravoj igri

---

## 📁 Struktura projekta (trenutno stanje)

```
grid-and-asphalt/
├── index.html
├── style.css
├── docs/
│   └── ROADMAP.md              ← ovaj fajl
└── src/
    ├── main.js
    ├── core/
    │   ├── engine.js            (najveći fajl, orkestrira sve)
    │   ├── gameLoop.js          (paused, timeScale)
    │   ├── camera.js
    │   ├── input.js             (drag-build, click, hover)
    │   └── config.js
    ├── world/
    │   ├── islandGenerator.js
    │   ├── tile.js
    │   ├── terrain.js
    │   ├── resourceNode.js
    │   └── port.js
    ├── pathfinding/
    │   ├── astar.js
    │   └── grid.js
    ├── logistics/
    │   ├── conveyor.js          (round-robin fairness)
    │   ├── truck.js
    │   ├── router.js            (dedicirane input/output celije)
    │   └── warehouse.js
    ├── production/
    │   ├── extractor.js
    │   ├── smelter.js
    │   ├── factory.js
    │   ├── assembler.js
    │   ├── processor.js         (bazna klasa za Smelter/Factory/Assembler)
    │   └── recipe.js
    ├── economy/
    │   ├── questManager.js
    │   ├── quest.js
    │   ├── market.js
    │   └── currency.js
    ├── tech/
    │   ├── techTree.js
    │   └── branches/
    │       ├── logistics.js
    │       ├── infrastructure.js
    │       ├── industry.js
    │       └── management.js
    ├── rendering/
    │   ├── renderer.js
    │   ├── tileRenderer.js      (3-pass rendering!)
    │   ├── entityRenderer.js
    │   ├── spriteAtlas.js
    │   ├── sprite.js
    │   ├── multiPartSprite.js   (animirani slojeviti sprite-ovi)
    │   ├── assetLoader.js
    │   ├── assetRegistry.js
    │   ├── assetManifest.js
    │   └── gridOverlay.js
    ├── ui/
    │   ├── hud.js
    │   ├── questPanel.js
    │   ├── techPanel.js
    │   ├── buildMenu.js         (najveći UI fajl, footprint logika)
    │   ├── truckPanel.js
    │   ├── shopPanel.js
    │   ├── tooltip.js
    │   ├── timePanel.js
    │   ├── pauseMenu.js
    │   ├── recipePanel.js
    │   └── warehouseMenu.js
    ├── state/
    │   ├── gameState.js
    │   └── difficultyModes.js
    └── utils/
        ├── vector2.js
        └── noise.js
```

---

## 🎮 Kontrole (trenutno stanje)

| Tipka | Akcija |
|---|---|
| `1` | Extractor mod |
| `2` | Smelter mod |
| `3` | Factory mod |
| `4` | Road Upgrade mod (drag za liniju) |
| `5` | Demolish mod (drag za liniju) |
| `6` | Conveyor mod (drag, samo ravno) |
| `7` | Assembler mod |
| `8` | Warehouse Small mod |
| `9` | Warehouse Large mod |
| `0` | Merger mod (prisilno spajanje beltova) |
| `R` | Rotiraj trenutnu zgradu/orijentaciju |
| `G` | Toggle grid overlay |
| `Space` | Pauza/nastavi |
| `ESC` | Progresivno: otkaži build → deselect kamion → pause meni → zatvori meni |
| Klik (bez pomaka) | Odabir/akcija na jednom tileu |
| Drag | Linija za ceste/rušenje/conveyor/merger |
| Scroll | Zoom |
| Drag (bez build moda) | Pomak kamere |

---

## ⚠️ Arhitekturne napomene za budući rad (naučene lekcije)

1. **Uvijek renderiraj u odvojenim prolazima kad zgrada/entitet prelazi granice jednog tilea.** Dva puta smo pali na isti bug (multi-tile zgrade, pa conveyor itemi) — kasnije obrađen tile u istoj petlji prepiše raniji ako se vizualno preklapaju. Rješenje je uvijek: prvo SVE pozadine, pa TEK ONDA sve što se crta preko granica.
2. **`tile.building` je DIJELJENA referenca** na cijelom footprintu — jedan objekt, više ćelija pokazuje na njega. Demolish/router/tooltip moraju znati raditi s ovim (provjereno da rade).
3. **`.next` na conveyoru je per-IZVOR, ne per-odredište** — više izvora SME pokazivati na isti cilj (to je legitiman merge), ali OTIMANJE (prepisivanje tuđeg `.next`) mora biti eksplicitno (Merger mod), nikad tiho automatski.
4. **Svaki footprint-based building ima `anchorX/Y`, `footprintWidth/Height`, `footprint` (niz ćelija), i za smelter/factory/assembler i `inputCell`/`outputCell`/`inputSide`/`outputSide`.** Warehouse ima drugačiji model (`slots` niz s `assignedType`/`amount`, plus `anchorX/Y` za input, `anchorX+1` stupac za outpute).
5. **Testiraj s jsdom prije isporuke** — koristi `npm install jsdom@24` (ne najnovija verzija, ima ovisnost-konflikt). Uvijek mockaj `Image` s custom klasom koja odmah "učita" (jsdom ne dekodira `data:` URI slike), i uvijek testiraj STVARNI redoslijed crtanja piksela za multi-tile stvari, ne samo pozive funkcija.
