using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PRG2_Gruberoo
{
    internal class Customer
    {
        // Attributes
        public string EmailAddress { get; set; }
        public string CustomerName { get; set; }

        // Association Attributes
        public List<Order> Orders { get; set; } = new List<Order>();

        // Class Constructors
        public Customer() { }
        public Customer(string emailAddress, string customerName)
        {
            EmailAddress = emailAddress;
            CustomerName = customerName;
        }

        // Methods
        public void AddOrder(Order order)
        {
            Orders.Add(order);
        }

        public void DisplayAllOrders()
        {
            foreach (Order order in Orders)
            {
                Console.WriteLine(order.ToString());
            }
        }

        public bool RemoveOrder(Order order)
        {
            return Orders.Remove(order);
        }

        public override string ToString()
        {
            return $"{CustomerName} - {EmailAddress}";
        }
    }
}
