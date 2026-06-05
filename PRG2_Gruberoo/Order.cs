using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PRG2_Gruberoo
{
    internal class Order
    {   
        // Attributes
        public int OrderId { get; set; }
        public DateTime OrderDateTime { get; set; }
        public double OrderTotal => CalculateOrderTotal(); // Changed to read-only property 18/1/ 20:34
        public string OrderStatus { get; set; }
        public DateTime DeliveryDateTime { get; set; }
        public string DeliveryAddress { get; set; }
        public string OrderPaymentMethod { get; set; }
        public bool OrderPaid { get; set; }

        // Association Attributes
        public List<OrderedFoodItem> OrderedFoodItems { get; set; } = new List<OrderedFoodItem>();
        public Customer Customer { get; set; }
        public Restaurant Restaurant { get; set; }
        public SpecialOffer SpecialOffer { get; set; }

        // Class Constructors
        public Order() { }
        public Order(int orderId, DateTime orderDateTime, string orderStatus, DateTime deliveryDateTime, string deliveryAddress, string orderPaymentMethod, bool orderPaid, Customer customer, Restaurant restaurant, SpecialOffer specialOffer)
        {
            OrderId = orderId;
            OrderDateTime = orderDateTime;
            OrderStatus = orderStatus;
            DeliveryDateTime = deliveryDateTime;
            DeliveryAddress = deliveryAddress;
            OrderPaymentMethod = orderPaymentMethod;
            OrderPaid = orderPaid;
            Customer = customer;
            Restaurant = restaurant;
            SpecialOffer = specialOffer;
        }

        // Methods
        public double CalculateOrderTotal() 
        {   
            double orderTotal = 0;
            foreach (var item in OrderedFoodItems)
            {
                orderTotal += item.CalculateSubTotal();
            }
            return orderTotal;
        }

        public void AddOrderedFoodItem(OrderedFoodItem orderedFoodItem)
        {
            OrderedFoodItems.Add(orderedFoodItem);
        }

        public bool RemoveOrderedFoodItem(OrderedFoodItem orderedFoodItem)
        {
            
            return OrderedFoodItems.Remove(orderedFoodItem);

        }

        public void DisplayOrderedFoodItems()
        {
            foreach (var item in OrderedFoodItems)
            {
                Console.WriteLine(item.ToString());
            }
        }

        public override string ToString()
        {
            return $"{OrderId,-10} {Customer.CustomerName,-12} {Restaurant.RestaurantName,-15} {DeliveryDateTime,-20} {this.CalculateOrderTotal(),-8:C2} {OrderStatus,-8}";
        }

    }
}
