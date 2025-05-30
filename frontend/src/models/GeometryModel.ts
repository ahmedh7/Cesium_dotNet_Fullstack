export interface GeometryModel {
  id: number;
  geometry: any;  // GeoJSON object
  shapefileId: number;
  label?: string;
}