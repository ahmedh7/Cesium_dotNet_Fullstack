namespace CesiumApp.Controllers
{
    public partial class ShapefileController
    {
        public class LabelUpdateModel
        {
            public int ShapefileId { get; set; }
            public Dictionary<int, string> Labels { get; set; } = []; // Key: Geometry ID, Value: New Label
        }


    }
}
