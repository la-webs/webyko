import dotenv from 'dotenv';
import { AllMiddlewareArgs, App, SlackEventMiddlewareArgs } from '@slack/bolt'; 
import { students } from './students';
import { channels } from './channels';
import { instructors } from './instructors';

dotenv.config();

const bot = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});
export const BOT_USER_ID = "<@U02V9LK9X5J>";

(async () => {
  await bot.start(process.env.PORT || 3000);

  bot.event('app_mention', async (result) => {
    const options = result.event.text.replace(/<@U02V9LK9X5J>\s+/g, '').split(/\s+/);

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
      case undefined:
        await help(options, result);
        break;
      default:
        await result.say(`コマンドが見つかりませんでした。\n\n`);
        await help(options, result);
        break;
    }
  });
})();

async function help(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  let message = "";
  message += "Webyko bot v1.0.0\n\n"
  message += "*コマンド一覧*\n"
  message += ` ${BOT_USER_ID} help: このヘルプを表示します\n`
  message += ` ${BOT_USER_ID} students help: 受講生関連のコマンド一覧を表示します\n`
  message += ` ${BOT_USER_ID} instructors help: 講師関連のコマンド一覧を表示します\n`
  message += ` ${BOT_USER_ID} channels help: チャンネル関連のコマンド一覧を表示します\n`
  result.say(message);
}
