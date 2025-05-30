import { Component, OnInit } from '@angular/core';
import { MapService } from '../map-service';
import * as Cesium from 'cesium';
import { ApiService } from '../api-service';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map-view',
  imports: [FormsModule],
  templateUrl: './map-view.html',
  styleUrl: './map-view.scss'
})
export class MapView implements OnInit {
  containerID: string = 'cesiumContainer';

  selectedFeatureId: number = -1;
  public newLabel = '';
  selectedEntity: Cesium.Entity | null = null;

  constructor(private mapService: MapService, private apiService: ApiService) { }

  ngOnInit(): void {
    this.mapService.initializeMapView(this.containerID);
    this.mapService.viewerStatus$.pipe(
      filter(viewer => !!viewer) // Only proceed when viewer exists
    ).subscribe(() => {
      this.registerPopUpOnClick();
    });

    this.apiService.labelUpdated$.subscribe((geomData) => {
      if (geomData) {
        this.cancelEdit();
      }
      else {
        if (this.selectedFeatureId !== -1)
          alert("Failed to update. Check logs");
      }

    });
  }

  showEditPopup(id: number, label: string, entity: Cesium.Entity) {
    this.selectedFeatureId = id;
    this.newLabel = label;
    this.selectedEntity = entity;
    console.log(id, label, this.selectedEntity  );
  }

  cancelEdit() {
    this.selectedFeatureId = -1 ;
    this.newLabel = '';
    this.selectedEntity = null;
  }

  saveLabel() {
    const id = this.selectedFeatureId;
    const label = this.newLabel;
    if (id !== null){
      if (this.selectedEntity) {
        // update entity's label property locally
        this.selectedEntity.properties!['label'] = new Cesium.ConstantProperty(label);

        this.apiService.updateLabel(id, label);
      }
    }
  }

  registerPopUpOnClick() {
    this.mapService.viewer!.screenSpaceEventHandler.setInputAction((click: { position: Cesium.Cartesian2; }) => {
      const pickedObject = this.mapService.viewer!.scene.pick(click.position);
      if (pickedObject && pickedObject.id && pickedObject.id.properties) {
        const entity = pickedObject.id;

        const id = entity.properties.id.getValue();
        const label = entity.properties.label.getValue();

        // Scroll to the row element (add a template reference to rows)
        const rowElement = document.getElementById(`row-${id}`);
        console.log(rowElement)
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          rowElement.click();
        }

        this.showEditPopup(id, label, entity);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

}
