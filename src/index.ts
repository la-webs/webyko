import dotenv from 'dotenv';
import { AllMiddlewareArgs, App, SlackEventMiddlewareArgs } from '@slack/bolt'; 
import { students } from './students';
import { channels } from './channels';
import { instructors } from './instructors';
import { version } from '../package.json';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const bot = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});
export const BOT_USER_ID = "<@U02V9LK9X5J>";
export const MANAGE_CHANNELS = ["C02USUP0MB9", "C02CZPCP0F6", "C02THR9HW3S"];

(async () => {
  await bot.start(process.env.PORT || 3000);

  bot.event('app_mention', async (result) => {
    if(!result.event.text.startsWith(BOT_USER_ID)) return;
    const options = result.event.text.replace(/<@U02V9LK9X5J>\s*/g, '').split(/\s+/);
    if(MANAGE_CHANNELS.includes(result.event.channel)) {
      switch (options.shift()) {
        case "help":
          await help(options, result);
          break;
        case "student":
        case "students":
          await students(options, result);
          break;
        case "channel":
        case "channels":
          await channels(options, result);
          break;
        case "instructor":
        case "instructors":
          await instructors(options, result);
          break;
        case "thread":
          await thread(options, result);
          break;
        case "threads":
          await threads(options, result);
          break;
        case "":
          await help(options, result);
          break;
        default:
          await result.say(`コマンドが見つかりませんでした。\n\n`);
          await help(options, result);
          break;
      }
    } else {
      switch (options.shift()) {
        case "thread":
          await thread(options, result);
          break;
        case "threads":
          await threads(options, result);
          break;
        default:
          await result.say(`WebサービスコースのWebykoだよ！\nよろしくね！`);
          break;
      }
    }
  });
})();

async function help(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  let message = "";
  message += `Webyko bot v${version}\n\n`
  message += "*コマンド一覧*\n"
  message += ` ${BOT_USER_ID} help: このヘルプを表示します\n`
  message += ` ${BOT_USER_ID} students help: 受講生関連のコマンド一覧を表示します\n`
  message += ` ${BOT_USER_ID} instructors help: 講師関連のコマンド一覧を表示します\n`
  message += ` ${BOT_USER_ID} channels help: チャンネル関連のコマンド一覧を表示します\n`
  message += ` ${BOT_USER_ID} thread [スレッド名] [備考...]: 受講生一覧のスレッドを生成します\n`
  message += ` ${BOT_USER_ID} threads [スレッド名] [備考...]: 受講生ごとにスレッドを生成します\n`
  result.say(message);
}

async function thread(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  const threadName = options.shift();
  if(!threadName) {
    await result.say(`スレッド名が指定されていません。`);
    return;
  }
  const students = await prisma.student.findMany()
  const thread = await result.say(`*【${threadName}】* ${options.length > 0 ? "\n" : ''}${options.join("\n")}`);
  
  if(thread.message?.ts){
    await Promise.all(students.map(async (student) => {
      await result.client.chat.postMessage({
        channel: `${thread.channel}`,
        text: `${student.nickname}`,
        thread_ts: thread.message?.ts,
      })
    }))
  }
}

async function threads(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  const threadName = options.shift();
  if(!threadName) {
    await result.say(`スレッド名が指定されていません。`);
    return;
  }
  const students = await prisma.student.findMany()
  
  await Promise.all(students.map(async (student) => {
    await result.say(`*【${student.nickname}${threadName}】* ${options.length > 0 ? "\n" : ''}${options.join("\n")}`);
  }))
}