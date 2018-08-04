import _ from "lodash";

import { FormLineId, FormLineInfo } from "../FormLines/FormDefintionLinesProcessor";
import { getIn, setIn } from "../FormStore/ImmutableOperators";
import { NormalizedPath, startsWith } from "../Path";
import { GenericModelValidator } from "../Types";

export function getRequiredLines<T>(
    subject: T,
    requiredByDefaultPaths: NormalizedPath[],
    formLineInfos: FormLineInfo[],
    validator: GenericModelValidator<T>
): FormLineId[] {
    const validationResult = validator(subject);
    return _.uniq([
        ...formLineInfos
            .filter(line => line.fields.some(path => validationResult.some(x => startsWith(x.path, path))))
            .map(x => x.id),
        ...formLineInfos
            .filter(line => line.fields.some(path => requiredByDefaultPaths.some(x => startsWith(x, path))))
            .map(x => x.id),
    ]);
}

export function getRequiredLinesForList<T>(
    subject: T[],
    requiredByDefaultPaths: NormalizedPath[],
    formLineInfos: FormLineInfo[],
    validator: GenericModelValidator<T[]>
): FormLineId[] {
    const validationResult = validator(subject);
    return _.uniq([
        ...formLineInfos
            .filter(line => line.fields.some(path => validationResult.some(x => startsWith(x.path.slice(1), path))))
            .map(x => x.id),
        ...formLineInfos
            .filter(line => line.fields.some(path => requiredByDefaultPaths.some(x => startsWith(x, path))))
            .map(x => x.id),
    ]);
}

export function updateValueByHiddenLinesWithPreseveValues<T>(
    subject: T,
    formLineInfos: FormLineInfo[],
    hiddenLineIds: FormLineId[]
): T {
    let result = subject;
    const hiddenLines = formLineInfos.filter(x => hiddenLineIds.includes(x.id));

    // TODO срочно переписать, так чтобы было понятно!!!
    result = hiddenLines.filter(x => someFieldOfLineFilled(subject, x)).reduce(
        (rootSubject, line) =>
            line.fields.reduce((xxx, path) => {
                const fieldValue = getIn(xxx, path);
                if (fieldValue != null) {
                    let childResult = xxx;
                    childResult = setIn(childResult, ["__HIDDEN_FIELDS__"], {
                        ...childResult["__HIDDEN_FIELDS__"],
                        [path.join(".")]: fieldValue,
                    });
                    childResult = setIn(childResult, path, undefined);
                    return childResult;
                }
                return xxx;
            }, rootSubject),
        result
    );
    result = formLineInfos
        .filter(x => !hiddenLineIds.includes(x.id))
        .filter(x => someFieldOfLineHidden(subject, x))
        .reduce(
            (rootSubject, line) =>
                line.fields.reduce((xxx, path) => {
                    const fieldValue = xxx["__HIDDEN_FIELDS__"][path.join(".")];
                    if (fieldValue != null) {
                        let childResult = xxx;
                        childResult = setIn(childResult, path, fieldValue);
                        childResult = setIn(childResult, ["__HIDDEN_FIELDS__"], {
                            ...childResult["__HIDDEN_FIELDS__"],
                            [path.join(".")]: undefined,
                        });
                        return childResult;
                    }
                    return xxx;
                }, rootSubject),
            result
        );
    return result;
}

export function updateValueByHiddenLinesWithPreseveValuesForArray<T>(
    subject: null | undefined | T[],
    formLineInfos: FormLineInfo[],
    hiddenLines: FormLineId[]
): null | undefined | T[] {
    const result = subject;
    if (subject == undefined) {
        return subject;
    }
    return subject.map(x => updateValueByHiddenLinesWithPreseveValues(x, formLineInfos, hiddenLines));
}

export function getFilledLineIds<T>(subject: T, lines: FormLineInfo[]): FormLineId[] {
    return lines.filter(x => someFieldOfLineFilled(subject, x)).map(x => x.id);
}

export function getFilledLineIdsForArray<T, TItem>(
    subject: undefined | null | T[],
    lines: FormLineInfo[]
): FormLineId[] {
    if (subject == undefined) {
        return [];
    }
    const result: FormLineId[] = [];
    for (const item of subject) {
        for (const line of lines) {
            if (result.includes(line.id)) {
                continue;
            }
            if (someFieldOfLineFilled(item, line)) {
                result.push(line.id);
            }
        }
    }
    return result;
}

export function someFieldOfLineFilled<T>(subject: T, line: FormLineInfo): boolean {
    return line.fields.some(x => getIn(subject, x));
}
export function someFieldOfLineHidden<T>(subject: T, line: FormLineInfo): boolean {
    return line.fields.some(x => subject && subject["__HIDDEN_FIELDS__"] && subject["__HIDDEN_FIELDS__"][x.join(".")]);
}
