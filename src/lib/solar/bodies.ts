export type BodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

export type BodyDef = {
  id: BodyId;
  name: string;
  parent?: BodyId;
  radius: number;
  orbitRadius: number;
  orbitPeriod: number;
  rotationPeriod: number;
  inclination: number;
  tilt: number;
  phase: number;
  color: string;
  atmosphere?: string;
  hasRings?: boolean;
  clouds?: boolean;
  facts: {
    kind: string;
    distance: string;
    diameter: string;
    year: string;
    day: string;
    moons: string;
    summary: string;
  };
};

const DEG = Math.PI / 180;

/** One Earth year in simulation seconds. Distances are compressed; periods keep real sidereal ratios. */
export const EARTH_YEAR = 22;

const sidereal = (years: number) => EARTH_YEAR * years;
const MOON_SIDEREAL = 27.321661 / 365.256363;

export const BODIES: BodyDef[] = [
  {
    id: "sun",
    name: "Słońce",
    radius: 2.55,
    orbitRadius: 0,
    orbitPeriod: 1,
    rotationPeriod: 28,
    inclination: 0,
    tilt: 7.25 * DEG,
    phase: 0,
    color: "#ffd19a",
    facts: {
      kind: "Gwiazda ciągu głównego (G2V)",
      distance: "—",
      diameter: "1 392 700 km",
      year: "—",
      day: "25,4 dnia (równik)",
      moons: "8 planet",
      summary:
        "Serce Układu Słonecznego. Grawitacja Słońca utrzymuje planety na orbitach, a jego światło napędza klimat Ziemi.",
    },
  },
  {
    id: "mercury",
    name: "Merkury",
    radius: 0.38,
    orbitRadius: 9.2,
    orbitPeriod: sidereal(0.2408467),
    rotationPeriod: 18,
    inclination: 7 * DEG,
    tilt: 0.03 * DEG,
    phase: 0.7,
    color: "#9a9590",
    facts: {
      kind: "Planeta skalista",
      distance: "0,39 au",
      diameter: "4 879 km",
      year: "88 dni",
      day: "59 dni",
      moons: "brak",
      summary:
        "Najbliższy Słońcu i najszybszy na orbicie. Powierzchnia usiana kraterami, bez atmosfery, z ekstremalnymi wahaniami temperatury.",
    },
  },
  {
    id: "venus",
    name: "Wenus",
    radius: 0.72,
    orbitRadius: 12.4,
    orbitPeriod: sidereal(0.61519726),
    rotationPeriod: -40,
    inclination: 3.4 * DEG,
    tilt: 177.4 * DEG,
    phase: 2.1,
    color: "#e6d2a8",
    atmosphere: "#ead9b0",
    facts: {
      kind: "Planeta skalista",
      distance: "0,72 au",
      diameter: "12 104 km",
      year: "225 dni",
      day: "243 dni (wsteczny)",
      moons: "brak",
      summary:
        "Najgorętsza planeta układu. Gęsta, toksyczna atmosfera zatrzymuje ciepło, a obrót jest wolny i wsteczny.",
    },
  },
  {
    id: "earth",
    name: "Ziemia",
    radius: 0.76,
    orbitRadius: 16.2,
    orbitPeriod: sidereal(1),
    rotationPeriod: 8,
    inclination: 0,
    tilt: 23.4 * DEG,
    phase: 4.2,
    color: "#6b93d6",
    atmosphere: "#7eb6ff",
    clouds: true,
    facts: {
      kind: "Planeta skalista",
      distance: "1 au",
      diameter: "12 756 km",
      year: "365,25 dnia",
      day: "23 h 56 min",
      moons: "1",
      summary:
        "Jedyna znana planeta z życiem. Ciekła woda, tlenowa atmosfera i pole magnetyczne tworzą kruchą, błękitną równowagę.",
    },
  },
  {
    id: "moon",
    name: "Księżyc",
    parent: "earth",
    radius: 0.22,
    orbitRadius: 1.85,
    orbitPeriod: sidereal(MOON_SIDEREAL),
    rotationPeriod: sidereal(MOON_SIDEREAL),
    inclination: 5.1 * DEG,
    tilt: 6.7 * DEG,
    phase: 0.4,
    color: "#c4c0b6",
    facts: {
      kind: "Księżyc Ziemi",
      distance: "384 400 km od Ziemi",
      diameter: "3 475 km",
      year: "27,3 dnia",
      day: "27,3 dnia (synchroniczny)",
      moons: "—",
      summary:
        "Towarzysz Ziemi, odpowiedzialny za pływy. Zawsze zwraca ku nam tę samą stronę.",
    },
  },
  {
    id: "mars",
    name: "Mars",
    radius: 0.5,
    orbitRadius: 20.4,
    orbitPeriod: sidereal(1.8808476),
    rotationPeriod: 8.4,
    inclination: 1.85 * DEG,
    tilt: 25.2 * DEG,
    phase: 5.6,
    color: "#c07a54",
    atmosphere: "#d9a078",
    facts: {
      kind: "Planeta skalista",
      distance: "1,52 au",
      diameter: "6 792 km",
      year: "687 dni",
      day: "24,6 h",
      moons: "2",
      summary:
        "Czerwona planeta. Suche koryta rzek i czapy polarne świadczą o wodnej przeszłości — dziś panuje cienka, zimna atmosfera.",
    },
  },
  {
    id: "jupiter",
    name: "Jowisz",
    radius: 2.15,
    orbitRadius: 28.6,
    orbitPeriod: sidereal(11.862615),
    rotationPeriod: 4.8,
    inclination: 1.3 * DEG,
    tilt: 3.1 * DEG,
    phase: 1.2,
    color: "#d4b48a",
    atmosphere: "#e0c49a",
    facts: {
      kind: "Gigant gazowy",
      distance: "5,20 au",
      diameter: "142 984 km",
      year: "11,9 roku",
      day: "9,9 h",
      moons: "115",
      summary:
        "Największa planeta układu. Potężne pasy chmur i Wielka Czerwona Plama — antycyklon większy od Ziemi.",
    },
  },
  {
    id: "saturn",
    name: "Saturn",
    radius: 1.85,
    orbitRadius: 37.4,
    orbitPeriod: sidereal(29.447498),
    rotationPeriod: 5.4,
    inclination: 2.5 * DEG,
    tilt: 26.7 * DEG,
    phase: 3.3,
    color: "#e6d3a8",
    atmosphere: "#eee0bb",
    hasRings: true,
    facts: {
      kind: "Gigant gazowy",
      distance: "9,58 au",
      diameter: "120 536 km",
      year: "29,5 roku",
      day: "10,7 h",
      moons: "293",
      summary:
        "Pan pierścieni. Tysiące cienkich pasm lodu i skał okrążają planetę, a gęstość Saturna jest niższa od wody.",
    },
  },
  {
    id: "uranus",
    name: "Uran",
    radius: 1.15,
    orbitRadius: 46.2,
    orbitPeriod: sidereal(84.016846),
    rotationPeriod: 7.2,
    inclination: 0.8 * DEG,
    tilt: 97.8 * DEG,
    phase: 0.3,
    color: "#9ad4d6",
    atmosphere: "#b7ecee",
    facts: {
      kind: "Gigant lodowy",
      distance: "19,2 au",
      diameter: "51 118 km",
      year: "84 lata",
      day: "17,2 h (wsteczny)",
      moons: "29",
      summary:
        "Leży niemal na boku. Oś obrotu jest przechylona o 98°, więc pory roku trwają po dwie dekady.",
    },
  },
  {
    id: "neptune",
    name: "Neptun",
    radius: 1.1,
    orbitRadius: 54.8,
    orbitPeriod: sidereal(164.79132),
    rotationPeriod: 6.6,
    inclination: 1.8 * DEG,
    tilt: 28.3 * DEG,
    phase: 4.9,
    color: "#4a73d4",
    atmosphere: "#6d94ee",
    facts: {
      kind: "Gigant lodowy",
      distance: "30,1 au",
      diameter: "49 528 km",
      year: "165 lat",
      day: "16,1 h",
      moons: "16",
      summary:
        "Najdalsza planeta. Najsilniejsze wiatry w układzie i głęboki błękit metanowej atmosfery.",
    },
  },
];

export const BODY_BY_ID = Object.fromEntries(BODIES.map((b) => [b.id, b])) as Record<
  BodyId,
  BodyDef
>;

export const PLANETS = BODIES.filter((b) => !b.parent && b.id !== "sun");

export function hitRadius(body: BodyDef) {
  if (body.id === "sun") return body.radius * 1.12;
  if (body.id === "moon") return Math.max(body.radius * 2.8, 0.7);
  if (body.id === "earth") return body.radius * 1.22;
  return Math.max(body.radius * 1.7, 0.72);
}
