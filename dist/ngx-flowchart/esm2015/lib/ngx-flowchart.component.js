import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, IterableDiffers, NgZone, Output } from '@angular/core';
import { FlowchartConstants } from './ngx-flowchart.models';
import { FcModelService } from './model.service';
import { FcModelValidationService } from './modelvalidation.service';
import { FcNodeDraggingService } from './node-dragging.service';
import { FcEdgeDrawingService } from './edge-drawing.service';
import { FcEdgeDraggingService } from './edge-dragging.service';
import { FcMouseOverService } from './mouseover.service';
import { FcRectangleSelectService } from './rectangleselect.service';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
export class NgxFlowchartComponent {
    constructor(elementRef, differs, modelValidation, edgeDrawingService, cd, zone) {
        this.elementRef = elementRef;
        this.differs = differs;
        this.modelValidation = modelValidation;
        this.edgeDrawingService = edgeDrawingService;
        this.cd = cd;
        this.zone = zone;
        this.modelChanged = new EventEmitter();
        this.fitModelSizeByDefaultValue = true;
        this.flowchartConstants = FlowchartConstants;
        this.nodesDiffer = this.differs.find([]).create((index, item) => {
            return item;
        });
        this.edgesDiffer = this.differs.find([]).create((index, item) => {
            return item;
        });
        this.detectChangesSubject = new Subject();
        this.arrowDefId = 'arrow-' + Math.random();
        this.arrowDefIdSelected = this.arrowDefId + '-selected';
        this.detectChangesSubject
            .pipe(debounceTime(50))
            .subscribe(() => this.cd.detectChanges());
    }
    get canvasClass() {
        return FlowchartConstants.canvasClass;
    }
    get fitModelSizeByDefault() {
        return this.fitModelSizeByDefaultValue;
    }
    set fitModelSizeByDefault(value) {
        this.fitModelSizeByDefaultValue = coerceBooleanProperty(value);
    }
    ngOnInit() {
        if (!this.dropTargetId && this.edgeStyle !== FlowchartConstants.curvedStyle && this.edgeStyle !== FlowchartConstants.lineStyle) {
            throw new Error('edgeStyle not supported.');
        }
        this.nodeHeight = this.nodeHeight || 200;
        this.nodeWidth = this.nodeWidth || 200;
        this.dragAnimation = this.dragAnimation || FlowchartConstants.dragAnimationRepaint;
        this.userCallbacks = this.userCallbacks || {};
        this.automaticResize = this.automaticResize || false;
        for (const key of Object.keys(this.userCallbacks)) {
            const callback = this.userCallbacks[key];
            if (typeof callback !== 'function' && key !== 'nodeCallbacks') {
                throw new Error('All callbacks should be functions.');
            }
        }
        this.userNodeCallbacks = this.userCallbacks.nodeCallbacks;
        const element = $(this.elementRef.nativeElement);
        this.modelService = new FcModelService(this.modelValidation, this.model, this.modelChanged, this.detectChangesSubject, this.selectedObjects, this.userCallbacks.dropNode, this.userCallbacks.createEdge, this.userCallbacks.edgeAdded, this.userCallbacks.nodeRemoved, this.userCallbacks.edgeRemoved, element[0], element[0].querySelector('svg'));
        if (this.dropTargetId) {
            this.modelService.dropTargetId = this.dropTargetId;
        }
        const applyFunction = this.zone.run.bind(this.zone);
        this.nodeDraggingService = new FcNodeDraggingService(this.modelService, applyFunction, this.automaticResize, this.dragAnimation);
        this.edgeDraggingService = new FcEdgeDraggingService(this.modelValidation, this.edgeDrawingService, this.modelService, this.model, this.userCallbacks.isValidEdge || null, applyFunction, this.dragAnimation, this.edgeStyle);
        this.mouseoverService = new FcMouseOverService(applyFunction);
        this.rectangleSelectService = new FcRectangleSelectService(this.modelService, element[0].querySelector('#select-rectangle'), applyFunction);
        this.callbacks = {
            nodeDragstart: this.nodeDraggingService.dragstart.bind(this.nodeDraggingService),
            nodeDragend: this.nodeDraggingService.dragend.bind(this.nodeDraggingService),
            edgeDragstart: this.edgeDraggingService.dragstart.bind(this.edgeDraggingService),
            edgeDragend: this.edgeDraggingService.dragend.bind(this.edgeDraggingService),
            edgeDrop: this.edgeDraggingService.drop.bind(this.edgeDraggingService),
            edgeDragoverConnector: this.edgeDraggingService.dragoverConnector.bind(this.edgeDraggingService),
            edgeDragoverMagnet: this.edgeDraggingService.dragoverMagnet.bind(this.edgeDraggingService),
            edgeDragleaveMagnet: this.edgeDraggingService.dragleaveMagnet.bind(this.edgeDraggingService),
            nodeMouseOver: this.mouseoverService.nodeMouseOver.bind(this.mouseoverService),
            nodeMouseOut: this.mouseoverService.nodeMouseOut.bind(this.mouseoverService),
            connectorMouseEnter: this.mouseoverService.connectorMouseEnter.bind(this.mouseoverService),
            connectorMouseLeave: this.mouseoverService.connectorMouseLeave.bind(this.mouseoverService),
            nodeClicked: (event, node) => {
                this.modelService.nodes.handleClicked(node, event.ctrlKey);
                event.stopPropagation();
                event.preventDefault();
            }
        };
        this.adjustCanvasSize(this.fitModelSizeByDefault);
    }
    ngDoCheck() {
        if (this.model) {
            const nodesChange = this.nodesDiffer.diff(this.model.nodes);
            const edgesChange = this.edgesDiffer.diff(this.model.edges);
            let nodesChanged = false;
            let edgesChanged = false;
            if (nodesChange !== null) {
                nodesChange.forEachAddedItem(() => {
                    nodesChanged = true;
                });
                nodesChange.forEachRemovedItem(() => {
                    nodesChanged = true;
                });
            }
            if (edgesChange !== null) {
                edgesChange.forEachAddedItem(() => {
                    edgesChanged = true;
                });
                edgesChange.forEachRemovedItem(() => {
                    edgesChanged = true;
                });
            }
            if (nodesChanged) {
                this.adjustCanvasSize(this.fitModelSizeByDefault);
            }
            if (nodesChanged || edgesChanged) {
                this.detectChangesSubject.next();
            }
        }
    }
    getEdgeDAttribute(edge) {
        return this.edgeDrawingService.getEdgeDAttribute(this.modelService.edges.sourceCoord(edge), this.modelService.edges.destCoord(edge), this.edgeStyle);
    }
    adjustCanvasSize(fit) {
        let maxX = 0;
        let maxY = 0;
        const element = $(this.elementRef.nativeElement);
        this.model.nodes.forEach((node) => {
            maxX = Math.max(node.x + this.nodeWidth, maxX);
            maxY = Math.max(node.y + this.nodeHeight, maxY);
        });
        let width;
        let height;
        if (fit) {
            width = maxX;
            height = maxY;
        }
        else {
            width = Math.max(maxX, element.prop('offsetWidth'));
            height = Math.max(maxY, element.prop('offsetHeight'));
        }
        element.css('width', width + 'px');
        element.css('height', height + 'px');
    }
    canvasClick(event) { }
    edgeMouseDown(event, edge) {
        event.stopPropagation();
    }
    edgeClick(event, edge) {
        this.modelService.edges.handleEdgeMouseClick(edge, event.ctrlKey);
        event.stopPropagation();
        event.preventDefault();
    }
    edgeRemove(event, edge) {
        this.modelService.edges.delete(edge);
        event.stopPropagation();
        event.preventDefault();
    }
    edgeEdit(event, edge) {
        if (this.userCallbacks.edgeEdit) {
            this.userCallbacks.edgeEdit(event, edge);
        }
    }
    edgeDoubleClick(event, edge) {
        if (this.userCallbacks.edgeDoubleClick) {
            this.userCallbacks.edgeDoubleClick(event, edge);
        }
    }
    edgeMouseOver(event, edge) {
        if (this.userCallbacks.edgeMouseOver) {
            this.userCallbacks.edgeMouseOver(event, edge);
        }
    }
    edgeMouseEnter(event, edge) {
        this.mouseoverService.edgeMouseEnter(event, edge);
    }
    edgeMouseLeave(event, edge) {
        this.mouseoverService.edgeMouseLeave(event, edge);
    }
    dragover(event) {
        this.nodeDraggingService.dragover(event);
        this.edgeDraggingService.dragover(event);
    }
    drop(event) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        this.nodeDraggingService.drop(event);
    }
    mousedown(event) {
        this.rectangleSelectService.mousedown(event);
    }
    mousemove(event) {
        this.rectangleSelectService.mousemove(event);
    }
    mouseup(event) {
        this.rectangleSelectService.mouseup(event);
    }
}
NgxFlowchartComponent.decorators = [
    { type: Component, args: [{
                selector: 'fc-canvas',
                template: "<div (click)=\"canvasClick($event)\" class=\"fc-canvas-container\">\n  <svg class=\"fc-canvas-svg\">\n    <defs>\n      <marker class=\"fc-arrow-marker\" [attr.id]=\"arrowDefId\" markerWidth=\"5\" markerHeight=\"5\" viewBox=\"-6 -6 12 12\" refX=\"10\" refY=\"0\" markerUnits=\"strokeWidth\" orient=\"auto\">\n        <polygon points=\"-2,0 -5,5 5,0 -5,-5\" stroke=\"gray\" fill=\"gray\" stroke-width=\"1px\"/>\n      </marker>\n      <marker class=\"fc-arrow-marker-selected\" [attr.id]=\"arrowDefIdSelected\" markerWidth=\"5\" markerHeight=\"5\" viewBox=\"-6 -6 12 12\" refX=\"10\" refY=\"0\" markerUnits=\"strokeWidth\" orient=\"auto\">\n        <polygon points=\"-2,0 -5,5 5,0 -5,-5\" stroke=\"red\" fill=\"red\" stroke-width=\"1px\"/>\n      </marker>\n    </defs>\n    <g *ngFor=\"let edge of model.edges; let $index = index\">\n      <path\n        [attr.id]=\"'fc-edge-path-'+$index\"\n        (mousedown)=\"edgeMouseDown($event, edge)\"\n        (click)=\"edgeClick($event, edge)\"\n        (dblclick)=\"edgeDoubleClick($event, edge)\"\n        (mouseover)=\"edgeMouseOver($event, edge)\"\n        (mouseenter)=\"edgeMouseEnter($event, edge)\"\n        (mouseleave)=\"edgeMouseLeave($event, edge)\"\n        [attr.class]=\"(modelService.edges.isSelected(edge) && flowchartConstants.selectedClass + ' ' + flowchartConstants.edgeClass) ||\n                      edge === mouseoverService.mouseoverscope.edge && flowchartConstants.hoverClass + ' ' + flowchartConstants.edgeClass ||\n                      edge.active && flowchartConstants.activeClass + ' ' + flowchartConstants.edgeClass ||\n                      flowchartConstants.edgeClass\"\n        [attr.d]=\"getEdgeDAttribute(edge)\"\n        [attr.marker-end]=\"'url(#' + (modelService.edges.isSelected(edge) ? arrowDefIdSelected : arrowDefId) + ')'\">\n      </path>\n    </g>\n    <g *ngIf=\"dragAnimation === flowchartConstants.dragAnimationRepaint && edgeDraggingService.edgeDragging.isDragging\">\n      <path [attr.class]=\"flowchartConstants.edgeClass + ' ' + flowchartConstants.draggingClass\"\n            [attr.d]=\"edgeDrawingService.getEdgeDAttribute(edgeDraggingService.edgeDragging.dragPoint1, edgeDraggingService.edgeDragging.dragPoint2, edgeStyle)\"></path>\n      <circle class=\"edge-endpoint\" r=\"4\"\n              [attr.cx]=\"edgeDraggingService.edgeDragging.dragPoint2.x\"\n              [attr.cy]=\"edgeDraggingService.edgeDragging.dragPoint2.y\">\n      </circle>\n    </g>\n    <g *ngIf=\"dragAnimation === flowchartConstants.dragAnimationShadow\"\n       class=\"shadow-svg-class {{ flowchartConstants.edgeClass }} {{ flowchartConstants.draggingClass }}\"\n       style=\"display:none\">\n      <path d=\"\"></path>\n      <circle class=\"edge-endpoint\" r=\"4\"></circle>\n    </g>\n  </svg>\n  <ng-container *ngFor=\"let node of model.nodes\">\n    <fc-node\n         [selected]=\"modelService.nodes.isSelected(node)\"\n         [edit]=\"modelService.nodes.isEdit(node)\"\n         [underMouse]=\"node === mouseoverService.mouseoverscope.node\"\n         [node]=\"node\"\n         [mouseOverConnector]=\"mouseoverService.mouseoverscope.connector\"\n         [modelservice]=\"modelService\"\n         [dragging]=\"nodeDraggingService.isDraggingNode(node)\"\n         [callbacks]=\"callbacks\"\n         [userNodeCallbacks]=\"userNodeCallbacks\">\n    </fc-node>\n  </ng-container>\n  <div *ngIf=\"dragAnimation === flowchartConstants.dragAnimationRepaint && edgeDraggingService.edgeDragging.isDragging\"\n       [attr.class]=\"'fc-noselect ' + flowchartConstants.edgeLabelClass\"\n       [ngStyle]=\"{\n          top: (edgeDrawingService.getEdgeCenter(edgeDraggingService.edgeDragging.dragPoint1, edgeDraggingService.edgeDragging.dragPoint2).y)+'px',\n          left: (edgeDrawingService.getEdgeCenter(edgeDraggingService.edgeDragging.dragPoint1, edgeDraggingService.edgeDragging.dragPoint2).x)+'px'\n       }\">\n    <div class=\"fc-edge-label-text\">\n      <span [attr.id]=\"'fc-edge-label-dragging'\" *ngIf=\"edgeDraggingService.edgeDragging.dragLabel\">{{edgeDraggingService.edgeDragging.dragLabel}}</span>\n    </div>\n  </div>\n  <div\n    (mousedown)=\"edgeMouseDown($event, edge)\"\n    (click)=\"edgeClick($event, edge)\"\n    (dblclick)=\"edgeDoubleClick($event, edge)\"\n    (mouseover)=\"edgeMouseOver($event, edge)\"\n    (mouseenter)=\"edgeMouseEnter($event, edge)\"\n    (mouseleave)=\"edgeMouseLeave($event, edge)\"\n    [attr.class]=\"'fc-noselect ' + ((modelService.edges.isEdit(edge) && flowchartConstants.editClass + ' ' + flowchartConstants.edgeLabelClass) ||\n                      (modelService.edges.isSelected(edge) && flowchartConstants.selectedClass + ' ' + flowchartConstants.edgeLabelClass) ||\n                      edge === mouseoverService.mouseoverscope.edge && flowchartConstants.hoverClass + ' ' + flowchartConstants.edgeLabelClass ||\n                      edge.active && flowchartConstants.activeClass + ' ' + flowchartConstants.edgeLabelClass ||\n                      flowchartConstants.edgeLabelClass)\"\n    [ngStyle]=\"{\n      top: (edgeDrawingService.getEdgeCenter(modelService.edges.sourceCoord(edge), modelService.edges.destCoord(edge)).y)+'px',\n      left: (edgeDrawingService.getEdgeCenter(modelService.edges.sourceCoord(edge), modelService.edges.destCoord(edge)).x)+'px'\n    }\"\n    *ngFor=\"let edge of model.edges; let $index = index\">\n    <div class=\"fc-edge-label-text\">\n      <div *ngIf=\"modelService.isEditable()\" class=\"fc-noselect fc-nodeedit\" (click)=\"edgeEdit($event, edge)\">\n        <i class=\"fa fa-pencil\" aria-hidden=\"true\"></i>\n      </div>\n      <div *ngIf=\"modelService.isEditable()\" class=\"fc-noselect fc-nodedelete\" (click)=\"edgeRemove($event, edge)\">\n        &times;\n      </div>\n      <span [attr.id]=\"'fc-edge-label-'+$index\" *ngIf=\"edge.label\">{{edge.label}}</span>\n    </div>\n  </div>\n  <div id=\"select-rectangle\" class=\"fc-select-rectangle\" hidden>\n  </div>\n</div>\n",
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [":host{-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;-webkit-user-select:none;background-color:transparent;background-image:linear-gradient(90deg,rgba(0,0,0,.1) 1px,transparent 0),linear-gradient(180deg,rgba(0,0,0,.1) 1px,transparent 0);background-size:25px 25px;min-height:100%;min-width:100%;user-select:none}:host,:host .fc-canvas-container,:host .fc-canvas-container svg.fc-canvas-svg{display:block;height:100%;position:relative;width:100%}:host .fc-edge{fill:transparent;stroke:grey;stroke-width:4;transition:stroke-width .2s}:host .fc-edge.fc-hover{fill:transparent;stroke:grey;stroke-width:6}:host .fc-edge.fc-selected{fill:transparent;stroke:red;stroke-width:4}:host .fc-edge.fc-active{-webkit-animation:dash 3s linear infinite;animation:dash 3s linear infinite;stroke-dasharray:20}:host .fc-edge.fc-dragging{pointer-events:none}:host .fc-arrow-marker polygon{fill:grey;stroke:grey}:host .fc-arrow-marker-selected polygon{fill:red;stroke:red}:host .edge-endpoint{fill:grey}:host .fc-noselect{-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}:host .fc-edge-label{margin:0 auto;opacity:.8;position:absolute;transform-origin:bottom left;transition:transform .2s}:host .fc-edge-label .fc-edge-label-text{font-size:16px;position:absolute;text-align:center;transform:translate(-50%,-50%);white-space:nowrap}:host .fc-edge-label .fc-edge-label-text span{background-color:#fff;border:solid #ff3d00;border-radius:10px;color:#ff3d00;cursor:default;padding:3px 5px}:host .fc-edge-label .fc-nodeedit{right:14px;top:-30px}:host .fc-edge-label .fc-nodedelete{right:-13px;top:-30px}:host .fc-edge-label.fc-hover{transform:scale(1.25)}:host .fc-edge-label.fc-edit .fc-edge-label-text span,:host .fc-edge-label.fc-selected .fc-edge-label-text span{background-color:red;border:solid red;color:#fff;font-weight:600}:host .fc-select-rectangle{background:rgba(20,125,255,.1);border:2px dashed #5262ff;position:absolute;z-index:2}@-webkit-keyframes dash{0%{stroke-dashoffset:500}}@keyframes dash{0%{stroke-dashoffset:500}}:host ::ng-deep .fc-nodeedit{display:none;font-size:15px}:host ::ng-deep .fc-nodedelete{display:none;font-size:18px}:host ::ng-deep .fc-edit .fc-nodedelete,:host ::ng-deep .fc-edit .fc-nodeedit{background:#494949;border:2px solid #eee;border-radius:50%;color:#fff;cursor:pointer;display:block;font-weight:600;height:20px;line-height:20px;padding-top:2px;position:absolute;text-align:center;vertical-align:bottom;width:22px}:host ::ng-deep .fc-edit .fc-nodeedit{right:16px;top:-24px}:host ::ng-deep .fc-edit .fc-nodedelete{right:-13px;top:-24px}"]
            },] }
];
NgxFlowchartComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: IterableDiffers },
    { type: FcModelValidationService },
    { type: FcEdgeDrawingService },
    { type: ChangeDetectorRef },
    { type: NgZone }
];
NgxFlowchartComponent.propDecorators = {
    canvasClass: [{ type: HostBinding, args: ['attr.class',] }],
    model: [{ type: Input }],
    selectedObjects: [{ type: Input }],
    edgeStyle: [{ type: Input }],
    userCallbacks: [{ type: Input }],
    automaticResize: [{ type: Input }],
    dragAnimation: [{ type: Input }],
    nodeWidth: [{ type: Input }],
    nodeHeight: [{ type: Input }],
    dropTargetId: [{ type: Input }],
    modelChanged: [{ type: Output }],
    fitModelSizeByDefault: [{ type: Input }],
    dragover: [{ type: HostListener, args: ['dragover', ['$event'],] }],
    drop: [{ type: HostListener, args: ['drop', ['$event'],] }],
    mousedown: [{ type: HostListener, args: ['mousedown', ['$event'],] }],
    mousemove: [{ type: HostListener, args: ['mousemove', ['$event'],] }],
    mouseup: [{ type: HostListener, args: ['mouseup', ['$event'],] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWZsb3djaGFydC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZmxvd2NoYXJ0L3NyYy9saWIvbmd4LWZsb3djaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0EsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osV0FBVyxFQUNYLFlBQVksRUFDWixLQUFLLEVBQ0wsZUFBZSxFQUNmLE1BQU0sRUFDTixNQUFNLEVBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUF3QyxrQkFBa0IsRUFBb0MsTUFBTSx3QkFBd0IsQ0FBQztBQUNwSSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDakQsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDckUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDaEUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDaEUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDekQsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDckUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMvQixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFROUMsTUFBTSxPQUFPLHFCQUFxQjtJQXVFaEMsWUFBb0IsVUFBbUMsRUFDbkMsT0FBd0IsRUFDeEIsZUFBeUMsRUFDMUMsa0JBQXdDLEVBQ3ZDLEVBQXFCLEVB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Ozs7MEJBdUJMLFdBQVcsU0FBQyxZQUFZO29CQUt4QixLQUFLOzhCQUdMLEtBQUs7d0JBR0wsS0FBSzs0QkFHTCxLQUFLOzhCQUdMLEtBQUs7NEJBR0wsS0FBSzt3QkFHTCxLQUFLO3lCQUdMLEtBQUs7MkJBR0wsS0FBSzsyQkFHTCxNQUFNO29DQU9OLEtBQUs7dUJBa05MLFlBQVksU0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7bUJBTW5DLFlBQVksU0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7d0JBVy9CLFlBQVksU0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUM7d0JBS3BDLFlBQVksU0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUM7c0JBS3BDLFlBQVksU0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBEb0NoZWNrLFxuICBJdGVyYWJsZURpZmZlcixcbiAgT25Jbml0XG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSG9zdEJpbmRpbmcsXG4gIEhvc3RMaXN0ZW5lcixcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgTmdab25lLFxuICBPdXRwdXRcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGY0NhbGxiYWNrcywgRmNFZGdlLCBGY01vZGVsLCBGY05vZGUsIEZsb3djaGFydENvbnN0YW50cywgVXNlckNhbGxiYWNrcywgVXNlck5vZGVDYWxsYmFja3MgfSBmcm9tICcuL25neC1mbG93Y2hhcnQubW9kZWxzJztcbmltcG9ydCB7IEZjTW9kZWxTZXJ2aWNlIH0gZnJvbSAnLi9tb2RlbC5zZXJ2aWNlJztcbmltcG9ydCB7IEZjTW9kZWxWYWxpZGF0aW9uU2VydmljZSB9IGZyb20gJy4vbW9kZWx2YWxpZGF0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHsgRmNOb2RlRHJhZ2dpbmdTZXJ2aWNlIH0gZnJvbSAnLi9ub2RlLWRyYWdnaW5nLnNlcnZpY2UnO1xuaW1wb3J0IHsgRmNFZGdlRHJhd2luZ1NlcnZpY2UgfSBmcm9tICcuL2VkZ2UtZHJhd2luZy5zZXJ2aWNlJztcbmltcG9ydCB7IEZjRWRnZURyYWdnaW5nU2VydmljZSB9IGZyb20gJy4vZWRnZS1kcmFnZ2luZy5zZXJ2aWNlJztcbmltcG9ydCB7IEZjTW91c2VPdmVyU2VydmljZSB9IGZyb20gJy4vbW91c2VvdmVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgRmNSZWN0YW5nbGVTZWxlY3RTZXJ2aWNlIH0gZnJvbSAnLi9yZWN0YW5nbGVzZWxlY3Quc2VydmljZSc7XG5pbXBvcnQgeyBjb2VyY2VCb29sZWFuUHJvcGVydHkgfSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGVib3VuY2VUaW1lIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdmYy1jYW52YXMnLFxuICB0ZW1wbGF0ZVVybDogJy4vbmd4LWZsb3djaGFydC5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL25neC1mbG93Y2hhcnQuY29tcG9uZW50LnNjc3MnXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgTmd4Rmxvd2NoYXJ0Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBEb0NoZWNrIHtcblxuICBASG9zdEJpbmRpbmcoJ2F0dHIuY2xhc3MnKVxuICBnZXQgY2FudmFzQ2xhc3MoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gRmxvd2NoYXJ0Q29uc3RhbnRzLmNhbnZhc0NsYXNzO1xuICB9XG5cbiAgQElucHV0KClcbiAgbW9kZWw6IEZjTW9kZWw7XG5cbiAgQElucHV0KClcbiAgc2VsZWN0ZWRPYmplY3RzOiBhbnlbXTtcblxuICBASW5wdXQoKVxuICBlZGdlU3R5bGU6IHN0cmluZztcblxuICBASW5wdXQoKVxuICB1c2VyQ2FsbGJhY2tzOiBVc2VyQ2FsbGJhY2tzO1xuXG4gIEBJbnB1dCgpXG4gIGF1dG9tYXRpY1Jlc2l6ZTogYm9vbGVhbjtcblxuICBASW5wdXQoKVxuICBkcmFnQW5pbWF0aW9uOiBzdHJpbmc7XG5cbiAgQElucHV0KClcbiAgbm9kZVdpZHRoOiBudW1iZXI7XG5cbiAgQElucHV0KClcbiAgbm9kZUhlaWdodDogbnVtYmVyO1xuXG4gIEBJbnB1dCgpXG4gIGRyb3BUYXJnZXRJZDogc3RyaW5nO1xuXG4gIEBPdXRwdXQoKVxuICBtb2RlbENoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgcHJpdmF0ZSBmaXRNb2RlbFNpemVCeURlZmF1bHRWYWx1ZSA9IHRydWU7XG4gIGdldCBmaXRNb2RlbFNpemVCeURlZmF1bHQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZml0TW9kZWxTaXplQnlEZWZhdWx0VmFsdWU7XG4gIH1cbiAgQElucHV0KClcbiAgc2V0IGZpdE1vZGVsU2l6ZUJ5RGVmYXVsdCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuZml0TW9kZWxTaXplQnlEZWZhdWx0VmFsdWUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG5cbiAgY2FsbGJhY2tzOiBGY0NhbGxiYWNrcztcblxuICB1c2VyTm9kZUNhbGxiYWNrczogVXNlck5vZGVDYWxsYmFja3M7XG5cbiAgbW9kZWxTZXJ2aWNlOiBGY01vZGVsU2VydmljZTtcbiAgbm9kZURyYWdnaW5nU2VydmljZTogRmNOb2RlRHJhZ2dpbmdTZXJ2aWNlO1xuICBlZGdlRHJhZ2dpbmdTZXJ2aWNlOiBGY0VkZ2VEcmFnZ2luZ1NlcnZpY2U7XG4gIG1vdXNlb3ZlclNlcnZpY2U6IEZjTW91c2VPdmVyU2VydmljZTtcbiAgcmVjdGFuZ2xlU2VsZWN0U2VydmljZTogRmNSZWN0YW5nbGVTZWxlY3RTZXJ2aWNlO1xuXG4gIGFycm93RGVmSWQ6IHN0cmluZztcbiAgYXJyb3dEZWZJZFNlbGVjdGVkOiBzdHJpbmc7XG5cbiAgZmxvd2NoYXJ0Q29uc3RhbnRzID0gRmxvd2NoYXJ0Q29uc3RhbnRzO1xuXG4gIHByaXZhdGUgbm9kZXNEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPEZjTm9kZT4gPSB0aGlzLmRpZmZlcnMuZmluZChbXSkuY3JlYXRlPEZjTm9kZT4oKGluZGV4LCBpdGVtKSA9PiB7XG4gICAgcmV0dXJuIGl0ZW07XG4gIH0pO1xuXG4gIHByaXZhdGUgZWRnZXNEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPEZjRWRnZT4gPSB0aGlzLmRpZmZlcnMuZmluZChbXSkuY3JlYXRlPEZjRWRnZT4oKGluZGV4LCBpdGVtKSA9PiB7XG4gICAgcmV0dXJuIGl0ZW07XG4gIH0pO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgZGV0ZWN0Q2hhbmdlc1N1YmplY3QgPSBuZXcgU3ViamVjdDxhbnk+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBkaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgICAgICAgICAgIHByaXZhdGUgbW9kZWxWYWxpZGF0aW9uOiBGY01vZGVsVmFsaWRhdGlvblNlcnZpY2UsXG4gICAgICAgICAgICAgIHB1YmxpYyBlZGdlRHJhd2luZ1NlcnZpY2U6IEZjRWRnZURyYXdpbmdTZXJ2aWNlLFxuICAgICAgICAgICAgICBwcml2YXRlIGNkOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICAgICAgICAgICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLmFycm93RGVmSWQgPSAnYXJyb3ctJyArIE1hdGgucmFuZG9tKCk7XG4gICAgdGhpcy5hcnJvd0RlZklkU2VsZWN0ZWQgPSB0aGlzLmFycm93RGVmSWQgKyAnLXNlbGVjdGVkJztcbiAgICB0aGlzLmRldGVjdENoYW5nZXNTdWJqZWN0XG4gICAgICAucGlwZShkZWJvdW5jZVRpbWUoNTApKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLmNkLmRldGVjdENoYW5nZXMoKSk7XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICBpZiAoIXRoaXMuZHJvcFRhcmdldElkICYmIHRoaXMuZWRnZVN0eWxlICE9PSBGbG93Y2hhcnRDb25zdGFudHMuY3VydmVkU3R5bGUgJiYgdGhpcy5lZGdlU3R5bGUgIT09IEZsb3djaGFydENvbnN0YW50cy5saW5lU3R5bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZWRnZVN0eWxlIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgfVxuICAgIHRoaXMubm9kZUhlaWdodCA9IHRoaXMubm9kZUhlaWdodCB8fCAyMDA7XG4gICAgdGhpcy5ub2RlV2lkdGggPSB0aGlzLm5vZGVXaWR0aCB8fCAyMDA7XG4gICAgdGhpcy5kcmFnQW5pbWF0aW9uID0gdGhpcy5kcmFnQW5pbWF0aW9uIHx8IEZsb3djaGFydENvbnN0YW50cy5kcmFnQW5pbWF0aW9uUmVwYWludDtcbiAgICB0aGlzLnVzZXJDYWxsYmFja3MgPSB0aGlzLnVzZXJDYWxsYmFja3MgfHwge307XG4gICAgdGhpcy5hdXRvbWF0aWNSZXNpemUgPSB0aGlzLmF1dG9tYXRpY1Jlc2l6ZSB8fCBmYWxzZTtcblxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMudXNlckNhbGxiYWNrcykpIHtcbiAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy51c2VyQ2FsbGJhY2tzW2tleV07XG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nICYmIGtleSAhPT0gJ25vZGVDYWxsYmFja3MnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIGNhbGxiYWNrcyBzaG91bGQgYmUgZnVuY3Rpb25zLicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudXNlck5vZGVDYWxsYmFja3MgPSB0aGlzLnVzZXJDYWxsYmFja3Mubm9kZUNhbGxiYWNrcztcblxuICAgIGNvbnN0IGVsZW1lbnQgPSAkKHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KTtcblxuICAgIHRoaXMubW9kZWxTZXJ2aWNlID0gbmV3IEZjTW9kZWxTZXJ2aWNlKHRoaXMubW9kZWxWYWxpZGF0aW9uLCB0aGlzLm1vZGVsLCB0aGlzLm1vZGVsQ2hhbmdlZCxcbiAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlc1N1YmplY3QsIHRoaXMuc2VsZWN0ZWRPYmplY3RzLFxuICAgICAgdGhpcy51c2VyQ2FsbGJhY2tzLmRyb3BOb2RlLCB0aGlzLnVzZXJDYWxsYmFja3MuY3JlYXRlRWRnZSwgdGhpcy51c2VyQ2FsbGJhY2tzLmVkZ2VBZGRlZCwgdGhpcy51c2VyQ2FsbGJhY2tzLm5vZGVSZW1vdmVkLFxuICAgICAgdGhpcy51c2VyQ2FsbGJhY2tzLmVkZ2VSZW1vdmVkLCBlbGVtZW50WzBdLCBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ3N2ZycpKTtcblxuICAgIGlmICh0aGlzLmRyb3BUYXJnZXRJZCkge1xuICAgICAgdGhpcy5tb2RlbFNlcnZpY2UuZHJvcFRhcmdldElkID0gdGhpcy5kcm9wVGFyZ2V0SWQ7XG4gICAgfVxuXG4gICAgY29uc3QgYXBwbHlGdW5jdGlvbiA9IHRoaXMuem9uZS5ydW4uYmluZCh0aGlzLnpvbmUpO1xuXG4gICAgdGhpcy5ub2RlRHJhZ2dpbmdTZXJ2aWNlID0gbmV3IEZjTm9kZURyYWdnaW5nU2VydmljZSh0aGlzLm1vZGVsU2VydmljZSwgYXBwbHlGdW5jdGlvbixcbiAgICAgICAgICB0aGlzLmF1dG9tYXRpY1Jlc2l6ZSwgdGhpcy5kcmFnQW5pbWF0aW9uKTtcblxuICAgIHRoaXMuZWRnZURyYWdnaW5nU2VydmljZSA9IG5ldyBGY0VkZ2VEcmFnZ2luZ1NlcnZpY2UodGhpcy5tb2RlbFZhbGlkYXRpb24sIHRoaXMuZWRnZURyYXdpbmdTZXJ2aWNlLCB0aGlzLm1vZGVsU2VydmljZSxcbiAgICAgIHRoaXMubW9kZWwsIHRoaXMudXNlckNhbGxiYWNrcy5pc1ZhbGlkRWRnZSB8fCBudWxsLCBhcHBseUZ1bmN0aW9uLFxuICAgICAgdGhpcy5kcmFnQW5pbWF0aW9uLCB0aGlzLmVkZ2VTdHlsZSk7XG5cbiAgICB0aGlzLm1vdXNlb3ZlclNlcnZpY2UgPSBuZXcgRmNNb3VzZU92ZXJTZXJ2aWNlKGFwcGx5RnVuY3Rpb24pO1xuXG4gICAgdGhpcy5yZWN0YW5nbGVTZWxlY3RTZXJ2aWNlID0gbmV3IEZjUmVjdGFuZ2xlU2VsZWN0U2VydmljZSh0aGlzLm1vZGVsU2VydmljZSxcbiAgICAgIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignI3NlbGVjdC1yZWN0YW5nbGUnKSwgYXBwbHlGdW5jdGlvbik7XG5cbiAgICB0aGlzLmNhbGxiYWNrcyA9IHtcbiAgICAgIG5vZGVEcmFnc3RhcnQ6IHRoaXMubm9kZURyYWdnaW5nU2VydmljZS5kcmFnc3RhcnQuYmluZCh0aGlzLm5vZGVEcmFnZ2luZ1NlcnZpY2UpLFxuICAgICAgbm9kZURyYWdlbmQ6IHRoaXMubm9kZURyYWdnaW5nU2VydmljZS5kcmFnZW5kLmJpbmQodGhpcy5ub2RlRHJhZ2dpbmdTZXJ2aWNlKSxcbiAgICAgIGVkZ2VEcmFnc3RhcnQ6IHRoaXMuZWRnZURyYWdnaW5nU2VydmljZS5kcmFnc3RhcnQuYmluZCh0aGlzLmVkZ2VEcmFnZ2luZ1NlcnZpY2UpLFxuICAgICAgZWRnZURyYWdlbmQ6IHRoaXMuZWRnZURyYWdnaW5nU2VydmljZS5kcmFnZW5kLmJpbmQodGhpcy5lZGdlRHJhZ2dpbmdTZXJ2aWNlKSxcbiAgICAgIGVkZ2VEcm9wOiB0aGlzLmVkZ2VEcmFnZ2luZ1NlcnZpY2UuZHJvcC5iaW5kKHRoaXMuZWRnZURyYWdnaW5nU2VydmljZSksXG4gICAgICBlZGdlRHJhZ292ZXJDb25uZWN0b3I6IHRoaXMuZWRnZURyYWdnaW5nU2VydmljZS5kcmFnb3ZlckNvbm5lY3Rvci5iaW5kKHRoaXMuZWRnZURyYWdnaW5nU2VydmljZSksXG4gICAgICBlZGdlRHJhZ292ZXJNYWduZXQ6IHRoaXMuZWRnZURyYWdnaW5nU2VydmljZS5kcmFnb3Zlck1hZ25ldC5iaW5kKHRoaXMuZWRnZURyYWdnaW5nU2VydmljZSksXG4gICAgICBlZGdlRHJhZ2xlYXZlTWFnbmV0OiB0aGlzLmVkZ2VEcmFnZ2luZ1NlcnZpY2UuZHJhZ2xlYXZlTWFnbmV0LmJpbmQodGhpcy5lZGdlRHJhZ2dpbmdTZXJ2aWNlKSxcbiAgICAgIG5vZGVNb3VzZU92ZXI6IHRoaXMubW91c2VvdmVyU2VydmljZS5ub2RlTW91c2VPdmVyLmJpbmQodGhpcy5tb3VzZW92ZXJTZXJ2aWNlKSxcbiAgICAgIG5vZGVNb3VzZU91dDogdGhpcy5tb3VzZW92ZXJTZXJ2aWNlLm5vZGVNb3VzZU91dC5iaW5kKHRoaXMubW91c2VvdmVyU2VydmljZSksXG4gICAgICBjb25uZWN0b3JNb3VzZUVudGVyOiB0aGlzLm1vdXNlb3ZlclNlcnZpY2UuY29ubmVjdG9yTW91c2VFbnRlci5iaW5kKHRoaXMubW91c2VvdmVyU2VydmljZSksXG4gICAgICBjb25uZWN0b3JNb3VzZUxlYXZlOiB0aGlzLm1vdXNlb3ZlclNlcnZpY2UuY29ubmVjdG9yTW91c2VMZWF2ZS5iaW5kKHRoaXMubW91c2VvdmVyU2VydmljZSksXG4gICAgICBub2RlQ2xpY2tlZDogKGV2ZW50LCBub2RlKSA9PiB7XG4gICAgICAgIHRoaXMubW9kZWxTZXJ2aWNlLm5vZGVzLmhhbmRsZUNsaWNrZWQobm9kZSwgZXZlbnQuY3RybEtleSk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5hZGp1c3RDYW52YXNTaXplKHRoaXMuZml0TW9kZWxTaXplQnlEZWZhdWx0KTtcbiAgfVxuXG4gIG5nRG9DaGVjaygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5tb2RlbCkge1xuICAgICAgY29uc3Qgbm9kZXNDaGFuZ2UgPSB0aGlzLm5vZGVzRGlmZmVyLmRpZmYodGhpcy5tb2RlbC5ub2Rlcyk7XG4gICAgICBjb25zdCBlZGdlc0NoYW5nZSA9IHRoaXMuZWRnZXNEaWZmZXIuZGlmZih0aGlzLm1vZGVsLmVkZ2VzKTtcbiAgICAgIGxldCBub2Rlc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgIGxldCBlZGdlc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgIGlmIChub2Rlc0NoYW5nZSAhPT0gbnVsbCkge1xuICAgICAgICBub2Rlc0NoYW5nZS5mb3JFYWNoQWRkZWRJdGVtKCgpID0+IHtcbiAgICAgICAgICBub2Rlc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgbm9kZXNDaGFuZ2UuZm9yRWFjaFJlbW92ZWRJdGVtKCgpID0+IHtcbiAgICAgICAgICBub2Rlc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChlZGdlc0NoYW5nZSAhPT0gbnVsbCkge1xuICAgICAgICBlZGdlc0NoYW5nZS5mb3JFYWNoQWRkZWRJdGVtKCgpID0+IHtcbiAgICAgICAgICBlZGdlc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgZWRnZXNDaGFuZ2UuZm9yRWFjaFJlbW92ZWRJdGVtKCgpID0+IHtcbiAgICAgICAgICBlZGdlc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChub2Rlc0NoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5hZGp1c3RDYW52YXNTaXplKHRoaXMuZml0TW9kZWxTaXplQnlEZWZhdWx0KTtcbiAgICAgIH1cbiAgICAgIGlmIChub2Rlc0NoYW5nZWQgfHwgZWRnZXNDaGFuZ2VkKSB7XG4gICAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlc1N1YmplY3QubmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEVkZ2VEQXR0cmlidXRlKGVkZ2U6IEZjRWRnZSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZWRnZURyYXdpbmdTZXJ2aWNlLmdldEVkZ2VEQXR0cmlidXRlKHRoaXMubW9kZWxTZXJ2aWNlLmVkZ2VzLnNvdXJjZUNvb3JkKGVkZ2UpLFxuICAgICAgdGhpcy5tb2RlbFNlcnZpY2UuZWRnZXMuZGVzdENvb3JkKGVkZ2UpLCB0aGlzLmVkZ2VTdHlsZSk7XG4gIH1cblxuICBwdWJsaWMgYWRqdXN0Q2FudmFzU2l6ZShmaXQ/OiBib29sZWFuKSB7XG4gICAgbGV0IG1heFggPSAwO1xuICAgIGxldCBtYXhZID0gMDtcbiAgICBjb25zdCBlbGVtZW50ID0gJCh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgdGhpcy5tb2RlbC5ub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICBtYXhYID0gTWF0aC5tYXgobm9kZS54ICsgdGhpcy5ub2RlV2lkdGgsIG1heFgpO1xuICAgICAgbWF4WSA9IE1hdGgubWF4KG5vZGUueSArIHRoaXMubm9kZUhlaWdodCwgbWF4WSk7XG4gICAgfSk7XG4gICAgbGV0IHdpZHRoO1xuICAgIGxldCBoZWlnaHQ7XG4gICAgaWYgKGZpdCkge1xuICAgICAgd2lkdGggPSBtYXhYO1xuICAgICAgaGVpZ2h0ID0gbWF4WTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSBNYXRoLm1heChtYXhYLCBlbGVtZW50LnByb3AoJ29mZnNldFdpZHRoJykpO1xuICAgICAgaGVpZ2h0ID0gTWF0aC5tYXgobWF4WSwgZWxlbWVudC5wcm9wKCdvZmZzZXRIZWlnaHQnKSk7XG4gICAgfVxuICAgIGVsZW1lbnQuY3NzKCd3aWR0aCcsIHdpZHRoICsgJ3B4Jyk7XG4gICAgZWxlbWVudC5jc3MoJ2hlaWdodCcsIGhlaWdodCArICdweCcpO1xuICB9XG5cbiAgY2FudmFzQ2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpIHt9XG5cbiAgZWRnZU1vdXNlRG93bihldmVudDogTW91c2VFdmVudCwgZWRnZTogRmNFZGdlKSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBlZGdlQ2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQsIGVkZ2U6IEZjRWRnZSkge1xuICAgIHRoaXMubW9kZWxTZXJ2aWNlLmVkZ2VzLmhhbmRsZUVkZ2VNb3VzZUNsaWNrKGVkZ2UsIGV2ZW50LmN0cmxLZXkpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH1cblxuICBlZGdlUmVtb3ZlKGV2ZW50OiBFdmVudCwgZWRnZTogRmNFZGdlKSB7XG4gICAgdGhpcy5tb2RlbFNlcnZpY2UuZWRnZXMuZGVsZXRlKGVkZ2UpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH1cblxuICBlZGdlRWRpdChldmVudDogRXZlbnQsIGVkZ2U6IEZjRWRnZSkge1xuICAgIGlmICh0aGlzLnVzZXJDYWxsYmFja3MuZWRnZUVkaXQpIHtcbiAgICAgIHRoaXMudXNlckNhbGxiYWNrcy5lZGdlRWRpdChldmVudCwgZWRnZSk7XG4gICAgfVxuICB9XG5cbiAgZWRnZURvdWJsZUNsaWNrKGV2ZW50OiBNb3VzZUV2ZW50LCBlZGdlOiBGY0VkZ2UpIHtcbiAgICBpZiAodGhpcy51c2VyQ2FsbGJhY2tzLmVkZ2VEb3VibGVDbGljaykge1xuICAgICAgdGhpcy51c2VyQ2FsbGJhY2tzLmVkZ2VEb3VibGVDbGljayhldmVudCwgZWRnZSk7XG4gICAgfVxuICB9XG5cbiAgZWRnZU1vdXNlT3ZlcihldmVudDogTW91c2VFdmVudCwgZWRnZTogRmNFZGdlKSB7XG4gICAgaWYgKHRoaXMudXNlckNhbGxiYWNrcy5lZGdlTW91c2VPdmVyKSB7XG4gICAgICB0aGlzLnVzZXJDYWxsYmFja3MuZWRnZU1vdXNlT3ZlcihldmVudCwgZWRnZSk7XG4gICAgfVxuICB9XG5cbiAgZWRnZU1vdXNlRW50ZXIoZXZlbnQ6IE1vdXNlRXZlbnQsIGVkZ2U6IEZjRWRnZSkge1xuICAgIHRoaXMubW91c2VvdmVyU2VydmljZS5lZGdlTW91c2VFbnRlcihldmVudCwgZWRnZSk7XG4gIH1cblxuICBlZGdlTW91c2VMZWF2ZShldmVudDogTW91c2VFdmVudCwgZWRnZTogRmNFZGdlKSB7XG4gICAgdGhpcy5tb3VzZW92ZXJTZXJ2aWNlLmVkZ2VNb3VzZUxlYXZlKGV2ZW50LCBlZGdlKTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RyYWdvdmVyJywgWyckZXZlbnQnXSlcbiAgZHJhZ292ZXIoZXZlbnQ6IEV2ZW50IHwgYW55KSB7XG4gICAgdGhpcy5ub2RlRHJhZ2dpbmdTZXJ2aWNlLmRyYWdvdmVyKGV2ZW50KTtcbiAgICB0aGlzLmVkZ2VEcmFnZ2luZ1NlcnZpY2UuZHJhZ292ZXIoZXZlbnQpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZHJvcCcsIFsnJGV2ZW50J10pXG4gIGRyb3AoZXZlbnQ6IEV2ZW50IHwgYW55KSB7XG4gICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgICBpZiAoZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gICAgdGhpcy5ub2RlRHJhZ2dpbmdTZXJ2aWNlLmRyb3AoZXZlbnQpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignbW91c2Vkb3duJywgWyckZXZlbnQnXSlcbiAgbW91c2Vkb3duKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgdGhpcy5yZWN0YW5nbGVTZWxlY3RTZXJ2aWNlLm1vdXNlZG93bihldmVudCk7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdtb3VzZW1vdmUnLCBbJyRldmVudCddKVxuICBtb3VzZW1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICB0aGlzLnJlY3RhbmdsZVNlbGVjdFNlcnZpY2UubW91c2Vtb3ZlKGV2ZW50KTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ21vdXNldXAnLCBbJyRldmVudCddKVxuICBtb3VzZXVwKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgdGhpcy5yZWN0YW5nbGVTZWxlY3RTZXJ2aWNlLm1vdXNldXAoZXZlbnQpO1xuICB9XG5cbn1cbiJdfQ==