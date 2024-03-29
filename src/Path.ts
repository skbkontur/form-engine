function getPath(propertyPicker: any) {
    const fieldsString = /(?:return|=>)[^{}()]*?(\.([^{}()]*?))?([;})]|$)/.exec(
        propertyPicker.toString().replace(/[\n\t\r]/g, "")
    );
    if (!fieldsString) {
        throw new Error(`Cannot extract path from function: ${propertyPicker.toString()}`);
    }
    if (fieldsString && !fieldsString[2]) {
        return [];
    }
    return fieldsString[2].replace(/\["?/g, ".").replace(/"?]/g, "").split(".");
}

export type Path<T, TR> = (value: T) => TR;

export type PathWithContext<T, TR, TC> = (value: T, context: TC) => TR;

export type NormalizedPath = Array<string | number>;

export function startsWith(path: NormalizedPath, prefix: NormalizedPath): boolean {
    return prefix.every((prefixItem, index) => path[index] != null && path[index].toString() === prefixItem.toString());
}

const normalizedPathCache = new Map();

export function combineNormalizedPath(left: NormalizedPath, right: NormalizedPath): NormalizedPath {
    return [...left, ...right];
}

export function getNormalizedPath<TTarget extends {}, TProp, TContext extends {}>(
    lambda: (target: TTarget, context?: TContext) => TProp
): NormalizedPath {
    let result = normalizedPathCache.get(lambda);
    if (result == undefined) {
        result = getPath(lambda);
        normalizedPathCache.set(lambda, result);
    }
    return result;
}
