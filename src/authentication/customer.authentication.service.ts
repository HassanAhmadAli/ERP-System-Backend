import { Injectable } from "@nestjs/common";
import { CustomerSignupDto } from "./dto/signinup.dto";
import { PrismaService, UserRole } from "@/prisma";
import { AuthenticationService } from "./authentication.service";

@Injectable()
export class CustomerAuthenticationService {
  constructor(
    private authenticationService: AuthenticationService,
    private prismaService: PrismaService,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async signup({ address, ...signupDto }: CustomerSignupDto) {
    const res = await this.authenticationService.genericSignup(UserRole.CUSTOMER, signupDto);

    const { id: userId } = await this.prisma.user.findUniqueOrThrow({
      select: { id: true },
      where: { email: signupDto.email },
    });
    await this.prisma.customer.create({
      data: {
        address,
        userId,
      },
    });
    return res;
  }
}
