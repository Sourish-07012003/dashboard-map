export const computeCentroid = (coords: [number, number][]) => {
  const len = coords.length;
  if (len === 0) return [0, 0] as [number, number];
  let sumLat = 0;
  let sumLon = 0;
  coords.forEach(([lat, lon]) => {
    sumLat += lat;
    sumLon += lon;
  });
  return [sumLat / len, sumLon / len] as [number, number];
};

export const evaluateColorRules = (
  value: number,
  rules: { operator: string; value: number; color: string }[]
): string | undefined => {
  for (const r of rules) {
    switch (r.operator) {
      case "<":
        if (value < r.value) return r.color;
        break;
      case "<=":
        if (value <= r.value) return r.color;
        break;
      case ">":
        if (value > r.value) return r.color;
        break;
      case ">=":
        if (value >= r.value) return r.color;
        break;
      case "=":
        if (value === r.value) return r.color;
        break;
    }
  }
  return undefined;
};
