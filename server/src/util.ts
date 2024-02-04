let id = 1000;

export function generateId() {
  const strID = id.toString();
  id++;
  return strID;
}

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
