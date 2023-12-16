import { FcConnector, FcEdge, FcModel, FcNode } from './ngx-flowchart.models';
import * as ɵngcc0 from '@angular/core';
export declare class FcModelValidationService {
    constructor();
    validateModel(model: FcModel): FcModel;
    validateNodes(nodes: Array<FcNode>): Array<FcNode>;
    validateNode(node: FcNode): FcNode;
    private _validateEdges;
    validateEdges(edges: Array<FcEdge>, nodes: Array<FcNode>): Array<FcEdge>;
    private _validateEdge;
    validateEdge(edge: FcEdge, nodes: Array<FcNode>): FcEdge;
    validateConnector(connector: FcConnector): FcConnector;
    static ɵfac: ɵngcc0.ɵɵFactoryDef<FcModelValidationService, never>;
    static ɵprov: ɵngcc0.ɵɵInjectableDef<FcModelValidationService>;
}

//# sourceMappingURL=modelvalidation.service.d.ts.map