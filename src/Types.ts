import { Dispatch } from "redux";

import { FormAction } from "./FormStore/FormActions";

// tslint:disable:prettier
export type DeepNonNullableWithLeafs<T> = T extends Nullable<string>
    ? string
    : T extends Nullable<number>
    ? number
    : T extends Nullable<string | Date>
    ? string | Date
    : {
          [P in keyof T]-?: T[P] extends Array<infer U>
              ? Array<DeepNonNullableWithLeafs<U>>
              : T[P] extends ReadonlyArray<infer U>
              ? ReadonlyArray<DeepNonNullableWithLeafs<U>>
              : T[P] extends Nullable<Array<infer U>>
              ? Array<DeepNonNullableWithLeafs<U>>
              : T[P] extends Nullable<unknown>
              ? DeepNonNullableWithLeafs<NonNullable<T[P]>>
              : T[P];
      };
// tslint:enable:prettier

export type GenericModelValidator<TData> = (value: TData) => ValidationResult;

export type ValuePicker<T, TContext, TR> = (value: T, context: TContext) => TR;

export type FormDispatch = Dispatch<FormAction>;

export type PathFilter = (path: string) => boolean;

export type NodePath = string[];

export interface ValidationResultItem {
    path: NodePath;
    text: string;
    type?: "submit" | "lostfocus" | "immediate";
}
export type ValidationResult = ValidationResultItem[];
