import { OnInit } from '@angular/core';
import { ElementRef } from '@angular/core';
import { FcCallbacks, FcConnector } from './ngx-flowchart.models';
import * as ɵngcc0 from '@angular/core';
export declare class FcMagnetDirective implements OnInit {
    elementRef: ElementRef<HTMLElement>;
    callbacks: FcCallbacks;
    connector: FcConnector;
    constructor(elementRef: ElementRef<HTMLElement>);
    ngOnInit(): void;
    dragover(event: Event | any): boolean;
    dragleave(event: Event | any): void;
    drop(event: Event | any): boolean;
    dragend(event: Event | any): void;
    static ɵfac: ɵngcc0.ɵɵFactoryDef<FcMagnetDirective, never>;
    static ɵdir: ɵngcc0.ɵɵDirectiveDefWithMeta<FcMagnetDirective, "[fc-magnet]", never, { "callbacks": "callbacks"; "connector": "connector"; }, {}, never>;
}

//# sourceMappingURL=magnet.directive.d.ts.map