using PRG2_Gruberoo;
using System;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Text.RegularExpressions;
using System.Text;

List<Restaurant> restaurantList = new List<Restaurant>();
List<Customer> customerList = new List<Customer>();
Stack<Order> refundStack = new Stack<Order>();
Dictionary<string, List<Order>> favouriteOrders = new Dictionary<string, List<Order>>();

void LoadRestaurants()
{
    // Load Restaurants
    using (StreamReader sr = new StreamReader("Data/restaurants.csv"))
    {
        sr.ReadLine(); // Skip header line
        string? line = "";
        int count = 0;

        while ((line = sr.ReadLine()) != null)
        {
            try
            {
                string[] values = line.Split(',');
                string restaurantId = values[0];
                string restaurantName = values[1];
                string restaurantEmail = values[2];
                restaurantList.Add(new Restaurant(restaurantId, restaurantName, restaurantEmail));
                count += 1;
            }
            catch (FormatException ex)
            {
                Console.WriteLine($"Error parsing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error processing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
        }

        Console.WriteLine($"{count} restaurants loaded!");
    }
}

void LoadFoodItems()
{
    // Load Food Items
    using (StreamReader sr = new StreamReader("Data/fooditems.csv"))
    {
        sr.ReadLine(); // Skip header line
        string? line = "";
        int count = 0;
        while ((line = sr.ReadLine()) != null)
        {
            try
            {
                string[] values = line.Split(',');
                string restaurantId = values[0];
                string itemName = values[1];
                string description = values[2];
                double price = double.Parse(values[3]);


                foreach (Restaurant restaurant in restaurantList) // Assign food items to respective restaurants
                {
                    if (restaurant.RestaurantId == restaurantId)
                    {
                        if (restaurant.Menus.Count < 1) // If no menu exists, create one and than add food item to it
                        {
                            restaurant.AddMenu(new Menu("M001", "Main Menu"));
                        }

                        restaurant.Menus[0].AddFoodItem(new FoodItem(itemName, description, price, ""));
                        break;
                    }
                }
                count += 1;
            }
            catch (FormatException ex)
            {
                Console.WriteLine($"Error parsing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error processing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
        }
        Console.WriteLine($"{count} food items loaded!");
    }
}

void LoadCustomers()
{
    // Load Customers
    using (StreamReader sr = new StreamReader("Data/customers.csv"))
    {
        sr.ReadLine(); // Skip header line
        string? line = "";
        int count = 0;
        while ((line = sr.ReadLine()) != null)
        {
            try
            {
                string[] values = line.Split(',');
                string customerName = values[0];
                string customerEmail = values[1];
                customerList.Add(new Customer(customerEmail, customerName));
                count += 1;
            }
            catch (FormatException ex)
            {
                Console.WriteLine($"Error parsing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error processing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
        }
        Console.WriteLine($"{count} customers loaded!");
    }
}

int orderCount = 1000; // Needed for when unqiue orderID needs to be generated when creating new Order objects
void LoadOrders()
{
    // Load Orders
    using (StreamReader sr = new StreamReader("Data/orders.csv"))
    {
        sr.ReadLine(); // Skip header line
        string? line = ""; // Skip header line
        int count = 0;

        while ((line = sr.ReadLine()) != null)
        {
            try
            {
                // Split by commas, but keep quoted text together
                string[] values = Regex.Split(line, ",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

                // Basic Info
                int orderId = int.Parse(values[0]);
                string customerEmail = values[1];
                string restaurantId = values[2];

                // Time & Location
                DateOnly deliveryDate = DateOnly.Parse(values[3]);
                TimeOnly deliveryTime = TimeOnly.Parse(values[4]);
                DateTime deliveryDateTime = new DateTime(deliveryDate, deliveryTime);
                string deliveryAddress = values[5];
                DateTime createdDateTime = DateTime.Parse(values[6]);

                // Payment & Status
                double totalAmount = double.Parse(values[7]);
                string status = values[8];

                // Food Items "Chicken Katsu Bento, 1|Vegetable Tempura Bento, 1"
                string items = values[9].Trim('"');
                string[] itemSplit = items.Split('|');

                // Find associated customer and restaurant to create new order object
                Customer? orderCustomer = null;
                foreach (Customer customer in customerList)
                {
                    if (customer.EmailAddress == customerEmail)
                    {
                        orderCustomer = customer;
                        break;
                    }
                }

                Restaurant? orderRestaurant = null;
                foreach (Restaurant restaurant in restaurantList)
                {
                    if (restaurantId == restaurant.RestaurantId)
                    {
                        orderRestaurant = restaurant;
                        break;
                    }
                }

                SpecialOffer specialOffer = new SpecialOffer();

                // Create Order Object to add food items
                if (orderCustomer != null && orderRestaurant != null)
                {
                    Order newOrder = new Order(orderId, createdDateTime, status, deliveryDateTime, deliveryAddress, "", false, orderCustomer, orderRestaurant, specialOffer);

                    // Find associated food items
                    FoodItem? foodItem = null;
                    OrderedFoodItem? orderedFoodItem = null;
                    foreach (string item in itemSplit) // Add all ordered food items to order
                    {

                        string[] itemDetails = item.Split(",");
                        string itemName = itemDetails[0];
                        int quantity = 0;
                        if (itemDetails.Length > 1)
                        {
                            quantity = int.Parse(itemDetails[1]);
                        }


                        foodItem = orderRestaurant?.Menus[0].FoodItems.Find(f => f.ItemName == itemName);
                        if (foodItem != null)
                        {
                            orderedFoodItem = new OrderedFoodItem(foodItem.ItemName, foodItem.ItemDesc, foodItem.ItemPrice, "", quantity);
                            newOrder.AddOrderedFoodItem(orderedFoodItem);
                        }
                    }

                    // Add order to restaurant's order queue and customer's order list
                    if (orderCustomer != null && orderRestaurant != null)
                    {
                        orderRestaurant.Orders.Add(newOrder);
                        orderCustomer.AddOrder(newOrder);
                        count += 1;
                    }
                }
            }
            catch (FormatException ex)
            {
                Console.WriteLine($"Error parsing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error processing line: {line}. Exception: {ex.Message}");
                continue; // Skip to the next line
            }
        }

        Console.WriteLine($"{count} orders loaded!");
        orderCount += count;
    }
}



void DisplayMenu()
{
    Console.WriteLine("\n===== Gruberoo Food Delivery System =====");
    Console.WriteLine("1. List all restaurants and menu items");
    Console.WriteLine("2. List all orders");
    Console.WriteLine("3. Create a new order");
    Console.WriteLine("4. Process an order");
    Console.WriteLine("5. Modify an existing order");
    Console.WriteLine("6. Delete an existing order");
    Console.WriteLine("7. Display total order amount");
    Console.WriteLine("8. Bulk processing of unprocessed orders for a current day");
    Console.WriteLine("9. Add order to favourites");
    Console.WriteLine("10. View favourite orders");
    Console.WriteLine("0. Exit");
    Console.Write("Enter your choice: ");
}



// (1) List all restaurants and menu items
void ListRestMenuItems()
{
    foreach (Restaurant restaurant in restaurantList)
    {
        Console.WriteLine($"\n{restaurant}");

        // Each menu in restaurant
        foreach (Menu menu in restaurant.Menus)
        {
            // Each food item in menu
            foreach (FoodItem foodItem in menu.FoodItems)
            {
                Console.WriteLine(foodItem);
            }
        }
    }
}



// (2) List all orders
void ListAllOrders()
{
    Console.WriteLine("\nAll Orders");
    Console.WriteLine("==========");
    Console.WriteLine("Order ID   Customer      Restaurant    Delivery Date/Time    Amount     Status");
    Console.WriteLine("--------   --------      ----------    ------------------    ------     ---------");

    // 1. Collect all orders
    List<Order> allOrders = new List<Order>();

    foreach (Restaurant restaurant in restaurantList)
    {
        foreach (Order order in restaurant.Orders)
        {
            allOrders.Add(order);
        }
    }

    // 2. Sort by Order ID
    allOrders.Sort((o1, o2) => o1.OrderId.CompareTo(o2.OrderId));

    // 3. Print in correct order
    foreach (Order order in allOrders)
    {
        Console.WriteLine(
            order.OrderId.ToString().PadRight(10) +
            order.Customer.CustomerName.PadRight(14) +
            order.Restaurant.RestaurantName.PadRight(16) +
            order.DeliveryDateTime.ToString("dd/MM/yyyy HH:mm").PadRight(21) +
            order.CalculateOrderTotal().ToString("C2").PadRight(11) +
            order.OrderStatus
        );
    }
}




// (3) Create a new order
void CreateNewOrder()
{
    // Create new Order object
    Console.WriteLine("\nCreate New Order");
    Console.WriteLine("================");

    Order newOrder = InitializeNewOrder();
    newOrder.Customer = FindCustomer();
    newOrder.Restaurant = FindRestaurant();
    newOrder.DeliveryDateTime = GetDeliveryDateTime();
    newOrder.DeliveryAddress = GetDeliveryAddress();

    ShowAvailableFoodItems(newOrder.Restaurant);
    AddItemsToOrder(newOrder);
    ProcessPayment(newOrder);

    DateOnly date = DateOnly.FromDateTime(newOrder.DeliveryDateTime);
    TimeOnly time = TimeOnly.FromDateTime(newOrder.DeliveryDateTime);

    // Build items string
    var sb = new StringBuilder();
    sb.Append('"');
    for (int i = 0; i < newOrder.OrderedFoodItems.Count; i++)
    {
        sb.Append($"{newOrder.OrderedFoodItems[i].ItemName}, {newOrder.OrderedFoodItems[i].QtyOrdered}");
        if (i != newOrder.OrderedFoodItems.Count - 1)
        {
            sb.Append('|');
        }
    }
    sb.Append('"');
    string items = sb.ToString();

    // Append to orders.csv
    using (StreamWriter sw = new StreamWriter("Data/orders.csv", true))
    {
        sw.WriteLine(
            $"{newOrder.OrderId}," +
            $"{newOrder.Customer.EmailAddress}," +
            $"{newOrder.Restaurant.RestaurantId}," +
            $"{date.ToString("d/M/yyyy")}," +
            $"{time.ToString("HH:mm")}," +
            $"{newOrder.DeliveryAddress}," +
            $"{newOrder.OrderDateTime.ToString("d/M/yyyy HH:mm")}," +
            $"{newOrder.CalculateOrderTotal()}," +
            $"{newOrder.OrderStatus}," +
            $"{items}");
    }
}

Order InitializeNewOrder()
{
    Order newOrder = new Order();
    orderCount += 1; // OrderCount is from the count of orders loaded from orders.csv
    newOrder.OrderId = orderCount;
    newOrder.OrderDateTime = DateTime.Now;
    newOrder.OrderStatus = "Pending";
    newOrder.OrderPaid = false;
    return newOrder;
}

Customer FindCustomer()
{
    while (true)
    {
        Console.Write("Enter Customer Email: ");
        string? custEmail = Console.ReadLine();
        Customer? customer = customerList.Find(f => f.EmailAddress == custEmail);
        if (customer != null)
        {
            return customer;
        }
        Console.WriteLine("Could not find customer with that email.\n");
    }
}

Restaurant FindRestaurant()
{
    while (true)
    {
        Console.Write("Enter Restaurant ID: ");
        string? restaurantId = Console.ReadLine();
        Restaurant? restaurant = restaurantList.Find(f => f.RestaurantId == restaurantId);
        if (restaurant != null)
        {
            return restaurant;
        }
        else
        {
            Console.WriteLine("Could not find restaurant with that ID.\n");
        }
    }
}

DateTime GetDeliveryDateTime()
{
    while (true)
    {
        Console.Write("Enter Delivery Date (dd/mm/yyyy): ");
        if (DateOnly.TryParse(Console.ReadLine(), out DateOnly date))
        {
            Console.Write("Enter Delivery Time (hh:mm): ");
            if (TimeOnly.TryParse(Console.ReadLine(), out TimeOnly time))
            {
                // Combine into a DateTime
                DateTime deliveryDateTime = date.ToDateTime(time);

                // Compare against current time
                if (deliveryDateTime > DateTime.Now)
                {
                    return deliveryDateTime;
                }
                else
                {
                    Console.WriteLine("Delivery must be in the future.\n");
                }
            }
            else
            {
                Console.WriteLine("Invalid time format.\n");
            }
        }
        else
        {
            Console.WriteLine("Invalid date format.\n");
        }
    }
}

string GetDeliveryAddress()
{
    while (true)
    {
        Console.Write("Enter Delivery Address: ");
        string? deliveryAddr = Console.ReadLine();
        if (deliveryAddr != null && deliveryAddr != "")
        {
            return deliveryAddr;
        }
        else
        {
            Console.WriteLine("Invalid delivery address.\n");
        }
    }
}

void ShowAvailableFoodItems(Restaurant restaurant)
{
    Console.WriteLine("\nAvailable Food Items:");
    foreach (Menu menu in restaurant.Menus)
    {
        menu.DisplayFoodItems();
    }
}

void AddItemsToOrder(Order order)
{
    // Get all food items and put in one list
    List<FoodItem> itemList = new List<FoodItem>();
    foreach (Menu menu in order.Restaurant.Menus)
    {
        foreach (FoodItem foodItem in menu.FoodItems)
        {
            itemList.Add(foodItem);
        }
    }

    // Add item to order
    while (true)
    {
        Console.Write("\nEnter item nummber (0 to finish): ");
        if (int.TryParse(Console.ReadLine(), out int orderItemNo))
        {
            if (orderItemNo == 0)
            {
                if (order.OrderedFoodItems.Count <= 0)
                {
                    Console.WriteLine("Order at least one food item.");
                }
                else
                {
                    break;
                }
            }
            else if (orderItemNo > 0 && orderItemNo <= itemList.Count) // Checks if num does not exceed menu item count
            {
                FoodItem selectedItem = itemList[orderItemNo - 1];

                Console.Write("Enter quantity: ");
                if (int.TryParse(Console.ReadLine(), out int quantity) && quantity > 0)
                {
                    OrderedFoodItem? orderedFoodItem = order.OrderedFoodItems.Find(f => f.ItemName == selectedItem.ItemName);
                    if (orderedFoodItem != null)
                    {
                        orderedFoodItem.QtyOrdered += quantity;
                    }
                    else
                    {
                        orderedFoodItem = new OrderedFoodItem(selectedItem.ItemName, selectedItem.ItemDesc, selectedItem.ItemPrice, AddSpecialRequest(), quantity);
                        order.AddOrderedFoodItem(orderedFoodItem);
                    }
                }
                else
                {
                    Console.WriteLine("Invalid quantity.");
                }
            }
            else
            {
                Console.WriteLine("Item number does not exist.");
            }
        }
        else
        {
            Console.WriteLine("Item number does not exist.");
        }
    }
}

string AddSpecialRequest()
{
    while (true)
    {
        Console.Write("Add special request? [Y/N]: ");
        string? userChoice = Console.ReadLine();
        if (userChoice == "Y")
        {
            Console.Write("Enter special request: ");
            string? specialRequest = Console.ReadLine();
            if (specialRequest != null)
            {
                return specialRequest;
            }
        }
        else if (userChoice == "N")
        {
            return "";
        }
        else
        {
            Console.WriteLine("Invalid choice.\n");
        }
    }
}

void ProcessPayment(Order order)
{
    Console.WriteLine($"\nOrder Total: {order.CalculateOrderTotal():C2} + {5:C2} (delivery) = {order.CalculateOrderTotal() + 5:C2}");
    bool paymentSuccess = false;

    while (paymentSuccess != true)
    {
        Console.Write("Proceed to payment? [Y/N]: ");
        string? userChoice = Console.ReadLine();
        if (userChoice == "Y")
        {
            // Payment method
            Console.WriteLine("\nPayment method: ");
            while (true)
            {
                Console.Write("[CC] Credit Card / [PP] PayPal / [CD] Cash on Delivery: ");
                string? paymentMethod = Console.ReadLine();
                if (paymentMethod == "CC" || paymentMethod == "PP" || paymentMethod == "CD")
                {
                    order.OrderPaymentMethod = paymentMethod;
                    order.Restaurant.Orders.Add(order);
                    order.Customer.AddOrder(order);
                    Console.WriteLine($"\nOrder {order.OrderId} created successfully! Status: {order.OrderStatus}");
                    paymentSuccess = true;
                    break;
                }
                else
                {
                    Console.WriteLine("Invalid payment method.\n");
                }
            }
        }
        else if (userChoice == "N")
        {
            break;
        }
        else
        {
            Console.WriteLine("Invalid choice.\n");
        }
    }
}



// (4) Process an order
void ProcessOrder()
{
    Console.WriteLine("\nProcess Order");
    Console.WriteLine("=============");

    Console.Write("Enter Restaurant ID: ");
    string? restaurantId = Console.ReadLine();

    Restaurant? restaurant = restaurantList.Find(r => r.RestaurantId == restaurantId);

    if (restaurant == null)
    {
        Console.WriteLine("Restaurant not found.");
        return;
    }

    foreach (Order order in restaurant.Orders)
    {
        Console.WriteLine($"\nOrder {order.OrderId}:");
        Console.WriteLine($"Customer: {order.Customer.CustomerName}");

        Console.WriteLine("Ordered Items:");
        int i = 1;
        foreach (OrderedFoodItem item in order.OrderedFoodItems)
        {
            Console.WriteLine($"{i}. {item.ItemName} - {item.QtyOrdered}");
            i++;
        }

        Console.WriteLine($"Delivery date/time: {order.DeliveryDateTime:dd/MM/yyyy HH:mm}");
        Console.WriteLine($"Total Amount: {order.CalculateOrderTotal():C2}");
        Console.WriteLine($"Order Status: {order.OrderStatus}");

        Console.Write("\n[C]onfirm / [R]eject / [S]kip / [D]eliver: ");
        string? choice = Console.ReadLine()?.ToUpper();

        if (choice == "C")
        {
            if (order.OrderStatus == "Pending")
            {
                order.OrderStatus = "Preparing";
                Console.WriteLine($"\nOrder {order.OrderId} confirmed. Status: Preparing");
            }
            else
            {
                Console.WriteLine("\nInvalid action for current order status.");
            }
        }
        else if (choice == "R")
        {
            if (order.OrderStatus == "Pending")
            {
                order.OrderStatus = "Cancelled";
                Console.WriteLine($"\nOrder {order.OrderId} rejected. Status: Cancelled");
                Console.WriteLine("Refund will be processed.");
            }
            else
            {
                Console.WriteLine("\nInvalid action for current order status.");
            }
        }
        else if (choice == "S")
        {
            if (order.OrderStatus == "Cancelled")
            {
                Console.WriteLine("\nOrder skipped.");
            }
            else
            {
                Console.WriteLine("\nInvalid action for current order status.");
            }
        }
        else if (choice == "D")
        {
            if (order.OrderStatus == "Preparing")
            {
                order.OrderStatus = "Delivered";
                Console.WriteLine($"\nOrder {order.OrderId} delivered. Status: Delivered");
            }
            else
            {
                Console.WriteLine("\nInvalid action for current order status.");
            }
        }
        else
        {
            Console.WriteLine("\nInvalid option.");
        }

    }
}




// (5) Modify an existing order
void ModifyExistingOrder()
{
    Console.WriteLine("\nModify Order");
    Console.WriteLine("============");

    // Required order details from user
    Customer customer = FindCustomer();
    List<Order> pendingOrders = FindPendingOrders(customer);

    if (pendingOrders.Count > 0)
    {
        DisplayPendingOrders(pendingOrders);
        Order order = SelectOrder(pendingOrders);
        DisplayOrderDetails(order);

        while (true)
        {
            Console.Write("\nModify: [1] Items [2] Address [3] Delivery Time: ");
            string? userChoice = Console.ReadLine();

            if (userChoice == "1") // Modify Items
            {
                Modifyitems(order);
                break;
            }
            else if (userChoice == "2") // Modify Address
            {
                ModifyAddress(order);
                break;
            }
            else if (userChoice == "3") // Modify Delivery Time
            {
                ModifyDeliveryTime(order);
                break;
            }
            else
            {
                Console.WriteLine("Invalid choice.");
            }
        }
    }
    else
    {
        Console.WriteLine("Customer has no pending orders currently.");
    }
}

List<Order> FindPendingOrders(Customer customer)
{
    List<Order> pendingOrders = new List<Order>();
    foreach (Order order in customer.Orders)
    {
        if (order.OrderStatus == "Pending") // Checks if order status is pending
        {
            pendingOrders.Add(order);
        }
    }
    return pendingOrders;
}

void DisplayPendingOrders(List<Order> pendingOrders)
{
    Console.WriteLine("Pending Orders:");
    foreach (Order order in pendingOrders)
    {
        Console.WriteLine($"{order.OrderId}");
    }
}

Order SelectOrder(List<Order> pendingOrders)
{
    while (true)
    {
        Console.Write("Enter Order ID: ");
        if (int.TryParse(Console.ReadLine(), out int orderId))
        {
            Order? order = pendingOrders.Find(f => f.OrderId == orderId);
            if (order != null)
            {
                return order;
            }
        }
        Console.WriteLine("Order ID does not exist.\n");
    }
}

void DisplayOrderDetails(Order order)
{
    Console.WriteLine("\nOrder Items:");
    for (int i = 0; i < order.OrderedFoodItems.Count; i++)
    {
        Console.WriteLine($"{i + 1}. {order.OrderedFoodItems[i].ItemName} - {order.OrderedFoodItems[i].QtyOrdered}");
    }

    Console.WriteLine("Address:");
    Console.WriteLine(order.DeliveryAddress);

    Console.WriteLine("Delivery Date/Time:");
    Console.WriteLine(order.DeliveryDateTime);
}

void Modifyitems(Order order)
{
    bool modifySuccess = false;
    double ogOrderTotal = order.CalculateOrderTotal();
    while (!modifySuccess)
    {
        Console.Write($"Modify Items: [1] Add [2] Remove [3] Quantity: ");
        string? userChoice = Console.ReadLine();

        if (userChoice == "1") // Add
        {
            ShowAvailableFoodItems(order.Restaurant);
            AddItemsToOrder(order);
            Console.WriteLine("Items added to order.");
            modifySuccess = true;
        }
        else if (userChoice == "2") // Remove
        {
            modifySuccess = RemoveItemsFromOrder(order);

        }
        else if (userChoice == "3") // Quantity
        {
            modifySuccess = ChangeItemQty(order);
        }
        else
        {
            Console.WriteLine("Invalid choice.\n");
        }
    }
    HandlePaymentAdjustment(order, ogOrderTotal);
}

bool RemoveItemsFromOrder(Order order)
{
    while (true)
    {
        Console.Write("Select Item Number: ");
        if (int.TryParse(Console.ReadLine(), out int itemNo) && itemNo > 0 && itemNo <= order.OrderedFoodItems.Count)
        {
            if (order.OrderedFoodItems.Count > 1)
            {
                order.RemoveOrderedFoodItem(order.OrderedFoodItems[itemNo - 1]);
                Console.WriteLine("Item removed from order.");
                return true;
            }
            else
            {
                Console.WriteLine("At least one food item is required in order.");
                return true;
            }
        }
        else
        {
            Console.WriteLine("Invalid item number.\n");
        }
    }
}

bool ChangeItemQty(Order order)
{
    while (true)
    {
        Console.Write("Select Item Number: ");
        if (int.TryParse(Console.ReadLine(), out int itemNo) && itemNo > 0 && itemNo <= order.OrderedFoodItems.Count)
        {
            Console.Write("Enter new quantity: ");
            if (int.TryParse(Console.ReadLine(), out int newQty) && newQty > 0)
            {
                order.OrderedFoodItems[itemNo - 1].QtyOrdered = newQty;
                Console.WriteLine($"Item quantity changed to {newQty}.");
                return true;
            }
            else
            {
                Console.WriteLine("Invalid quantity.\n");
            }
        }
        else
        {
            Console.WriteLine("Invalid item number.\n");
        }
    }
}

void ModifyAddress(Order order)
{
    while (true)
    {
        Console.Write("Enter new Address: ");
        string? address = Console.ReadLine();
        if (address != null && address != "")
        {
            order.DeliveryAddress = address;
            Console.WriteLine($"Order {order.OrderId} updated. New Address: {address}");
            break;
        }
        else
        {
            Console.WriteLine("Invalid address.\n");
        }

    }
}

void ModifyDeliveryTime(Order order)
{
    while (true)
    {
        DateOnly date = DateOnly.FromDateTime(order.DeliveryDateTime);
        Console.Write("Enter new Delivery Time (hh:mm): ");
        if (TimeOnly.TryParse(Console.ReadLine(), out TimeOnly time))
        {
            // Combine into a DateTime
            DateTime updatedDateTime = date.ToDateTime(time);

            // Compare against current time
            if (updatedDateTime > DateTime.Now)
            {
                order.DeliveryDateTime = updatedDateTime;
                Console.WriteLine($"Order {order.OrderId} updated. New Delivery Time: {time}");
                break;
            }
            else
            {
                Console.WriteLine("Delivery must be in the future.\n");
            }
        }
        else
        {
            Console.WriteLine("Invalid time format.\n");
        }
    }
}

void HandlePaymentAdjustment(Order order, double originalTotal)
{
    Console.WriteLine($"\nOriginal Order Total: {originalTotal:C2} + {5:C2} (delivery) = {originalTotal + 5:C2}");
    Console.WriteLine($"New Order Total: {order.CalculateOrderTotal():C2} + {5:C2} (delivery) = {order.CalculateOrderTotal() + 5:C2}");
    // Checks for surcharge and refunds
    if (order.CalculateOrderTotal() > originalTotal)
    {
        // If there is a surcharge
        Console.WriteLine("\nPayment method: ");
        while (true)
        {
            Console.Write("[CC] Credit Card / [PP] PayPal / [CD] Cash on Delivery: ");
            string? paymentMethod = Console.ReadLine();
            if (paymentMethod == "CC" || paymentMethod == "PP" || paymentMethod == "CD")
            {
                order.OrderPaymentMethod = paymentMethod;
                Console.WriteLine($"\nSurcharge of {order.CalculateOrderTotal() - originalTotal:C2} processed.");
                Console.WriteLine($"Order {order.OrderId} updated.");
                break;
            }
            else
            {
                Console.WriteLine("Invalid payment method.\n");
            }
        }
    }
    else if (originalTotal > order.CalculateOrderTotal())
    {
        // If there is a refund
        Console.WriteLine($"\nRefund of {originalTotal - order.CalculateOrderTotal():C2} processed.");
        Console.WriteLine($"Order {order.OrderId} updated.");
    }
}

// (6) Delete an existing order
void DeleteExistingOrder()
{
    Console.WriteLine("\nDelete Order");
    Console.WriteLine("===========");

    // 1. Prompt for customer email
    string email;
    do
    {
        Console.Write("Enter Customer Email: ");
        email = Console.ReadLine()?.Trim() ?? "";
    }
    while (email == "");

    Customer? customer = customerList.Find(c => c.EmailAddress.Equals(email, StringComparison.OrdinalIgnoreCase));

    if (customer == null)
    {
        Console.WriteLine("Customer not found.");
        return;
    }

    // 2. Display pending orders
    List<Order> pendingOrders = customer.Orders
        .Where(o => o.OrderStatus == "Pending")
        .ToList();

    if (pendingOrders.Count == 0)
    {
        Console.WriteLine("No pending orders found.");
        return;
    }

    Console.WriteLine("\nPending Orders:");
    foreach (Order o in pendingOrders)
    {
        Console.WriteLine(o.OrderId);
    }

    // 3. Prompt for Order ID
    int orderId;
    Console.Write("Enter Order ID: ");
    while (!int.TryParse(Console.ReadLine(), out orderId))
    {
        Console.Write("Invalid Order ID. Enter again: ");
    }

    Order? order = pendingOrders.Find(o => o.OrderId == orderId);

    if (order == null)
    {
        Console.WriteLine("Order not found.");
        return;
    }

    // 4. Display order info
    Console.WriteLine($"\nCustomer: {order.Customer.CustomerName}");
    Console.WriteLine("Ordered Items:");
    int i = 1;
    foreach (OrderedFoodItem item in order.OrderedFoodItems)
    {
        Console.WriteLine($"{i}. {item.ItemName} - {item.QtyOrdered}");
        i++;
    }

    Console.WriteLine($"Delivery date/time: {order.DeliveryDateTime:dd/MM/yyyy HH:mm}");
    Console.WriteLine($"Total Amount: {order.CalculateOrderTotal():C2}");
    Console.WriteLine($"Order Status: {order.OrderStatus}");

    // 5. Confirm deletion
    string confirm;
    do
    {
        Console.Write("Confirm deletion? [Y/N]: ");
        confirm = Console.ReadLine()?.ToUpper() ?? "";
    }
    while (confirm != "Y" && confirm != "N");

    if (confirm == "N")
    {
        Console.WriteLine("Deletion cancelled.");
        return;
    }

    // 6. Cancel order + refund
    order.OrderStatus = "Cancelled";
    refundStack.Push(order);

    Console.WriteLine($"Order {order.OrderId} cancelled. Refund of {order.CalculateOrderTotal():C2} processed.");
}



// (7) Display order total amount
// Advanced feature (B)
void DisplayOrderTotal()
{
    double deliveredTotal = 0;
    double refundCount = 0;
    double finalTotal = 0;
    foreach (Restaurant restaurant in restaurantList)
    {
        foreach (Order order in restaurant.Orders)
        {
            if (order.OrderStatus == "Delivered")
            {
                deliveredTotal += order.CalculateOrderTotal();
                finalTotal += order.CalculateOrderTotal() + 5; // Add delivery fee
            }
            else if (order.OrderStatus == "Cancelled")
            {
                refundCount += 1;
            }
        }
    }

    Console.WriteLine("\n-----------------------------------------");
    Console.WriteLine($"Total order amount: {deliveredTotal:C2}");
    Console.WriteLine($"Total refunds: {refundCount}");
    Console.WriteLine("-----------------------------------------");
    Console.WriteLine($"Total amount earned: {finalTotal:C2}");
}


//(8) Bulk processing of unprocessed orders for a current day 
// Advanced feature (A)

void BulkProcessTodayOrders()
{
    Console.WriteLine("\nBulk Processing of Today's Pending Orders");
    Console.WriteLine("========================================");

    DateTime now = DateTime.Now;
    DateOnly today = DateOnly.FromDateTime(now);

    List<Order> pendingTodayOrders = new List<Order>();

    // 1. Collect all pending orders for today
    foreach (Restaurant restaurant in restaurantList)
    {
        foreach (Order order in restaurant.Orders)
        {
            if (order.OrderStatus == "Pending" &&
                DateOnly.FromDateTime(order.DeliveryDateTime) == today)
            {
                pendingTodayOrders.Add(order);
            }
        }
    }

    // 2. Display total in queue
    Console.WriteLine($"Total pending orders today: {pendingTodayOrders.Count}");

    if (pendingTodayOrders.Count == 0)
    {
        Console.WriteLine("No pending orders to process.");
        return;
    }

    int processed = 0;
    int preparingCount = 0;
    int rejectedCount = 0;

    // 3. Process each order
    foreach (Order order in pendingTodayOrders)
    {
        TimeSpan timeToDelivery = order.DeliveryDateTime - now;

        if (timeToDelivery.TotalHours < 1)
        {
            order.OrderStatus = "Rejected";
            rejectedCount++;
        }
        else
        {
            order.OrderStatus = "Preparing";
            preparingCount++;
        }

        processed++;
    }

    // 4. Display summary
    double percentage = (double)processed / pendingTodayOrders.Count * 100;

    Console.WriteLine("\nSummary");
    Console.WriteLine("-------");
    Console.WriteLine($"Orders processed: {processed}");
    Console.WriteLine($"Preparing orders: {preparingCount}");
    Console.WriteLine($"Rejected orders: {rejectedCount}");
    Console.WriteLine($"Auto-processed percentage: {percentage:F2}%");
}

//(9) Adding Order to favourites + View Favourite Orders
// Recommended feature 1
void AddOrderToFavourites()
{
    Console.WriteLine("\nAdd Order to Favourites");
    Console.WriteLine("=======================");

    Console.Write("Enter Customer Email: ");
    string email = Console.ReadLine()?.Trim() ?? "";

    Customer? customer = customerList.Find(
        c => c.EmailAddress.Equals(email, StringComparison.OrdinalIgnoreCase)
    );

    if (customer == null)
    {
        Console.WriteLine("Customer not found.");
        return;
    }

    if (customer.Orders.Count == 0)
    {
        Console.WriteLine("Customer has no orders to favourite.");
        return;
    }

    Console.WriteLine("\nCustomer Orders:");
    foreach (Order o in customer.Orders)
    {
        Console.WriteLine($"{o.OrderId} - {o.Restaurant.RestaurantName} - {o.OrderStatus}");
    }

    Console.Write("\nEnter Order ID to add to favourites: ");
    if (!int.TryParse(Console.ReadLine(), out int orderId))
    {
        Console.WriteLine("Invalid Order ID.");
        return;
    }

    Order? selectedOrder = customer.Orders.Find(o => o.OrderId == orderId);

    if (selectedOrder == null)
    {
        Console.WriteLine("Order not found.");
        return;
    }

    if (!favouriteOrders.ContainsKey(email))
    {
        favouriteOrders[email] = new List<Order>();
    }

    if (favouriteOrders[email].Any(o => o.OrderId == orderId))
    {
        Console.WriteLine("Order already in favourites.");
        return;
    }

    favouriteOrders[email].Add(selectedOrder);
    Console.WriteLine($"Order {orderId} added to favourites.");
}


void ViewFavouriteOrders()
{
    Console.WriteLine("\nFavourite Orders");
    Console.WriteLine("================");

    Console.Write("Enter Customer Email: ");
    string email = Console.ReadLine()?.Trim() ?? "";

    Customer? customer = customerList.Find(
        c => c.EmailAddress.Equals(email, StringComparison.OrdinalIgnoreCase)
    );

    if (customer == null)
    {
        Console.WriteLine("Customer not found.");
        return;
    }

    if (!favouriteOrders.ContainsKey(email) || favouriteOrders[email].Count == 0)
    {
        Console.WriteLine("No favourite orders found.");
        return;
    }

    foreach (Order order in favouriteOrders[email])
    {
        Console.WriteLine(
            $"Order ID: {order.OrderId} | " +
            $"Total: {order.CalculateOrderTotal():C2} | " +
            $"Status: {order.OrderStatus}"
        );
    }
}




// Main
Console.WriteLine("Welcome to the Gruberoo Food Delivery System");
LoadRestaurants();
LoadFoodItems();
LoadCustomers();
LoadOrders();

while (true)
{
    DisplayMenu();
    string? userChoice = Console.ReadLine();

    if (userChoice == "1")
    {
        ListRestMenuItems();
    }
    else if (userChoice == "2")
    {
        ListAllOrders();
    }
    else if (userChoice == "3")
    {
        CreateNewOrder();
    }
    else if (userChoice == "4")
    {
        ProcessOrder();
    }
    else if (userChoice == "5")
    {
        ModifyExistingOrder();
    }
    else if (userChoice == "6")
    {
        DeleteExistingOrder();
    }
    else if (userChoice == "7")
    {
        DisplayOrderTotal();
    }
    else if (userChoice == "8")
    {
        BulkProcessTodayOrders();
    }
    else if (userChoice == "9")
    {
        AddOrderToFavourites();
    }
    else if (userChoice == "10")
    {
        ViewFavouriteOrders();
    }
    else if (userChoice == "0")
    {
        break;
    }
}
