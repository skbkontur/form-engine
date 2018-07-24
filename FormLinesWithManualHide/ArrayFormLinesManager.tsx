import * as React from "react";
import { FormLineId, FormLineInfo } from "../FormLines/FormDefintionLinesProcessor";
import * as _ from "lodash";
import {
    getFilledLineIdsForArray,
    getRequiredLinesForList,
    updateValueByHiddenLinesWithPreseveValuesForArray,
} from "./FormLinesWithManualHideUtils";
import { GenericModelValidator } from "../Types";
import { NormalizedPath } from "../Path";
import { FormLinesContext } from "./FormLinesContext";
import MessageMonitoringLocalStorage from "../../../MessageMonitoring/api/messageMonitoringLocalStorage";
import { DocumentTypes } from "Domain/EDI/DocumentCirculationMeta/DocumentType";

interface ArrayChildFormLinesManagerProps<TData> {
    lines: FormLineInfo[];
    value: TData[];
    onChangeValue: (nextValue: TData[]) => void;
    validator?: GenericModelValidator<TData[]>;
    requiredByDefaultPaths: NormalizedPath[];
    children: (context: FormLinesContext) => JSX.Element;
}

interface ArrayChildFormLinesManagerState {
    hiddenLines: FormLineId[];
    requiredByValidator: FormLineId[];
}

export class ArrayChildFormLinesManager<TData> extends React.Component<
    ArrayChildFormLinesManagerProps<TData>,
    ArrayChildFormLinesManagerState
> {
    state: ArrayChildFormLinesManagerState;

    constructor(props: ArrayChildFormLinesManagerProps<TData>) {
        super(props);
        const allLineids = props.lines.map(x => x.id);
        const initialHiddenLineIds =
            MessageMonitoringLocalStorage.getVisibleFieldsInMessageCreatorNew(DocumentTypes.Invoic, "GoodItem") ||
            props.lines.filter(x => x.hiddenByDefault).map(x => x.id);
        const requiredByValidator = props.validator
            ? getRequiredLinesForList(props.value, props.requiredByDefaultPaths, props.lines, props.validator)
            : [];
        this.state = {
            hiddenLines: _.difference(
                initialHiddenLineIds,
                getFilledLineIdsForArray(props.value, props.lines),
                requiredByValidator
            ),
            requiredByValidator: requiredByValidator,
        };
    }

    componentWillReceiveProps(nextProps: ArrayChildFormLinesManagerProps<TData>) {
        this.recalculateRequiredFieldsDebounced(nextProps);
    }

    handleSaveLines = () => {
        MessageMonitoringLocalStorage.setVisibleFieldsInMessageCreatorNew(
            DocumentTypes.Invoic,
            "GoodItem",
            this.state.hiddenLines
        );
    };

    recalculateRequiredFields = (props: ArrayChildFormLinesManagerProps<TData>) => {
        const requiredByValidator = props.validator
            ? getRequiredLinesForList(props.value, props.requiredByDefaultPaths, props.lines, props.validator)
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
            updateValueByHiddenLinesWithPreseveValuesForArray(this.props.value, this.props.lines, hiddenLines) || []
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
