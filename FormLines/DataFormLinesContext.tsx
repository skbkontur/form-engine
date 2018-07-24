import * as React from "react";
import createContext, { Context } from "create-react-context";
import { FormLineId } from "./FormDefintionLinesProcessor";

export const DataFormLinesContext = createContext<FormLineId[]>([]);
