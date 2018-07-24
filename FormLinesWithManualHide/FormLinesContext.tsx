import { FormLineId } from "../FormLines/FormDefintionLinesProcessor";

export interface FormLinesContext {
    hiddenLines: FormLineId[];
    requiredByValidator: FormLineId[];
    onChangeHiddenLines: (hiddenLines: FormLineId[]) => void;
    onSave: () => void;
}
