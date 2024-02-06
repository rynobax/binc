import levy from "js-levenshtein";
import { convertNumberToWords } from "./numbers";

type Modifier = (str: string) => string;

function replaceNumbersWithStrings(input: string): string {
  const parts = input.split(/(\d+)/);
  const processedParts = parts.map((part) => {
    // Check if the part is a number by trying to parse it
    const number = parseInt(part, 10);
    if (!isNaN(number)) {
      // It's a number, so convert it to words
      return convertNumberToWords(number);
    } else {
      // Not a number, return as is
      return part;
    }
  });
  return processedParts.join("");
}

const MODIFICATIONS: Modifier[] = [
  (str) => str.replace(/[\W_]+/g, ""),
  (str) => str.split(" (")[0],
  (str) => str.split(" - ")[0],
  (str) => str.replace(/\s?the\s?/g, ""),
  replaceNumbersWithStrings,
];
const COMBINATIONS = getAllCombinations(MODIFICATIONS);

function areStringsEqual(target: string, guess: string) {
  if (target.length <= 4) return target === guess;
  const distance = levy(target, guess);
  const maxDistance = Math.max(target.length / 4, 3);
  return distance <= maxDistance;
}

export function isGuessCorrect(
  // song or artist name
  target: string,
  // use guess
  guess: string
) {
  const lowerTarget = target.toLocaleLowerCase();
  const lowerGuess = guess.toLocaleLowerCase();
  for (const guessMods of COMBINATIONS) {
    for (const targetMods of COMBINATIONS) {
      let modifiedTarget = lowerTarget;
      for (const mod of targetMods) {
        modifiedTarget = mod(modifiedTarget);
      }

      let modifiedGuess = lowerGuess;
      for (const mod of guessMods) {
        modifiedGuess = mod(modifiedGuess);
      }

      if (areStringsEqual(modifiedTarget, modifiedGuess)) return true;
    }
  }
  return false;
}

function getAllCombinations<T>(arr: T[]): T[][] {
  const combinations: T[][] = [];

  function helper(start: number, currentCombination: T[]) {
    combinations.push([...currentCombination]);

    for (let i = start; i < arr.length; i++) {
      // Include the current element
      currentCombination.push(arr[i]);
      // Recurse with the next element
      helper(i + 1, currentCombination);
      // Exclude the current element and move to the next
      currentCombination.pop();
    }
  }

  helper(0, []);
  return combinations;
}
