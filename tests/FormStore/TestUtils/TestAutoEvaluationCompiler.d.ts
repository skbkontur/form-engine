import { AutoEvaluator } from "../../../src/AutoEvaluators";
import { DeepNonNullableWithLeafs } from "../../../src/Types";

export declare function compileAutoEvaluator<T>(expression: (x: DeepNonNullableWithLeafs<T>) => void): AutoEvaluator<T>;
