namespace SortingHat.Models
{
    public class SortingResponse
    {
        public string Result { get; set; }
        public bool Success { get; set; }
        public string Error { get; set; }

        public static SortingResponse CreateSuccess(string result)
        {
            return new SortingResponse { Success = true, Result = result };
        }

        public static SortingResponse CreateError(string error)
        {
            return new SortingResponse { Success = false, Error = error };
        }
    }
}