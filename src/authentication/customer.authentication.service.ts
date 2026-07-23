import { Injectable } from "@nestjs/common";
import { CustomerSignupDto } from "./dto/customer-signup.dto";
import { UserRole } from "@/prisma/client";
import { AuthenticationService } from "./authentication.service";
import { PrismaService } from "@/prisma/prisma.service";

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

    await this.prisma.customer.upsert({
      where: { userId },
      create: {
        address,
        userId,
      },
      update: {
        address,
      },
    });
    return res;
  }
}
