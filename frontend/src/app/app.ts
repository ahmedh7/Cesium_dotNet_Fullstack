import { Component } from '@angular/core';
import { MapView } from "./map-view/map-view";

import "cesium/Build/Cesium/Widgets/widgets.css";
import { Upload } from "./upload/upload";
import { CesiumDrawComponent } from "./drawer/drawer";
import { ShapefilesTable } from "./shapefiles-table/shapefiles-table";
import { GeometriesTable } from "./geometries-table/geometries-table";

@Component({
  selector: 'app-root',
  imports: [MapView, Upload, CesiumDrawComponent, ShapefilesTable, GeometriesTable],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'cesiumApp';
}
