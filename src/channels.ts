import { PrismaClient } from "@prisma/client";
import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { BOT_USER_ID } from ".";

const prisma = new PrismaClient()

export async function channels(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {

  switch (options.shift()) {
    case "help":
      help(options, result);
      break;
    case "deploy":
      deploy(options, result);
      break;
    case "invite":
      invite(options, result);
      break;
    case "list":
      list(options, result);
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
  message += "*チャンネル関連コマンド一覧*\n"
  message += ` ${BOT_USER_ID} channels help: このヘルプを表示します\n`
  message += ` ${BOT_USER_ID} channels deploy [ students | instructors | all ] [prefix] [option: private]: チャンネルの展開を実行します\n`
  message += ` ${BOT_USER_ID} channels invite [チャンネルメンション] [ students | instructors | all ]: チャンネルへ招待を実行します\n`
  await result.say(message);
}

async function deploy(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 1) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} deploy [ students | instructors | all ] [prefix] [option: private]`);
    return;
  }

  let message = `以下のチャンネルを展開しました。\n\n`;
  const targetList = []

  const students = await prisma.student.findMany();
  const instructors = await prisma.instructor.findMany();

  switch (options[0]) {
    case "students": {
      targetList.push(...students.map(student => student.nicknameEn))
      break;
    }
    case "instructors": {
      targetList.push(...instructors.map(instructor => instructor.nicknameEn))
      break;
    }
    case "all": {
      targetList.push(...students.map(student => student.nicknameEn))
      targetList.push(...instructors.map(instructor => instructor.nicknameEn))
      break;
    }
    default:
      result.say(`オプションが正しくありません。\n\n${BOT_USER_ID} deploy [ students | instructors | all ] [prefix] [option: private]`);
      return;
  }
  await Promise.all(targetList.map(async target => {
    try {
      const channel = await result.client.conversations.create({ name: `${options[1]}_${target}`, is_private: options[2] === "private" });
      message += `- <#${channel.channel?.id}|${channel.channel?.name}>\n`
      await Promise.all(instructors.map(i => i.slackId ? i.slackId : "")
        .filter(i => i !== "")
        .map(async i => {
          await result.client.conversations.invite({ channel: `${channel.channel?.id}`, users: i });
        }))
    } catch (e: any) {
      if(e?.data?.error == "name_taken") {
        message += `- #${options[1]}_${target} は既に存在しています\n`
      }
      console.log(e)
    }
  }))
  await result.say(message);
}

async function invite(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  if(options.length < 2) {
    result.say(`オプションが足りません。\n\n${BOT_USER_ID} invite [チャンネルメンション] [ students | instructors | all ]`);
    return;
  }

  let message = `以下のアカウントをチャンネルへ招待しました。\n\n`;
  const targetList = []
  const students = await prisma.student.findMany();
  const instructors = await prisma.instructor.findMany();

  switch (options[1]) {
    case "students": {
      targetList.push(...students.map(student => student.slackId))
      break;
    }
    case "instructors": {
      targetList.push(...instructors.map(instructor => instructor.slackId))
      break;
    }
    case "all": {
      targetList.push(...students.map(student => student.slackId))
      targetList.push(...instructors.map(instructor => instructor.slackId))
      break;
    }
    default:
      result.say(`オプションが正しくありません。\n\n${BOT_USER_ID} invite [チャンネルメンション] [ students | instructors | all ]`);
      return;
  }
  await Promise.all(targetList.map(async target => {
    try {console.log(target)
      const channelId = options[0].replace(/<#/, "").replace(/\|.*/, "");
      await result.client.conversations.invite({ channel: channelId, users: `${target}` });
      message += `- <@${target}>\n`
    } catch (e: any) {
      if(e?.data?.error == "already_in_channel") {
        message += `- <@${target}> は既に招待されています\n`
      }
      if(e?.data?.error == "channel_not_found") {
        message += `- ${options[0]} は存在しません\n`
      }
      console.log(e)
    }
  }))
  await result.say(message);
}

async function list(options: string[], result: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) {
  const res = await result.client.conversations.list({types: 'public_channel,private_channel'})
  await result.say(`${res.channels?.map(c => `:${c.is_private ? "lock" : "hash"}: ${c.name}: ${c.id}`).sort().join("\n")}`);
}