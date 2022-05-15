import { PrismaClient } from "@prisma/client";
import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { BOT_USER_ID } from ".";
import { version } from "../package.json";

const prisma = new PrismaClient()

export async function messages(options: string[], lines: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {

  switch (options.shift()) {
    case "help":
      help(options, result);
      break;
    case "send":
      send(options, lines, result);
      break;
    case undefined:
      await help(options, result);
      break;
    default:
      await result.say(`コマンドが見つかりませんでした。\n\n`);
      await help(options, result);
      break;
  }
}

async function help(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  let message = "";
  message += `Webyko bot v${version}\n\n`
  message += "*メッセージ関連コマンド一覧*\n"
  message += `\`${BOT_USER_ID} help\`\nWebykoのヘルプを表示します\n\n`
  message += `\`${BOT_USER_ID} messages help\`\nこのヘルプを表示します\n\n`
  message += `\`${BOT_USER_ID} messages send [channel_prefix]\`\n各チャンネルに投稿をばらまきます\n\n`
  await result.say(message);
}

async function send(options: string[], lines: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 1) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} messages send [channel_prefix]`);
    return;
  }
  
  let messages: { id: number, body: string }[] = []
  lines.forEach(l => {
    const result = l.match(/^\|(\d+)\|/)
    if(result) {
      messages.push({id: Number.parseInt(result[1]), body: l.replace(/^\|\d+\|/, "")})
    } else {
      if(messages.length != 0)
        messages[messages.length - 1].body += "\n" + l
    }
  })
  messages = messages.filter(m => m.body.length > 0)
  
  const students = await prisma.student.findMany({ where: { id: { in: messages.map(m => m.id) } }})
  await Promise.all(students.map(async (student) => {
    await result.client.chat.postMessage({
      channel: `#${options[0]}_${student.nicknameEn}`,
      text: `<@${student.slackId}>\n${messages.find(m => m.id == student.id)?.body}`,
    })
  }))
  
  console.log(messages)
}
