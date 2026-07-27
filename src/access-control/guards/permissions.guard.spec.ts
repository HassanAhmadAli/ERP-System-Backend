/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";
import { PermissionsGuard } from "./permissions.guard";
import { Keys } from "@/common/const";
import { Permissions, PermissionsMap } from "../permission.type";
import { UserRole } from "@/prisma/client";
import type { ActiveUserType } from "@/authentication/dto/request-user.dto";

describe("PermissionsGuard", () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get(PermissionsGuard);
    reflector = module.get(Reflector);
  });

  const createContextWithRole = (role: UserRole): jest.Mocked<ExecutionContext> => {
    const activeUser: ActiveUserType = {
      sub: 1,
      email: "test@example.com",
      role,
      language: "en",
      tokenType: "access",
    };
    const context: jest.Mocked<ExecutionContext> = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ [Keys.User]: activeUser }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getArgs: jest.fn(),
    };
    return context;
  };

  describe("canActivate", () => {
    it("grants access when no permissions metadata is set", () => {
      const context = createContextWithRole(UserRole.CUSTOMER);
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(Keys.Permissions, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it("grants access when empty permissions array is set", () => {
      const context = createContextWithRole(UserRole.CUSTOMER);
      reflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("grants access when role has the single required permission", () => {
      const context = createContextWithRole(UserRole.CASHIER);
      reflector.getAllAndOverride.mockReturnValue([Permissions.createSales]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("grants access when role has all required permissions", () => {
      const context = createContextWithRole(UserRole.STORE_MANAGER);
      reflector.getAllAndOverride.mockReturnValue([Permissions.manageEmployees, Permissions.deleteAccount]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("grants access to CUSTOMER role for customer-level permission", () => {
      const context = createContextWithRole(UserRole.CUSTOMER);
      reflector.getAllAndOverride.mockReturnValue([Permissions.viewCustomerProfile]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("denies access when role lacks the required permission", () => {
      const context = createContextWithRole(UserRole.CUSTOMER);
      reflector.getAllAndOverride.mockReturnValue([Permissions.manageDiscounts]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("denies access when role lacks one of multiple required permissions", () => {
      const context = createContextWithRole(UserRole.CASHIER);
      reflector.getAllAndOverride.mockReturnValue([Permissions.createSales, Permissions.manageAds]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe("PermissionsMap integrity", () => {
    const allRoles: UserRole[] = [
      UserRole.CUSTOMER,
      UserRole.CASHIER,
      UserRole.WAREHOUSE_WORKER,
      UserRole.ACCOUNTANT,
      UserRole.STORE_MANAGER,
    ];

    const basePermissions: Permissions[] = [
      Permissions.updatePersonalProfile,
      Permissions.viewProducts,
      Permissions.viewCategories,
      Permissions.viewAds,
    ];

    it.each(allRoles)("grants BASE_PERMISSIONS to %s role", (role) => {
      const context = createContextWithRole(role);
      reflector.getAllAndOverride.mockReturnValue(basePermissions);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("STORE_MANAGER has all permissions from CASHIER, WAREHOUSE_WORKER, and ACCOUNTANT", () => {
      const combined = new Set([
        ...PermissionsMap[UserRole.CASHIER],
        ...PermissionsMap[UserRole.WAREHOUSE_WORKER],
        ...PermissionsMap[UserRole.ACCOUNTANT],
      ]);
      const storeManagerPermissions = new Set(PermissionsMap[UserRole.STORE_MANAGER]);

      for (const permission of combined) {
        expect(storeManagerPermissions.has(permission)).toBe(true);
      }
    });

    it("CUSTOMER lacks staff-only permissions", () => {
      const customerPermissions = new Set(PermissionsMap[UserRole.CUSTOMER]);
      const staffPermissions: Permissions[] = [
        Permissions.manageDiscounts,
        Permissions.manageEmployees,
        Permissions.manageAds,
        Permissions.viewReports,
        Permissions.manageFinancials,
        Permissions.viewAuditLogs,
      ];

      for (const permission of staffPermissions) {
        expect(customerPermissions.has(permission)).toBe(false);
      }
    });

    it("WAREHOUSE_WORKER has product management permissions", () => {
      const workerPermissions = PermissionsMap[UserRole.WAREHOUSE_WORKER];

      expect(workerPermissions).toContain(Permissions.addProduct);
      expect(workerPermissions).toContain(Permissions.manageProduct);
      expect(workerPermissions).toContain(Permissions.manageCategories);
      expect(workerPermissions).toContain(Permissions.manageSuppliers);
    });

    it("ACCOUNTANT has financial management permissions", () => {
      const accountantPermissions = PermissionsMap[UserRole.ACCOUNTANT];

      expect(accountantPermissions).toContain(Permissions.manageExpenses);
      expect(accountantPermissions).toContain(Permissions.viewExpenses);
      expect(accountantPermissions).toContain(Permissions.viewFinancials);
      expect(accountantPermissions).toContain(Permissions.manageFinancials);
    });
  });
});
