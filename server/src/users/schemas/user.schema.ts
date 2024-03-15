import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CoinbaseAuth } from './coinbase-auth.schema';

@Schema({ versionKey: false })
export class User extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  coinbaseAuth?: CoinbaseAuth;
}

export const UserSchema = SchemaFactory.createForClass(User);
