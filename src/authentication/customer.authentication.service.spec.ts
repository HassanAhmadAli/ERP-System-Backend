import { Test, TestingModule } from "@nestjs/testing";
import { CustomerAuthenticationService } from "./customer.authentication.service";
import { AuthenticationService } from "./authentication.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("CustomerAuthenticationService", () => {
  let service: CustomerAuthenticationService;
  let authenticationService: jest.Mocked<AuthenticationService>;
  let prismaService: jest.Mocked<PrismaService>;

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
        phoneNumber: "+12025550199" as any,
        address: "456 Oak Ave",
      };

      const expectedResponse = { message: "User created" };
      authenticationService.genericSignup.mockResolvedValue(expectedResponse);
      prismaService.client.user.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      prismaService.client.customer.upsert.mockResolvedValue({} as any);

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
