import { NormalizedPath } from "../Path";

interface FormUpdateAction {
    type: "UpdateValue";
    path: NormalizedPath;
    value: any;
}

interface FormReplaceValueAction {
    type: "ReplaceValue";
    value: any;
}

interface InitAction {
    type: "@@redux/INIT";
}

export type FormAction = InitAction | FormReplaceValueAction | FormUpdateAction;

export function userUpdateValue(path: NormalizedPath, value: any): FormAction {
    return {
        type: "UpdateValue",
        path: path,
        value: value,
    };
}

export function replaceValue(value: any): FormAction {
    return {
        type: "ReplaceValue",
        value: value,
    };
}
