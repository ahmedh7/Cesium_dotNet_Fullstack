import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ShapefileModel } from '../../models/ShapefileModel';
import { ApiService } from '../api-service';
import { MapService } from '../map-service';

@Component({
  selector: 'app-shapefiles-table',
  imports: [MatTableModule],
  templateUrl: './shapefiles-table.html',
  styleUrl: './shapefiles-table.scss'
})
export class ShapefilesTable implements OnInit {

  displayedColumns: string[] = ['id','name'];
  dataSource: ShapefileModel[] = [];
  selectedRows = new Set<ShapefileModel>();


  constructor(private apiService: ApiService, private mapService: MapService) { }

  ngOnInit(): void {
    this.apiService.shapeFiles$.subscribe((data) => {
      this.dataSource = data;
    });
    this.apiService.refreshShapefiles();
  }

  onRowClicked(row: ShapefileModel) {
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
      this.mapService.toggleShapefileVisibility(row.id, false);
    } else {
      this.selectedRows.add(row);
      this.mapService.toggleShapefileVisibility(row.id, true);
    }

    const shpFilesIds = new Set([...this.selectedRows].map((s)=> s.id))
    this.mapService.updateSelectedShapefilesIds(shpFilesIds);
  }
}
