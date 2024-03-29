import { cloneElement } from "react";

import { getNormalizedPath, NormalizedPath } from "../Path";

import { JSXElementVisitor, traverseElements } from "./JSXElementTraverse";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter";
import { concatTids } from "./concatTids";

export interface ProcessedForm {
    formDefinition: JSX.Element;
    lines: FormLineInfo[];
    structuredLines: StructuredFormItem[];
}

export type FormLineId = string;

export interface FormLineInfo {
    id: FormLineId;
    caption: string;
    fields: NormalizedPath[];
    hiddenByDefault: boolean;
    alwaysVisible: boolean;
    showIfUsed?: boolean;
    hiddenIfEmpty?: boolean;
}

export interface StructuredFormLineInfo extends FormLineInfo {
    type: "FormLine";
}

export interface StructuredFormLineGroup {
    type: "FormLineGroup";
    caption?: string;
    children: FormLineInfo[];
}

export interface StructuredFormLineArray {
    type: "FormLineArray";
    children: JSX.Element | null;
}

export type StructuredFormItem = StructuredFormLineInfo | StructuredFormLineGroup;

function toUpperCamelCasePath(normalizedPath: NormalizedPath): string {
    return toUpperCamelCasePathWithSeparator(normalizedPath, "-");
}

function toUpperCamelCasePathWithSeparator(normalizedPath: NormalizedPath, separator: string): string {
    return normalizedPath
        .map(x => x.toString())
        .map(capitalizeFirstLetter)
        .join(separator);
}

function isPathExistInLine(line: NormalizedPath[], path: NormalizedPath): boolean {
    return line.map(x => x.toString()).includes(path.toString());
}

function addIfNotExists(current: NormalizedPath[], value: NormalizedPath) {
    if (!isPathExistInLine(current, value)) {
        current.push(value);
    }
}

function getNormalizedPathsFromProps(props: any) {
    if (props == null) return [];
    return Object.keys(props)
        .filter(propKey => propKey.startsWith("path") && props[propKey] != null)
        .map(propKey => getNormalizedPath(props[propKey]));
}

class ExtractFormLinesInfoVisitor implements JSXElementVisitor {
    public currentLine: NormalizedPath[] = [];
    public lines: FormLineInfo[] = [];
    public structuredLines: StructuredFormItem[] = [];
    public currentGroup?: StructuredFormLineGroup;
    public arrayLine?: StructuredFormLineArray;
    public nestingCount = 0;
    public groupStack: FormLineId[][] = [];

    public visitElementOpen(element: JSX.Element): JSX.Element {
        if (element.type["FormLine"]) {
            this.currentLine = [];
        }
        if (element.type["FormSection"]) {
            this.nestingCount++;
            if (this.currentGroup == null) {
                this.currentGroup = {
                    type: "FormLineGroup",
                    caption: element.props.groupInLineSelector ? element.props.caption : undefined,
                    children: [],
                };
            }
            this.groupStack.push([]);
        }
        if (element.type["FormArrayControl"]) {
            this.arrayLine = {
                type: "FormLineArray",
                children: null,
            };
        }
        if (element.type["FormArrayItemControl"]) {
            if (this.arrayLine != undefined) {
                this.arrayLine.children = element;
            }
        }
        return element;
    }

    public visitElementClose(element: JSX.Element): JSX.Element {
        if (element.type["FormSection"]) {
            this.nestingCount--;
            if (this.currentGroup != null && this.nestingCount === 0) {
                this.structuredLines.push(this.currentGroup);
                this.currentGroup = undefined;
            }
            const currentGroupdChildLineIds = this.groupStack.pop();
            return cloneElement(element, { childInternalIds: currentGroupdChildLineIds });
        }
        if (element.type["FormSwitchBindControl"]) {
            if (element.props.path == undefined) {
                return element;
            }
            // Берем пути у детей
            element.props.children.forEach((child: JSX.Element) => {
                (child.props.children || []).forEach((innerChild: JSX.Element) => {
                    const normalizedPaths = getNormalizedPathsFromProps(innerChild.props);
                    normalizedPaths.forEach(path => addIfNotExists(this.currentLine, path));
                });
            });
            return element;
        }
        if (element.type["FormBindControl"]) {
            const normalizedPaths = getNormalizedPathsFromProps(element.props);
            if (normalizedPaths.length === 0) {
                return element;
            }

            normalizedPaths.forEach(path => addIfNotExists(this.currentLine, path));

            const tids = normalizedPaths
                .map(path => toUpperCamelCasePathWithSeparator(path, "."))
                .concat(normalizedPaths.map(path => toUpperCamelCasePathWithSeparator(path, "-")));
            return cloneElement(element, {
                "data-tid": concatTids(...tids),
            });
        }
        if (element.type["FormLine"]) {
            //this.lines = this.lines;
            const id = this.currentLine.map(x => x.join("-")).join("_");
            this.groupStack.forEach(x => x.push(id));
            const lineInfo = {
                useAlignTopHack: Boolean(element.props.useAlignTopHack),
                hiddenByDefault: Boolean(element.props.hiddenByDefault),
                caption: element.props.lineSelectorCaption || element.props.caption,
                alwaysVisible: Boolean(element.props.alwaysVisible),
                showIfUsed: Boolean(element.props.showIfUsed),
                hiddenIfEmpty: Boolean(element.props.hiddenIfEmpty),
                id: id,
                fields: [...this.currentLine],
            };
            this.lines.push(lineInfo);
            if (this.currentGroup != null) {
                this.currentGroup.children.push(lineInfo);
            } else {
                this.structuredLines.push({
                    type: "FormLine",
                    ...lineInfo,
                });
            }
            this.currentLine = [];
            const dataTid1 = lineInfo.fields.map(toUpperCamelCasePath).join("") + "Line";
            const dataTid2 =
                lineInfo.fields.length > 1 ? lineInfo.fields.map(toUpperCamelCasePath).join("_") : undefined;
            const dataTid3 = element.props["data-tid"] != null ? element.props["data-tid"] : undefined;
            return cloneElement(element, {
                "data-tid": concatTids(dataTid1, dataTid2, dataTid3),
                internalId: id,
            });
        }
        if (element.type["FormArrayControl"]) {
            this.arrayLine = undefined;
            const normalizedPath = getNormalizedPath(element.props.path);
            return cloneElement(element, {
                "data-tid": concatTids(
                    toUpperCamelCasePathWithSeparator(normalizedPath, "."),
                    toUpperCamelCasePathWithSeparator(normalizedPath, "_")
                ),
            });
        }

        if (element.type["FormArrayItemControl"]) {
            if (this.arrayLine != undefined && this.arrayLine.children != null) {
                return this.arrayLine.children;
            }
        }

        return element;
    }
}

export class FormDefinitionLinesProcessor {
    public static processForm(formSource: JSX.Element): ProcessedForm {
        const linesInfoVisitor = new ExtractFormLinesInfoVisitor();
        const result = traverseElements(formSource, linesInfoVisitor);
        return {
            formDefinition: result,
            lines: linesInfoVisitor.lines,
            structuredLines: linesInfoVisitor.structuredLines,
        };
    }
}
