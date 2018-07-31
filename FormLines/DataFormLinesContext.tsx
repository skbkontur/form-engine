import createContext, { Context } from "create-react-context";
import * as React from "react";

import { FormLineId } from "./FormDefintionLinesProcessor";

export const DataFormLinesContext = createContext<FormLineId[]>([]);
