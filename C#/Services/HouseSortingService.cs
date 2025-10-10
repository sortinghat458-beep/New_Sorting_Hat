using SortingHat.Models;
using System.Security.Cryptography;
using System.Text;

namespace SortingHat.Services
{
    public interface IHouseSortingService
    {
        Task<House> SortByEmailAsync(string email);
    }

    public class HouseSortingService : IHouseSortingService
    {
        public async Task<House> SortByEmailAsync(string email)
        {
            // Normalize email to lowercase
            email = email.ToLowerInvariant();

            // Use SHA256 to generate a deterministic hash from the email
            using (var sha256 = SHA256.Create())
            {
                var emailBytes = Encoding.UTF8.GetBytes(email);
                var hashBytes = sha256.ComputeHash(emailBytes);
                
                // Use the first byte of the hash to determine the house
                var houseIndex = hashBytes[0] % 4;
                
                var houseType = (HouseType)houseIndex;
                
                return House.Create(houseType);
            }
        }
    }
}