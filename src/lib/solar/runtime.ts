import type { Object3D } from "three";

export const bodyObjects = new Map<string, Object3D>();
export const simClock = { time: 0 };
export const inputFlags = { dragging: false };

export const SPACE = {
  bg: "#05060a",
  orbit: "#4a4e56",
  orbitActive: "#b8c0cc",
  sun: "#f0c48a",
};

export function registerBody(id: string, obj: Object3D | null) {
  if (obj) bodyObjects.set(id, obj);
  else bodyObjects.delete(id);
}
