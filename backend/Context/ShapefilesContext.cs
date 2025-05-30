using CesiumApp.Models;
using Microsoft.EntityFrameworkCore;

namespace CesiumApp.Context
{
    public class ShapefilesContext: DbContext
    {
        public DbSet<ShapefileModel> Shapefiles { get; set; }
        public DbSet<GeometryModel> Geometries { get; set; }
        public ShapefilesContext(DbContextOptions<ShapefilesContext> options)
        : base(options)
        {
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<GeometryModel>()
                .Property(e => e.Geometry)
                .HasColumnType("geometry");
        }
        //protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        //{
        //    optionsBuilder.UseSqlServer(
        //        "TODOConnectionString",
        //        x => x.UseNetTopologySuite());
        //}
    }
}
