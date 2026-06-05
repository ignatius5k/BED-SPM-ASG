using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PRG2_Gruberoo
{
    internal class FoodItem
    {
        // Attributes
        public string ItemName { get; set; }
        public string ItemDesc { get; set; }
        public double ItemPrice { get; set; }
        public string Customise { get; set; }

        // Class Constructors
        public FoodItem() { }
        public FoodItem(string itemName, string itemDesc, double itemPrice, string customise)
        {
            ItemName = itemName;
            ItemDesc = itemDesc;
            ItemPrice = itemPrice;
            Customise = customise;
        }

        // Methods
        public override string ToString()
        {
            return $" - {ItemName}: {ItemDesc} - {ItemPrice:C2}";
        }
    }
}
