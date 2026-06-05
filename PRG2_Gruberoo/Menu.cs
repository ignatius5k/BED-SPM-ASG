using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PRG2_Gruberoo
{
    internal class Menu
    {
        // Attributes
        public string MenuId { get; set; }
        public string MenuName { get; set; }

        // Association Attributes
        public List<FoodItem> FoodItems { get; set; } = new List<FoodItem>();

        // Class Constructors
        public Menu() { }
        public Menu(string menuId, string menuName)
        {
            MenuId = menuId;
            MenuName = menuName;
        }

        // Methods
        public void AddFoodItem(FoodItem foodItem)
        {
            FoodItems.Add(foodItem);
        }

        public bool RemoveFoodItem(FoodItem foodItem)
        {
            return FoodItems.Remove(foodItem);
        }

        public void DisplayFoodItems()
        {
            for (int i = 0; i < FoodItems.Count; i++)
            {
                Console.WriteLine($"{i + 1}. {FoodItems[i]}");
            }
        }

        public override string ToString()
        {
            return $"{MenuName} (ID: {MenuId})";
        }
    }
}
