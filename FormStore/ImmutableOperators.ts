import * as _ from "lodash";

import { NormalizedPath } from "../Path";
import { getNormalizedPath } from "../Path";

function isPrimitive<T>(value: T): boolean {
    if (value == null) {
        return false;
    }
    if (typeof value !== "object" && !Array.isArray(value)) {
        return true;
    }
    return false;
}

export function getIn<T>(target: T, path: NormalizedPath): any {
    return _.get(target, path);
}

export function setIn<T>(target: T, path: NormalizedPath, value: any): T {
    if (path.length === 0) {
        return value;
    }
    if (isPrimitive(target)) {
        return target;
    }
    const [currentPathItem, ...restPath] = path;
    if (typeof currentPathItem === "number" && (Array.isArray(target) || target == null)) {
        const result: any = target == null ? [] : [...target];
        result[currentPathItem] = setIn(target == null ? null : target[currentPathItem], restPath, value);
        return result;
    } else if (typeof currentPathItem === "string" && Array.isArray(target)) {
        const result: any = target == null ? [] : [...target];
        result[currentPathItem] = setIn(target == null ? null : target[currentPathItem], restPath, value);
        return result;
    } else {
        return {
            ...(target as any),
            [currentPathItem]: setIn(target == null ? null : target[currentPathItem], restPath, value),
        };
    }
}
