import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { SigninDto } from "./dto/signin.dto";
import { CustomerSignupDto } from "./dto/customer-signup.dto";
import { AuthenticationService } from "./authentication.service";
import { Public } from "@/common/decorators/public.decorator";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SignoutDto } from "./dto/signout.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { CustomerAuthenticationService } from "./customer.authentication.service";
import { UserRole } from "@/prisma";

@Public()
@Controller("authentication")
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly customerAuthenticationService: CustomerAuthenticationService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post("customer/signin")
  async customerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.CUSTOMER);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("cashier/signin")
  async cashierSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.CASHIER);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("store-manager/signin")
  async storeManagerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.STORE_MANAGER);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("accountant/signin")
  async accountantSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.ACCOUNTANT);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("warehouse-worker/signin")
  async warehouseWorkerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(
      signinDto,
      UserRole.WAREHOUSE_WORKER,
    );
    return { access_token, refresh_token };
  }

  @Post("customer/signup")
  async customerSignup(@Body() signUpDto: CustomerSignupDto) {
    return await this.customerAuthenticationService.signup(signUpDto);
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
