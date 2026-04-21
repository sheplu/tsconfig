import { double } from "./native-helper.ts";

export const quadruple = (n: number): number => double(double(n));
