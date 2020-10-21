import { difference } from "lodash";
import * as React from "react";
import { debounce } from "typescript-debounce-decorator";
import { DocumentType } from "Domain/EDI/DocumentCirculationMeta/DocumentType";

import { MessageMonitoringLocalStorage } from "../../../MessageMonitoring/api/messageMonitoringLocalStorage";
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
    documentType?: DocumentType;
}

interface FormLinesManagerState {
    hiddenLines: FormLineId[];
    requiredByValidator: FormLineId[];
}

export class FormLinesManager<TData> extends React.PureComponent<FormLinesManagerProps<TData>, FormLinesManagerState> {
    public state: FormLinesManagerState;

    public constructor(props: FormLinesManagerProps<TData>) {
        super(props);
        const initialHiddenLineIds =
            (props.documentType &&
                MessageMonitoringLocalStorage.getVisibleFieldsInMessageCreatorNew(props.documentType, "Root")) ||
            props.lines.filter(x => x.hiddenByDefault).map(x => x.id);
        const requiredByValidator = props.validator
            ? getRequiredLines(props.value, props.requiredByDefaultPaths, props.lines, props.validator)
            : [];
        this.state = {
            hiddenLines: difference(
                initialHiddenLineIds,
                getFilledLineIds(props.value, props.lines),
                requiredByValidator
            ),
            requiredByValidator: requiredByValidator,
        };
    }

    public componentWillReceiveProps(nextProps: FormLinesManagerProps<TData>) {
        if (nextProps.lines.length !== this.props.lines.length) {
            this.recalculateRequiredAndHiddenFieldsDebounced(nextProps);
        }
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

    private readonly handleSaveLines = () => {
        const { documentType } = this.props;

        if (documentType) {
            MessageMonitoringLocalStorage.setVisibleFieldsInMessageCreatorNew(
                documentType,
                "Root",
                this.state.hiddenLines
            );
        } else {
            throw new Error("documentType must be defined");
        }
    };

    private recalculateRequiredFields(
        { value, validator, requiredByDefaultPaths, lines }: FormLinesManagerProps<TData>,
        withHiddenFields?: boolean
    ) {
        const nextRequiredByValidator = validator
            ? getRequiredLines(value, requiredByDefaultPaths, lines, validator)
            : [];

        const nextHiddenLines = withHiddenFields
            ? lines.filter(x => x.hiddenByDefault).map(x => x.id)
            : difference(this.state.hiddenLines, nextRequiredByValidator);

        if (
            !isArrayContainsSameItems(this.state.hiddenLines, nextHiddenLines) ||
            !isArrayContainsSameItems(this.state.requiredByValidator, nextRequiredByValidator)
        ) {
            this.setState({
                hiddenLines: nextHiddenLines,
                requiredByValidator: nextRequiredByValidator,
            });
        }
    }

    @debounce(800, { leading: false })
    private recalculateRequiredFieldsDebounced(props: FormLinesManagerProps<TData>) {
        this.recalculateRequiredFields(props);
    }

    @debounce(800, { leading: false })
    private recalculateRequiredAndHiddenFieldsDebounced(props: FormLinesManagerProps<TData>) {
        this.recalculateRequiredFields(props, true);
    }

    private readonly handleChangeHiddenFields = (hiddenLines: FormLineId[]) => {
        this.setState({
            hiddenLines: hiddenLines,
        });
        this.props.onChangeValue(
            updateValueByHiddenLinesWithPreseveValues(this.props.value, this.props.lines, hiddenLines)
        );
    };
}

function isArrayContainsSameItems<T>(left: T[], right: T[]) {
    return difference(left, right).length === 0 && difference(right, left).length === 0;
}
