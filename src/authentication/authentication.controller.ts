import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { SigninDto } from "./dto/signin.dto";
import { CustomerSignupDto, SignupDto } from "./dto/signinup.dto";
import { AuthenticationService } from "./authentication.service";
import { Public } from "@/common/decorators/public.decorator";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SignoutDto } from "./dto/signout.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ManagerAuthenticationService } from "./manager.authentication.service";
import { EmployeeAuthenticationService } from "./admin.authentication.service";
import { CustomerAuthenticationService } from "./customer.authentication.service";
import { AdminAuthenticationService } from "./employee.authentication.service";
@Public()
@Controller("authentication")
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly managerAuthenticationService: ManagerAuthenticationService,
    private readonly employeeAuthenticationService: EmployeeAuthenticationService,
    private readonly customerAuthenticationService: CustomerAuthenticationService,
    private readonly adminAuthenticationService: AdminAuthenticationService,
  ) {}

  // # sign in
  @HttpCode(HttpStatus.OK)
  @Post("customer/signin")
  async customerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("employee/signin")
  async employeeSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("admin/signin")
  async adminSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("manager/signin")
  async managerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto);
    return { access_token, refresh_token };
  }
  // signup

  @Post("customer/signup")
  async customerSignup(@Body() signUpDto: CustomerSignupDto) {
    return await this.customerAuthenticationService.signup(signUpDto);
  }

  @Post("manager/signup")
  async managerSignup(@Body() signUpDto: SignupDto) {
    return await this.managerAuthenticationService.signup(signUpDto);
  }

  @Post("admin/signup")
  async adminSignup(@Body() signUpDto: SignupDto) {
    return await this.adminAuthenticationService.signup(signUpDto);
  }
  @Post("employee/signup")
  async employeeSignup(@Body() signUpDto: SignupDto) {
    return await this.employeeAuthenticationService.signup(signUpDto);
  }

  @Post("verify")
  async verify(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authenticationService.verifyEmail(verifyEmailDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh-tokens")
  refreshTokens(@Body() refreshTokensDto: RefreshTokenDto) {
    return this.authenticationService.refreshTokens(refreshTokensDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("signout")
  signout(@Body() signoutDto: SignoutDto) {
    return this.authenticationService.signout(signoutDto);
  }
}
