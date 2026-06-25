import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SigninDto } from "./dto/signin.dto";
import { CustomerSignupDto } from "./dto/customer-signup.dto";
import { AuthenticationService } from "./authentication.service";
import { Public } from "@/common/decorators/public.decorator";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SignoutDto } from "./dto/signout.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { CustomerAuthenticationService } from "./customer.authentication.service";
import { UserRole } from "@/prisma/client";
import { DocumentBody, DocumentCreatedResponse, DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";
import { AuthTokensDto, MessageResponseDto } from "@/openapi/dto/responses.dto";

@Public()
@ApiTags("Authentication")
@Controller("authentication")
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly customerAuthenticationService: CustomerAuthenticationService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post("customer/signin")
  @DocumentOperation("Customer sign in", "Authenticate a customer account and receive JWT tokens.")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async customerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.CUSTOMER);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("cashier/signin")
  @DocumentOperation("Cashier sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async cashierSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.CASHIER);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("store-manager/signin")
  @DocumentOperation("Store manager sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async storeManagerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.STORE_MANAGER);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("accountant/signin")
  @DocumentOperation("Accountant sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async accountantSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(signinDto, UserRole.ACCOUNTANT);
    return { access_token, refresh_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("warehouse-worker/signin")
  @DocumentOperation("Warehouse worker sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async warehouseWorkerSignin(@Body() signinDto: SigninDto) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(
      signinDto,
      UserRole.WAREHOUSE_WORKER,
    );
    return { access_token, refresh_token };
  }

  @Post("customer/signup")
  @DocumentOperation("Customer sign up", "Creates a customer account. Email verification is required before sign-in.")
  @DocumentBody(CustomerSignupDto)
  @DocumentCreatedResponse("Signup accepted; verification email sent")
  async customerSignup(@Body() signUpDto: CustomerSignupDto) {
    return await this.customerAuthenticationService.signup(signUpDto);
  }

  @Post("verify")
  @DocumentOperation("Verify email", "Confirm email with the 8-digit code sent after signup.")
  @DocumentBody(VerifyEmailDto)
  @DocumentOkResponse("Email verified", MessageResponseDto)
  async verify(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authenticationService.verifyEmail(verifyEmailDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh-tokens")
  @DocumentOperation("Refresh access token")
  @DocumentBody(RefreshTokenDto)
  @DocumentOkResponse("New access and refresh tokens", AuthTokensDto)
  refreshTokens(@Body() refreshTokensDto: RefreshTokenDto) {
    return this.authenticationService.refreshTokens(refreshTokensDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("signout")
  @DocumentOperation("Sign out", "Revoke the refresh token for this session.")
  @DocumentBody(SignoutDto)
  @DocumentOkResponse("Signed out", MessageResponseDto)
  signout(@Body() signoutDto: SignoutDto) {
    return this.authenticationService.signout(signoutDto);
  }
}
