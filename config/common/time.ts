const secs = [60, 60, 24, 30].reduce((acc: number[], n) => {
  const last = acc.length === 0 ? 1 : acc[acc.length - 1];
  acc.push(last * n);
  return acc;
}, []);

export const secsIn = {
  min: secs[0],
  hour: secs[1],
  day: secs[2],
  month: secs[3],
};
