import { NextResponse } from 'next/server';
import EmailSetting from '@/models/EmailSetting';
import {dbConnect} from '@/lib/mongodb';

export async function GET() {
  await dbConnect();
  const settings = await EmailSetting.findOne();
  return NextResponse.json(settings || {});
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  let settings = await EmailSetting.findOne();
  if (settings) {
    settings.mailHost = body.mailHost;
    settings.mailPort = body.mailPort;
    settings.sendFromId = body.sendFromId;
    settings.sendFromPassword = body.sendFromPassword;
    await settings.save();
  } else {
    settings = await EmailSetting.create(body);
  }
  return NextResponse.json(settings);
}
