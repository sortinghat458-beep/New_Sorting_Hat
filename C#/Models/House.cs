namespace SortingHat.Models
{
    public enum HouseType
    {
        GriffinHour,
        RavenClause,
        SlytheRoll,
        HuffleStaff
    }

    public class House
    {
        public HouseType Type { get; set; }
        public string Name => Type.ToString();
        public string ImagePath => $"/assets/{Name}.png";

        public static House Create(HouseType type)
        {
            return new House { Type = type };
        }
    }
}