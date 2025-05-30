import { Injectable } from '@angular/core';
import { environment } from '../environments/environmetn';
import { HttpClient } from '@angular/common/http';
import { ShapefileModel } from '../models/ShapefileModel';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeometryModel } from '../models/GeometryModel';
import { NewShapeData } from '../models/NewShapeData';
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  private _isUploadingStatus$ = new BehaviorSubject<boolean>(false);
  public isUploadingStatus$ = this._isUploadingStatus$.asObservable();

  private _labelUpdated$ = new BehaviorSubject<GeometryModel | null>(null);
  public labelUpdated$ = this._labelUpdated$.asObservable();

  private _uploadMessage$ = new BehaviorSubject<string>('');
  public uploadMessage$ = this._uploadMessage$.asObservable();

  private _shapeFiles$ = new BehaviorSubject<ShapefileModel[]>([]);
  public shapeFiles$ = this._shapeFiles$.asObservable();

  private _geometries$ = new BehaviorSubject<GeometryModel[]>([]);
  public geometries$ = this._geometries$.asObservable();

  postShapefile(formData: FormData){
    this._isUploadingStatus$.next(true);
    this.http.post(`${environment.apiBaseUrl}/shapefile/shapefile`, formData).subscribe({
      next: response => {
        this._isUploadingStatus$.next(false);
        this._uploadMessage$.next('Upload Successful');
        console.log(response);
        this.refreshShapefiles();
        this.refreshGeometries();
      },
      error: err => {
        this._isUploadingStatus$.next(false);
        this._uploadMessage$.next('Upload failed.' + err.error);
        console.error(err);
      }
    });
  }

  refreshShapefiles(): void {
    this.http.get<ShapefileModel[]>(`${environment.apiBaseUrl}/shapefile/shapefiles`).subscribe({
      next: (data) => {
        this._shapeFiles$.next(data);
      },
      error: (error) => {
        console.error('Error fetching shapefiles:', error);
      }
    });;
  }

  refreshGeometries(): void {
    this.http.get<GeometryModel[]>(`${environment.apiBaseUrl}/shapefile/geometries`).subscribe({
      next: (data) => {
        this._geometries$.next(data);
      },
      error: (error) => {
        console.error('Error fetching geometries:', error);
      }
    });;
  }

  updateLabel(id: number, label: string) {
    this.http.put(`${environment.apiBaseUrl}/shapefile/update-label/${id}`, { label }).subscribe({
      next: () => {
        const geomModel : GeometryModel ={id, label, geometry:null, shapefileId: 0};
        this._labelUpdated$.next(geomModel);
      },
      error: (err) => {
        console.error('Error saving label', err);
        this._labelUpdated$.next(null);
      }
    });
  }

  saveNewShape(shape: NewShapeData) {
    this.http.post(`${environment.apiBaseUrl}/shapefile/new-shape`, shape,
    {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        this.refreshShapefiles();
        this.refreshGeometries();
      },
      error: (err) => {
        console.error('Error saving new shape', err);
        
      }
    });
  }

  // Get all geometries
  getAllGeometries(): Observable<GeometryModel[]> {
    return this.http.get<GeometryModel[]>(`${environment.apiBaseUrl}/shapefile/geometries`);
  }

  // Get geometries filtered by shapefileId
  getGeometriesByShapefileId(shapefileId: number): Observable<GeometryModel[]> {
    return this.http.get<GeometryModel[]>(`${environment.apiBaseUrl}/shapefile/geometries/${shapefileId}`);
  }
}
