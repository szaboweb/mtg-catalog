# MTG Catalog Backend

Egyszerű Node.js backend MariaDB adatbázissal az MTG katalógushoz.

## Alap funkciók

- Kártyák lekérése (`GET /cards`)
- Új kártya hozzáadása (`POST /cards`)

mtg-catalog/

├── config/ # Konfigurációs fájlok, adatbázis kapcsolat beállításai (db.js)

│ └── db.js # MariaDB-hez való csatlakozás kezelése környezeti változókkal

├── routes/ # Az Express útvonalak (routes) helye, itt definiáljuk az API végpontokat

│ └── cards.js # A kártyákat kezelő HTTP végpontok (pl. GET /cards, POST /cards)

├── app.js # Az alkalmazás fő szerverfájlja, köztes rétegek, útvonalak regisztrációja, Express (backend keretrendszer) szerver indítása

├── .env # Környezeti változók (adatbázis jelszó, host, port stb.), ami NEM kerül a verziókezelőbe (.gitignore-ban van)

├── .gitignore # A git által figyelmen kívül hagyandó fájlok listája (pl. node_modules, .env)

├── README.md # Projekt dokumentáció, fejlesztési útmutató

├── package.json # Projekt metaadatok, függőségek, futtatási parancsok és egyéb npm beállítások
