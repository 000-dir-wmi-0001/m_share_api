import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'default_jwt_secret',
    };

    // passport-jwt types can be incompatible with Nest's constructor signature in some setups,
    // so cast to any to avoid TS issues while preserving runtime behavior.
    super(opts as any);
  }

  validate(payload: { sub: string; email: string }) {
    // Payload should contain user id and email. Return a subset to be attached to request.user
    return { userId: payload.sub, email: payload.email };
  }
}
