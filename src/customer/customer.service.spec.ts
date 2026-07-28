/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { Prisma, UserRole, DiscountScope } from "@/prisma/client";
import { I18nService } from "nestjs-i18n";
import { AuditAction } from "@/common/const";
import { CustomerService } from "./customer.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("CustomerService", () => {
  let service: CustomerService;
  let userFindUniqueOrThrowMock: jest.Mock;
  let userUpdateMock: jest.Mock;
  let discountFindManyMock: jest.Mock;
  let customerFindUniqueOrThrowMock: jest.Mock;
  let customerFindManyMock: jest.Mock;
  let customerCountMock: jest.Mock;
  let transactionMock: jest.Mock;
  let i18nTMock: jest.Mock;

  const mockCustomerProfile = {
    fullName: "Jane Customer",
    fullNameAr: null,
    email: "jane@example.com",
    phoneNumber: "+12025550199",
    language: "en",
    customer: {
      id: 5,
      address: "456 Oak Ave",
      addressAr: null,
      loyaltyPoints: 100,
      totalSpent: new Prisma.Decimal("500.00"),
    },
  };

  const mockDiscount = {
    id: 1,
    name: "10% Off",
    nameAr: null,
    type: "PERCENTAGE",
    value: new Prisma.Decimal("10"),
    maxUses: 100,
    usedCount: 5,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
  };

  const mockCustomerRecord = {
    id: 5,
    userId: 10,
    address: "456 Oak Ave",
    addressAr: null,
    loyaltyPoints: 100,
    totalSpent: new Prisma.Decimal("500.00"),
  };

  const mockCustomerListEntry = {
    id: 5,
    userId: 10,
    address: "456 Oak Ave",
    addressAr: null,
    loyaltyPoints: 100,
    totalSpent: new Prisma.Decimal("500.00"),
    user: {
      id: 10,
      fullName: "Jane Customer",
      fullNameAr: null,
      email: "jane@example.com",
      phoneNumber: "+12025550199",
      isActive: true,
    },
  };

  const mockTransactionClient = {
    customer: { update: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(async () => {
    userFindUniqueOrThrowMock = jest.fn();
    userUpdateMock = jest.fn();
    discountFindManyMock = jest.fn();
    customerFindUniqueOrThrowMock = jest.fn();
    customerFindManyMock = jest.fn();
    customerCountMock = jest.fn();
    transactionMock = jest.fn();
    i18nTMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: {
                findUniqueOrThrow: userFindUniqueOrThrowMock,
                update: userUpdateMock,
              },
              discount: {
                findMany: discountFindManyMock,
                fields: { maxUses: "maxUses" },
              },
              customer: {
                findUniqueOrThrow: customerFindUniqueOrThrowMock,
                findMany: customerFindManyMock,
                count: customerCountMock,
              },
              $transaction: transactionMock,
            },
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: i18nTMock,
          },
        },
      ],
    }).compile();

    service = module.get(CustomerService);
  });

  describe("getProfile", () => {
    it("returns user profile with customer data and active discounts", async () => {
      userFindUniqueOrThrowMock.mockResolvedValue(mockCustomerProfile);
      discountFindManyMock.mockResolvedValue([mockDiscount]);

      const result = await service.getProfile(10);

      expect(result).toStrictEqual({ ...mockCustomerProfile, activeDiscounts: [mockDiscount] });
      expect(userFindUniqueOrThrowMock).toHaveBeenCalledWith({
        where: { id: 10 },
        select: {
          fullName: true,
          fullNameAr: true,
          email: true,
          phoneNumber: true,
          language: true,
          customer: {
            where: { userId: 10 },
            select: {
              id: true,
              address: true,
              addressAr: true,
              loyaltyPoints: true,
              totalSpent: true,
            },
          },
        },
      });
      expect(discountFindManyMock).toHaveBeenCalledWith({
        where: {
          scope: DiscountScope.CUSTOMER,
          customerId: 5,
          isActive: true,
          startDate: { lte: expect.any(Date) as Date },
          OR: [{ endDate: null }, { endDate: { gte: expect.any(Date) as Date } }],
          AND: [
            {
              OR: [{ maxUses: null }, { usedCount: { lt: "maxUses" } }],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
          type: true,
          value: true,
          maxUses: true,
          usedCount: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { endDate: "asc" },
      });
    });

    it("returns empty activeDiscounts when customer record is null", async () => {
      userFindUniqueOrThrowMock.mockResolvedValue({ ...mockCustomerProfile, customer: null });

      const result = await service.getProfile(10);

      expect(result).toStrictEqual({ ...mockCustomerProfile, customer: null, activeDiscounts: [] });
      expect(discountFindManyMock).not.toHaveBeenCalled();
    });

    it("propagates rejection when user is not found", async () => {
      const error = new Error("User not found");
      userFindUniqueOrThrowMock.mockRejectedValue(error);

      await expect(service.getProfile(999)).rejects.toThrow(error);
    });

    it("propagates rejection when discount query fails", async () => {
      userFindUniqueOrThrowMock.mockResolvedValue(mockCustomerProfile);
      discountFindManyMock.mockRejectedValue(new Error("Discount query failed"));

      await expect(service.getProfile(10)).rejects.toThrow("Discount query failed");
    });
  });

  describe("updateProfile", () => {
    it("updates user fields and customer address fields", async () => {
      const dto = {
        fullName: "Jane Updated",
        address: "789 New St",
        addressAr: "789 شارع جديد",
      };
      const mockReturn = {
        language: "en",
        fullName: "Jane Updated",
        fullNameAr: null,
        email: "jane@example.com",
        phoneNumber: "+12025550199",
        customer: {
          address: "789 New St",
          addressAr: "789 شارع جديد",
        },
      };
      userUpdateMock.mockResolvedValue(mockReturn);

      const result = await service.updateProfile(10, dto);

      expect(result).toStrictEqual(mockReturn);
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          fullName: "Jane Updated",
          customer: {
            update: {
              where: { userId: 10 },
              data: { address: "789 New St", addressAr: "789 شارع جديد" },
            },
          },
        },
        select: {
          language: true,
          fullName: true,
          fullNameAr: true,
          email: true,
          phoneNumber: true,
          customer: {
            where: { userId: 10 },
            select: {
              address: true,
              addressAr: true,
            },
          },
        },
      });
    });

    it("updates only user fields when address fields are not provided", async () => {
      const dto = { fullName: "Name Only" };
      const mockReturn = {
        language: "en",
        fullName: "Name Only",
        fullNameAr: null,
        email: "jane@example.com",
        phoneNumber: "+12025550199",
        customer: { address: null, addressAr: null },
      };
      userUpdateMock.mockResolvedValue(mockReturn);

      const result = await service.updateProfile(10, dto);

      expect(result).toStrictEqual(mockReturn);
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          fullName: "Name Only",
          customer: {
            update: {
              where: { userId: 10 },
              data: { address: undefined, addressAr: undefined },
            },
          },
        },
        select: {
          language: true,
          fullName: true,
          fullNameAr: true,
          email: true,
          phoneNumber: true,
          customer: {
            where: { userId: 10 },
            select: {
              address: true,
              addressAr: true,
            },
          },
        },
      });
    });

    it("propagates Prisma rejection", async () => {
      const error = new Error("DB update failed");
      userUpdateMock.mockRejectedValue(error);

      await expect(service.updateProfile(10, { fullName: "Fail" })).rejects.toThrow(error);
    });
  });

  describe("findAll", () => {
    const defaultQuery = { limit: 10, offset: 0, deleted: false };

    it("returns paginated customers without search term", async () => {
      customerFindManyMock.mockResolvedValue([mockCustomerListEntry]);
      customerCountMock.mockResolvedValue(1);

      const result = await service.findAll(defaultQuery);

      expect(result).toStrictEqual({
        data: [mockCustomerListEntry],
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      expect(customerFindManyMock).toHaveBeenCalledWith({
        where: {
          user: { role: UserRole.CUSTOMER, deletedAt: null },
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              fullNameAr: true,
              email: true,
              phoneNumber: true,
              isActive: true,
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: { id: "asc" },
      });
      expect(customerCountMock).toHaveBeenCalledWith({
        where: {
          user: { role: UserRole.CUSTOMER, deletedAt: null },
        },
      });
    });

    it("includes search conditions when search term is provided", async () => {
      const searchQuery = { limit: 10, offset: 0, deleted: false, search: "Jane" };
      customerFindManyMock.mockResolvedValue([mockCustomerListEntry]);
      customerCountMock.mockResolvedValue(1);

      await service.findAll(searchQuery);

      const callArg = customerFindManyMock.mock.calls[0]![0];
      expect(callArg.where.user.OR).toStrictEqual([
        { fullName: { contains: "Jane", mode: "insensitive" } },
        { fullNameAr: { contains: "Jane", mode: "insensitive" } },
        { email: { contains: "Jane", mode: "insensitive" } },
      ]);
    });

    it("returns empty result when no customers match", async () => {
      customerFindManyMock.mockResolvedValue([]);
      customerCountMock.mockResolvedValue(0);

      const result = await service.findAll(defaultQuery);

      expect(result).toStrictEqual({
        data: [],
        total: 0,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
    });

    it("filters deleted customers when deleted is true", async () => {
      const deletedQuery = { limit: 10, offset: 0, deleted: true };
      customerFindManyMock.mockResolvedValue([]);
      customerCountMock.mockResolvedValue(0);

      await service.findAll(deletedQuery);

      expect(customerFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user: { role: UserRole.CUSTOMER, deletedAt: { not: null } } },
        }),
      );
    });
  });

  describe("findOne", () => {
    it("returns customer with user and recent orders", async () => {
      const mockFullCustomer = {
        ...mockCustomerRecord,
        user: {
          id: 10,
          fullName: "Jane Customer",
          fullNameAr: null,
          email: "jane@example.com",
          phoneNumber: "+12025550199",
          isActive: true,
          createdAt: new Date("2024-01-01"),
        },
        orders: [
          {
            id: 1,
            status: "DELIVERED",
            subtotal: new Prisma.Decimal("150.00"),
            createdAt: new Date("2024-06-01"),
          },
        ],
      };
      customerFindUniqueOrThrowMock.mockResolvedValue(mockFullCustomer);

      const result = await service.findOne(5);

      expect(result).toStrictEqual(mockFullCustomer);
      expect(customerFindUniqueOrThrowMock).toHaveBeenCalledWith({
        where: { id: 5 },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              fullNameAr: true,
              email: true,
              phoneNumber: true,
              isActive: true,
              createdAt: true,
            },
          },
          orders: {
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              subtotal: true,
              createdAt: true,
            },
          },
        },
      });
    });

    it("propagates rejection when customer not found", async () => {
      const error = new Error("Customer not found");
      customerFindUniqueOrThrowMock.mockRejectedValue(error);

      await expect(service.findOne(999)).rejects.toThrow(error);
    });
  });

  describe("updateStatus", () => {
    it("fetches customer then updates user isActive", async () => {
      customerFindUniqueOrThrowMock.mockResolvedValue({ id: 5, userId: 10, user: { id: 10 } });
      const mockUpdatedUser = {
        id: 10,
        fullName: "Jane Customer",
        fullNameAr: null,
        email: "jane@example.com",
        isActive: true,
      };
      userUpdateMock.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateStatus(5, { isActive: true });

      expect(result).toStrictEqual(mockUpdatedUser);
      expect(customerFindUniqueOrThrowMock).toHaveBeenCalledWith({
        where: { id: 5 },
        include: { user: { select: { id: true } } },
      });
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { isActive: true },
        select: { id: true, fullName: true, fullNameAr: true, email: true, isActive: true },
      });
    });

    it("propagates rejection when customer not found", async () => {
      customerFindUniqueOrThrowMock.mockRejectedValue(new Error("Customer not found"));

      await expect(service.updateStatus(999, { isActive: false })).rejects.toThrow("Customer not found");
    });

    it("propagates rejection when user update fails after customer lookup", async () => {
      customerFindUniqueOrThrowMock.mockResolvedValue({ id: 5, userId: 10, user: { id: 10 } });
      userUpdateMock.mockRejectedValue(new Error("Update failed"));

      await expect(service.updateStatus(5, { isActive: true })).rejects.toThrow("Update failed");
    });
  });

  describe("adjustLoyalty", () => {
    const customerId = 5;
    const actorUserId = 1;

    beforeEach(() => {
      mockTransactionClient.customer.update = jest.fn();
      mockTransactionClient.auditLog.create = jest.fn();
    });

    it("adds positive points and creates audit log", async () => {
      customerFindUniqueOrThrowMock.mockResolvedValue({ ...mockCustomerRecord, loyaltyPoints: 100 });
      const updatedCustomer = {
        ...mockCustomerRecord,
        loyaltyPoints: 150,
        user: { id: 10, fullName: "Jane Customer", fullNameAr: null, email: "jane@example.com" },
      };
      mockTransactionClient.customer.update.mockResolvedValue(updatedCustomer);
      mockTransactionClient.auditLog.create.mockResolvedValue(undefined);
      transactionMock.mockImplementation(async (cb: (...args: unknown[]) => Promise<unknown>) =>
        cb(mockTransactionClient),
      );

      const result = await service.adjustLoyalty(customerId, actorUserId, { points: 50 });

      expect(result).toStrictEqual(updatedCustomer);
      expect(mockTransactionClient.customer.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: { loyaltyPoints: 150 },
        include: {
          user: { select: { id: true, fullName: true, fullNameAr: true, email: true } },
        },
      });
      expect(mockTransactionClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: actorUserId,
          action: AuditAction.LOYALTY_ADJUSTMENT,
          entity: UserRole.CUSTOMER,
          entityId: String(customerId),
          oldValue: { loyaltyPoints: 100, reason: null },
          newValue: { loyaltyPoints: 150, delta: 50, reason: null },
        },
      });
    });

    it("deducts points when within bounds", async () => {
      customerFindUniqueOrThrowMock.mockResolvedValue({ ...mockCustomerRecord, loyaltyPoints: 100 });
      const updatedCustomer = {
        ...mockCustomerRecord,
        loyaltyPoints: 80,
        user: { id: 10, fullName: "Jane Customer", fullNameAr: null, email: "jane@example.com" },
      };
      mockTransactionClient.customer.update.mockResolvedValue(updatedCustomer);
      mockTransactionClient.auditLog.create.mockResolvedValue(undefined);
      transactionMock.mockImplementation(async (cb: (...args: unknown[]) => Promise<unknown>) =>
        cb(mockTransactionClient),
      );

      const result = await service.adjustLoyalty(customerId, actorUserId, { points: -20 });

      expect(result).toStrictEqual(updatedCustomer);
      expect(mockTransactionClient.customer.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: { loyaltyPoints: 80 },
        include: {
          user: { select: { id: true, fullName: true, fullNameAr: true, email: true } },
        },
      });
    });

    it("throws BadRequestException when points would go below zero", async () => {
      customerFindUniqueOrThrowMock.mockResolvedValue({ ...mockCustomerRecord, loyaltyPoints: 10 });
      i18nTMock.mockReturnValue("Loyalty points cannot be negative");

      await expect(service.adjustLoyalty(customerId, actorUserId, { points: -20 })).rejects.toThrow(
        BadRequestException,
      );

      expect(i18nTMock).toHaveBeenCalledWith("errors.customer.loyaltyPointsNegative");
      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("includes reason in audit log when provided", async () => {
      customerFindUniqueOrThrowMock.mockResolvedValue({ ...mockCustomerRecord, loyaltyPoints: 50 });
      mockTransactionClient.customer.update.mockResolvedValue({
        ...mockCustomerRecord,
        loyaltyPoints: 100,
        user: { id: 10, fullName: "Jane Customer", fullNameAr: null, email: "jane@example.com" },
      });
      mockTransactionClient.auditLog.create.mockResolvedValue(undefined);
      transactionMock.mockImplementation(async (cb: (...args: unknown[]) => Promise<unknown>) =>
        cb(mockTransactionClient),
      );

      await service.adjustLoyalty(customerId, actorUserId, { points: 50, reason: "Good customer" });

      expect(mockTransactionClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: actorUserId,
          action: AuditAction.LOYALTY_ADJUSTMENT,
          entity: UserRole.CUSTOMER,
          entityId: String(customerId),
          oldValue: { loyaltyPoints: 50, reason: "Good customer" },
          newValue: { loyaltyPoints: 100, delta: 50, reason: "Good customer" },
        },
      });
    });

    it("propagates rejection from $transaction", async () => {
      customerFindUniqueOrThrowMock.mockResolvedValue({ ...mockCustomerRecord, loyaltyPoints: 100 });
      transactionMock.mockRejectedValue(new Error("Transaction failed"));

      await expect(service.adjustLoyalty(customerId, actorUserId, { points: 50 })).rejects.toThrow(
        "Transaction failed",
      );
    });

    it("propagates rejection when customer lookup fails", async () => {
      customerFindUniqueOrThrowMock.mockRejectedValue(new Error("Customer not found"));

      await expect(service.adjustLoyalty(999, actorUserId, { points: 50 })).rejects.toThrow("Customer not found");

      expect(transactionMock).not.toHaveBeenCalled();
    });
  });
});
