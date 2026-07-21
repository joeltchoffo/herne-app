# Herne Event App

Webanwendung zur VerÃ¶ffentlichung, Suche und Buchung von Veranstaltungen in Herne. Das Repository enthÃ¤lt ein React-Frontend, ein Spring-Boot-Hauptbackend, einen separaten Herne-Simulator sowie die lokale Infrastruktur fÃ¼r PostgreSQL, MQTT und E-Mail-Tests.

> **Projektstatus:** Entwicklungs- und Demonstrationsstand. Die Anwendung lÃ¤sst sich lokal als Gesamtsystem starten, ist in der aktuellen Form aber nicht fÃ¼r einen Ã¶ffentlichen Produktivbetrieb geeignet. Konkrete GrÃ¼nde stehen unter [Bekannte EinschrÃ¤nkungen und Sicherheitsrisiken](#bekannte-einschrÃ¤nkungen-und-sicherheitsrisiken).

## Inhalt

- [Funktionen](#funktionen)
- [Architektur](#architektur)
- [Technologien](#technologien)
- [Schnellstart mit Docker Compose](#schnellstart-mit-docker-compose)
- [Erste Anmeldung und Admin-Zugang](#erste-anmeldung-und-admin-zugang)
- [Herne-Simulator verwenden](#herne-simulator-verwenden)
- [API und Authentifizierung](#api-und-authentifizierung)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Konfiguration](#konfiguration)
- [Datenmodell](#datenmodell)
- [Tests und Builds](#tests-und-builds)
- [Projektstruktur](#projektstruktur)
- [Fehlerbehebung](#fehlerbehebung)
- [Bekannte EinschrÃ¤nkungen und Sicherheitsrisiken](#bekannte-einschrÃ¤nkungen-und-sicherheitsrisiken)
- [Lizenz](#lizenz)

## Funktionen

### FÃ¼r Besucher und registrierte Benutzer

- Benutzerkonto registrieren und per JWT anmelden
- Veranstaltungen anzeigen, filtern und seitenweise durchsuchen
- Veranstaltungsdetails mit Ort, Termin, Kategorien und Auslastung Ã¶ffnen
- Veranstaltung buchen
- Buchung Ã¼ber den BestÃ¤tigungscode finden
- Eigene Profildaten bearbeiten
- Eigene Buchungen einsehen und stornieren

### FÃ¼r Administratoren

- Benutzer anzeigen, bearbeiten und lÃ¶schen
- Rollen zwischen `USER` und `ADMIN` Ã¤ndern
- Buchungen verwalten und im Kalender anzeigen
- Veranstaltungen Ã¼ber die Backend-API anlegen, bearbeiten und lÃ¶schen
- Rundmail an registrierte Benutzer auslÃ¶sen

### Systemintegration

- Veranstaltungen Ã¼ber den Herne-Simulator als Multipart-Anfrage einreichen
- Ãœbertragung vom Simulator zum Hauptbackend per MQTT
- Neue Veranstaltungen anlegen oder bestehende anhand der `herneID` aktualisieren
- Buchungs- und Stornierungs-E-Mails lokal mit smtp4dev prÃ¼fen
- REST-APIs Ã¼ber OpenAPI/Swagger untersuchen

## Architektur

```mermaid
flowchart TD
    Browser["React-Frontend"] -->|"HTTP / JWT"| API["Spring-Boot-Backend"]
    API --> DB[(PostgreSQL)]
    API -->|"SMTP"| Mail["smtp4dev"]
    Simulator["Herne-Simulator"] -->|"MQTT: infos/servertest"| Broker["Mosquitto"]
    Broker --> API
```

| Dienst | Aufgabe | Interner Port | Host-Port |
| --- | --- | ---: | ---: |
| `frontend` | React-WeboberflÃ¤che | 3000 | 3000 |
| `backend` | Haupt-API, Authentifizierung, Events, Buchungen, Benutzer | 8080 | 8090 |
| `backend-herne` | Simuliert die Event-Schnittstelle der Stadt Herne | 8081 | 8091 |
| `database` | PostgreSQL-Datenbank `eventsManagement` | 5432 | 5433 |
| `mosquitto` | MQTT-Broker | 1883 / 9001 | 1883 / 9001 |
| `smtp4dev` | SMTP-Testserver und WeboberflÃ¤che | 25 / 80 | 2525 / 5000 |

Der Simulator verÃ¶ffentlicht JSON-Nachrichten im Topic `infos/servertest`. Das Hauptbackend abonniert dieses Topic und speichert die empfangenen Events in PostgreSQL. Bilder werden dabei als Base64-Text Ã¼bertragen und in der Datenbank gespeichert.

## Technologien

| Bereich | Technologie |
| --- | --- |
| Frontend | React 18, React Router 7, Axios, React Calendar, React Datepicker, Leaflet |
| Hauptbackend | Java 21, Spring Boot 3.4.6, Spring Web, Spring Security, Spring Data JPA |
| Herne-Simulator | Java 17 laut Maven-Konfiguration, Spring Boot 3.5.0 |
| Authentifizierung | JWT mit JJWT 0.12.5, BCrypt |
| Datenbank | PostgreSQL |
| Messaging | Eclipse Paho MQTT, Eclipse Mosquitto |
| API-Dokumentation | springdoc-openapi / Swagger UI |
| E-Mail-Tests | Spring Mail, smtp4dev |
| Container | Docker, Docker Compose |

Die Dockerfiles bauen beide Backends mit Java 21. FÃ¼r eine einheitliche lokale Toolchain ist daher Java 21 die sinnvollste Wahl. Das Frontend-Dockerfile nutzt noch Node.js 18, wÃ¤hrend React Router 7.6.2 laut Paketdefinition mindestens Node.js 20 erwartet. Diese Versionsabweichung sollte bereinigt werden.

## Schnellstart mit Docker Compose

### Voraussetzungen

- Docker Engine oder Docker Desktop
- Docker Compose v2 (`docker compose`)
- freie Host-Ports `1883`, `3000`, `5000`, `5433`, `8090`, `8091` und `9001`

### Anwendung starten

```bash
git clone https://github.com/joeltchoffo/herne-app.git
cd herne-app
docker compose up --build -d
```

Status und Logs prÃ¼fen:

```bash
docker compose ps
docker compose logs -f backend backend-herne frontend
```

Beim ersten Start mÃ¼ssen Images geladen, Maven-AbhÃ¤ngigkeiten aufgelÃ¶st, npm-Pakete installiert und die Datenbanktabellen erzeugt werden. Das kann mehrere Minuten dauern.

### OberflÃ¤chen

| Ziel | URL |
| --- | --- |
| Webanwendung | <http://localhost:3000> |
| Swagger UI des Hauptbackends | <http://localhost:8090/swagger-ui/index.html> |
| OpenAPI-JSON des Hauptbackends | <http://localhost:8090/v3/api-docs> |
| Swagger UI des Herne-Simulators | <http://localhost:8091/swagger-ui/index.html> |
| OpenAPI-JSON des Herne-Simulators | <http://localhost:8091/v3/api-docs> |
| smtp4dev | <http://localhost:5000> |

### Anwendung stoppen

Container stoppen und behalten:

```bash
docker compose stop
```

Container und Netzwerk entfernen:

```bash
docker compose down
```

Lokale Volumes ebenfalls lÃ¶schen:

```bash
docker compose down -v
```

Der letzte Befehl entfernt lokale Containerdaten unwiderruflich.

## Erste Anmeldung und Admin-Zugang

1. Unter <http://localhost:3000/register> ein Benutzerkonto anlegen.
2. Unter <http://localhost:3000/login> anmelden.
3. FÃ¼r reine Benutzerfunktionen ist keine weitere Einrichtung nÃ¶tig.

Jede Ã¶ffentliche Registrierung erhÃ¤lt im Backend fest die Rolle `USER`. FÃ¼r das erste Administratorkonto existiert aktuell kein Bootstrap-Prozess. In einer lokalen Entwicklungsumgebung kann ein bereits registrierter Benutzer deshalb direkt in PostgreSQL hochgestuft werden:

```bash
docker compose exec database psql \
  -U admin_user \
  -d eventsManagement \
  -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.org';"
```

Danach abmelden und erneut anmelden, damit ein neues JWT und die aktualisierte Rolle im Browser gespeichert werden. Dieses Vorgehen ist nur fÃ¼r die lokale Entwicklung gedacht.

## Herne-Simulator verwenden

Der Simulator nimmt `POST /send` als `multipart/form-data` entgegen:

- Part `event`: Event als JSON-Text
- Part `image`: Bilddatei

Beispiel:

```bash
curl --request POST http://localhost:8091/send \
  --form 'event={
    "status":"ACTIVE",
    "herneID":"HERNE-001",
    "eventDate":"2026-08-15",
    "eventLocation":{
      "city":"Herne",
      "street":"Friedrich-Ebert-Platz",
      "houseNumber":2,
      "zip":44623
    },
    "maxParticipant":100,
    "eventPhoto":"",
    "eventDescription":"Beispielveranstaltung aus dem Herne-Simulator",
    "eventName":"Sommerabend 2026",
    "startTime":"18:00",
    "endTime":"20:00",
    "categories":[{"name":"Kultur"}]
  }' \
  --form 'image=@./event.jpg;type=image/jpeg'
```

`eventPhoto` muss im aktuellen DTO vorhanden sein, obwohl der Simulator den Wert anschlieÃŸend durch das hochgeladene Bild ersetzt. Beim erneuten Senden derselben `herneID` wird das vorhandene Event aktualisiert. `status` akzeptiert `ACTIVE`, `CANCELLED` oder `EXPIRED`; Uhrzeiten verwenden das Format `HH:mm`.

Nach erfolgreicher Ãœbertragung erscheint das Event im Hauptbackend und im Frontend. Bei Problemen helfen diese Logs:

```bash
docker compose logs -f backend-herne mosquitto backend
```

## API und Authentifizierung

Das Hauptbackend antwortet Ã¼berwiegend mit einem gemeinsamen Response-Objekt. Je nach Endpunkt enthÃ¤lt es unter anderem:

```json
{
  "statusCode": 200,
  "message": "Successful",
  "token": "<jwt>",
  "role": "USER",
  "user": {},
  "event": {},
  "booking": {},
  "userList": [],
  "eventList": [],
  "bookingList": []
}
```

Nicht benÃ¶tigte Felder werden nicht ausgegeben. GeschÃ¼tzte Aufrufe erwarten:

```http
Authorization: Bearer <jwt>
```

Das Frontend speichert Token und Rolle im `localStorage`. Ein Login-Token ist laut Backend sieben Tage gÃ¼ltig.

### Hauptbackend

| Methode | Pfad | Zugriff | Zweck |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Ã¶ffentlich | Benutzer registrieren; Rolle wird immer `USER` |
| `POST` | `/auth/login` | Ã¶ffentlich | Anmelden und JWT ausgeben |
| `PUT` | `/auth/update` | `USER` | Eigenes Profil Ã¤ndern |
| `PUT` | `/auth/update-user?email=â€¦` | `ADMIN` | Profil eines Benutzers Ã¤ndern |
| `GET` | `/events/all` | Ã¶ffentlich | Alle Events abrufen |
| `GET` | `/events/categories` | Ã¶ffentlich | Kategorien abrufen |
| `GET` | `/events/event-by-id/{eventID}` | Ã¶ffentlich | Event mit Buchungen abrufen |
| `GET` | `/events/all-available-events` | Ã¶ffentlich | Buchbare zukÃ¼nftige Events abrufen |
| `POST` | `/events/add` | `ADMIN` | Event anlegen |
| `PUT` | `/events/update/{eventID}` | `ADMIN` | Event Ã¤ndern |
| `DELETE` | `/events/delete/{eventID}` | `ADMIN` | Event lÃ¶schen |
| `POST` | `/events/notify` | derzeit Ã¶ffentlich | Rundmail versenden |
| `POST` | `/bookings/book-event/{eventID}/{userId}` | `USER` oder `ADMIN` | Event buchen |
| `GET` | `/bookings/all` | `ADMIN` | Alle Buchungen abrufen |
| `GET` | `/bookings/get-by-confirmation-code/{code}` | Ã¶ffentlich | Buchung anhand des Codes finden |
| `DELETE` | `/bookings/cancel/{bookingId}` | `USER` oder `ADMIN` | Buchung stornieren |
| `GET` | `/users/all` | `ADMIN` | Alle Benutzer abrufen |
| `GET` | `/users/get-by-id/{userId}` | angemeldet | Benutzer abrufen |
| `GET` | `/users/get-logged-in-profile-info` | angemeldet | Eigenes Profil abrufen |
| `GET` | `/users/get-user-bookings/{userId}` | angemeldet | Buchungen eines Benutzers abrufen |
| `PUT` | `/users/update/{id}` | `ADMIN` | Benutzer und Rolle Ã¤ndern |
| `DELETE` | `/users/delete/{userId}` | `ADMIN` | Benutzer lÃ¶schen |
| `POST` | `/users/send-feedback` | `USER` | Noch nicht implementierter Feedback-Endpunkt |

Die Swagger UI ist die verlÃ¤sslichste Quelle fÃ¼r Request- und Response-Schemas. FÃ¼r geschÃ¼tzte Aufrufe dort zuerst anmelden, das JWT kopieren und Ã¼ber **Authorize** als Bearer-Token setzen.

### Herne-Simulator

| Methode | Pfad | Zugriff | Zweck |
| --- | --- | --- | --- |
| `POST` | `/send` | Ã¶ffentlich | Event und Bild validieren und per MQTT verÃ¶ffentlichen |

## Lokale Entwicklung

Docker Compose ist der vorgesehene Weg, da Quellcode und Konfiguration interne DNS-Namen wie `database`, `mosquitto` und `smtp4dev` verwenden.

### Frontend separat starten

Voraussetzungen: Node.js 20 oder neuer und npm. Das weicht vom derzeitigen Frontend-Dockerfile ab, verhindert aber den bekannten Engine-Konflikt mit React Router 7.

```bash
cd frontend_app
npm ci
npm start
```

Das Frontend erwartet das Hauptbackend fest unter `http://localhost:8090`. Die Basis-URL steht in `frontend_app/src/service/ApiService.js`.

### Hauptbackend separat starten

Voraussetzungen: Java 21 und Maven 3.9 oder neuer.

```bash
cd backend
mvn spring-boot:run
```

AuÃŸerhalb des Compose-Netzwerks mÃ¼ssen mindestens Datenbank-, MQTT- und SMTP-Hostnamen angepasst oder lokal auflÃ¶sbar gemacht werden.

### Herne-Simulator separat starten

```bash
cd backend_herne
mvn spring-boot:run
```

Auch hier muss der MQTT-Broker unter dem im Quellcode konfigurierten Host erreichbar sein.

## Konfiguration

Die Anwendung verwendet aktuell keine `.env`-Datei und keine konsistente Umgebungsvariablen-Konfiguration. Relevante Stellen:

| Konfiguration | Datei |
| --- | --- |
| Container, Ports, PostgreSQL-Zugang | `docker-compose.yaml` |
| Datenbank, SMTP, Upload-Limits, Backend-Port | `backend/src/main/resources/application.properties` |
| Simulator-Port und Upload-Limits | `backend_herne/src/main/resources/application.properties` |
| Frontend-API-URL | `frontend_app/src/service/ApiService.js` |
| MQTT-Broker, Topic und Client-IDs | `PublisherService.java` und `MqttSubject.java` |
| Mosquitto-Zugriff | `mosquitto/mosquitto.conf` |

Aktuelle Entwicklungswerte:

| Wert | Konfiguration |
| --- | --- |
| Datenbank | `eventsManagement` |
| Datenbankbenutzer | `admin_user` |
| Datenbank-Host im Compose-Netz | `database:5432` |
| SMTP-Host im Compose-Netz | `smtp4dev:25` |
| MQTT-Broker im Compose-Netz | `mosquitto:1883` |
| MQTT-Topic | `infos/servertest` |
| Maximale Upload-GrÃ¶ÃŸe | 2 GB |
| JPA-Schema-Verhalten | `hibernate.ddl-auto=update` |

FÃ¼r andere Umgebungen sollten Zugangsdaten, JWT-SchlÃ¼ssel, externe URLs, CORS-Regeln und Broker-Konfiguration Ã¼ber Umgebungsvariablen oder ein Secret-Management bereitgestellt werden.

## Datenmodell

| EntitÃ¤t | Wesentliche Beziehungen |
| --- | --- |
| `User` | besitzt mehrere Buchungen und Feedback-EintrÃ¤ge |
| `Event` | gehÃ¶rt zu einem Ort, besitzt Kategorien, Buchungen und Feedback |
| `Booking` | verbindet genau einen Benutzer mit genau einem Event |
| `Category` | steht in einer n:m-Beziehung zu Events |
| `Location` | kann mehreren Events zugeordnet sein |
| `Feedback` | verweist auf Benutzer und Event |

Event-Statuswerte sind `ACTIVE`, `CANCELLED` und `EXPIRED`. Eventname und `herneID` sind in der Datenbank eindeutig.

## Tests und Builds

### Frontend

```bash
cd frontend_app
npm ci
npm test -- --watchAll=false
npm run build
```

Der Testlauf schlÃ¤gt mit der aktuellen Kombination aus Create React App 5 und React Router 7 bereits bei der ModulauflÃ¶sung von `react-router-dom` fehl. Der einzige Test in `src/App.test.js` ist auÃŸerdem noch der Create-React-App-Beispieltest und erwartet den nicht mehr vorhandenen Text â€žlearn reactâ€œ. Er prÃ¼ft keine reale Funktion der App. `npm run build` erzeugt dagegen einen Produktionsbuild, aktuell mit einer ESLint-Warnung wegen einer ungenutzten Variable in `ManageBookingsPage.jsx`.

### Hauptbackend

```bash
cd backend
mvn clean verify
```

### Herne-Simulator

```bash
cd backend_herne
mvn clean verify
```

In beiden Backend-Projekten sind aktuell keine Tests unter `src/test` vorhanden. Die GitHub-Actions-Dateien enthalten auÃŸerdem keine wirksame Projektmatrix; der aktuelle CI-Stand baut die Anwendung daher nicht zuverlÃ¤ssig. Ein grÃ¼ner lokaler Build ersetzt noch keine Integrations- oder Sicherheitstests.

## Projektstruktur

```text
herne-app/
├── backend/                  # Hauptbackend mit REST, JPA, JWT, Mail und MQTT-Subscriber
│   ├── src/main/java/...
│   ├── src/main/resources/application.properties
│   ├── Dockerfile
│   └── pom.xml
├── backend_herne/            # Simulator und MQTT-Publisher
│   ├── src/main/java/...
│   ├── src/main/resources/application.properties
│   ├── Dockerfile
│   └── pom.xml
├── frontend_app/             # React-Anwendung
│   ├── public/
│   ├── src/components/
│   ├── src/service/
│   ├── Dockerfile
│   └── package.json
├── mosquitto/mosquitto.conf  # Lokale Broker-Konfiguration
├── docker-compose.yaml       # Gesamtsystem für die Entwicklung
├── LICENSE
└── README.md
```

## Fehlerbehebung

### Ein Port ist bereits belegt

In `docker-compose.yaml` nur den Host-Port links vom Doppelpunkt Ã¤ndern. Beispiel:

```yaml
ports:
  - "8092:8080"
```

Danach mÃ¼ssen Aufrufer wie die Frontend-`BASE_URL` ebenfalls auf den neuen Host-Port zeigen.

### Backend startet vor PostgreSQL oder Mosquitto

`depends_on` steuert nur die Startreihenfolge und wartet nicht auf Betriebsbereitschaft. Falls das Backend beim ersten Start die Verbindung verliert:

```bash
docker compose restart backend backend-herne
docker compose logs -f backend backend-herne
```

### Frontend erreicht das Backend nicht

- PrÃ¼fen, ob <http://localhost:8090/v3/api-docs> erreichbar ist.
- In der Browserkonsole nach CORS- oder Netzwerkfehlern suchen.
- PrÃ¼fen, ob `ApiService.BASE_URL` zum verÃ¶ffentlichten Backend-Port passt.

### Keine E-Mail sichtbar

- smtp4dev unter <http://localhost:5000> Ã¶ffnen.
- `docker compose logs smtp4dev backend` prÃ¼fen.
- Sicherstellen, dass das Backend `smtp4dev:25` im Compose-Netz erreicht.

### Ein Event aus dem Simulator erscheint nicht

- FÃ¼r alle Pflichtfelder gÃ¼ltige Werte senden.
- `eventPhoto` im JSON mitsenden und zusÃ¤tzlich einen `image`-Part hochladen.
- Auf eindeutige Werte fÃ¼r `herneID` und `eventName` achten.
- Logs von `backend-herne`, `mosquitto` und `backend` gemeinsam prÃ¼fen.

### Datenbank vollstÃ¤ndig neu erzeugen

```bash
docker compose down -v
docker compose up --build -d
```

Dabei gehen sÃ¤mtliche lokalen Daten verloren.

## Bekannte EinschrÃ¤nkungen und Sicherheitsrisiken

Die folgenden Punkte sind im aktuellen Code vorhanden und sollten vor einem Produktivbetrieb behoben werden:

- Der JWT-SignaturschlÃ¼ssel ist im Quellcode hinterlegt und muss in ein Secret-Management ausgelagert und rotiert werden.
- Datenbankzugangsdaten stehen im Repository und sind nur als lokale Entwicklungswerte vertretbar.
- Mosquitto erlaubt anonyme Verbindungen; Authentifizierung und TLS fehlen.
- CORS erlaubt jede Origin (`*`).
- `POST /events/notify` ist trotz Admin-OberflÃ¤che Ã¶ffentlich erreichbar und kann Rundmails auslÃ¶sen.
- Mehrere Event- und Booking-Pfade sind global freigegeben; Methodensicherheit schÃ¼tzt nur einen Teil davon.
- Die Ã¶ffentliche Suche per Buchungs-BestÃ¤tigungscode kann personenbezogene Buchungsdaten zurÃ¼ckgeben.
- Angemeldete Benutzer kÃ¶nnen Benutzer- und Buchungsdaten Ã¼ber frei wÃ¤hlbare IDs anfragen; eine EigentumsprÃ¼fung ist nicht erkennbar.
- Das Frontend vertraut fÃ¼r Admin-Routing auf die Rolle im `localStorage`. Die Backend-PrÃ¼fung bleibt maÃŸgeblich, trotzdem sollte die UI-Rolle aus verifizierten Token-Claims abgeleitet werden.

- Die Admin-Seite zum Anlegen eines Benutzers bietet `ADMIN` an, verwendet aber denselben Registrierungs-Endpunkt; die Auswahl wird dadurch nicht Ã¼bernommen.
- `POST /users/send-feedback` enthÃ¤lt nur einen TODO-Kommentar und speichert kein Feedback.
- Im Frontend existieren Aufrufe fÃ¼r `/events/search` und `/locations/all`, fÃ¼r die das Backend keine Controller-Endpunkte bereitstellt. Der aktuell verwendete Event-Filter arbeitet stattdessen clientseitig.
- Bilder werden als Base64 in MQTT-Nachrichten und in PostgreSQL gespeichert. Das ist fÃ¼r groÃŸe Dateien speicher- und bandbreitenineffizient. Gleichzeitig erlaubt die Konfiguration Uploads bis 2 GB.
- Die Container haben keine Healthchecks. Startfehler durch noch nicht bereite AbhÃ¤ngigkeiten sind mÃ¶glich.
- Das Frontend lÃ¤uft im Container Ã¼ber den Entwicklungsserver und ist kein optimierter Produktionsbuild.
- Das Frontend-Dockerfile verwendet Node.js 18, React Router 7.6.2 verlangt laut Paketmetadaten jedoch Node.js 20 oder neuer.
- AussagekrÃ¤ftige Unit-, Integrations- und End-to-End-Tests fehlen; der einzige Frontend-Test ist veraltet.
- Fehler werden teilweise mit Stacktraces oder `console.log` ausgegeben; strukturiertes Logging und zentrale Fehlerbehandlung fehlen.
