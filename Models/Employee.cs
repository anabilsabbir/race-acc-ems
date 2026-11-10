using System.ComponentModel.DataAnnotations;

namespace CrudApi.Models;

public class Employee
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = null!;

    [Required]
    [StringLength(100)]
    public string Designation { get; set; } = null!;

    [Required]
    [Range(16, 100)]
    public int? Age { get; set; }

    [Required]
    [Range(0, 1_000_000)]
    public decimal? Salary { get; set; }
}
