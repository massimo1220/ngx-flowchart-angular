import { Injectable } from '@angular/core';
import { fcTopSort, ModelvalidationError } from './ngx-flowchart.models';
export class FcModelValidationService {
    constructor() { }
    validateModel(model) {
        this.validateNodes(model.nodes);
        this._validateEdges(model.edges, model.nodes);
        return model;
    }
    validateNodes(nodes) {
        const ids = [];
        nodes.forEach((node) => {
            this.validateNode(node);
            if (ids.indexOf(node.id) !== -1) {
                throw new ModelvalidationError('Id not unique.');
            }
            ids.push(node.id);
        });
        const connectorIds = [];
        nodes.forEach((node) => {
            node.connectors.forEach((connector) => {
                if (connectorIds.indexOf(connector.id) !== -1) {
                    throw new ModelvalidationError('Id not unique.');
                }
                connectorIds.push(connector.id);
            });
        });
        return nodes;
    }
    validateNode(node) {
        if (node.id === undefined) {
            throw new ModelvalidationError('Id not valid.');
        }
        if (typeof node.name !== 'string') {
            throw new ModelvalidationError('Name not valid.');
        }
        if (typeof node.x !== 'number' || node.x < 0 || Math.round(node.x) !== node.x) {
            throw new ModelvalidationError('Coordinates not valid.');
        }
        if (typeof node.y !== 'number' || node.y < 0 || Math.round(node.y) !== node.y) {
            throw new ModelvalidationError('Coordinates not valid.');
        }
        if (!Array.isArray(node.connectors)) {
            throw new ModelvalidationError('Connectors not valid.');
        }
        node.connectors.forEach((connector) => {
            this.validateConnector(connector);
        });
        return node;
    }
    _validateEdges(edges, nodes) {
        edges.forEach((edge) => {
            this._validateEdge(edge, nodes);
        });
        edges.forEach((edge1, index1) => {
            edges.forEach((edge2, index2) => {
                if (index1 !== index2) {
                    if ((edge1.source === edge2.source && edge1.destination === edge2.destination) ||
                        (edge1.source === edge2.destination && edge1.destination === edge2.source)) {
                        throw new ModelvalidationError('Duplicated edge.');
                    }
                }
            });
        });
        if (fcTopSort({ nodes, edges }) === null) {
            throw new ModelvalidationError('Graph has a circle.');
        }
        return edges;
    }
    validateEdges(edges, nodes) {
        this.validateNodes(nodes);
        return this._validateEdges(edges, nodes);
    }
    _validateEdge(edge, nodes) {
        if (edge.source === undefined) {
            throw new ModelvalidationError('Source not valid.');
        }
        if (edge.destination === undefined) {
            throw new ModelvalidationError('Destination not valid.');
        }
        if (edge.source === edge.destination) {
            throw new ModelvalidationError('Edge with same source and destination connectors.');
        }
        const sourceNode = nodes.filter((node) => node.connectors.some((connector) => connector.id === edge.source))[0];
        if (sourceNode === undefined) {
            throw new ModelvalidationError('Source not valid.');
        }
        const destinationNode = nodes.filter((node) => node.connectors.some((connector) => connector.id === edge.destination))[0];
        if (destinationNode === undefined) {
            throw new ModelvalidationError('Destination not valid.');
        }
        if (sourceNode === destinationNode) {
            throw new ModelvalidationError('Edge with same source and destination nodes.');
        }
        return edge;
    }
    validateEdge(edge, nodes) {
        this.validateNodes(nodes);
        return this._validateEdge(edge, nodes);
    }
    validateConnector(connector) {
        if (connector.id === undefined) {
            throw new ModelvalidationError('Id not valid.');
        }
        if (connector.type === undefined || connector.type === null || typeof connector.type !== 'string') {
            throw new ModelvalidationError('Type not valid.');
        }
        return connector;
    }
}
FcModelValidationService.decorators = [
    { type: Injectable }
];
FcModelValidationService.ctorParameters = () => [];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWx2YWxpZGF0aW9uLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZmxvd2NoYXJ0L3NyYy9saWIvbW9kZWx2YWxpZGF0aW9uLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMzQyxPQUFPLEVBQXdDLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBRy9HLE1BQU0sT0FBTyx3QkFBd0I7SUFFbkMsZ0JBQWdCLENBQUM7SUFFVixhQUFhLENBQUMsS0FBYztRQUNqQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLGFBQWEsQ0FBQyxLQUFvQjtRQUN2QyxNQUFNLEdBQUcsR0FBYSxFQUFFLENBQUM7UUFDekIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDL0IsTUFBTSxJQUFJLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDbEQ7WUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sWUFBWSxHQUFhLEVBQUUsQ0FBQztRQUNsQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDckIsSUFB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LEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUgsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFO1lBQ2pDLE1BQU0sSUFBSSxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1NBQzFEO1FBQ0QsSUFBSSxVQUFVLEtBQUssZUFBZSxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxvQkFBb0IsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1NBQ2hGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sWUFBWSxDQUFDLElBQVksRUFBRSxLQUFvQjtRQUNwRCxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVNLGlCQUFpQixDQUFDLFNBQXNCO1FBQzdDLElBQUksU0FBUyxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUU7WUFDOUIsTUFBTSxJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ2pEO1FBQ0QsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxPQUFPLFNBQVMsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ2pHLE1BQU0sSUFBSSxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQzs7O1lBcEhGLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBGY0Nvbm5lY3RvciwgRmNFZGdlLCBGY01vZGVsLCBGY05vZGUsIGZjVG9wU29ydCwgTW9kZWx2YWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuL25neC1mbG93Y2hhcnQubW9kZWxzJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEZjTW9kZWxWYWxpZGF0aW9uU2VydmljZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7IH1cblxuICBwdWJsaWMgdmFsaWRhdGVNb2RlbChtb2RlbDogRmNNb2RlbCk6IEZjTW9kZWwge1xuICAgIHRoaXMudmFsaWRhdGVOb2Rlcyhtb2RlbC5ub2Rlcyk7XG4gICAgdGhpcy5fdmFsaWRhdGVFZGdlcyhtb2RlbC5lZGdlcywgbW9kZWwubm9kZXMpO1xuICAgIHJldHVybiBtb2RlbDtcbiAgfVxuXG4gIHB1YmxpYyB2YWxpZGF0ZU5vZGVzKG5vZGVzOiBBcnJheTxGY05vZGU+KTogQXJyYXk8RmNOb2RlPiB7XG4gICAgY29uc3QgaWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIG5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgIHRoaXMudmFsaWRhdGVOb2RlKG5vZGUpO1xuICAgICAgaWYgKGlkcy5pbmRleE9mKG5vZGUuaWQpICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9kZWx2YWxpZGF0aW9uRXJyb3IoJ0lkIG5vdCB1bmlxdWUuJyk7XG4gICAgICB9XG4gICAgICBpZHMucHVzaChub2RlLmlkKTtcbiAgICB9KTtcbiAgICBjb25zdCBjb25uZWN0b3JJZHM6IHN0cmluZ1tdID0gW107XG4gICAgbm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgbm9kZS5jb25uZWN0b3JzLmZvckVhY2goKGNvbm5lY3RvcikgPT4ge1xuICAgICAgICBpZiAoY29ubmVjdG9ySWRzLmluZGV4T2YoY29ubmVjdG9yLmlkKSAhPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTW9kZWx2YWxpZGF0aW9uRXJyb3IoJ0lkIG5vdCB1bmlxdWUuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdG9ySWRzLnB1c2goY29ubmVjdG9yLmlkKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBub2RlcztcbiAgfVxuXG4gIHB1YmxpYyB2YWxpZGF0ZU5vZGUobm9kZTogRmNOb2RlKTogRmNOb2RlIHtcbiAgICBpZiAobm9kZS5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgTW9kZWx2YWxpZGF0aW9uRXJyb3IoJ0lkIG5vdCB2YWxpZC4nKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBub2RlLm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgTW9kZWx2YWxpZGF0aW9uRXJyb3IoJ05hbWUgbm90IHZhbGlkLicpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGUueCAhPT0gJ251bWJlcicgfHwgbm9kZS54IDwgMCB8fCBNYXRoLnJvdW5kKG5vZGUueCkgIT09IG5vZGUueCkge1xuICAgICAgdGhyb3cgbmV3IE1vZGVsdmFsaWRhdGlvbkVycm9yKCdDb29yZGluYXRlcyBub3QgdmFsaWQuJyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygbm9kZS55ICE9PSAnbnVtYmVyJyB8fCBub2RlLnkgPCAwIHx8IE1hdGgucm91bmQobm9kZS55KSAhPT0gbm9kZS55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9kZWx2YWxpZGF0aW9uRXJyb3IoJ0Nvb3JkaW5hdGVzIG5vdCB2YWxpZC4nKTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGUuY29ubmVjdG9ycykpIHtcbiAgICAgIHRocm93IG5ldyBNb2RlbHZhbGlkYXRpb25FcnJvcignQ29ubmVjdG9ycyBub3QgdmFsaWQuJyk7XG4gICAgfVxuICAgIG5vZGUuY29ubmVjdG9ycy5mb3JFYWNoKChjb25uZWN0b3IpID0+IHtcbiAgICAgIHRoaXMudmFsaWRhdGVDb25uZWN0b3IoY29ubmVjdG9yKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHByaXZhdGUgX3ZhbGlkYXRlRWRnZXMoZWRnZXM6IEFycmF5PEZjRWRnZT4sIG5vZGVzOiBBcnJheTxGY05vZGU+KTogQXJyYXk8RmNFZGdlPiB7XG4gICAgZWRnZXMuZm9yRWFjaCgoZWRnZSkgPT4ge1xuICAgICAgdGhpcy5fdmFsaWRhdGVFZGdlKGVkZ2UsIG5vZGVzKTtcbiAgICB9KTtcbiAgICBlZGdlcy5mb3JFYWNoKChlZGdlMSwgaW5kZXgxKSA9PiB7XG4gICAgICBlZGdlcy5mb3JFYWNoKChlZGdlMiwgaW5kZXgyKSA9PiB7XG4gICAgICAgIGlmIChpbmRleDEgIT09IGluZGV4Mikge1xuICAgICAgICAgIGlmICgoZWRnZTEuc291cmNlID09PSBlZGdlMi5zb3VyY2UgJiYgZWRnZTEuZGVzdGluYXRpb24gPT09IGVkZ2UyLmRlc3RpbmF0aW9uKSB8fFxuICAgICAgICAgICAgKGVkZ2UxLnNvdXJjZSA9PT0gZWRnZTIuZGVzdGluYXRpb24gJiYgZWRnZTEuZGVzdGluYXRpb24gPT09IGVkZ2UyLnNvdXJjZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNb2RlbHZhbGlkYXRpb25FcnJvcignRHVwbGljYXRlZCBlZGdlLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgaWYgKGZjVG9wU29ydCh7bm9kZXMsIGVkZ2VzfSkgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBNb2RlbHZhbGlkYXRpb25FcnJvcignR3JhcGggaGFzIGEgY2lyY2xlLicpO1xuICAgIH1cbiAgICByZXR1cm4gZWRnZXM7XG4gIH1cblxuICBwdWJsaWMgdmFsaWRhdGVFZGdlcyhlZGdlczogQXJyYXk8RmNFZGdlPiwgbm9kZXM6IEFycmF5PEZjTm9kZT4pOiBBcnJheTxGY0VkZ2U+IHtcbiAgICB0aGlzLnZhbGlkYXRlTm9kZXMobm9kZXMpO1xuICAgIHJldHVybiB0aGlzLl92YWxpZGF0ZUVkZ2VzKGVkZ2VzLCBub2Rlcyk7XG4gIH1cblxuICBwcml2YXRlIF92YWxpZGF0ZUVkZ2UoZWRnZTogRmNFZGdlLCBub2RlczogQXJyYXk8RmNOb2RlPik6IEZjRWRnZSB7XG4gICAgaWYgKGVkZ2Uuc291cmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBNb2RlbHZhbGlkYXRpb25FcnJvcignU291cmNlIG5vdCB2YWxpZC4nKTtcbiAgICB9XG4gICAgaWYgKGVkZ2UuZGVzdGluYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IE1vZGVsdmFsaWRhdGlvbkVycm9yKCdEZXN0aW5hdGlvbiBub3QgdmFsaWQuJyk7XG4gICAgfVxuICAgIGlmIChlZGdlLnNvdXJjZSA9PT0gZWRnZS5kZXN0aW5hdGlvbikge1xuICAgICAgdGhyb3cgbmV3IE1vZGVsdmFsaWRhdGlvbkVycm9yKCdFZGdlIHdpdGggc2FtZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGNvbm5lY3RvcnMuJyk7XG4gICAgfVxuICAgIGNvbnN0IHNvdXJjZU5vZGUgPSBub2Rlcy5maWx0ZXIoKG5vZGUpID0+IG5vZGUuY29ubmVjdG9ycy5zb21lKChjb25uZWN0b3IpID0+IGNvbm5lY3Rvci5pZCA9PT0gZWRnZS5zb3VyY2UpKVswXTtcbiAgICBpZiAoc291cmNlTm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgTW9kZWx2YWxpZGF0aW9uRXJyb3IoJ1NvdXJjZSBub3QgdmFsaWQuJyk7XG4gICAgfVxuICAgIGNvbnN0IGRlc3RpbmF0aW9uTm9kZSA9IG5vZGVzLmZpbHRlcigobm9kZSkgPT4gbm9kZS5jb25uZWN0b3JzLnNvbWUoKGNvbm5lY3RvcikgPT4gY29ubmVjdG9yLmlkID09PSBlZGdlLmRlc3RpbmF0aW9uKSlbMF07XG4gICAgaWYgKGRlc3RpbmF0aW9uTm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgTW9kZWx2YWxpZGF0aW9uRXJyb3IoJ0Rlc3RpbmF0aW9uIG5vdCB2YWxpZC4nKTtcbiAgICB9XG4gICAgaWYgKHNvdXJjZU5vZGUgPT09IGRlc3RpbmF0aW9uTm9kZSkge1xuICAgICAgdGhyb3cgbmV3IE1vZGVsdmFsaWRhdGlvbkVycm9yKCdFZGdlIHdpdGggc2FtZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIG5vZGVzLicpO1xuICAgIH1cbiAgICByZXR1cm4gZWRnZTtcbiAgfVxuXG4gIHB1YmxpYyB2YWxpZGF0ZUVkZ2UoZWRnZTogRmNFZGdlLCBub2RlczogQXJyYXk8RmNOb2RlPik6IEZjRWRnZSB7XG4gICAgdGhpcy52YWxpZGF0ZU5vZGVzKG5vZGVzKTtcbiAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGVFZGdlKGVkZ2UsIG5vZGVzKTtcbiAgfVxuXG4gIHB1YmxpYyB2YWxpZGF0ZUNvbm5lY3Rvcihjb25uZWN0b3I6IEZjQ29ubmVjdG9yKTogRmNDb25uZWN0b3Ige1xuICAgIGlmIChjb25uZWN0b3IuaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IE1vZGVsdmFsaWRhdGlvbkVycm9yKCdJZCBub3QgdmFsaWQuJyk7XG4gICAgfVxuICAgIGlmIChjb25uZWN0b3IudHlwZSA9PT0gdW5kZWZpbmVkIHx8IGNvbm5lY3Rvci50eXBlID09PSBudWxsIHx8IHR5cGVvZiBjb25uZWN0b3IudHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBNb2RlbHZhbGlkYXRpb25FcnJvcignVHlwZSBub3QgdmFsaWQuJyk7XG4gICAgfVxuICAgIHJldHVybiBjb25uZWN0b3I7XG4gIH1cblxufVxuIl19