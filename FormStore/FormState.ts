import { ValidationResult } from "Commons/Mutators/Types";
import { GenericModelValidator } from "../Types";

export interface FormState<T, TContext = any> {
    value: T;
    context: TContext;
    validator?: GenericModelValidator<T>;
    validationResult?: ValidationResult;
}
