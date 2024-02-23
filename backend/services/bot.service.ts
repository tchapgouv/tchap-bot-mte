import bot from "../utils/bot.js";
import vm from "vm"


async function runScript (script:string, message:string) {

  const context = {'data': message};
  vm.createContext(context); // Contextify the object.
  await vm.runInContext(script, context);

  // console.log(context.data);
  return context.data
}


async function postMessage (roomId:string, message:string, script:string) {

  // console.log('message before script : ', message);
  await runScript(script, message).then(data => message = data)
  // console.log('message after script : ', message);

  return await bot.sendTextMessage(roomId, message).then(() => {
    return {message: "Message sent"}
  }).catch(e => console.error(e))
}

export {postMessage}
