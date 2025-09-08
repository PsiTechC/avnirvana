import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSetting extends Document {
  mailHost: string;
  mailPort: string;
  sendFromId: string;
  sendFromPassword: string;
}

const EmailSettingSchema: Schema = new Schema({
  mailHost: { type: String, required: true },
  mailPort: { type: String, required: true },
  sendFromId: { type: String, required: true },
  sendFromPassword: { type: String, required: true },
});

export default mongoose.models.EmailSetting || mongoose.model<IEmailSetting>('EmailSetting', EmailSettingSchema);
