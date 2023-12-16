import { AfterViewInit, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ComponentFactoryResolver, ElementRef, ViewContainerRef } from '@angular/core';
import { FcCallbacks, FcConnector, FcNode, FcNodeComponentConfig, FcNodeRectInfo, UserNodeCallbacks } from './ngx-flowchart.models';
import { FcModelService } from './model.service';
import * as ɵngcc0 from '@angular/core';
export declare class FcNodeContainerComponent implements OnInit, AfterViewInit, OnChanges {
    private nodeComponentConfig;
    private elementRef;
    private componentFactoryResolver;
    callbacks: FcCallbacks;
    userNodeCallbacks: UserNodeCallbacks;
    node: FcNode;
    selected: boolean;
    edit: boolean;
    underMouse: boolean;
    mouseOverConnector: FcConnector;
    modelservice: FcModelService;
    dragging: boolean;
    get nodeId(): string;
    get top(): string;
    get left(): string;
    nodeComponent: FcNodeComponent;
    nodeContentContainer: ViewContainerRef;
    constructor(nodeComponentConfig: FcNodeComponentConfig, elementRef: ElementRef<HTMLElement>, componentFactoryResolver: ComponentFactoryResolver);
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    private updateNodeClass;
    private updateNodeComponent;
    private toggleClass;
    mousedown(event: MouseEvent): void;
    dragstart(event: Event | any): void;
    dragend(event: Event | any): void;
    click(event: MouseEvent): void;
    mouseover(event: MouseEvent): void;
    mouseout(event: MouseEvent): void;
    static ɵfac: ɵngcc0.ɵɵFactoryDef<FcNodeContainerComponent, never>;
    static ɵcmp: ɵngcc0.ɵɵComponentDefWithMeta<FcNodeContainerComponent, "fc-node", never, { "userNodeCallbacks": "userNodeCallbacks"; "callbacks": "callbacks"; "node": "node"; "selected": "selected"; "edit": "edit"; "underMouse": "underMouse"; "mouseOverConnector": "mouseOverConnector"; "modelservice": "modelservice"; "dragging": "dragging"; }, {}, never, never>;
}
export declare abstract class FcNodeComponent implements OnInit {
    callbacks: FcCallbacks;
    userNodeCallbacks: UserNodeCallbacks;
    node: FcNode;
    selected: boolean;
    edit: boolean;
    underMouse: boolean;
    mouseOverConnector: FcConnector;
    modelservice: FcModelService;
    dragging: boolean;
    flowchartConstants: {
        htmlPrefix: string;
        leftConnectorType: string;
        rightConnectorType: string;
        curvedStyle: string;
        lineStyle: string;
        dragAnimationRepaint: string;
        dragAnimationShadow: string;
        canvasClass: string;
        selectedClass: string;
        editClass: string;
        activeClass: string;
        hoverClass: string;
        draggingClass: string;
        edgeClass: string;
        edgeLabelClass: string;
        connectorClass: string;
        magnetClass: string;
        nodeClass: string;
        nodeOverlayClass: string;
        leftConnectorClass: string;
        rightConnectorClass: string;
        canvasResizeThreshold: number;
        canvasResizeStep: number;
    };
    width: number;
    height: number;
    nodeRectInfo: FcNodeRectInfo;
    ngOnInit(): void;
    static ɵfac: ɵngcc0.ɵɵFactoryDef<FcNodeComponent, never>;
    static ɵdir: ɵngcc0.ɵɵDirectiveDefWithMeta<FcNodeComponent, never, never, { "callbacks": "callbacks"; "userNodeCallbacks": "userNodeCallbacks"; "node": "node"; "selected": "selected"; "edit": "edit"; "underMouse": "underMouse"; "mouseOverConnector": "mouseOverConnector"; "modelservice": "modelservice"; "dragging": "dragging"; }, {}, never>;
}

//# sourceMappingURL=node.component.d.ts.map