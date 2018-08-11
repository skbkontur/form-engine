import { Dispatch } from "redux";
import { ValidationResult } from "Commons/Mutators/Types";

import { FormState } from "./FormStore/FormState";

type Diff<T, U> = T extends U ? never : T;

type NonNullable<T> = Diff<T, null | undefined>;

// tslint:disable:prettier
export type DeepNonNullable<T> =
    T extends Nullable<string> ? T :
    T extends Nullable<number> ? T :
    T extends Nullable<string | Date> ? T :
    {
        [P in keyof T]-?:
            T[P] extends Array<infer U> ? Array<DeepNonNullable<U>> :
            T[P] extends ReadonlyArray<infer U> ? ReadonlyArray<DeepNonNullable<U>> :
            T[P] extends Nullable<Array<infer U>> ? Array<DeepNonNullable<U>> :
            T[P] extends Object ? DeepNonNullable<NonNullable<T[P]>> :
            T[P]
    };
// tslint:enable:prettier

export type GenericModelValidator<TData> = (value: TData) => ValidationResult;

export type ValuePicker<T, TContext, TR> = (value: T, context: TContext) => TR;

export type FormDispatch<TData> = Dispatch<FormState<TData>>;
