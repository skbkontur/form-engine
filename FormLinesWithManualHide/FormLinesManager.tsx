import * as React from "react";
import { FormLineId, FormLineInfo } from "../FormLines/FormDefintionLinesProcessor";
import * as _ from "lodash";
import {
    getFilledLineIds,
    getRequiredLines,
    updateValueByHiddenLinesWithPreseveValues,
} from "./FormLinesWithManualHideUtils";
import { GenericModelValidator } from "../Types";
import { NormalizedPath } from "../Path";
import { FormLinesContext } from "./FormLinesContext";
import { DocumentTypes } from "Domain/EDI/DocumentCirculationMeta/DocumentType";
import MessageMonitoringLocalStorage from "../../../MessageMonitoring/api/messageMonitoringLocalStorage";

interface FormLinesManagerProps<TData> {
    lines: FormLineInfo[];
    value: TData;
    onChangeValue: (nextValue: TData) => void;
    validator?: GenericModelValidator<TData>;
    requiredByDefaultPaths: NormalizedPath[];
    children: (context: FormLinesContext) => JSX.Element;
}

interface FormLinesManagerState {
    hiddenLines: FormLineId[];
    requiredByValidator: FormLineId[];
}

export class FormLinesManager<TData> extends React.Component<FormLinesManagerProps<TData>, FormLinesManagerState> {
    state: FormLinesManagerState;

    constructor(props: FormLinesManagerProps<TData>) {
        super(props);
        const allLineids = props.lines.map(x => x.id);
        const initialHiddenLineIds =
            MessageMonitoringLocalStorage.getVisibleFieldsInMessageCreatorNew(DocumentTypes.Invoic, "Root") ||
            props.lines.filter(x => x.hiddenByDefault).map(x => x.id);
        const requiredByValidator = props.validator
            ? getRequiredLines(props.value, props.requiredByDefaultPaths, props.lines, props.validator)
            : [];
        this.state = {
            hiddenLines: _.difference(
                initialHiddenLineIds,
                getFilledLineIds(props.value, props.lines),
                requiredByValidator
            ),
            requiredByValidator: requiredByValidator,
        };
    }

    componentWillReceiveProps(nextProps: FormLinesManagerProps<TData>) {
        this.recalculateRequiredFieldsDebounced(nextProps);
    }

    handleSaveLines = () => {
        MessageMonitoringLocalStorage.setVisibleFieldsInMessageCreatorNew(
            DocumentTypes.Invoic,
            "Root",
            this.state.hiddenLines
        );
    };

    recalculateRequiredFields = (props: FormLinesManagerProps<TData>) => {
        const requiredByValidator = props.validator
            ? getRequiredLines(props.value, props.requiredByDefaultPaths, props.lines, props.validator)
            : [];
        const nextHiddenLines = _.difference(this.state.hiddenLines, requiredByValidator);
        const nextLines = props.lines.map(x => ({ ...x, requiredByValidator: requiredByValidator.includes(x.id) }));
        if (
            !isArrayContainsSameItems(this.state.hiddenLines, nextHiddenLines) ||
            !isArrayContainsSameItems(this.state.requiredByValidator, requiredByValidator)
        ) {
            this.setState({
                hiddenLines: nextHiddenLines,
                requiredByValidator: requiredByValidator,
            });
        }
    };

    recalculateRequiredFieldsDebounced = _.debounce(this.recalculateRequiredFields, 800);

    handleChangeHiddenFields = (hiddenLines: FormLineId[]) => {
        this.setState({
            hiddenLines: hiddenLines,
        });
        this.props.onChangeValue(
            updateValueByHiddenLinesWithPreseveValues(this.props.value, this.props.lines, hiddenLines)
        );
    };

    render(): JSX.Element {
        return this.props.children({
            hiddenLines: this.state.hiddenLines,
            requiredByValidator: this.state.requiredByValidator,
            onChangeHiddenLines: this.handleChangeHiddenFields,
            onSave: this.handleSaveLines,
        });
    }
}

function isArrayContainsSameItems<T>(left: T[], right: T[]) {
    return _.difference(left, right).length === 0 && _.difference(right, left).length === 0;
}
