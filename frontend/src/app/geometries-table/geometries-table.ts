import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { GeometryModel } from '../../models/GeometryModel';
import { ApiService } from '../api-service';
import { MapService } from '../map-service';


@Component({
  selector: 'app-geometries-table',
  imports: [MatTableModule],
  templateUrl: './geometries-table.html',
  styleUrl: './geometries-table.scss'
})
export class GeometriesTable implements OnInit {
  displayedColumns: string[] = ['shapefileId', 'id', 'name'];
  dataSource: GeometryModel[] = [];
  filteredGeometries: GeometryModel[] = [];
  selectedRow!: GeometryModel;

  constructor(private apiService: ApiService, private mapService: MapService) {
  }
  ngOnInit(): void {
    this.apiService.geometries$.subscribe((data) => {
      this.dataSource = data;
      console.log(data);
      this.mapService.loadFeaturesToMap(data);
    });

    this.apiService.labelUpdated$.subscribe((geomModel)=>{
      if(!geomModel)
        return;
      const row = this.dataSource.find(r => r.id === geomModel.id);
      if (row)
        row.label = geomModel.label;
    });

    this.mapService.visibleShapeFileIds$.subscribe((ids)=>{
      this.filteredGeometries = this.dataSource.filter((geom)=> ids.has(geom.shapefileId));
    });

    this.apiService.refreshGeometries();
  }

  onRowClicked(row: GeometryModel) {
    this.selectedRow = row;
    this.mapService.zoomToFeature(row.id);
  }
  
}
