import { PrismaClient } from "@prisma/client";
import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { BOT_USER_ID } from ".";

const prisma = new PrismaClient()

export async function instructors(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  switch (options.shift()) {
    case "help":
      help(options, result);
      break;
    case "register":
      register(options, result);
      break;
    case "list":
      list(options, result);
      break;
    case "delete":
      deleteInstructor(options, result);
      break;
    case "setSlackId":
      setSlackId(options, result);
      break;
    default:
      await result.say(`コマンドが見つかりませんでした。\n\n`);
      await help(options, result);
      break;
  }
}

async function help(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  let message = "";
  message += "Webyko bot v1.0.0\n\n"
  message += "*講師関連コマンド一覧*\n"
  message += ` ${BOT_USER_ID} instructors help: このヘルプを表示します\n`
  message += ` ${BOT_USER_ID} instructors register [講師ニックネーム] [講師英語表記] [option: Slackメンション]: 講師を新規登録します\n`
  message += ` ${BOT_USER_ID} instructors setSlackId [講師ID] [Slackメンション]: 講師とSlackアカウントを紐付けします\n`
  message += ` ${BOT_USER_ID} instructors delete [講師ID]: 講師を削除します\n`
  message += ` ${BOT_USER_ID} instructors list: 講師一覧を表示します\n`
  await result.say(message);
}

async function register(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 2) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} instructors register [講師ニックネーム] [講師英語表記] [option: Slackメンション]`);
    return;
  }
  let slackId: string | null = null;
  if(options[2] && options[2].startsWith("<@")) {
    slackId = options[2].replace(/[<@>]/g, "");
  }
  await prisma.instructor.create({
    data: {
      nickname: options[0],
      nicknameEn: options[1],
      slackId: slackId
    }
  })
  await result.say(`講師を登録しました。`);
}

async function list(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  const instructors = await prisma.instructor.findMany({orderBy: {id: "asc"}});
  let message = "";
  message += "*講師一覧*\n\n"
  instructors.forEach(instructor => {
    const slackId = instructor.slackId ? `<@${instructor.slackId}>` : "";
    message += `- ${instructor.id}: ${instructor.nickname} (${instructor.nicknameEn}) ${slackId}\n`
  })
  await result.say(message);
}

async function deleteInstructor(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 1) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} instructors delete [講師ID]`);
    return;
  }
  await prisma.instructor.delete({
    where: {
      id: Number(options[0])
    }
  })
  await result.say(`講師を削除しました。`);
}

async function setSlackId(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 1) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} instructors setSlackId [講師ID] [Slackメンション]`);
    return;
  }
  if(!options[1] || !options[1].startsWith("<@")) {
    result.say(`Slackメンションが不正です。\n\n${BOT_USER_ID} instructors setSlackId [講師ID] [Slackメンション]`);
    console.log(options[0])
    return;
  }
  await prisma.instructor.update({
    where: {
      id: Number(options[0])
    },
    data: {
      slackId: options[1].replace(/[<@>]/g, "")
    }
  })
  await result.say(`講師のSlackIDを更新しました。`);
}
