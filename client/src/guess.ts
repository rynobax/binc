import levy from "js-levenshtein";

export function isGuessCorrect(target: string, guess: string) {
  if (target.length <= 4)
    return target.toLocaleLowerCase() === guess.toLocaleLowerCase();
  const distance = levy(target.toLocaleLowerCase(), guess.toLocaleLowerCase());
  return distance <= 3;
}
