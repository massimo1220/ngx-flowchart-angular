import { FcCoords } from './ngx-flowchart.models';
import * as ɵngcc0 from '@angular/core';
export declare class FcEdgeDrawingService {
    constructor();
    getEdgeDAttribute(pt1: FcCoords, pt2: FcCoords, style: string): string;
    getEdgeCenter(pt1: FcCoords, pt2: FcCoords): FcCoords;
    private computeEdgeTangentOffset;
    private computeEdgeSourceTangent;
    private computeEdgeDestinationTangent;
    static ɵfac: ɵngcc0.ɵɵFactoryDef<FcEdgeDrawingService, never>;
    static ɵprov: ɵngcc0.ɵɵInjectableDef<FcEdgeDrawingService>;
}

//# sourceMappingURL=edge-drawing.service.d.ts.map