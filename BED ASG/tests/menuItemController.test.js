const menuItemController = require("../controllers/menuItemController");
const menuItemModel = require("../models/menuItemModel");

jest.mock("../models/menuItemModel");

function createMockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe("menuItemController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getAllMenuItems returns menu items", async () => {
    const mockMenuItems = [
      { id: 1, itemName: "Chicken Rice", price: 4.5 },
      { id: 2, itemName: "Sugar Cane Juice", price: 2.0 },
    ];
    menuItemModel.getAllMenuItems.mockResolvedValue(mockMenuItems);

    const req = { query: {} };
    const res = createMockResponse();

    await menuItemController.getAllMenuItems(req, res);

    expect(menuItemModel.getAllMenuItems).toHaveBeenCalledWith({
      stallId: null,
      category: null,
      searchTerm: null,
      availableOnly: false,
    });
    expect(res.json).toHaveBeenCalledWith(mockMenuItems);
  });

  test("getMenuItemById returns 404 when item does not exist", async () => {
    menuItemModel.getMenuItemById.mockResolvedValue(null);

    const req = { params: { id: "999" } };
    const res = createMockResponse();

    await menuItemController.getMenuItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Menu item not found" });
  });

  test("createMenuItem returns 201 with created item", async () => {
    const createdMenuItem = { id: 3, itemName: "Laksa", price: 5.5 };
    menuItemModel.createMenuItem.mockResolvedValue(createdMenuItem);

    const req = { body: { itemName: "Laksa" } };
    const res = createMockResponse();

    await menuItemController.createMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdMenuItem);
  });

  test("deleteMenuItem returns 204 when item is deleted", async () => {
    menuItemModel.deleteMenuItem.mockResolvedValue(true);

    const req = { params: { id: "1" } };
    const res = createMockResponse();

    await menuItemController.deleteMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
