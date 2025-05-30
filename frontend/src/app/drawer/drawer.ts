import { Component, OnInit, OnDestroy } from '@angular/core';
import * as Cesium from 'cesium';
import { MapService } from '../map-service';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api-service';

@Component({
  selector: 'app-cesium-draw',
  templateUrl: './drawer.html',
  styleUrls: ['./drawer.scss'],
  imports: [FormsModule]
})
export class CesiumDrawComponent implements OnInit, OnDestroy {

  constructor(private mapService: MapService, private apiService: ApiService) { }

  private handler!: Cesium.ScreenSpaceEventHandler;
  private activeShapePoints: Cesium.Cartesian3[] = [];
  private activeShape: Cesium.Entity | undefined;
  private floatingPoint: Cesium.Entity | undefined;
  public drawingMode: string = '';
  public isDrawing = false;
  public isAskingForLabel = false;
  public newLabel = '';
  private savedGeoJsonGeometry:any;

  ngOnInit(): void {
    this.mapService.viewerStatus$.pipe(
      filter(viewer => !!viewer) // Only proceed when viewer exists
    ).subscribe(() => {
      this.initializeCesium();

    });
  }

  ngOnDestroy(): void {
    if (this.handler) {
      this.handler.destroy();
    }
    if (this.mapService.viewer!) {
      this.mapService.viewer!.destroy();
    }
  }

  private initializeCesium(): void {
    // Initialize event handler
    console.log(this.mapService.viewer);
    this.handler = new Cesium.ScreenSpaceEventHandler(this.mapService.viewer!.scene.canvas);
    this.mapService.viewer!.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  startDrawing(mode: 'polygon' | 'polyline'): void {
    if (this.drawingMode === mode && this.isDrawing) {
      return; // Already in this drawing mode
    }

    this.drawingMode = mode;
    this.isDrawing = true;
    this.clearActiveShape(); // Clear any existing active shape

    // Setup handlers
    this.setupDrawingHandlers();
  }

  private setupDrawingHandlers(): void {
    // Remove any existing handlers
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // Left click - add point
    this.handler!.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const earthPosition = this.getPosition(click.position);
      if (!earthPosition) return;

      if (this.activeShapePoints.length === 0) {
        // Create floating point that follows the mouse
        this.floatingPoint = this.createPoint(earthPosition);
        this.activeShapePoints.push(earthPosition);

        // Create the initial shape
        this.activeShape = this.createShape();
      }

      // Add new point
      this.activeShapePoints.push(earthPosition);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Mouse move - update floating point
    this.handler!.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (this.floatingPoint && this.activeShapePoints.length > 0) {
        const newPosition = this.getPosition(movement.endPosition);
        if (newPosition) {
          this.floatingPoint.position = new Cesium.ConstantPositionProperty(newPosition);
          //this.updateShape();
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Right click - finish drawing
    this.handler!.setInputAction(() => {
      this.finishDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // Double click - finish drawing
    this.handler!.setInputAction(() => {
      this.finishDrawing();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  private getPosition(screenPosition: Cesium.Cartesian2): Cesium.Cartesian3 | undefined {
    let position;
    try {
      // Try to pick position on terrain/3D tiles first
      const ray = this.mapService.viewer!.camera.getPickRay(screenPosition);
      if (ray) {
        position = this.mapService.viewer!.scene.globe.pick(ray, this.mapService.viewer!.scene);
      }
    } catch (e) {
      console.warn('Could not pick position:', e);
    }

    // Fallback to pick position without terrain
    if (!position) {
      position = this.mapService.viewer!.scene.pickPosition(screenPosition);
    }

    return position;
  }

  private createPoint(position: Cesium.Cartesian3): Cesium.Entity {
    return this.mapService.viewer!.entities.add({
      position: position,
      point: {
        pixelSize: 8,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1
      }
    });
  }

  private createShape(): Cesium.Entity {
    if (this.drawingMode === 'polygon') {
      return this.mapService.viewer!.entities.add({
        polygon: {
          hierarchy: new Cesium.CallbackProperty(() => {
            return new Cesium.PolygonHierarchy(this.activeShapePoints);
          }, false),
          material: Cesium.Color.GREEN.withAlpha(0.5),
          outline: true,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2
        }
      });
    } else { // polyline
      return this.mapService.viewer!.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            return this.activeShapePoints;
          }, false),
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.BLUE
          })
        }
      });
    }
  }

  // Called when user finishes drawing (e.g., double click or finish)
  finishDrawing(): void {
    if (!this.isDrawing || this.activeShapePoints.length < 2) {
      return;
    }

    // Stop the drawing state
    this.isDrawing = false;

    // Remove floating point entity if exists
    if (this.floatingPoint) {
      this.mapService.viewer!.entities.remove(this.floatingPoint);
      this.floatingPoint = undefined;
    }

    // Remove the temporary activeShape entity
    if (this.activeShape) {
      this.mapService.viewer!.entities.remove(this.activeShape);
    }

    // Convert Cartesian3 points to GeoJSON geometry and store for later
    if (this.drawingMode === 'polygon' && this.activeShapePoints.length >= 3) {
      const coords = this.activeShapePoints.map(cartesian => {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        return [
          Cesium.Math.toDegrees(cartographic.longitude),
          Cesium.Math.toDegrees(cartographic.latitude)
        ];
      });
      if (
        coords.length > 0 &&
        (coords[0][0] !== coords[coords.length - 1][0] ||
          coords[0][1] !== coords[coords.length - 1][1])
      ) {
        coords.push(coords[0]);
      }
      this.savedGeoJsonGeometry = {
        type: 'Polygon',
        coordinates: [coords]
      };
    } else if (this.drawingMode === 'polyline') {
      const coords = this.activeShapePoints.map(cartesian => {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        return [
          Cesium.Math.toDegrees(cartographic.longitude),
          Cesium.Math.toDegrees(cartographic.latitude)
        ];
      });
      this.savedGeoJsonGeometry = {
        type: 'LineString',
        coordinates: coords
      };
    } else {
      console.warn('Unsupported drawing mode or insufficient points');
      this.resetDrawingState();
      return;
    }

    // Show popup for label input
    this.isAskingForLabel = true;
  }

  saveLabel(): void {
    if (!this.newLabel || this.newLabel.trim() === '') {
      alert('Label is required.');
      return;
    }

    const shapeData = {
      label: this.newLabel.trim(),
      geometry: JSON.stringify(this.savedGeoJsonGeometry)  
    };
    this.apiService.saveNewShape(shapeData);
    this.clearDrawingAndReset();
    this.isAskingForLabel = false;
    
  }

  cancelEdit(): void {
    this.clearDrawingAndReset();
  }

  clearDrawingAndReset(): void {
    // Remove any active shapes if still present
    if (this.activeShape) {
      this.mapService.viewer!.entities.remove(this.activeShape);
      this.activeShape = undefined;
    }
    if (this.floatingPoint) {
      this.mapService.viewer!.entities.remove(this.floatingPoint);
      this.floatingPoint = undefined;
    }

    this.activeShapePoints = [];
    this.isAskingForLabel = false;
    this.newLabel = '';
    this.savedGeoJsonGeometry = undefined;
    this.isDrawing = false;
    // Any other cleanup/reset you want
  }


  clearAll(): void {
    this.resetDrawingState();
    this.mapService.viewer!.entities.removeAll();
  }

  private clearActiveShape(): void {
    if (this.floatingPoint) {
      this.mapService.viewer!.entities.remove(this.floatingPoint);
    }
    if (this.activeShape) {
      this.mapService.viewer!.entities.remove(this.activeShape);
    }
    this.activeShapePoints = [];
  }

  private resetDrawingState(): void {
    this.clearActiveShape();
    this.isDrawing = false;
    this.drawingMode = '';
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler!.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }


}