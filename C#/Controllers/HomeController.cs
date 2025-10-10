using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SortingHat.Models;
using SortingHat.Services;

namespace SortingHat.Controllers;

public class HomeController : Controller
{
    private readonly IHouseSortingService _sortingService;
    private readonly ILogger<HomeController> _logger;

    public HomeController(IHouseSortingService sortingService, ILogger<HomeController> logger)
    {
        _sortingService = sortingService;
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }

    [HttpGet]
    [Route("api/check-email")]
    public async Task<IActionResult> CheckEmail([FromQuery] string email)
    {
        try
        {
            if (string.IsNullOrEmpty(email))
            {
                return Json(SortingResponse.CreateError("Please provide an email address"));
            }

            var house = await _sortingService.SortByEmailAsync(email);
            return Json(SortingResponse.CreateSuccess(house.Name));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sorting house for email: {Email}", email);
            return Json(SortingResponse.CreateError("An error occurred while sorting your house"));
        }
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Json(new { status = "ok" });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
