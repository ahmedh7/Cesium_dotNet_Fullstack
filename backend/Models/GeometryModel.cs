namespace CesiumApp.Models
{
    public class GeometryModel
    {
        public int ID { get; set; }
        public int ShapefielId { get; set; }
        public NetTopologySuite.Geometries.Geometry Geometry { get; set; }
        public string Label { get; set; } = string.Empty;
    }
}
