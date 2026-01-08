# OpenCode Manager - Wdrożenie na Easypanel

## Szybki Start

OpenCode Manager został przystosowany do łatwego wdrożenia na Easypanel. Ten przewodnik pomoże Ci uruchomić aplikację na VPS w kilka minut.

## Wymagania

- VPS z Ubuntu 20.04+ (minimum 2GB RAM, 20GB dysk)
- Domena wskazująca na IP Twojego VPS
- Otwarte porty 80 i 443

## Kroki Instalacji

### 1. Zainstaluj Easypanel

```bash
# Zainstaluj Docker
curl -sSL https://get.docker.com | sh

# Zainstaluj Easypanel
docker run --rm \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```

Przejdź do `http://adres-ip-vps:3000` i ukończ kreator konfiguracji.

### 2. Wdróż OpenCode Manager

#### Opcja A: Z repozytorium GitHub (zalecane)

1. W Easypanel: **Utwórz Nowy Projekt** → **GitHub Repository**
2. Podłącz konto GitHub
3. Wybierz repozytorium: `grand151/opencode-manager`
4. Gałąź: `main`
5. Metoda budowania: **Docker Compose**
6. Plik: `docker-compose.yml`

#### Opcja B: Używając Docker Compose

1. W Easypanel: **Utwórz Nowy Projekt** → **Docker Compose**
2. Użyj pliku: `docker-compose.easypanel.yml`
3. Lub użyj obrazu: `ghcr.io/grand151/opencode-manager:latest`

### 3. Skonfiguruj Zmienne Środowiskowe

W ustawieniach projektu dodaj:

```env
# Twoja domena
DOMAIN=opencode.twojadomena.pl

# Podstawowa konfiguracja
NODE_ENV=production
PORT=5003
HOST=0.0.0.0
CORS_ORIGIN=https://opencode.twojadomena.pl

# Opcjonalne: Dostosuj limity
MAX_FILE_SIZE_MB=100
MAX_UPLOAD_SIZE_MB=100
```

### 4. Skonfiguruj Domenę

1. Przejdź do zakładki **Domeny**
2. Dodaj domenę: `opencode.twojadomena.pl`
3. Easypanel automatycznie utworzy certyfikat SSL

### 5. Wdróż

Kliknij przycisk **Deploy** i poczekaj 5-10 minut na pierwszą kompilację.

## Weryfikacja

Sprawdź status zdrowia:
```bash
curl https://opencode.twojadomena.pl/api/health
```

Powinno zwrócić:
```json
{
  "status": "ok",
  "version": "0.5.7",
  "opencode": {
    "installed": true,
    "running": true
  }
}
```

## Dostępne Porty

Aplikacja eksponuje następujące porty dla serwerów deweloperskich:

- **5003** - Główna aplikacja OpenCode Manager
- **5100-5103** - Porty dla serwerów deweloperskich w repozytoriach

## Zarządzanie

### Oglądanie Logów

W Easypanel: **Projekt** → Zakładka **Logs**

Lub przez CLI:
```bash
docker logs -f opencode-manager
```

### Aktualizacja

**Automatyczna** (zalecane):
- Włącz "Auto Deploy" w ustawieniach projektu

**Ręczna**:
- Kliknij przycisk **Rebuild** w Easypanel

### Restart

W Easypanel: Kliknij przycisk **Restart**

Lub przez CLI:
```bash
docker restart opencode-manager
```

## Kopia Zapasowa

Dane są przechowywane w wolumenach Docker:

```bash
# Zatrzymaj aplikację
docker stop opencode-manager

# Utwórz kopię zapasową
docker run --rm \
  -v opencode-workspace:/workspace \
  -v opencode-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/opencode-backup-$(date +%Y%m%d).tar.gz /workspace /data

# Uruchom ponownie
docker start opencode-manager
```

## Zaawansowana Konfiguracja

Pełna dokumentacja dostępna w [DEPLOYMENT.md](./DEPLOYMENT.md) (w języku angielskim):

- Szczegółowa konfiguracja zmiennych środowiskowych
- Ustawienie reverse proxy (Nginx, Caddy)
- Strategie backup i restore
- Rozwiązywanie problemów
- Best practices bezpieczeństwa

## Pliki Konfiguracyjne

Projekt zawiera trzy pliki Docker Compose:

1. **`docker-compose.yml`** - Główny plik z pełną konfiguracją
2. **`docker-compose.easypanel.yml`** - Uproszczona wersja dla Easypanel
3. **`.env.production`** - Przykładowa konfiguracja produkcyjna

## Funkcje dla Produkcji

✅ Automatyczny SSL z Let's Encrypt  
✅ Health checks i auto-restart  
✅ Trwałe wolumeny danych  
✅ Konfiguracja przez zmienne środowiskowe  
✅ Wsparcie reverse proxy (Traefik/Nginx/Caddy)  
✅ Gotowe do skalowania poziomego  

## Wsparcie

- **Problemy:** [GitHub Issues](https://github.com/grand151/opencode-manager/issues)
- **Dyskusje:** [GitHub Discussions](https://github.com/grand151/opencode-manager/discussions)
- **Dokumentacja angielska:** [DEPLOYMENT.md](./DEPLOYMENT.md)

## Bezpieczeństwo

1. ✅ Zawsze używaj HTTPS w produkcji
2. ✅ Regularnie aktualizuj do najnowszej wersji
3. ✅ Twórz regularne kopie zapasowe
4. ✅ Używaj silnych haseł dla GitHub PAT i OAuth
5. ✅ Ogranicz CORS do swojej domeny
6. ✅ Monitoruj logi pod kątem podejrzanej aktywności

---

*Ostatnia aktualizacja: 2026-01-08*
