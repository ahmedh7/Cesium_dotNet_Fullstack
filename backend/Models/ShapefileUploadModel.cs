namespace CesiumApp.Controllers
{
    public partial class ShapefileController
    {
        public class ShapefileUploadModel
        {
            public IFormFile ShpFile { get; set; }
            //public IFormFile ShxFile { get; set; }
            //public IFormFile DbfFile { get; set; }
            public IFormFile PrjFile { get; set; }
        }

    }
}
