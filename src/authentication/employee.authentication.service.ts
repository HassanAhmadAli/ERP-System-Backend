import { Injectable } from "@nestjs/common";
import { SignupDto } from "./dto/signinup.dto";
import { UserRole } from "@/prisma";
import { AuthenticationService } from "./authentication.service";
@Injectable()
export class AdminAuthenticationService {
  constructor(private authenticationService: AuthenticationService) {}
  async signup(signupDto: SignupDto) {
    return this.authenticationService.genericSignup(UserRole.ADMIN, signupDto);
  }
}
