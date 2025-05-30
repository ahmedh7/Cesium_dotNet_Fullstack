namespace CesiumApp.Models
{
    public class ShapefileModel
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public DateTime UploadDate { get; set; } = DateTime.Now;
    }
}
