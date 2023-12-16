import { OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ElementRef } from '@angular/core';
import { FcCallbacks, FcConnector, FcNodeRectInfo } from './ngx-flowchart.models';
import { FcModelService } from './model.service';
import * as ɵngcc0 from '@angular/core';
export declare class FcConnectorDirective implements OnInit, OnChanges {
    elementRef: ElementRef<HTMLElement>;
    callbacks: FcCallbacks;
    modelservice: FcModelService;
    connector: FcConnector;
    nodeRectInfo: FcNodeRectInfo;
    mouseOverConnector: FcConnector;
    constructor(elementRef: ElementRef<HTMLElement>);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    private updateConnectorClass;
    dragover(event: Event | any): void;
    drop(event: Event | any): boolean;
    dragend(event: Event | any): void;
    dragstart(event: Event | any): void;
    mouseenter(event: MouseEvent): void;
    mouseleave(event: MouseEvent): void;
    static ɵfac: ɵngcc0.ɵɵFactoryDef<FcConnectorDirective, never>;
    static ɵdir: ɵngcc0.ɵɵDirectiveDefWithMeta<FcConnectorDirective, "[fc-connector]", never, { "callbacks": "callbacks"; "modelservice": "modelservice"; "connector": "connector"; "nodeRectInfo": "nodeRectInfo"; "mouseOverConnector": "mouseOverConnector"; }, {}, never>;
}

//# sourceMappingURL=connector.directive.d.ts.map