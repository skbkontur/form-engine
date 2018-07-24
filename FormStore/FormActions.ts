import { NormalizedPath } from "../Path";

type FormUpdateAction = {
    type: "UpdateValue";
    path: NormalizedPath;
    value: any;
};

type FormReplaceValueAction = {
    type: "ReplaceValue";
    value: any;
};

type InitAction = {
    type: "@@redux/INIT";
};

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
