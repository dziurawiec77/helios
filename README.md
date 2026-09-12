# Helios

Trójwymiarowy Układ Słoneczny: Słońce, osiem planet, Księżyc, pas asteroidów. Tempo, pauza, orbity, etykiety i przybliżenie po kliknięciu.

Okresy orbitalne zachowują prawdziwe stosunki lat syderycznych. Odległości są ściśnięte, żeby układ zmieścił się na ekranie.

## Uruchomienie

Potrzebujesz Node.js 22.

```bash
npm install
npm run dev
```

Produkcja:

```bash
npm run build
npm run preview
```

## Sterowanie

- klik w planetę albo nazwę na pasku — przybliżenie i karta
- pauza, orbity, etykiety, suwak tempa
- klawiatura: spacja, Esc, 0–9, `[` `]`, R, O, L

## Hosting

Aplikacja jest zbudowana pod Grok (`*.grok.me`) / Vercel (Nitro).  
Netlify nie jest natywnym celem tego stosu — wrzucenie repozytorium 1:1 na Netlify nie zadziała bez zmiany adaptera.

Kopia w tym archiwum to pełne źródło Heliosa do własnego `npm install` i dalszej pracy.
