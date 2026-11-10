using CrudApi.Data;
using CrudApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrudApi.Controllers;

public class EmployeesController(AppDbContext db) : Controller
{
    private bool IsAjax => string.Equals(
        Request.Headers["X-Requested-With"],
        "XMLHttpRequest",
        StringComparison.OrdinalIgnoreCase);

    // GET /Employees?search=jo
    // Normal request: renders the page. AJAX request: returns the matching employees as JSON.
    public async Task<IActionResult> Index(string? search)
    {
        var query = db.Employees.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            // Escape LIKE wildcards so "%" or "_" are searched literally.
            var term = search.Trim()
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");
            query = query.Where(e =>
                EF.Functions.Like(e.Name, $"%{term}%", "\\") ||
                EF.Functions.Like(e.Designation, $"%{term}%", "\\"));
        }

        var employees = await query.OrderBy(e => e.Id).ToListAsync();

        if (IsAjax)
        {
            return Json(employees);
        }

        ViewData["Search"] = search?.Trim();
        return View(employees);
    }

    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Employee employee)
    {
        if (!ModelState.IsValid)
        {
            return IsAjax ? JsonValidationError() : View(employee);
        }

        db.Employees.Add(employee);
        await db.SaveChangesAsync();

        // Shown on the list page after the Create page redirects back.
        TempData["Status"] = "Employee added.";

        return IsAjax ? Json(employee) : RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
        if (employee is null)
        {
            return NotFound();
        }

        return IsAjax ? Json(employee) : View(employee);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Employee employee)
    {
        if (id != employee.Id)
        {
            return BadRequest();
        }

        if (!ModelState.IsValid)
        {
            return IsAjax ? JsonValidationError() : View(employee);
        }

        var exists = await db.Employees.AnyAsync(e => e.Id == id);
        if (!exists)
        {
            return NotFound();
        }

        db.Update(employee);
        await db.SaveChangesAsync();

        // Shown on the list page after the Edit page redirects back.
        TempData["Status"] = "Employee updated.";

        return IsAjax ? Json(employee) : RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
        return employee is null ? NotFound() : View(employee);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var employee = await db.Employees.FindAsync(id);
        if (employee is null)
        {
            return NotFound();
        }

        db.Employees.Remove(employee);
        await db.SaveChangesAsync();

        return IsAjax ? Json(new { id }) : RedirectToAction(nameof(Index));
    }

    private IActionResult JsonValidationError()
    {
        var errors = ModelState
            .Where(entry => entry.Value is { Errors.Count: > 0 })
            .ToDictionary(
                entry => entry.Key,
                entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());

        return BadRequest(new { errors });
    }
}
