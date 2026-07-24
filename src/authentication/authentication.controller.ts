import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";
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
import type { ActiveUserType, RefreshTokenPayload } from "./dto/request-user.dto";

@Public()
@UseGuards(ThrottlerGuard)
@ApiTags("Authentication")
@Controller("authentication")
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly customerAuthenticationService: CustomerAuthenticationService,
  ) {}

  @UseGuards(AuthGuard("local"))
  @HttpCode(HttpStatus.OK)
  @Post("customer/signin")
  @DocumentOperation("Customer sign in", "Authenticate a customer account and receive JWT tokens.")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async customerSignin(@Body() _signinDto: SigninDto, @Req() req: Request) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(
      req.user as ActiveUserType,
      UserRole.CUSTOMER,
    );
    return { access_token, refresh_token };
  }

  @UseGuards(AuthGuard("local"))
  @HttpCode(HttpStatus.OK)
  @Post("cashier/signin")
  @DocumentOperation("Cashier sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async cashierSignin(@Body() _signinDto: SigninDto, @Req() req: Request) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(
      req.user as ActiveUserType,
      UserRole.CASHIER,
    );
    return { access_token, refresh_token };
  }

  @UseGuards(AuthGuard("local"))
  @HttpCode(HttpStatus.OK)
  @Post("store-manager/signin")
  @DocumentOperation("Store manager sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async storeManagerSignin(@Body() _signinDto: SigninDto, @Req() req: Request) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(
      req.user as ActiveUserType,
      UserRole.STORE_MANAGER,
    );
    return { access_token, refresh_token };
  }

  @UseGuards(AuthGuard("local"))
  @HttpCode(HttpStatus.OK)
  @Post("accountant/signin")
  @DocumentOperation("Accountant sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async accountantSignin(@Body() _signinDto: SigninDto, @Req() req: Request) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(
      req.user as ActiveUserType,
      UserRole.ACCOUNTANT,
    );
    return { access_token, refresh_token };
  }

  @UseGuards(AuthGuard("local"))
  @HttpCode(HttpStatus.OK)
  @Post("warehouse-worker/signin")
  @DocumentOperation("Warehouse worker sign in")
  @DocumentBody(SigninDto)
  @DocumentOkResponse("Access and refresh tokens", AuthTokensDto)
  async warehouseWorkerSignin(@Body() _signinDto: SigninDto, @Req() req: Request) {
    const { access_token, refresh_token } = await this.authenticationService.signIn(
      req.user as ActiveUserType,
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

  @UseGuards(AuthGuard("jwt-refresh"))
  @HttpCode(HttpStatus.OK)
  @Post("refresh-tokens")
  @DocumentOperation("Refresh access token")
  @DocumentBody(RefreshTokenDto)
  @DocumentOkResponse("New access and refresh tokens", AuthTokensDto)
  refreshTokens(@Body() _refreshTokensDto: RefreshTokenDto, @Req() req: Request) {
    return this.authenticationService.refreshTokens(req.user as RefreshTokenPayload);
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @HttpCode(HttpStatus.OK)
  @Post("signout")
  @DocumentOperation("Sign out", "Revoke the refresh token for this session.")
  @DocumentBody(SignoutDto)
  @DocumentOkResponse("Signed out", MessageResponseDto)
  signout(@Body() _signoutDto: SignoutDto, @Req() req: Request) {
    return this.authenticationService.signout(req.user as RefreshTokenPayload);
  }
}
