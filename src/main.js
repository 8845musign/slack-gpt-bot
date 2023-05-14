const OPEN_AI_KEY = PropertiesService.getScriptProperties().getProperty('OPEN_AI_KEY');
const SLACK_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
const cache = CacheService.getScriptCache();

if (OPEN_AI_KEY === null) {
  throw new Error('OPEN_AI_KEY is not set');
}

if (SLACK_BOT_TOKEN === null) {
  throw new Error('SLACK_BOT_TOKEN is not set');
}
// eslint-disable-next-line no-undef
const app = SlackApp.create(SLACK_BOT_TOKEN);

function lockProcessByClientMsgId(clientMsgId) {
  // clientMsgIdをキャッシュに追加
  cache.put(`process_${clientMsgId}`, clientMsgId, 60 * 5);
  Logger.log(`lock: ${clientMsgId}`);
}

function isProcessing(clientMsgId) {
  return cache.get(`process_${clientMsgId}`) !== null;
}

function unLockProcessByClientMsgId(clientMsgId) {
  cache.remove(`process_${clientMsgId}`);
  Logger.log(`unlock: ${clientMsgId}`);
}

// eslint-disable-next-line no-unused-vars
function doPost(e) {
  Logger.log('-------- run --------');

  let postData;

  try {
    postData = JSON.parse(e.postData.getDataAsString());
  } catch (e) {
    Logger.log(e);
  }

  // url_verification
  try {
    if (postData.type === "url_verification") {
      return ContentService.createTextOutput(postData.challenge);
    }
  }
  catch (e) {
    Logger.log(e);
  }

  // eslint-disable-next-line camelcase
  const { text, client_msg_id } = postData.event;

  if (isProcessing(client_msg_id)) {
    return;
  }

  lockProcessByClientMsgId(client_msg_id);

  try {
    const mentinoReg = /<@.*?>/;
    app.chatPostMessage(postData.event.channel, `${text.replace(mentinoReg, '')}と言われた`);
  } catch (e) {
    Logger.log(e);
    unLockProcessByClientMsgId(client_msg_id);
  }
}
