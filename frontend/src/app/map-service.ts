import { EventEmitter, Injectable } from '@angular/core';
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer, GeoJsonDataSource, Color } from 'cesium';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeometryModel } from '../models/GeometryModel';
import * as Cesium from 'cesium';


@Injectable({
  providedIn: 'root'
})
export class MapService {

  private _viewerStatus$ = new BehaviorSubject<any>(null);
  public viewerStatus$ = this._viewerStatus$.asObservable();

  private _visibleShapeFileIds$ = new BehaviorSubject<Set<number>>(new Set());
  public visibleShapeFileIds$ = this._visibleShapeFileIds$.asObservable();

  visibilityState: Record<number, boolean> = {};

  //private currentDataSource: GeoJsonDataSource | null = null;

  shapefileDataSources = new Map<number, Cesium.GeoJsonDataSource>();
  entityMap = new Map<number, Cesium.Entity>();

  constructor() { }

  public viewer: Viewer | null = null;

  initializeMapView(containerID: string) {
    (window as any).CESIUM_BASE_URL = '/assets/cesium';

    // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
    this.viewer = new Viewer(containerID, {
      infoBox: false,
    });
    this._viewerStatus$.next(this.viewer);
  }


  loadFeaturesToMap(data: GeometryModel[]) {
    if (!this.viewer) return;

    // Remove all existing shapefile-specific data sources
    for (const ds of this.shapefileDataSources.values()) {
      this.viewer.dataSources.remove(ds, true);
    }
    this.shapefileDataSources.clear();
    this.entityMap.clear();

    // Group geometries by shapefileId
    const grouped = new Map<number, GeometryModel[]>();
    for (const geom of data) {
      if (!grouped.has(geom.shapefileId)) {
        grouped.set(geom.shapefileId, []);
      }
      grouped.get(geom.shapefileId)!.push(geom);
    }



    // Load each group as a separate GeoJsonDataSource
    for (const [shapefileId, group] of grouped.entries()) {
      // Initialize visibility if not present
      if (!(shapefileId in this.visibilityState)) {
        this.visibilityState[shapefileId] = false; // default not visible
      }
      const featureCollection = {
        type: "FeatureCollection",
        features: group.map((item: GeometryModel) => ({
          type: "Feature",
          geometry: JSON.parse(item.geometry),
          properties: {
            id: item.id,
            label: item.label,
            shapefileId: item.shapefileId
          }
        }))
      };

      Cesium.GeoJsonDataSource.load(featureCollection, {
        stroke: Cesium.Color.BLUE,
        fill: Cesium.Color.CYAN.withAlpha(0.3),
        strokeWidth: 3
      }).then(dataSource => {
         // Apply visibility from visibilityState
        dataSource.show = this.visibilityState[shapefileId];
        this.shapefileDataSources.set(shapefileId, dataSource);
        this.viewer!.dataSources.add(dataSource);

        // Store entities by ID
        dataSource.entities.values.forEach(entity => {
          const id = entity.properties?.['id']?.getValue();
          if (id != null) {
            this.entityMap.set(id, entity);
          }
        });
      }).catch(error => {
        console.error(`Error loading shapefile ${shapefileId}:`, error);
      });
    }
  }

  toggleShapefileVisibility(shapefileId: number, visible: boolean) {
    const ds = this.shapefileDataSources.get(shapefileId);
    if (ds) {
      ds.show = visible;
      if (visible && this.viewer) {
        this.viewer.flyTo(ds);
      }
    }
  }

  updateSelectedShapefilesIds(ids: Set<number>){
    this._visibleShapeFileIds$.next(ids);
  }


  // loadFeaturesToMap(data: GeometryModel[]) {
  //   const featureCollection = {
  //     type: "FeatureCollection",
  //     features: data.map((item: GeometryModel) => ({
  //       type: "Feature",
  //       geometry: JSON.parse(item.geometry),
  //       properties: {
  //         id: item.id,
  //         label: item.label,
  //         shapefileId: item.shapefileId
  //       }
  //     }))
  //   };
  //   //console.log(featureCollection);

  //   // Remove the previous data source if it exists
  //   if (this.currentDataSource && this.viewer) {
  //     this.viewer.dataSources.remove(this.currentDataSource, true);
  //     this.currentDataSource = null;
  //   }

  //   GeoJsonDataSource.load(featureCollection, {
  //     stroke: Color.BLUE,
  //     fill: Color.CYAN.withAlpha(0.3),
  //     strokeWidth: 3
  //   }).then(dataSource => {
  //     this.currentDataSource = dataSource;
  //     this.viewer!.dataSources.add(dataSource);
  //     this.viewer!.zoomTo(dataSource);

  //     // Store each entity by its `id` for quick lookup later
  //     this.entityMap = new Map<number, Cesium.Entity>();
  //     dataSource.entities.values.forEach(entity => {
  //       const id = entity.properties?.['id']?.getValue();
  //       if (id != null) {
  //         this.entityMap.set(id, entity);
  //       }
  //     });
  //   })
  //     .catch(error => {
  //       console.error("Error loading geometries:", error);
  //     });
  // }

  zoomToFeature(id: number) {
    const entity = this.entityMap.get(id);
    if (entity) {
      this.viewer!.flyTo(entity);
    } else {
      console.warn("Entity not found for ID", id);
    }
  }


}
