import { Test, TestingModule } from "@nestjs/testing";
import { UserRole } from "@/prisma/client";
import { UserService } from "./user.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AppCachingService } from "@/caching/caching.service";
import { AuthenticationService } from "@/authentication/authentication.service";
import type { CreateStaffDto } from "./dto/create-staff.dto";

describe("UserService", () => {
  let service: UserService;
  let userUpdateMock: jest.Mock;
  let userFindUniqueOrThrowMock: jest.Mock;
  let userFindManyMock: jest.Mock;
  let userCountMock: jest.Mock;
  let removeCachedUserDataMock: jest.Mock;
  let createVerifiedStaffMock: jest.Mock;

  const mockStaffProfile = {
    fullName: "Test User",
    fullNameAr: null,
    role: UserRole.CASHIER,
    nationalId: "1234567890",
    phoneNumber: "+12025550199",
    email: "test@example.com",
    language: "en",
  };

  beforeEach(async () => {
    userUpdateMock = jest.fn();
    userFindUniqueOrThrowMock = jest.fn();
    userFindManyMock = jest.fn();
    userCountMock = jest.fn();
    removeCachedUserDataMock = jest.fn();
    createVerifiedStaffMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: {
                update: userUpdateMock,
                findUniqueOrThrow: userFindUniqueOrThrowMock,
                findMany: userFindManyMock,
                count: userCountMock,
              },
            },
          },
        },
        {
          provide: AppCachingService,
          useValue: {
            users: {
              removeCachedUserData: removeCachedUserDataMock,
            },
          },
        },
        {
          provide: AuthenticationService,
          useValue: {
            createVerifiedStaff: createVerifiedStaffMock,
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe("updatePersonalProfile", () => {
    it("updates user and removes cached data", async () => {
      const dto = { fullName: "Updated Name" };
      userUpdateMock.mockResolvedValue({ ...mockStaffProfile, fullName: "Updated Name" });

      const result = await service.updatePersonalProfile(dto, 1);

      expect(result).toStrictEqual({ ...mockStaffProfile, fullName: "Updated Name" });
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
        select: {
          fullName: true,
          fullNameAr: true,
          role: true,
          nationalId: true,
          phoneNumber: true,
          email: true,
          language: true,
        },
      });
      expect(removeCachedUserDataMock).toHaveBeenCalledWith(1);
    });

    it("propagates rejection from Prisma", async () => {
      const error = new Error("DB error");
      userUpdateMock.mockRejectedValue(error);

      await expect(service.updatePersonalProfile({}, 1)).rejects.toThrow(error);
      expect(removeCachedUserDataMock).not.toHaveBeenCalled();
    });
  });

  describe("createStaff", () => {
    it("delegates to AuthenticationService.createVerifiedStaff", async () => {
      const dto = { role: UserRole.CASHIER, jobTitle: "Cashier" } as unknown as CreateStaffDto;
      const staffResult = {
        message: "Staff account created",
        user: { id: 1, email: "staff@example.com", fullName: "Staff", fullNameAr: null, role: UserRole.CASHIER },
      };
      createVerifiedStaffMock.mockResolvedValue(staffResult);

      const result = await service.createStaff(dto);

      expect(result).toBe(staffResult);
      expect(createVerifiedStaffMock).toHaveBeenCalledWith(dto);
    });

    it("propagates rejection from AuthenticationService", async () => {
      const error = new Error("Auth failure");
      createVerifiedStaffMock.mockRejectedValue(error);

      await expect(service.createStaff({} as CreateStaffDto)).rejects.toThrow(error);
    });
  });

  describe("updateStoreManagerProfile", () => {
    it("updates store manager and removes cached data", async () => {
      const dto = { fullNameAr: "المدير" };
      userUpdateMock.mockResolvedValue({ ...mockStaffProfile, fullNameAr: "المدير", role: UserRole.STORE_MANAGER });

      const result = await service.updateStoreManagerProfile(dto, 5);

      expect(result).toStrictEqual({ ...mockStaffProfile, fullNameAr: "المدير", role: UserRole.STORE_MANAGER });
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 5, role: UserRole.STORE_MANAGER },
        data: dto,
        select: {
          fullName: true,
          fullNameAr: true,
          role: true,
          nationalId: true,
          phoneNumber: true,
          email: true,
          language: true,
        },
      });
      expect(removeCachedUserDataMock).toHaveBeenCalledWith(5);
    });

    it("propagates Prisma rejection", async () => {
      userUpdateMock.mockRejectedValue(new Error("Not found"));

      await expect(service.updateStoreManagerProfile({}, 999)).rejects.toThrow("Not found");
    });
  });

  describe("getProfile", () => {
    it("returns the user profile", async () => {
      userFindUniqueOrThrowMock.mockResolvedValue(mockStaffProfile);

      const result = await service.getProfile(1);

      expect(result).toStrictEqual(mockStaffProfile);
      expect(userFindUniqueOrThrowMock).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          fullName: true,
          fullNameAr: true,
          role: true,
          nationalId: true,
          phoneNumber: true,
          email: true,
          language: true,
        },
      });
    });

    it("propagates Prisma rejection", async () => {
      const error = new Error("User not found");
      userFindUniqueOrThrowMock.mockRejectedValue(error);

      await expect(service.getProfile(999)).rejects.toThrow(error);
    });
  });

  describe("updateStaffProfile", () => {
    it("updates staff user and removes cached data", async () => {
      const dto = { phoneNumber: "+11111111111" };
      userUpdateMock.mockResolvedValue({ ...mockStaffProfile, phoneNumber: "+11111111111" });

      const result = await service.updateStaffProfile(dto, 3);

      expect(result).toStrictEqual({ ...mockStaffProfile, phoneNumber: "+11111111111" });
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 3, role: { in: [UserRole.CASHIER, UserRole.ACCOUNTANT, UserRole.WAREHOUSE_WORKER] } },
        data: dto,
        select: {
          fullName: true,
          fullNameAr: true,
          role: true,
          nationalId: true,
          phoneNumber: true,
          email: true,
          language: true,
        },
      });
      expect(removeCachedUserDataMock).toHaveBeenCalledWith(3);
    });

    it("propagates Prisma rejection", async () => {
      userUpdateMock.mockRejectedValue(new Error("Update failed"));

      await expect(service.updateStaffProfile({}, 99)).rejects.toThrow("Update failed");
    });
  });

  describe("archiveAccount", () => {
    it("sets deletedAt on the user", async () => {
      const mockUser = { id: 1, deletedAt: new Date() };
      userUpdateMock.mockResolvedValue(mockUser);

      const result = await service.archiveAccount(1);

      expect(result).toStrictEqual(mockUser);
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("propagates Prisma rejection", async () => {
      userUpdateMock.mockRejectedValue(new Error("Archive failed"));

      await expect(service.archiveAccount(99)).rejects.toThrow("Archive failed");
    });
  });

  describe("deleteAccount", () => {
    it("sets deletedAt on the user", async () => {
      const mockUser = { id: 2, deletedAt: new Date() };
      userUpdateMock.mockResolvedValue(mockUser);

      const result = await service.deleteAccount(2);

      expect(result).toStrictEqual(mockUser);
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("propagates Prisma rejection", async () => {
      userUpdateMock.mockRejectedValue(new Error("Delete failed"));

      await expect(service.deleteAccount(99)).rejects.toThrow("Delete failed");
    });
  });

  describe("viewUsersProfiles", () => {
    const defaultQuery = { limit: 10, offset: 0, deleted: false };

    it("returns paginated users when role is provided", async () => {
      const mockUsers = [{ id: 1, createdAt: new Date("2024-01-01"), ...mockStaffProfile }];
      userFindManyMock.mockResolvedValue(mockUsers);
      userCountMock.mockResolvedValue(1);

      const result = await service.viewUsersProfiles(defaultQuery, UserRole.CASHIER);

      expect(result).toStrictEqual({
        data: mockUsers,
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      expect(userFindManyMock).toHaveBeenCalledWith({
        where: { role: UserRole.CASHIER, deletedAt: null },
        select: {
          fullName: true,
          fullNameAr: true,
          role: true,
          nationalId: true,
          phoneNumber: true,
          email: true,
          language: true,
          id: true,
          createdAt: true,
          deletedAt: false,
        },
        take: 10,
        skip: 0,
        orderBy: { createdAt: "desc" },
      });
      expect(userCountMock).toHaveBeenCalledWith({
        where: { role: UserRole.CASHIER, deletedAt: null },
      });
    });

    it("omits role from where clause when role is undefined", async () => {
      userFindManyMock.mockResolvedValue([]);
      userCountMock.mockResolvedValue(0);

      await service.viewUsersProfiles(defaultQuery, undefined);

      const expectedWhere = { role: undefined, deletedAt: null };
      expect(userFindManyMock).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
      expect(userCountMock).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    });

    it("uses deletedAt: { not: null } when query.deleted is true", async () => {
      const deletedQuery = { limit: 20, offset: 5, deleted: true };
      userFindManyMock.mockResolvedValue([]);
      userCountMock.mockResolvedValue(0);

      await service.viewUsersProfiles(deletedQuery, UserRole.ACCOUNTANT);

      expect(userFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.ACCOUNTANT, deletedAt: { not: null } },
          select: expect.objectContaining({ deletedAt: true }),
        }),
      );
    });

    it("returns empty result with correct pagination metadata", async () => {
      userFindManyMock.mockResolvedValue([]);
      userCountMock.mockResolvedValue(0);

      const result = await service.viewUsersProfiles(defaultQuery, undefined);

      expect(result).toStrictEqual({
        data: [],
        total: 0,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
    });

    it("returns isFinalPage false when more records remain", async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
        ...mockStaffProfile,
      }));
      userFindManyMock.mockResolvedValue(mockUsers);
      userCountMock.mockResolvedValue(15);

      const result = await service.viewUsersProfiles({ limit: 10, offset: 0, deleted: false }, UserRole.CASHIER);

      expect(result.isFinalPage).toBe(false);
    });

    it("returns isFinalPage true at exact page boundary", async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
        ...mockStaffProfile,
      }));
      userFindManyMock.mockResolvedValue(mockUsers);
      userCountMock.mockResolvedValue(10);

      const result = await service.viewUsersProfiles({ limit: 10, offset: 0, deleted: true }, undefined);

      expect(result.isFinalPage).toBe(true);
    });
  });
});
