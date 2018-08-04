import bind from "bind-decorator";
import * as _ from "lodash";
import * as React from "react";
import { debounce } from "typescript-debounce-decorator";
import { DocumentTypes } from "Domain/EDI/DocumentCirculationMeta/DocumentType";

import MessageMonitoringLocalStorage from "../../../MessageMonitoring/api/messageMonitoringLocalStorage";
import { FormLineId, FormLineInfo } from "../FormLines/FormDefintionLinesProcessor";
import { NormalizedPath } from "../Path";
import { GenericModelValidator } from "../Types";

import { FormLinesContext } from "./FormLinesContext";
import {
    getFilledLineIds,
    getRequiredLines,
    updateValueByHiddenLinesWithPreseveValues,
} from "./FormLinesWithManualHideUtils";

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
    public state: FormLinesManagerState;

    public constructor(props: FormLinesManagerProps<TData>) {
        super(props);
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

    public componentWillReceiveProps(nextProps: FormLinesManagerProps<TData>) {
        this.recalculateRequiredFieldsDebounced(nextProps);
    }

    public render(): JSX.Element {
        return this.props.children({
            hiddenLines: this.state.hiddenLines,
            requiredByValidator: this.state.requiredByValidator,
            onChangeHiddenLines: this.handleChangeHiddenFields,
            onSave: this.handleSaveLines,
        });
    }

    @bind
    private handleSaveLines() {
        MessageMonitoringLocalStorage.setVisibleFieldsInMessageCreatorNew(
            DocumentTypes.Invoic,
            "Root",
            this.state.hiddenLines
        );
    }

    private recalculateRequiredFields(props: FormLinesManagerProps<TData>) {
        const requiredByValidator = props.validator
            ? getRequiredLines(props.value, props.requiredByDefaultPaths, props.lines, props.validator)
            : [];
        const nextHiddenLines = _.difference(this.state.hiddenLines, requiredByValidator);
        if (
            !isArrayContainsSameItems(this.state.hiddenLines, nextHiddenLines) ||
            !isArrayContainsSameItems(this.state.requiredByValidator, requiredByValidator)
        ) {
            this.setState({
                hiddenLines: nextHiddenLines,
                requiredByValidator: requiredByValidator,
            });
        }
    }

    @debounce(800, { leading: false })
    private recalculateRequiredFieldsDebounced(props: FormLinesManagerProps<TData>) {
        this.recalculateRequiredFields(props);
    }

    @bind
    private handleChangeHiddenFields(hiddenLines: FormLineId[]) {
        this.setState({
            hiddenLines: hiddenLines,
        });
        this.props.onChangeValue(
            updateValueByHiddenLinesWithPreseveValues(this.props.value, this.props.lines, hiddenLines)
        );
    }
}

function isArrayContainsSameItems<T>(left: T[], right: T[]) {
    return _.difference(left, right).length === 0 && _.difference(right, left).length === 0;
}
