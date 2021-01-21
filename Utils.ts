import { NodePath } from "./AutoEvaluators";

export function getKeyByNodePath(path: NodePath): string {
    return path.map(x => x.toString()).join(".");
}
