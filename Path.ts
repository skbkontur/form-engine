import { getPath } from "lens";

export type Path<T, TR> = (value: T) => TR;

export type NormalizedPath = Array<string | number>;

export function startsWith(path: NormalizedPath, prefix: NormalizedPath): boolean {
    return prefix.every((prefixItem, index) => path[index] != null && path[index].toString() === prefixItem.toString());
}

const normalizedPathCache = new Map();

export function getNormalizedPath<TTarget extends {}, TProp>(lambda: (target: TTarget) => TProp): NormalizedPath {
    let result = normalizedPathCache.get(lambda);
    if (result == undefined) {
        result = getPath(lambda);
        normalizedPathCache.set(lambda, result);
    }
    return result;
}
