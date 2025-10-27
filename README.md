# MTG Catalog Backend

Egyszerű Node.js backend MariaDB adatbázissal az MTG katalógushoz.

## Alap funkciók

- Kártyák lekérése (`GET /cards`)
- Új kártya hozzáadása (`POST /cards`)

## API Tesztelés Postman-nal

A projekt tartalmaz egy `postman.json` fájlt, amit importálhatsz Postman-ba:

1. Nyisd meg a Postman-t
2. Import → Upload Files → válaszd ki a `postman.json` fájlt
3. A collection automatikusan beállítja a `base_url` változót `http://localhost:3300`-ra

### Elérhető végpontok:
- **GET /cards** - Összes kártya lekérése
- **POST /cards** - Új kártya hozzáadása (JSON body-val)

### POST body mezők
A `POST /cards` kérés JSON body-ja a következő, a táblázat oszlopainak megfelelő mezőket használja. A `name` kötelező.

- name (string) - kötelező
- release_year (int) - opcionális
- cost (string) - opcionális
- type (string) - opcionális
- subtype (string) - opcionális
- ability (text) - opcionális
- power (int) - opcionális
- toughness (int) - opcionális
- text (string) - opcionális
- rarity (enum) - opcionális, lehetséges értékek: `M`, `R`, `U`, `C`. Alapértelmezett: `R` (ha nem adod meg)

Példa Postman body (lásd `postman.json`):

{
	"name": "Lightning Bolt",
	"release_year": 1993,
	"cost": "R",
	"type": "Instant",
	"subtype": "",
	"ability": "Lightning Bolt deals 3 damage to any target.",
	"power": null,
	"toughness": null,
	"text": "common",
	"rarity": "R"
}

mtg-catalog/
├── config/ # Konfigurációs fájlok, adatbázis kapcsolat beállításai (db.js)
│ └── db.js # MariaDB-hez való csatlakozás kezelése környezeti változókkal
├── routes/ # Az Express útvonalak (routes) helye, itt definiáljuk az API végpontokat
│ └── cards.js # A kártyákat kezelő HTTP végpontok (pl. GET /cards, POST /cards)
├── server.js # Az alkalmazás fő szerverfájlja, köztes rétegek, útvonalak regisztrációja, Express (backend keretrendszer) szerver indítása
├── postman.json # Postman collection fájl az API végpontok teszteléséhez

Frontend (React gyors prototípus)
- A projekt mostantól tartalmaz egy egyszerű React alapú frontendet a `public/` mappában.
- Indítás után megnyithatod: http://localhost:3300/ — itt egy egyszerű weboldal található, ami a `/cards` végpontot használja.
- Funkciók: szűrés színek szerint (W U B R G a `cost` mező alapján), név szerinti keresés, exportálás JSON/CSV formátumban.
├── .env # Környezeti változók (adatbázis jelszó, host, port stb.), ami NEM kerül a verziókezelőbe (.gitignore-ban van)
├── .gitignore # A git által figyelmen kívül hagyandó fájlok listája (pl. node_modules, .env)
├── README.md # Projekt dokumentáció, fejlesztési útmutató
├── package.json # Projekt metaadatok, függőségek, futtatási parancsok és egyéb npm beállítások
