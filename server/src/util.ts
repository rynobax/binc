let id = 1000;

export function generateId() {
  const strID = id.toString();
  id++;
  return strID;
}

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function shuffle<T>(arr: T[]) {
  const length = arr.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  const result = [...arr];
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result;
}
