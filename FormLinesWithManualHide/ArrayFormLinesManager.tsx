import * as _ from "lodash";
import * as React from "react";
import { debounce } from "typescript-debounce-decorator";
import { DocumentType } from "Domain/EDI/DocumentCirculationMeta/DocumentType";

import { MessageMonitoringLocalStorage } from "../../../MessageMonitoring/api/messageMonitoringLocalStorage";
import { FormLineId, FormLineInfo } from "../FormLines/FormDefintionLinesProcessor";
import { NormalizedPath } from "../Path";
import { GenericModelValidator } from "../Types";

import { FormLinesContext } from "./FormLinesContext";
import {
    getFilledLineIdsForArray,
    getRequiredLinesForList,
    updateValueByHiddenLinesWithPreseveValuesForArray,
} from "./FormLinesWithManualHideUtils";

interface ArrayChildFormLinesManagerProps<TData> {
    lines: FormLineInfo[];
    value: TData[];
    onChangeValue: (nextValue: TData[]) => void;
    validator?: GenericModelValidator<TData[]>;
    requiredByDefaultPaths: NormalizedPath[];
    documentType?: DocumentType;
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
    public state: ArrayChildFormLinesManagerState;

    public constructor(props: ArrayChildFormLinesManagerProps<TData>) {
        super(props);
        const initialHiddenLineIds =
            (props.documentType &&
                MessageMonitoringLocalStorage.getVisibleFieldsInMessageCreatorNew(props.documentType, "GoodItem")) ||
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

    public componentWillReceiveProps(nextProps: ArrayChildFormLinesManagerProps<TData>) {
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
                "GoodItem",
                this.state.hiddenLines
            );
        } else {
            throw new Error("documentType must be defined");
        }
    };

    private readonly handleChangeHiddenFields = (hiddenLines: FormLineId[]) => {
        this.setState({
            hiddenLines: hiddenLines,
        });
        this.props.onChangeValue(
            updateValueByHiddenLinesWithPreseveValuesForArray(this.props.value, this.props.lines, hiddenLines) || []
        );
    };

    private recalculateRequiredFields(props: ArrayChildFormLinesManagerProps<TData>) {
        const requiredByValidator = props.validator
            ? getRequiredLinesForList(props.value, props.requiredByDefaultPaths, props.lines, props.validator)
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
    private recalculateRequiredFieldsDebounced(props: ArrayChildFormLinesManagerProps<TData>) {
        this.recalculateRequiredFields(props);
    }
}

function isArrayContainsSameItems<T>(left: T[], right: T[]) {
    return _.difference(left, right).length === 0 && _.difference(right, left).length === 0;
}
