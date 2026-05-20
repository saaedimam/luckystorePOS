export const toPaisa = (taka: number) => Math.round(taka * 100);
export const toTaka = (paisa: number) => paisa / 100;
export const fmtTaka = (paisa: number) => `৳${(paisa / 100).toFixed(2)}`;
