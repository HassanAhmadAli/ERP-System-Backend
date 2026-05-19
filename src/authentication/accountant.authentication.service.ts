import { Injectable } from "@nestjs/common";
import { EmployeeSignupDto } from "./dto/signinup.dto";
import { PrismaService, UserRole } from "@/prisma";
import { AuthenticationService } from "./authentication.service";

@Injectable()
export class AccountantAuthenticationService {
  constructor(
    private authenticationService: AuthenticationService,
    private prismaService: PrismaService,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async signup({ jobTitle, ...signupDto }: EmployeeSignupDto) {
    const res = await this.authenticationService.genericSignup(UserRole.ACCOUNTANT, signupDto);

    const { id: userId } = await this.prisma.user.findUniqueOrThrow({
      select: { id: true },
      where: { email: signupDto.email },
    });

    await this.prisma.employee.create({
      data: { jobTitle, userId },
    });

    return res;
  }
}
