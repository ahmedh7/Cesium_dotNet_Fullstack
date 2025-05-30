using CesiumApp.Context;
using CesiumApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using NetTopologySuite.IO.Esri;
using NetTopologySuite.IO.Esri.Shapefiles.Readers;
using Newtonsoft.Json.Linq;
using ProjNet.CoordinateSystems;

namespace CesiumApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public partial class ShapefileController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ShapefilesContext _context;

        public ShapefileController(IWebHostEnvironment environment, ShapefilesContext context)
        {
            _environment = environment;
            _context = context;
        }

        [HttpGet("shapefiles")]
        public async Task<IActionResult> GetShapefileList()
        {
            var shapefiles = await _context.Shapefiles
                .Select(s => new
                {
                    Id = s.ID,
                    Name = s.Name
                })
                .ToListAsync();

            return Ok(shapefiles);
        }

        [HttpGet("geometries/{shapefileId?}")]
        public async Task<IActionResult> GetGeometriesWithLabels([FromRoute] int? shapefileId)
        {
            IQueryable<GeometryModel> query = _context.Geometries;

            if (shapefileId.HasValue)
            {
                query = query.Where(g => g.ShapefielId == shapefileId.Value);
            }

            var geometries = await query.ToListAsync();

            var geoJsonWriter = new GeoJsonWriter();
            var geoJsonFeatures = geometries.Select(g => new
            {
                id = g.ID,
                geometry = geoJsonWriter.Write(g.Geometry),
                shapefileId = g.ShapefielId,
                label = g.Label
            });
            return Ok(geoJsonFeatures);
        }

        [HttpPost("shapefile")]
        public async Task<IActionResult> Upload([FromForm] ShapefileUploadModel model)
        {
            if (model.ShpFile == null /*|| model.ShxFile == null || model.DbfFile == null*/ || model.PrjFile == null)
            {
                return BadRequest("shapefile and projection files (.shp, .prj) are required.");
            }

            var uploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", Path.GetFileNameWithoutExtension(model.ShpFile.FileName));
            Directory.CreateDirectory(uploadPath);

            var files = new Dictionary<string, FileEntry>()
            {
                {".shp", new FileEntry(model.ShpFile) },
                {".prj", new FileEntry(model.PrjFile) },
            };

            foreach (var file in files)
            {
                // Copy shapefile and projection file to upload directory
                var filePath = Path.Combine(uploadPath, Path.GetFileName(model.ShpFile.FileName).Replace(".shp", file.Key));
                using var stream = new FileStream(filePath, FileMode.Create);
                await file.Value.File.CopyToAsync(stream);
                file.Value.Path = filePath;
            }

            bool isWGS84 = CheckWGS84CRS(files[".prj"].Path);
            if (!isWGS84)
            {
                return BadRequest("Coordinate System must be WGS 84.");
            }


            // Process the shapefile and store geometries in the database
            var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
            var shapefile = new ShapefileModel { Name = Path.GetFileNameWithoutExtension(files[".shp"].Path) };
            _context.Shapefiles.Add(shapefile);
            await _context.SaveChangesAsync();

            var geometries = ShapefileReader.ReadAllGeometries(files[".shp"].Path);
            for (int i = 0; i < geometries.Length; i++)
            {
                var geometry = geometries[i];
                if (!geometry.IsValid)
                {
                    geometry = NetTopologySuite.Geometries.Utilities.GeometryFixer.Fix(geometry);
                }

                var geometryEntity = new GeometryModel
                {
                    ShapefielId = shapefile.ID,
                    Geometry = geometryFactory.CreateGeometry(geometry),
                };
                _context.Geometries.Add(geometryEntity);
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Shapefile uploaded and processed successfully." });
        }

        [HttpPut("update-label/{id}")]
        public async Task<IActionResult> UpdateLabel([FromRoute] int id, [FromBody] UpdateLabelDto dto)
        {
            var geometryEntity = await _context.Geometries.FindAsync(id);
            if (geometryEntity is null)
                return NotFound();

            geometryEntity.Label = dto.Label;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("new-shape")]
        public async Task<IActionResult> PostShape([FromBody] NewShapeDto dto)
        {
            if (string.IsNullOrEmpty(dto.Geometry))
                return BadRequest("Geometry is required.");

            Geometry geometry;
            try
            {
                var reader = new GeoJsonReader();
                geometry = reader.Read<Geometry>(dto.Geometry);
            }
            catch (Exception ex)
            {
                return BadRequest("Invalid geometry GeoJSON: " + ex.Message);
            }

            // Example Shapefile ID to check or create — you can get this from dto or assign default
            string drawingsShapefileName = "Drawings";

            // Check if Shapefile exists
            var shapefile = await _context.Shapefiles.FirstOrDefaultAsync((shpf)=> shpf.Name == drawingsShapefileName);

            if (shapefile == null)
            {
                // Create a new shapefile entry
                shapefile = new ShapefileModel
                {
                    Name = drawingsShapefileName
                };

                _context.Shapefiles.Add(shapefile);
                await _context.SaveChangesAsync();  // Save to get the new entry persisted
            }

            var shape = new GeometryModel
            {
                Label = dto.Label,
                Geometry = geometry,
                ShapefielId = shapefile.ID
            };

            _context.Geometries.Add(shape);
            await _context.SaveChangesAsync();

            return StatusCode(201);
        }

        public class NewShapeDto
        {
            public string Label { get; set; }

            // Geometry as a string containing GeoJSON
            public string Geometry { get; set; }
        }

        public class FileEntry(IFormFile file)
        {
            public IFormFile File { get; set; } = file;
            public string Path { get; set; } = string.Empty;
        }

        public class UpdateLabelDto
        {
            public string Label { get; set; } = string.Empty;
        }

        static bool CheckWGS84CRS(string projectionFilePath)
        {

            string wkt = System.IO.File.ReadAllText(projectionFilePath);
            var csFactory = new CoordinateSystemFactory();
            var coordinateSystem = csFactory.CreateFromWkt(wkt);
            // Check if the coordinate system is WGS84
            bool isWGS84 = coordinateSystem.Name.Equals("GCS_WGS_1984", StringComparison.OrdinalIgnoreCase);
            return isWGS84;
        }
    }
}
