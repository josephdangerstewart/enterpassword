const TIMEOUT = 400;
const INPUT_TIMEOUT = 800;

const STYLESHEET = {
  "f": "color: #166088;",
  "q": "color: #594423;",
  "s": "color: #A37C40;",
  "i": "color: #7D7ABC;",
  "n": "color: #E87102;"
}

var CAN_SPEAK = false;

var name = "";

var audio;

var isWaiting = false;
function speak(input) {
  if (isWaiting) {
    next(input);
  }
  return null;
}

function getName(index,branch) {
  next = (input) => {
    name=input;
    setTimeout(() => processLine(index+1,branch),INPUT_TIMEOUT);
    isWaiting=false;
    let element = document.getElementById("please-help");
    element.parentNode.removeChild(element);
    CAN_SPEAK = true;
  }

  let styles = [];

  isWaiting=true;
}

function displayString(str, speak, callback) {
  str = atob(str).replace(/!NAME!/g, "@n|" + name + "@|");
  let i = 0;
  let styles = [];
  while ((i = str.indexOf("@")) != -1) {
    if (str.charAt(i+1) == '|') {
      styles.push("color:black");
      str = str.replace("@|","%c");
    } else if (str.charAt(i+2) == '|') {
      styles.push(STYLESHEET[str.charAt(i+1)]);
      str = str.replace("@" + str.charAt(i+1) + "|","%c");
    } else {
      str = str.replace("@","")
    }
  }

  console.log(str,...styles);
  if (speak) {
    let msg = new SpeechSynthesisUtterance();
    msg.rate = 1;
    msg.pitch = 2;
    msg.text = str.replace(/%c/g,"");
    msg.onend = callback;
    speechSynthesis.speak(msg);
  }
}

function handleOptions(line,index,branch) {
  displayString(btoa("--- Select an option by typing @f|speak@|(@i|option@|) (no quotes) ---"))
  for (var i = 0; i < line.length; i ++) {
    displayString(line[i].option);
    next = (input) => {
      input--;
      if (input >= 0 && input < line.length) {
        result = atob(line[input].result);
        if (!result.startsWith("\""))
          setTimeout(() => processLine(0,branches[result]),INPUT_TIMEOUT);
        else {
          setTimeout(() => {
            if (CAN_SPEAK && 'speechSynthesis' in window) {
              displayString(btoa(result.substring(1,result.length-1)), true, () => processLine(index+1,branch));
            } else {
              setTimeout(() => processLine(index + 1, branch), TIMEOUT * (result.split(' ').length))
            }
          },INPUT_TIMEOUT)
        }
        isWaiting = false;
      } else {
        handleOptions(line,index,branch);
      }
    }
    isWaiting = true;
  }
}

function fadeAudioIn() {
  audio.volume = 0.0;
  audio.play();
  var fadeAudio = setInterval(() => {
    if (audio.volume + 0.05 <= 0.25) {
      audio.volume += 0.05;
    } else {
      audio.volume = 0.25;
      clearInterval(fadeAudio);
    }
  },200)
}

function fadeAudioOut() {
  var fadeAudio = setInterval(() => {
    if (audio.volume - 0.1 >= 0.0) {
      audio.volume -= 0.1;
    } else {
      clearInterval(fadeAudio);
      audio.pause();
    }
  }, 200);
}

function handleAudio(line) {
  line = atob(line);
  let file = line.substring(1,line.length-1);

  if (file != "end") {
    if (audio != null && audio != undefined) {
      audio.pause();
    }
    if (!file.startsWith(":")) {
      audio = new Audio(file);
      audio.addEventListener('ended', () => {
          audio.currentTime = 0;
          audio.play();
      }, false);
    } else {
      audio = new Audio(file.substring(1,file.length-1));
    }
    fadeAudioIn();
  } else if (audio != null && audio != undefined) {
    fadeAudioOut();
  }
}

function changeBackground(line) {
  line = atob(line).trim();
  let color = line.substring(line.indexOf(":") + 1).trim();
  document.getElementById("okiedokie-then").style.background = color;
}

function processLine(index,branch, ignoreTimeout) {
  let line = branch[index];
  if (typeof line == "string" && atob(line) == "getName") {
    getName(index, branch);
  } else if (typeof line == "string" && atob(line).startsWith("WAIT")) {
    let time = atob(line).substring(4).trim();
    setTimeout( () => processLine(index + 1, branch), time * 1000);
  } else if (typeof line == "string" && atob(line).startsWith("**")) {
    processLine(0, branches[atob(line).substring(2)]);
  } else if (typeof line == "string" && atob(line).startsWith("(")) {
    handleAudio(line);
    processLine(index + 1, branch);
  } else if (typeof line == "string" && atob(line).trim().startsWith("BG:")) {
    changeBackground(line);
    processLine(index + 1, branch);
  } else if (typeof line == "string") {

    if (CAN_SPEAK && 'speechSynthesis' in window) {
      displayString(line, true, () => processLine(index+1,branch), index, branch);
    } else {
      displayString(line);
      if (typeof branch[index+1] == "string")
        setTimeout(() => processLine(index+1,branch), ignoreTimeout ? 10 : TIMEOUT * (atob(branch[index]).split(' ').length));
      else if (typeof branch[index + 1] == "function" || typeof branch[index + 1 == "object"])
        processLine(index + 1,branch);
    }

  } else if (typeof line == "function") {
    line(index,branch);
  } else if (typeof line == "object") {
    handleOptions(line,index,branch);
  }
}

processLine(0,branches.root, true);
