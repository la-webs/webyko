import { PrismaClient } from "@prisma/client";
import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { BOT_USER_ID } from ".";
import { version } from "../package.json";

const prisma = new PrismaClient()

export async function students(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {

  switch (options.shift()) {
    case "help":
      await help(options, result);
      break;
    case "register":
      await register(options, result);
      break;
    case "list":
      await list(options, result);
      break;
    case "delete":
      await deleteStudent(options, result);
      break;
    case "setSlackId":
      await setSlackId(options, result);
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
  message += "*受講生関連コマンド一覧*\n"
  message += `\`${BOT_USER_ID} help\`\nWebykoのヘルプを表示します\n\n`
  message += `\`${BOT_USER_ID} students help\`\nこのヘルプを表示します\n\n`
  message += `\`${BOT_USER_ID} students register [受講生ニックネーム] [受講生英語表記] [option: Slackメンション]\`\n受講生を新規登録します\n\n`
  message += `\`${BOT_USER_ID} students setSlackId [受講生ID] [Slackメンション]\`\n受講生とSlackアカウントを紐付けします\n\n`
  message += `\`${BOT_USER_ID} students delete [受講生ID]\`\n受講生を削除します\n\n`
  message += `\`${BOT_USER_ID} students list\`\n受講生一覧を表示します\n\n`
  await result.say(message);
}

async function register(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 2) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} students register [受講生ニックネーム] [受講生英語表記] [option: Slackメンション]`);
    return;
  }
  let slackId: string | null = null;
  if(options[2] && options[2].startsWith("<@")) {
    slackId = options[2].replace(/[<@>]/g, "");
  }
  await prisma.student.create({
    data: {
      nickname: options[0],
      nicknameEn: options[1],
      slackId: slackId
    }
  })
  await result.say(`受講生を登録しました。`);
}

async function list(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  const students = await prisma.student.findMany({orderBy: {id: "asc"}});
  let message = "";
  message += "*受講生一覧*\n\n"
  students.forEach(student => {
    const slackId = student.slackId ? `<@${student.slackId}>` : "";
    message += `- ${student.id}: ${student.nickname} (${student.nicknameEn}) ${slackId}\n`
  })
  await result.say(message);
}

async function deleteStudent(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 1) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} students delete [受講生ID]`);
    return;
  }
  await prisma.student.delete({
    where: {
      id: Number(options[0])
    }
  })
  await result.say(`受講生を削除しました。`);
}

async function setSlackId(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 1) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} students setSlackId [受講生ID] [Slackメンション]`);
    return;
  }
  if(!options[1] || !options[1].startsWith("<@")) {
    result.say(`Slackメンションが不正です。\n\n${BOT_USER_ID} students setSlackId [受講生ID] [Slackメンション]`);
    return;
  }
  await prisma.student.update({
    where: {
      id: Number(options[0])
    },
    data: {
      slackId: options[1].replace(/[<@>]/g, "")
    }
  })
  await result.say(`受講生のSlackIDを更新しました。`);
}
