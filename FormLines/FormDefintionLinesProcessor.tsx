import * as React from "react";
import { JSXElementVisitor, traverseElemenents } from "./JSXElementTraverse";
import { getNormalizedPath, NormalizedPath } from "../Path";
import { capitalizeFirstLetter } from "utils";

interface ProcessedForm {
    formDefinition: JSX.Element;
    lines: FormLineInfo[];
    structuredLines: Array<StructuredFormItem>;
}

export type FormLineId = string;

export interface FormLineInfo {
    id: FormLineId;
    caption: string;
    fields: NormalizedPath[];
    hiddenByDefault: boolean;
    alwaysVisible: boolean;
}

export interface StructuredFormLineInfo extends FormLineInfo {
    type: "FormLine";
}

export interface StructuredFormLineGroup {
    type: "FormLineGroup";
    caption?: string;
    children: Array<FormLineInfo>;
}

export type StructuredFormItem = StructuredFormLineInfo | StructuredFormLineGroup;

function toUpperCamelCasePath(normalizedPath: NormalizedPath, separator: string = "."): string {
    return normalizedPath
        .map(x => x.toString())
        .map(capitalizeFirstLetter)
        .join(separator);
}

class ExtractFormLinesInfoVisitor implements JSXElementVisitor {
    public currentLine: NormalizedPath[] = [];
    public lines: FormLineInfo[] = [];
    public structuredLines: StructuredFormItem[] = [];
    public currentGroup?: StructuredFormLineGroup;
    public nestingCount: number = 0;
    public groupStack: Array<FormLineId[]> = [];

    visitElementOpen(element: JSX.Element): JSX.Element {
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
        return element;
    }

    visitElementClose(element: JSX.Element): JSX.Element {
        if (element.type["FormSection"]) {
            this.nestingCount--;
            if (this.currentGroup != null && this.nestingCount === 0) {
                this.structuredLines.push(this.currentGroup);
                this.currentGroup = undefined;
            }
            const currentGroupdChildLineIds = this.groupStack.pop();
            return React.cloneElement(element, { childInternalIds: currentGroupdChildLineIds });
        }
        if (element.type["FormBindControl"]) {
            this.currentLine = this.currentLine;
            const normalizedPath = getNormalizedPath(element.props.path);
            this.currentLine.push(normalizedPath);
            return React.cloneElement(element, {
                "data-tid": toUpperCamelCasePath(normalizedPath, ".") + " " + toUpperCamelCasePath(normalizedPath, "-"),
            });
        }
        if (element.type["FormLine"]) {
            this.lines = this.lines;
            const id = this.currentLine.map(x => x.join("-")).join("_");
            this.groupStack.forEach(x => x.push(id));
            const lineInfo = {
                hiddenByDefault: Boolean(element.props.hiddenByDefault),
                caption: element.props.lineSelectorCaption || element.props.caption,
                alwaysVisible: Boolean(element.props.alwaysVisible),
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
            return React.cloneElement(element, {
                "data-tid":
                    lineInfo.fields.map(x => toUpperCamelCasePath(x)).join("") +
                    "Line" +
                    (lineInfo.fields.length > 1
                        ? " " + lineInfo.fields.map(x => toUpperCamelCasePath(x)).join("_")
                        : ""),
                internalId: id,
            });
        }
        return element;
    }
}

export class FormDefintionLinesProcessor {
    public static processForm(formSource: JSX.Element): ProcessedForm {
        const linesInfoVisitor = new ExtractFormLinesInfoVisitor();
        const result = traverseElemenents(formSource, linesInfoVisitor);
        return {
            formDefinition: result,
            lines: linesInfoVisitor.lines,
            structuredLines: linesInfoVisitor.structuredLines,
        };
    }
}
