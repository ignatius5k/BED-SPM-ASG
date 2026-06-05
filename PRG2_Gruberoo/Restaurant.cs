using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PRG2_Gruberoo
{
    internal class Restaurant
    {
        // Attributes
        public string RestaurantId { get; set; }
        public string RestaurantName { get; set; }
        public string RestaurantEmail { get; set; }

        // Association Attributes
        public List<Menu> Menus { get; set; } = new List<Menu>();
        public List<SpecialOffer> SpecialOffers { get; set; } = new List<SpecialOffer>();
        public List<Order> Orders { get; set; } = new List<Order>();

        // Class Constructors
        public Restaurant() { }
        public Restaurant(string restaurantId, string restaurantName, string restaurantEmail)
        {
            RestaurantId = restaurantId;
            RestaurantName = restaurantName;
            RestaurantEmail = restaurantEmail;
        }

        // Methods
        public void DisplayOrders()
        {
            foreach (Order order in Orders)
            {
                Console.WriteLine(order.ToString());
            }
        }

        public void DisplaySpecialOffers()
        {
            foreach (SpecialOffer offer in SpecialOffers)
            {
                Console.WriteLine(offer.ToString());
            }
        }

        public void DisplayMenu()
        {
            foreach (Menu menu in Menus)
            {
                Console.WriteLine(menu.ToString());
            }
        }

        public void AddMenu(Menu menu)
        {
            Menus.Add(menu);
        }

        public bool RemoveMenu(Menu menu)
        {
            return Menus.Remove(menu);
        }

        public override string ToString()
        {
            return $"Restaurant: {RestaurantName} ({RestaurantId})";
        }
    }
}
