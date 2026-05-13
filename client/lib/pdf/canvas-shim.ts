export function createCanvas(): never {
  throw new Error("The canvas package is not available in the browser bundle.");
}

export default { createCanvas };
