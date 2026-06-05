using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.AccessControl;
using System.Text;
using System.Threading.Tasks;

namespace PRG2_Gruberoo
{
    internal class OrderedFoodItem : FoodItem
    {
        // Attributes
        public int QtyOrdered { get; set; }
        public double SubTotal => CalculateSubTotal(); // Changed to read-only property 18/1/ 20:34

        // Class Constructors
        public OrderedFoodItem() { }
        public OrderedFoodItem(string itemName, string itemDesc, double itemPrice, string customise, int qtyOrdered) : base(itemName, itemDesc, itemPrice, customise)
        {
            QtyOrdered = qtyOrdered;
        }

        // Methods
        public double CalculateSubTotal()
        {
            return QtyOrdered * ItemPrice;
        }
    }
}
