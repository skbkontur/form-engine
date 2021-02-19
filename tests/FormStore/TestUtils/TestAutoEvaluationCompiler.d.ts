import { parse } from "@babel/parser";

import { AutoEvaluator } from "../../../AutoEvaluators";
import { DeepNonNullableWithLeafs } from "../../../Types";

export declare function compileAutoEvaluator<T>(expression: (x: DeepNonNullableWithLeafs<T>) => void): AutoEvaluator<T>;
