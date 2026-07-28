/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { CustomerAuthenticationService } from "./customer.authentication.service";
import { AuthenticationService } from "./authentication.service";
import { PrismaService } from "@/prisma/prisma.service";
import { UserRole } from "@/prisma/client";
import { phoneNumberSchema } from "@/common/schema/phone-number.schema";

describe("CustomerAuthenticationService", () => {
  let service: CustomerAuthenticationService;
  let authenticationService: jest.Mocked<AuthenticationService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUserModel = (
    overrides?: Partial<{
      id: number;
      fullName: string;
      fullNameAr: string | null;
      email: string;
      phoneNumber: string | null;
      passwordHash: string;
      nationalId: string;
      role: UserRole;
      isActive: boolean;
      language: string;
      isVerified: boolean;
      verificationCode: string | null;
      verificationCodeExpiresAt: Date | null;
      deletedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) => ({
    id: 1,
    fullName: "Test User",
    fullNameAr: null,
    email: "test@example.com",
    phoneNumber: null,
    passwordHash: "hashed-password",
    nationalId: "0000000000",
    role: UserRole.CUSTOMER,
    isActive: true,
    language: "en",
    isVerified: false,
    verificationCode: null,
    verificationCodeExpiresAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    productPhotos: [],
    employee: null,
    customer: null,
    auditLogs: [],
    sentNotifications: [],
    notificationRecipients: [],
    recordedExpenses: [],
    createdDiscounts: [],
    productImportJobs: [],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAuthenticationService,
        {
          provide: AuthenticationService,
          useValue: {
            genericSignup: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: {
                findUniqueOrThrow: jest.fn(),
              },
              customer: {
                upsert: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<CustomerAuthenticationService>(CustomerAuthenticationService);
    authenticationService = module.get(AuthenticationService);
    prismaService = module.get(PrismaService);
  });

  describe("signup", () => {
    it("signup_createsCustomerWithAddress", async () => {
      const signupDto = {
        fullName: "Jane Customer",
        email: "jane@example.com",
        password: "TestPass123",
        nationalId: "0000000099",
        phoneNumber: phoneNumberSchema.parse("+12025550199"),
        address: "456 Oak Ave",
      };

      const expectedResponse = { message: "User created" };
      authenticationService.genericSignup.mockResolvedValue(expectedResponse);
      jest.mocked(prismaService.client.user.findUniqueOrThrow).mockResolvedValue(mockUserModel({ id: 1 }));

      const result = await service.signup(signupDto);

      expect(result).toBe(expectedResponse);
      expect(authenticationService.genericSignup).toHaveBeenCalledWith("CUSTOMER", {
        fullName: signupDto.fullName,
        email: signupDto.email,
        password: signupDto.password,
        nationalId: signupDto.nationalId,
        phoneNumber: signupDto.phoneNumber,
      });
      expect(prismaService.client.user.findUniqueOrThrow).toHaveBeenCalledWith({
        select: { id: true },
        where: { email: signupDto.email },
      });
      expect(prismaService.client.customer.upsert).toHaveBeenCalledWith({
        where: { userId: 1 },
        create: { address: signupDto.address, userId: 1 },
        update: { address: signupDto.address },
      });
    });
  });
});
